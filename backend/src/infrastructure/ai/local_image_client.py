#!/usr/bin/env python
# 文件名: local_image_client.py
# 作者: wuhao
# 日期: 2026_05_14_2022
# 描述: 本地图片生成客户端，使用 Tongyi-MAI/Z-Image-Turbo 模型


from __future__ import annotations

import base64
import io
import os
import time
from typing import Any

import torch
from loguru import logger

from core.exceptions import ExternalServiceError


class LocalImageClient:
    """本地图片生成客户端"""

    _instance: LocalImageClient | None = None
    _pipe: Any | None = None
    _is_loading: bool = False

    def __new__(cls) -> LocalImageClient:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        self._model_path: str = os.getenv(
            "MODELSCOPE_IMAGE_MODEL_PATH", "/home/qyjgylc_whf/.cache/modelscope/hub/models/Tongyi-MAI/Z-Image-Turbo"
        )
        self._default_steps: int = int(os.getenv("MODELSCOPE_IMAGE_STEPS", "4"))
        self._default_width: int = int(os.getenv("MODELSCOPE_IMAGE_WIDTH", "1024"))
        self._default_height: int = int(os.getenv("MODELSCOPE_IMAGE_HEIGHT", "1024"))
        self._device: str = self._select_device()
        self._dtype = torch.bfloat16 if self._device.startswith("cuda") else torch.float32

    def _select_device(self) -> str:
        if not torch.cuda.is_available():
            return "cpu"

        device_count = torch.cuda.device_count()
        if device_count <= 0:
            return "cpu"

        best_device_index = 0
        best_free = -1
        for i in range(device_count):
            try:
                free, total = torch.cuda.mem_get_info(i)
                logger.info(f"GPU {i}: free={free / 1024**3:.2f}GB total={total / 1024**3:.2f}GB")
                if free > best_free:
                    best_free = free
                    best_device_index = i
            except Exception as e:
                logger.warning(f"GPU {i}: mem_get_info failed: {e}")

        return f"cuda:{best_device_index}"

    def _ensure_pipe(self) -> None:
        """确保模型已加载"""
        if LocalImageClient._pipe is not None:
            return

        if LocalImageClient._is_loading:
            for _ in range(600):
                if LocalImageClient._pipe is not None:
                    return
                time.sleep(0.2)
            raise ExternalServiceError(
                message="图片生成模型加载超时",
                details={},
            )

        LocalImageClient._is_loading = True
        try:
            logger.info(f"Loading ZImagePipeline: path={self._model_path} device={self._device} dtype={self._dtype}")
            from modelscope import ZImagePipeline

            pipe = ZImagePipeline.from_pretrained(
                self._model_path,
                torch_dtype=self._dtype,
                low_cpu_mem_usage=False,
            )
            pipe = pipe.to(self._device)
            LocalImageClient._pipe = pipe
            logger.info("本地图片生成模型加载完成")
        finally:
            LocalImageClient._is_loading = False

    def _generate_image(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
    ) -> dict[str, Any]:
        """生成图片

        Args:
            prompt: 图片描述
            width: 宽度
            height: 高度
            steps: 采样步数
            seed: 随机种子

        Returns:
            dict: 生成结果（包含 base64 图片）
        """
        self._ensure_pipe()

        if LocalImageClient._pipe is None:
            raise ExternalServiceError(
                message="图片生成模型加载失败",
                details={},
            )

        actual_steps = steps or self._default_steps
        actual_width = width or self._default_width
        actual_height = height or self._default_height

        generator: torch.Generator | None = None
        if seed is not None and seed >= 0:
            generator = torch.Generator(device=self._device).manual_seed(seed)

        logger.info(
            f"生成图片 | 提示词: {prompt[:30]}... | 尺寸: {actual_width}x{actual_height} | 步数: {actual_steps}"
        )

        image = LocalImageClient._pipe(
            prompt,
            width=actual_width,
            height=actual_height,
            num_inference_steps=actual_steps,
            guidance_scale=0.0,
            generator=generator,
        ).images[0]

        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return {
            "image_base64": image_base64,
            "width": actual_width,
            "height": actual_height,
            "steps": actual_steps,
            "seed": seed if seed is not None else -1,
        }

    async def generate(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
    ) -> dict[str, Any]:
        """异步生成图片

        Args:
            prompt: 图片描述
            width: 宽度
            height: 高度
            steps: 采样步数
            seed: 随机种子

        Returns:
            dict: 生成结果（包含 base64 图片）
        """
        import asyncio

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._generate_image,
            prompt,
            width,
            height,
            steps,
            seed,
        )

    @classmethod
    def unload(cls) -> None:
        """卸载模型，释放显存"""
        if cls._pipe is not None:
            del cls._pipe
            cls._pipe = None
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            logger.info("本地图片生成模型已卸载")

    @classmethod
    def is_loaded(cls) -> bool:
        """检查模型是否已加载"""
        return cls._pipe is not None


__all__ = ["LocalImageClient"]
