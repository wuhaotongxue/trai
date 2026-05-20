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
    ) -> str:
        """构建推理脚本内容"""
        return f"""
import base64
import io
import json
import sys
import numpy as np
import torch
from accelerate.hooks import remove_hook_from_module

from modelscope import QwenImageEditPlusPipeline
from PIL import Image

# 加载 pipeline
pipe = QwenImageEditPlusPipeline.from_pretrained(
    "{self._model_path}",
    torch_dtype=torch.bfloat16,
)

# 强制把所有组件移到 cuda:0，移除 accelerate hooks，
# 然后启用 CPU offload 减少显存占用
for name in ("transformer", "vae", "text_encoder"):
    obj = getattr(pipe, name, None)
    if obj is not None:
        remove_hook_from_module(obj)

pipe.enable_model_cpu_offload()

# QwenImageEditPlusPipeline 缺少 eval() 方法，
# modelscope 1.36.3 + diffusers 0.38.0 兼容补丁
def _pipe_eval():
    for name in ("transformer", "vae", "text_encoder"):
        obj = getattr(pipe, name, None)
        if obj is not None and callable(getattr(obj, "eval", None)):
            obj.eval()
pipe.eval = _pipe_eval

# 从命令行参数读取图片路径
img_path = sys.argv[1]
image = Image.open(img_path)
image.load()  # 强制加载到内存，避免文件关闭后崩溃

# 随机种子
generator = None
if {seed!r} is not None and {seed!r} >= 0:
    generator = torch.Generator(device="cuda").manual_seed({seed!r})

# 推理
result = pipe(
    image=image,
    prompt=sys.stdin.read().strip(),
    height={height!r},
    width={width!r},
    num_inference_steps={steps!r},
    generator=generator,
    true_cfg_scale=4.0,
    negative_prompt="bad quality, blurry, deformed",
    num_images_per_prompt=1,
)

output_image = result.images[0] if hasattr(result, "images") else result[0]

# 验证输出
arr = np.array(output_image)
if arr.max() == 0 and arr.min() == 0:
    print("WARNING: output is all black/zero!", file=sys.stderr)
    sys.stderr.flush()

# 编码返回
buf = io.BytesIO()
output_image.save(buf, format="PNG")
output_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

print(json.dumps({{
    "image_base64": output_b64,
    "width": output_image.width,
    "height": output_image.height,
    "steps": {steps!r},
    "seed": {seed!r} if {seed!r} is not None else -1,
    "stats": {{"min": int(arr.min()), "max": int(arr.max()), "mean": float(arr.mean())}},
}}))
"""

    def _run_edit_subprocess(
        self,
        device: int,
        image_path: str,
        prompt: str,
        width: int | None,
        height: int | None,
        steps: int,
        seed: int | None,
    ) -> dict[str, Any]:
        """在独立子进程中执行一次图片编辑，进程退出后显存自动释放"""
        script_content = self._build_script(seed, height, width, steps)
        script_fd, script_path = tempfile.mkstemp(suffix=".py", prefix="edit_")
        os.close(script_fd)
        try:
            with open(script_path, "w") as file_handle:
                file_handle.write(script_content)

            env = os.environ.copy()
            env["CUDA_VISIBLE_DEVICES"] = str(device)
            env["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

            result = subprocess.run(
                [sys.executable, script_path, image_path],
                capture_output=True,
                text=True,
                timeout=600,
                input=prompt,
                env=env,
            )
        finally:
            try:
                os.unlink(script_path)
            except OSError:
                pass

        if result.returncode != 0:
            stderr = result.stderr
            if "OutOfMemoryError" in stderr or "CUDA out of memory" in stderr:
                raise torch.cuda.OutOfMemoryError(stderr)
            raise RuntimeError(f"图片编辑子进程失败: {stderr[:1000]}")

        output = json.loads(result.stdout.strip())
        return output

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
    ) -> dict[str, Any]:
        """异步编辑图片，自动选择最空闲的 GPU，OOM 时自动换 GPU 重试"""
        image = self._load_image(image_input)
        actual_steps = steps or self._default_steps

        devices = self._get_devices_by_free_memory()
        last_error: Exception | None = None

        # 将图片写入临时文件，subprocess 通过路径读取
        img_fd, img_path = tempfile.mkstemp(suffix=".png", prefix="edit_input_")
        os.close(img_fd)
        try:
            image.save(img_path, format="PNG")
        except Exception as error:
            if os.path.exists(img_path):
                os.unlink(img_path)
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
                        f"编辑图片 | {device_name} | 提示词: {prompt[:30]}... | 步数: {actual_steps} | seed: {seed}"
                    )

                    for attempt in range(2):
                        try:
                            loop = asyncio.get_event_loop()
                            result = await loop.run_in_executor(
                                None,
                                self._run_edit_subprocess,
                                device,
                                img_path,
                                prompt,
                                width,
                                height,
                                actual_steps,
                                seed,
                            )
                            stats = result.get("stats", {})
                            if stats.get("max", 255) == 0:
                                logger.warning(f"{device_name} 输出全黑，跳过")
                                last_error = RuntimeError("输出全黑")
                                break
                            logger.info(f"{device_name} 编辑成功")
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
            if os.path.exists(img_path):
                os.unlink(img_path)

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
