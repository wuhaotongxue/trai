#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: local_image_edit_client.py
# 作者: wuhao
# 日期: 2026_05_19
# 描述: 本地图片编辑客户端，使用 Qwen/Qwen-Image-Edit-2511 模型


from __future__ import annotations

import asyncio
import base64
import io
import json
import os
import subprocess
import sys
import tempfile
from typing import Any

import torch
from loguru import logger

from core.exceptions import ExternalServiceError


# Qwen-Image-Edit-2511 约需 ~30GB 显存（bf16），预留 2GB 余量
_MIN_FREE_GB = 30


class LocalImageEditClient:
    """本地图片编辑客户端 (Qwen-Image-Edit-2511)

    每次推理启动独立的 subprocess，进程退出后显存自动释放。
    subprocess 中通过 CUDA_VISIBLE_DEVICES=目标GPU 限制只能看到一个 GPU，
    然后强制把 text_encoder 移到 CUDA，避免 accelerate 将其放到 meta 设备导致黑图。
    """

    _instance: LocalImageEditClient | None = None
    _device_locks: dict[int, asyncio.Lock] = {}
    _init_done: bool = False

    def __new__(cls) -> LocalImageEditClient:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if LocalImageEditClient._init_done:
            return
        LocalImageEditClient._init_done = True
        self._model_path: str = os.getenv(
            "MODELSCOPE_IMAGE_EDIT_MODEL_PATH",
            "/home/qyjgylc_whf/.cache/modelscope/hub/models/Qwen/Qwen-Image-Edit-2511",
        )
        self._default_steps: int = int(os.getenv("MODELSCOPE_IMAGE_EDIT_STEPS", "40"))
        self._default_width: int = int(os.getenv("MODELSCOPE_IMAGE_EDIT_WIDTH", "1024"))
        self._default_height: int = int(os.getenv("MODELSCOPE_IMAGE_EDIT_HEIGHT", "1024"))

    def _get_gpu_free_memory(self, device: int) -> float:
        """查询指定 GPU 的空闲显存（GB），失败返回 -1"""
        if device < 0:
            return float("inf")
        try:
            result = subprocess.run(
                [
                    "nvidia-smi",
                    "--query-gpu=index,memory.free",
                    "--format=csv,noheader,nounits",
                    "-i",
                    str(device),
                ],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                free_mb = float(result.stdout.strip().split(",")[-1].strip())
                return free_mb / 1024
        except Exception:
            pass
        return -1.0

    def _get_devices_by_free_memory(self) -> list[tuple[int, float]]:
        """获取所有 GPU，按空闲显存从多到少排序"""
        if not torch.cuda.is_available():
            return [(-1, float("inf"))]

        devices: list[tuple[int, float]] = []
        try:
            result = subprocess.run(
                [
                    "nvidia-smi",
                    "--query-gpu=index,memory.free",
                    "--format=csv,noheader,nounits",
                ],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                for line in result.stdout.strip().split("\n"):
                    parts = line.split(",")
                    if len(parts) >= 2:
                        idx = int(parts[0].strip())
                        free_mb = float(parts[1].strip())
                        free_gb = free_mb / 1024
                        devices.append((idx, free_gb))
                        logger.info(f"GPU {idx}: free={free_gb:.2f}GB")
            else:
                logger.warning(f"nvidia-smi failed: {result.stderr}")
        except Exception as error:
            logger.warning(f"nvidia-smi 查询失败: {error}")

        if not devices:
            for i in range(torch.cuda.device_count()):
                try:
                    free, total = torch.cuda.mem_get_info(i)
                    free_gb = free / (1024**3)
                    devices.append((i, free_gb))
                    logger.info(f"GPU {i}: free={free_gb:.2f}GB")
                except Exception:
                    devices.append((i, 0.0))

        devices.sort(key=lambda x: x[1], reverse=True)
        return devices

    def _ensure_lock(self, device: int) -> asyncio.Lock:
        """确保指定 GPU 的锁存在"""
        if device not in LocalImageEditClient._device_locks:
            LocalImageEditClient._device_locks[device] = asyncio.Lock()
        return LocalImageEditClient._device_locks[device]

    def _build_script(
        self,
        seed: int | None,
        height: int | None,
        width: int | None,
        steps: int,
        is_dual: bool = False,
    ) -> str:
        """构建推理脚本内容

        Args:
            is_dual: 是否为双图联动编辑模式（True=两张图，False=单图）
        """
        model_path = self._model_path

        if is_dual:
            # 双图联动编辑模式（QwenImageEditPlusPipeline 原生支持）
            script = (
                "import base64\n"
                "import io\n"
                "import json\n"
                "import sys\n"
                "import traceback\n"
                "import numpy as np\n"
                "import torch\n"
                "from accelerate.hooks import remove_hook_from_module\n"
                "\n"
                "from modelscope import QwenImageEditPlusPipeline\n"
                "from PIL import Image\n"
                "\n"
                "def _main():\n"
                "    print(\"[1/7] 初始化完成 | GPU数量: \" + str(torch.cuda.device_count()), flush=True)\n"
                "\n"
                "    pipe = QwenImageEditPlusPipeline.from_pretrained(\n"
                "        \"" + model_path + "\",\n"
                "        torch_dtype=torch.bfloat16,\n"
                "    )\n"
                "    print(\"[2/7] 模型加载完成\", flush=True)\n"
                "\n"
                "    for name in (\"transformer\", \"vae\", \"text_encoder\"):\n"
                "        obj = getattr(pipe, name, None)\n"
                "        if obj is not None:\n"
                "            remove_hook_from_module(obj)\n"
                "\n"
                "    pipe.enable_model_cpu_offload()\n"
                "\n"
                "    def _pipe_eval():\n"
                "        for name in (\"transformer\", \"vae\", \"text_encoder\"):\n"
                "            obj = getattr(pipe, name, None)\n"
                "            if obj is not None and callable(getattr(obj, \"eval\", None)):\n"
                "                obj.eval()\n"
                "    pipe.eval = _pipe_eval\n"
                "\n"
                "    img_path_1 = sys.argv[1]\n"
                "    img_path_2 = sys.argv[2]\n"
                "    image1 = Image.open(img_path_1)\n"
                "    image2 = Image.open(img_path_2)\n"
                "    image1.load()\n"
                "    image2.load()\n"
                "    print(\"[3/7] 图片加载完成 | 图1: \" + str(image1.size) + \" | 图2: \" + str(image2.size), flush=True)\n"
                "\n"
                "    generator = None\n"
                "    _seed = " + repr(seed) + "\n"
                "    if _seed is not None and _seed >= 0:\n"
                "        generator = torch.Generator(device=\"cuda\").manual_seed(_seed)\n"
                "\n"
                "    _seed_str = str(_seed) if _seed is not None else \"随机\"\n"
                "    print(\"[4/7] 开始推理 | 步数: " + str(steps) + " | seed: \" + _seed_str, flush=True)\n"
                "\n"
                "    result = pipe(\n"
                "        image=[image1, image2],\n"
                "        prompt=sys.stdin.read().strip(),\n"
                "        height=" + repr(height) + ",\n"
                "        width=" + repr(width) + ",\n"
                "        num_inference_steps=" + repr(steps) + ",\n"
                "        generator=generator,\n"
                "        true_cfg_scale=4.0,\n"
                "        negative_prompt=\"bad quality, blurry, deformed\",\n"
                "        num_images_per_prompt=1,\n"
                "    )\n"
                "    print(\"[5/7] 推理完成，开始后处理\", flush=True)\n"
                "\n"
                "    output_image = result.images[0] if hasattr(result, \"images\") else result[0]\n"
                "\n"
                "    arr = np.array(output_image)\n"
                "    if arr.max() == 0 and arr.min() == 0:\n"
                "        print(\"WARNING: output is all black/zero!\", file=sys.stderr)\n"
                "        sys.stderr.flush()\n"
                "\n"
                "    print(\"[6/7] 图片编码中 | 尺寸: \" + str(output_image.width) + \"x\" + str(output_image.height), flush=True)\n"
                "\n"
                "    buf = io.BytesIO()\n"
                "    output_image.save(buf, format=\"PNG\")\n"
                "    output_b64 = base64.b64encode(buf.getvalue()).decode(\"utf-8\")\n"
                "\n"
                "    print(json.dumps({\n"
                "        \"image_base64\": output_b64,\n"
                "        \"width\": output_image.width,\n"
                "        \"height\": output_image.height,\n"
                "        \"steps\": " + repr(steps) + ",\n"
                "        \"seed\": " + repr(seed) + " if " + repr(seed) + " is not None else -1,\n"
                "        \"is_dual\": True,\n"
                "        \"stats\": {\"min\": int(arr.min()), \"max\": int(arr.max()), \"mean\": float(arr.mean())},\n"
                "    }))\n"
                "    print(\"[7/7] 完成\", flush=True)\n"
                "\n"
                "if __name__ == \"__main__\":\n"
                "    try:\n"
                "        _main()\n"
                "    except Exception:\n"
                "        traceback.print_exc()\n"
                "        sys.stderr.flush()\n"
                "        sys.exit(1)\n"
            )
            return script
        else:
            # 单图编辑模式
            script = (
                "import base64\n"
                "import io\n"
                "import json\n"
                "import sys\n"
                "import traceback\n"
                "import numpy as np\n"
                "import torch\n"
                "from accelerate.hooks import remove_hook_from_module\n"
                "\n"
                "from modelscope import QwenImageEditPlusPipeline\n"
                "from PIL import Image\n"
                "\n"
                "def _main():\n"
                "    print(\"[1/7] 初始化完成 | GPU数量: \" + str(torch.cuda.device_count()), flush=True)\n"
                "\n"
                "    pipe = QwenImageEditPlusPipeline.from_pretrained(\n"
                "        \"" + model_path + "\",\n"
                "        torch_dtype=torch.bfloat16,\n"
                "    )\n"
                "    print(\"[2/7] 模型加载完成\", flush=True)\n"
                "\n"
                "    for name in (\"transformer\", \"vae\", \"text_encoder\"):\n"
                "        obj = getattr(pipe, name, None)\n"
                "        if obj is not None:\n"
                "            remove_hook_from_module(obj)\n"
                "\n"
                "    pipe.enable_model_cpu_offload()\n"
                "\n"
                "    def _pipe_eval():\n"
                "        for name in (\"transformer\", \"vae\", \"text_encoder\"):\n"
                "            obj = getattr(pipe, name, None)\n"
                "            if obj is not None and callable(getattr(obj, \"eval\", None)):\n"
                "                obj.eval()\n"
                "    pipe.eval = _pipe_eval\n"
                "\n"
                "    img_path = sys.argv[1]\n"
                "    image = Image.open(img_path)\n"
                "    image.load()\n"
                "    print(\"[3/7] 图片加载完成 | 尺寸: \" + str(image.size), flush=True)\n"
                "\n"
                "    generator = None\n"
                "    _seed = " + repr(seed) + "\n"
                "    if _seed is not None and _seed >= 0:\n"
                "        generator = torch.Generator(device=\"cuda\").manual_seed(_seed)\n"
                "\n"
                "    _seed_str = str(_seed) if _seed is not None else \"随机\"\n"
                "    print(\"[4/7] 开始推理 | 步数: " + str(steps) + " | seed: \" + _seed_str, flush=True)\n"
                "\n"
                "    result = pipe(\n"
                "        image=image,\n"
                "        prompt=sys.stdin.read().strip(),\n"
                "        height=" + repr(height) + ",\n"
                "        width=" + repr(width) + ",\n"
                "        num_inference_steps=" + repr(steps) + ",\n"
                "        generator=generator,\n"
                "        true_cfg_scale=4.0,\n"
                "        negative_prompt=\"bad quality, blurry, deformed\",\n"
                "        num_images_per_prompt=1,\n"
                "    )\n"
                "    print(\"[5/7] 推理完成，开始后处理\", flush=True)\n"
                "\n"
                "    output_image = result.images[0] if hasattr(result, \"images\") else result[0]\n"
                "\n"
                "    arr = np.array(output_image)\n"
                "    if arr.max() == 0 and arr.min() == 0:\n"
                "        print(\"WARNING: output is all black/zero!\", file=sys.stderr)\n"
                "        sys.stderr.flush()\n"
                "\n"
                "    print(\"[6/7] 图片编码中 | 尺寸: \" + str(output_image.width) + \"x\" + str(output_image.height), flush=True)\n"
                "\n"
                "    buf = io.BytesIO()\n"
                "    output_image.save(buf, format=\"PNG\")\n"
                "    output_b64 = base64.b64encode(buf.getvalue()).decode(\"utf-8\")\n"
                "\n"
                "    print(json.dumps({\n"
                "        \"image_base64\": output_b64,\n"
                "        \"width\": output_image.width,\n"
                "        \"height\": output_image.height,\n"
                "        \"steps\": " + repr(steps) + ",\n"
                "        \"seed\": " + repr(seed) + " if " + repr(seed) + " is not None else -1,\n"
                "        \"is_dual\": False,\n"
                "        \"stats\": {\"min\": int(arr.min()), \"max\": int(arr.max()), \"mean\": float(arr.mean())},\n"
                "    }))\n"
                "    print(\"[7/7] 完成\", flush=True)\n"
                "\n"
                "if __name__ == \"__main__\":\n"
                "    try:\n"
                "        _main()\n"
                "    except Exception:\n"
                "        traceback.print_exc()\n"
                "        sys.stderr.flush()\n"
                "        sys.exit(1)\n"
            )
            return script

    async def _run_edit_subprocess(
        self,
        device: int,
        image_path: str,
        prompt: str,
        width: int | None,
        height: int | None,
        steps: int,
        seed: int | None,
        image_path_2: str | None = None,
    ) -> dict[str, Any]:
        """在独立子进程中执行一次图片编辑，实时流式读取输出日志"""
        is_dual = image_path_2 is not None
        script_content = self._build_script(seed, height, width, steps, is_dual=is_dual)
        script_fd, script_path = tempfile.mkstemp(suffix=".py", prefix="edit_")
        os.close(script_fd)
        try:
            with open(script_path, "w") as file_handle:
                file_handle.write(script_content)

            env = os.environ.copy()
            env["CUDA_VISIBLE_DEVICES"] = str(device)
            env["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

            if is_dual:
                cmd = [sys.executable, script_path, image_path, image_path_2]
            else:
                cmd = [sys.executable, script_path, image_path]

            # 完全同步版本：子进程创建 + IO 全部在 _sync_run_process 内，通过 asyncio.to_thread 调用
            def _sync_run_process() -> tuple[str, str, int]:
                import select as _select

                proc = subprocess.Popen(
                    cmd,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    close_fds=True,
                    env=env,
                )

                input_data = (prompt + "\n").encode("utf-8")
                proc.stdin.write(input_data)
                proc.stdin.close()

                stdout_buf: list[bytes] = []
                stderr_buf: list[bytes] = []
                stdout_done = False
                stderr_done = False

                while not (stdout_done and stderr_done):
                    ready_r, _, _ = _select.select(
                        [proc.stdout, proc.stderr], [], [], 0.5
                    )
                    if proc.stdout in ready_r:
                        chunk = os.read(proc.stdout.fileno(), 16384)
                        if not chunk:
                            stdout_done = True
                        else:
                            stdout_buf.append(chunk)
                            for ln in chunk.decode("utf-8", errors="replace").splitlines():
                                ln = ln.strip()
                                if ln:
                                    logger.info(f"[子进程] {ln}")
                    if proc.stderr in ready_r:
                        chunk = os.read(proc.stderr.fileno(), 4096)
                        if not chunk:
                            stderr_done = True
                        else:
                            stderr_buf.append(chunk)
                            # 实时记录 stderr 供调试
                            for ln in chunk.decode("utf-8", errors="replace").splitlines():
                                ln = ln.strip()
                                if ln:
                                    logger.warning(f"[子进程 stderr] {ln}")

                    if proc.poll() is not None and not stdout_done:
                        try:
                            remaining = os.read(proc.stdout.fileno(), 65536)
                            if remaining:
                                stdout_buf.append(remaining)
                        except OSError:
                            pass
                        stdout_done = True
                    if proc.poll() is not None and not stderr_done:
                        try:
                            remaining = os.read(proc.stderr.fileno(), 65536)
                            if remaining:
                                stderr_buf.append(remaining)
                        except OSError:
                            pass
                        stderr_done = True

                # 进程已退出，但 select 可能已错过最后一小段，再做一次最终 drain
                try:
                    remaining_out = os.read(proc.stdout.fileno(), 65536)
                    if remaining_out:
                        stdout_buf.append(remaining_out)
                except OSError:
                    pass
                try:
                    remaining_err = os.read(proc.stderr.fileno(), 65536)
                    if remaining_err:
                        stderr_buf.append(remaining_err)
                except OSError:
                    pass

                proc.wait()  # 确保完全结束
                return (
                    b"".join(stdout_buf).decode("utf-8", errors="replace"),
                    b"".join(stderr_buf).decode("utf-8", errors="replace"),
                    proc.returncode,
                )

            stdout_str, stderr_str, rc = await asyncio.to_thread(_sync_run_process)

            # proc.poll() 返回 None 说明进程还没完全退出，用 wait() 同步获取退出码
            if rc is None:
                rc = os.waitstatus_to_exitcode(proc.wait())

            # 打印完整输出，方便排查静默崩溃
            logger.info(f"[子进程 stdout 共 {len(stdout_str)} 字符] {stdout_str[:500]}")
            if stderr_str:
                logger.warning(f"[子进程 stderr 共 {len(stderr_str)} 字符] {stderr_str[:2000]}")

            if rc != 0:
                if "OutOfMemoryError" in stderr_str or "CUDA out of memory" in stderr_str:
                    raise torch.cuda.OutOfMemoryError(stderr_str)
                raise RuntimeError(
                    f"图片编辑子进程失败(returncode={rc}):\n--- stdout ---\n{stdout_str[:3000]}\n--- stderr ---\n{stderr_str[:3000]}"
                )

            lines = [l.strip() for l in stdout_str.strip().splitlines() if l.strip()]
            for line in reversed(lines):
                if line.startswith("{"):
                    return json.loads(line)

            raise RuntimeError(
                f"图片编辑未返回有效 JSON 输出(returncode={rc}):\n--- stdout ---\n{stdout_str[:3000]}\n--- stderr ---\n{stderr_str[:3000]}"
            )

        finally:
            try:
                os.unlink(script_path)
            except OSError:
                pass

    def _load_image(self, image_input: str | bytes) -> Any:
        """加载图片为 PIL.Image"""
        from PIL import Image
        import requests

        if isinstance(image_input, bytes):
            return Image.open(io.BytesIO(image_input))

        if image_input.startswith("http://") or image_input.startswith("https://"):
            response = requests.get(image_input, timeout=30)
            response.raise_for_status()
            return Image.open(io.BytesIO(response.content))

        if image_input.startswith("data:"):
            b64_data = image_input.split(",", 1)[1] if "," in image_input else image_input.split(";base64,", 1)[-1]
            image_bytes = base64.b64decode(b64_data)
            return Image.open(io.BytesIO(image_bytes))

        if len(image_input) > 200:
            try:
                image_bytes = base64.b64decode(image_input)
                return Image.open(io.BytesIO(image_bytes))
            except Exception:
                pass

        return Image.open(image_input)

    async def edit(
        self,
        image_input: str | bytes,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
        image_input_2: str | bytes | None = None,
    ) -> dict[str, Any]:
        """异步编辑图片，自动选择最空闲的 GPU，OOM 时自动换 GPU 重试

        Args:
            image_input: 第一张图片（base64 / data URL / 文件路径 / URL）
            image_input_2: 第二张图片（双图联动编辑模式，为 None 时使用单图模式）
            prompt: 编辑提示词
            width: 输出宽度
            height: 输出高度
            steps: 采样步数
            seed: 随机种子（-1 表示随机）

        Returns:
            dict: {"image_base64": ..., "width": ..., "height": ..., "is_dual": bool, ...}
        """
        image1 = self._load_image(image_input)
        image2 = self._load_image(image_input_2) if image_input_2 else None
        actual_steps = steps or self._default_steps

        devices = self._get_devices_by_free_memory()
        last_error: Exception | None = None

        # 将图片写入临时文件，subprocess 通过路径读取
        img1_fd, img1_path = tempfile.mkstemp(suffix=".png", prefix="edit_input1_")
        img2_fd: int | None = None
        img2_path: str | None = None

        os.close(img1_fd)
        logger.info(f"[1/6] 图片加载完成 | 第一张: {image1.size}px | 双图模式: {image2 is not None}")
        try:
            image1.save(img1_path, format="PNG")
            logger.info(f"[2/6] 图片写入临时文件 | 路径: {img1_path} | 大小: {os.path.getsize(img1_path):,} bytes")

            if image2 is not None:
                img2_fd, img2_path = tempfile.mkstemp(suffix=".png", prefix="edit_input2_")
                os.close(img2_fd)
                image2.save(img2_path, format="PNG")
                logger.info(f"[2/6] 图片写入临时文件 | 路径2: {img2_path} | 大小: {os.path.getsize(img2_path):,} bytes")
            else:
                logger.info(f"[2/6] 单图模式，跳过第二张图片")
        except Exception as error:
            if os.path.exists(img1_path):
                os.unlink(img1_path)
            if img2_path and os.path.exists(img2_path):
                os.unlink(img2_path)
            logger.error(f"图片加载失败: {error}")
            raise

        try:
            for device, free_gb in devices:
                if device >= 0 and free_gb < _MIN_FREE_GB:
                    logger.warning(f"GPU {device} 空闲显存 {free_gb:.2f}GB < {_MIN_FREE_GB}GB，跳过")
                    continue

                device_name = f"GPU {device}" if device >= 0 else "CPU"
                lock = self._ensure_lock(device)

                async with lock:
                    if device >= 0:
                        free_now = self._get_gpu_free_memory(device)
                        if free_now >= 0 and free_now < _MIN_FREE_GB:
                            logger.warning(f"{device_name} 当前空闲 {free_now:.2f}GB < {_MIN_FREE_GB}GB，跳过")
                            continue

                    logger.info(
                        f"[3/6] 启动推理 | {device_name} | 双图模式: {image2 is not None} "
                        f"| 提示词: {prompt[:30]}... | 步数: {actual_steps} | seed: {seed}"
                    )

                    for attempt in range(2):
                        try:
                            result = await self._run_edit_subprocess(
                                device,
                                img1_path,
                                prompt,
                                width,
                                height,
                                actual_steps,
                                seed,
                                img2_path,
                            )
                            stats = result.get("stats", {})
                            if stats.get("max", 255) == 0:
                                logger.warning(f"{device_name} 输出全黑，跳过")
                                last_error = RuntimeError("输出全黑")
                                break
                            logger.info(f"{device_name} 编辑成功 | 双图模式: {result.get('is_dual', False)}")
                            return result
                        except torch.cuda.OutOfMemoryError:
                            logger.warning(f"{device_name} OOM（尝试 {attempt + 1}/2），换 GPU")
                            if attempt == 1:
                                break
                        except Exception as error:
                            logger.error(f"{device_name} 编辑异常: {error}")
                            last_error = error
                            break
        finally:
            if os.path.exists(img1_path):
                os.unlink(img1_path)
            if img2_path and os.path.exists(img2_path):
                os.unlink(img2_path)

        raise ExternalServiceError(
            message="所有 GPU 均不可用或显存不足，图片编辑失败",
            details={"last_error": str(last_error) if last_error else None},
        )

    @classmethod
    def unload(cls, device: int | None = None) -> None:
        """subprocess 模式下无需手动卸载，进程退出即释放"""

    @classmethod
    def is_loaded(cls, device: int | None = None) -> bool:
        """subprocess 模式下始终返回 False"""
        return False


__all__ = ["LocalImageEditClient"]
