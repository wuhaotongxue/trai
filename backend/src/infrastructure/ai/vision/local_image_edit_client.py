#!/usr/bin/env python
# 文件名: local_image_edit_client.py
# 作者: wuhao
# 日期: 2026_05_28_17:05:00
# 描述: 本地图像编辑客户端, 使用 Qwen/Qwen-Image-Edit-2511 模型执行单图与双图编辑

from __future__ import annotations

import asyncio
import base64
import json
import os
import subprocess
import sys
import tempfile
import uuid
from io import BytesIO
from pathlib import Path
from typing import Any

import torch
from loguru import logger
from PIL import Image


class LocalImageEditClient:
    """
    本地图像编辑客户端.

    参数:
      无.
    返回:
      LocalImageEditClient: 单例客户端实例.
    异常:
      无.
    """

    _instance: LocalImageEditClient | None = None
    _device_locks: dict[int, asyncio.Lock] = {}
    _global_semaphore: asyncio.Semaphore | None = None
    _init_done: bool = False
    _min_free_gb: float = 20.0  # 降低阈值, 配合 CPU Offload

    def __new__(cls) -> LocalImageEditClient:
        """
        创建或复用单例实例.

        参数:
          cls: 当前类对象.
        返回:
          LocalImageEditClient: 客户端实例.
        异常:
          无.
        """
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        """
        初始化本地模型路径与默认参数.

        参数:
          无.
        返回:
          None: 无返回值.
        异常:
          ValueError: 当环境变量值无法转换为整数时抛出.
        """
        if LocalImageEditClient._init_done:
            return
        LocalImageEditClient._init_done = True
        if LocalImageEditClient._global_semaphore is None:
            # 限制全局同时执行图像编辑的任务数为 1, 确保排队防止 OOM
            LocalImageEditClient._global_semaphore = asyncio.Semaphore(1)
        self._model_path = os.getenv(
            "MODELSCOPE_IMAGE_EDIT_MODEL_PATH",
            "/home/qyjgylc_whf/.cache/modelscope/hub/models/Qwen/Qwen-Image-Edit-2511",
        )
        self._default_steps = int(os.getenv("MODELSCOPE_IMAGE_EDIT_STEPS", "40"))
        self._default_width = int(os.getenv("MODELSCOPE_IMAGE_EDIT_WIDTH", "1024"))
        self._default_height = int(os.getenv("MODELSCOPE_IMAGE_EDIT_HEIGHT", "1024"))

    def _get_gpu_free_memory(self, device: int) -> float:
        """
        查询指定 GPU 的空闲显存.

        参数:
          device: GPU 索引编号.
        返回:
          float: 空闲显存大小, 单位为 GB.
        异常:
          无. 失败时返回 -1.0.
        """
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
                check=False,
            )
            if result.returncode == 0:
                free_mb = float(result.stdout.strip().split(",")[-1].strip())
                return free_mb / 1024
        except Exception as error:
            logger.error(f"查询 GPU {device} 空闲显存失败: {error}")
        return -1.0

    def _get_devices_by_free_memory(self) -> list[tuple[int, float]]:
        """
        按空闲显存倒序获取可用设备列表.

        参数:
          无.
        返回:
          list[tuple[int, float]]: 设备索引与空闲显存列表.
        异常:
          无.
        """
        if not torch.cuda.is_available():
            return [(-1, float("inf"))]
        devices: list[tuple[int, float]] = []
        for index in range(torch.cuda.device_count()):
            free_gb = self._get_gpu_free_memory(index)
            devices.append((index, free_gb))
            logger.info(f"ImageEdit GPU candidate: device={index}, free_gb={free_gb:.2f}")
        devices.sort(key=lambda item: item[1], reverse=True)
        return devices

    def _ensure_lock(self, device: int) -> asyncio.Lock:
        """
        为指定设备创建并返回并发锁.

        参数:
          device: 设备索引, CPU 使用 -1.
        返回:
          asyncio.Lock: 对应设备锁.
        异常:
          无.
        """
        if device not in LocalImageEditClient._device_locks:
            LocalImageEditClient._device_locks[device] = asyncio.Lock()
        return LocalImageEditClient._device_locks[device]

    def _decode_to_temp_image(self, data: str, suffix: str, temp_dir: Path) -> tuple[Path, tuple[int, int]]:
        """
        将 base64 或 data URL 写入临时图片文件.

        参数:
          data: 前端上传的图片内容.
          suffix: 输出文件后缀, 例如 ".png".
          temp_dir: 临时目录路径.
        返回:
          tuple[Path, tuple[int, int]]: 临时文件路径与图片原始尺寸.
        异常:
          ValueError: 当图片无法解码时抛出.
        """
        data_body = data.split(",", 1)[1] if data.startswith("data:") else data
        image_bytes = base64.b64decode(data_body)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        output_path = temp_dir / f"{uuid.uuid4().hex}{suffix}"
        image.save(output_path, format="PNG")
        return output_path, image.size

    def _normalize_dimension(self, value: int, *, fallback: int) -> int:
        """
        将单个尺寸规范到 16 的倍数.

        参数:
          value: 原始尺寸值.
          fallback: 当尺寸无效时使用的兜底值.
        返回:
          int: 可用于模型推理的合法尺寸.
        异常:
          无.
        """
        if value <= 0:
            value = fallback
        normalized = max(16, (value // 16) * 16)
        if normalized <= 0:
            normalized = max(16, (fallback // 16) * 16)
        return normalized

    def _normalize_output_size(self, width: int, height: int) -> tuple[int, int]:
        """
        将输出宽高同时规范到 16 的倍数.

        参数:
          width: 原始宽度.
          height: 原始高度.
        返回:
          tuple[int, int]: 规范化后的宽高.
        异常:
          无.
        """
        normalized_width = self._normalize_dimension(width, fallback=self._default_width)
        normalized_height = self._normalize_dimension(height, fallback=self._default_height)
        return normalized_width, normalized_height

    def _build_script(self, steps: int, seed: int | None) -> str:
        """
        构造子进程推理脚本.

        参数:
          steps: 推理步数.
          seed: 随机种子.
        返回:
          str: 可直接传给 python -c 的脚本文本.
        异常:
          无.
        """
        return f"""
import base64
import io
import json
import os
import sys
import traceback

import torch
from diffusers import QwenImageEditPlusPipeline
from PIL import Image


def _load_image(path: str, width: int, height: int) -> Image.Image:
  image = Image.open(path).convert("RGB")
  if image.size != (width, height):
    image = image.resize((width, height), Image.LANCZOS)
  return image


def _main() -> None:
  device = os.environ.get("TRAI_IMAGE_EDIT_DEVICE", "cpu")
  model_path = os.environ["TRAI_IMAGE_EDIT_MODEL_PATH"]
  prompt = os.environ["TRAI_IMAGE_EDIT_PROMPT"]
  width = int(os.environ["TRAI_IMAGE_EDIT_WIDTH"])
  height = int(os.environ["TRAI_IMAGE_EDIT_HEIGHT"])
  sys.stderr.write("[1/7] 初始化编辑管线\\n")
  dtype = torch.bfloat16 if device.startswith("cuda") else torch.float32

  # 使用 low_cpu_mem_usage=True 减少内存占用, 先加载到 CPU
  pipe = QwenImageEditPlusPipeline.from_pretrained(
    model_path,
    torch_dtype=dtype,
    low_cpu_mem_usage=True,
    device_map="cpu"
  )

  if device.startswith("cuda"):
    # 显式设置当前设备, 配合 CUDA_VISIBLE_DEVICES 确保正确加载
    try:
      torch.cuda.set_device(0)
      # 开启模型层级 CPU Offload, 解决 20B 模型显存需求 (>50GB) 超过单卡 (44GB) 的问题
      pipe.enable_model_cpu_offload()
      sys.stderr.write("[1.5/7] 已启用显存优化 (Model CPU Offload)\\n")
    except Exception as e:
      sys.stderr.write(f"启用显存优化失败: {{e}}, 尝试强制移动到设备\\n")
      pipe = pipe.to(device)
  else:
    pipe = pipe.to(device)

  pipe.set_progress_bar_config(disable=None)
  sys.stderr.write("[2/7] 模型加载完成\\n")
  images = [_load_image(path, width, height) for path in sys.argv[1:]]
  sys.stderr.write("[3/7] 图片加载完成 | count=" + str(len(images)) + " | size=" + str((width, height)) + "\\n")
  seed_value = {repr(seed)}
  generator = None
  if seed_value is not None and seed_value >= 0:
    generator = torch.Generator(device=device).manual_seed(seed_value)
  sys.stderr.write("[4/7] 开始推理 | steps={steps} | seed=" + str(seed_value) + "\\n")
  result = pipe(
    image=images if len(images) > 1 else images[0],
    prompt=prompt,
    negative_prompt=" ",
    num_inference_steps={steps},
    true_cfg_scale=4.0,
    guidance_scale=1.0,
    num_images_per_prompt=1,
    generator=generator,
  )
  image = result.images[0]
  buffer = io.BytesIO()
  image.save(buffer, format="PNG")
  encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
  sys.stderr.write("[5/7] 推理完成 | result_size=" + str(image.size) + "\\n")
  sys.stderr.write("[6/7] 结果编码完成\\n")
  print(json.dumps({{"status": "completed", "image_base64": encoded}}, ensure_ascii=False))
  sys.stderr.write("[7/7] 子进程结束\\n")


if __name__ == "__main__":
  try:
    _main()
  except Exception:
    traceback.print_exc()
    sys.exit(1)
"""

    async def _run_subprocess(
        self,
        image_input: str,
        prompt: str,
        width: int,
        height: int,
        steps: int,
        seed: int | None,
        image_input_2: str | None,
        progress_callback: Any | None = None,
    ) -> dict[str, Any]:
        """
        启动子进程执行本地图像编辑推理.

        参数:
          image_input: 第一张输入图片.
          prompt: 编辑指令.
          width: 输出宽度.
          height: 输出高度.
          steps: 推理步数.
          seed: 随机种子.
          image_input_2: 第二张输入图片, 为空表示单图编辑.
          progress_callback: 进度回调函数, 接收 (message, current_step, total_steps).
        返回:
          dict[str, Any]: 编辑结果字典.
        异常:
          RuntimeError: 当模型执行失败, 显存不足或返回无效结果时抛出.
        """
        async with (self._global_semaphore or asyncio.Semaphore(1)):
            devices = self._get_devices_by_free_memory()
            selected_device = -1
            for dev_idx, free_gb in devices:
                if dev_idx >= 0 and free_gb >= self._min_free_gb:
                    selected_device = dev_idx
                    logger.info(f"选择 GPU {selected_device} 执行任务, 空闲显存: {free_gb:.2f}GB")
                    break

            if selected_device < 0 and devices and devices[0][0] >= 0:
                # 如果没有显存充足的卡, 但有 GPU 可用, 强制选显存最高的那张并尝试执行
                selected_device = devices[0][0]
                logger.warning(
                    f"未找到显存充足 (>={self._min_free_gb}GB) 的 GPU, 强制使用最佳候选卡 {selected_device}, 空闲显存: {devices[0][1]:.2f}GB"
                )

            with tempfile.TemporaryDirectory(prefix="trai_image_edit_") as temp_dir_str:
                temp_dir = Path(temp_dir_str)
                input_paths: list[str] = []
                first_path, _ = self._decode_to_temp_image(image_input, ".png", temp_dir)
                input_paths.append(str(first_path))
                if image_input_2:
                    second_path, _ = self._decode_to_temp_image(image_input_2, ".png", temp_dir)
                    input_paths.append(str(second_path))

                command = [sys.executable, "-c", self._build_script(steps=steps, seed=seed), *input_paths]
                environment = os.environ.copy()
                if selected_device >= 0:
                    environment["CUDA_VISIBLE_DEVICES"] = str(selected_device)
                    environment["TRAI_IMAGE_EDIT_DEVICE"] = "cuda:0"
                    environment["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
                else:
                    environment["TRAI_IMAGE_EDIT_DEVICE"] = "cpu"
                environment["TRAI_IMAGE_EDIT_MODEL_PATH"] = self._model_path
                environment["TRAI_IMAGE_EDIT_PROMPT"] = prompt
                environment["TRAI_IMAGE_EDIT_WIDTH"] = str(width)
                environment["TRAI_IMAGE_EDIT_HEIGHT"] = str(height)
                logger.info(
                    "启动本地图像编辑子进程 | "
                    f"device={environment['TRAI_IMAGE_EDIT_DEVICE']} | "
                    f"steps={steps} | width={width} | height={height} | "
                    f"dual_input={image_input_2 is not None}"
                )

                process = await asyncio.create_subprocess_exec(
                    *command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=environment,
                )

                # 实时读取 stderr 输出并记录日志/回调进度
                last_stdout_line = ""

                async def read_stderr(stream: asyncio.StreamReader) -> None:
                    import re
                    while True:
                        line = await stream.readline()
                        if not line:
                            break
                        text = line.decode("utf-8", errors="ignore").strip()
                        if text:
                            logger.info(f"ImageEdit Subprocess Stderr: {text}")
                            if progress_callback:
                                # 解析进度信息, 例如 "[1/7] 初始化编辑管线"
                                match = re.search(r"\[(\d+)/(\d+)\]\s+(.*)", text)
                                if match:
                                    curr, total, msg = match.groups()
                                    await progress_callback(msg, int(curr), int(total))
                                elif "it/s" in text or "s/it" in text:
                                    # 处理 tqdm 进度条 (简单匹配)
                                    await progress_callback("模型推理中...", 4, 7)

                async def read_stdout(stream: asyncio.StreamReader) -> None:
                    nonlocal last_stdout_line
                    while True:
                        line = await stream.readline()
                        if not line:
                            break
                        text = line.decode("utf-8", errors="ignore").strip()
                        if text:
                            last_stdout_line = text

                # 并发读取 stdout 和 stderr
                await asyncio.gather(read_stderr(process.stderr), read_stdout(process.stdout))
                await process.wait()

                if process.returncode != 0:
                    logger.error(f"本地图像编辑子进程失败 | returncode={process.returncode}")
                    raise RuntimeError("本地图像编辑模型执行失败, 请检查后端日志")

                if not last_stdout_line:
                    raise RuntimeError("本地图像编辑模型未返回结果")

                try:
                    return json.loads(last_stdout_line)
                except json.JSONDecodeError as error:
                    logger.error(f"本地图像编辑结果解析失败 | stdout={last_stdout_line}")
                    raise RuntimeError(f"本地图像编辑结果解析失败: {error}") from error

    async def edit(
        self,
        image_input: str,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
        image_input_2: str | None = None,
        progress_callback: Any | None = None,
    ) -> dict[str, Any]:
        """
        执行单图或双图本地图像编辑.

        参数:
          image_input: 第一张输入图片, 支持 data URL 或 base64.
          prompt: 编辑描述文本.
          width: 指定输出宽度, 为空时回退到原图宽度或默认值.
          height: 指定输出高度, 为空时回退到原图高度或默认值.
          steps: 指定推理步数, 为空时使用默认值.
          seed: 指定随机种子, 为空时使用随机种子.
          image_input_2: 第二张输入图片, 用于双图联动编辑.
          progress_callback: 进度回调.
        返回:
          dict[str, Any]: 编辑结果, 包含 status, image_base64 与 task_id.
        异常:
          RuntimeError: 当图片解码失败或本地推理失败时抛出.
        """
        with tempfile.TemporaryDirectory(prefix="trai_image_probe_") as probe_dir_str:
            probe_dir = Path(probe_dir_str)
            _, source_size = self._decode_to_temp_image(image_input, ".png", probe_dir)
        original_width = width or source_size[0] or self._default_width
        original_height = height or source_size[1] or self._default_height
        target_width, target_height = self._normalize_output_size(original_width, original_height)
        target_steps = steps or self._default_steps
        logger.info(
            "开始本地图像编辑 | "
            f"prompt={prompt[:80]} | "
            f"requested_size={original_width}x{original_height} | "
            f"normalized_size={target_width}x{target_height} | "
            f"steps={target_steps} | dual_input={image_input_2 is not None}"
        )
        result = await self._run_subprocess(
            image_input=image_input,
            prompt=prompt,
            width=target_width,
            height=target_height,
            steps=target_steps,
            seed=seed,
            image_input_2=image_input_2,
            progress_callback=progress_callback,
        )
        result["task_id"] = result.get("task_id") or str(uuid.uuid4())
        logger.info(f"本地图像编辑完成 | task_id={result['task_id']}")
        return result
