#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: image_generation.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 图片生成用例

from __future__ import annotations

from dataclasses import dataclass, field

from trai.application.usecases.base import UseCase
from trai.domain.entities.image_generation import ImageGeneration
from trai.infrastructure.ai.modelscope_client import ModelScopeClient


@dataclass
class ImageGenerationInput:
    """图片生成输入"""
    prompt: str
    model: str = "AI-ModelScope/FLUX.1-dev"
    width: int = 1024
    height: int = 1024
    steps: int = 30
    seed: int = -1


@dataclass
class ImageGenerationOutput:
    """图片生成输出"""
    task_id: str
    image_url: str | None = None
    status: str = "pending"
    error: str | None = None


class ImageGenerationUseCase(UseCase[ImageGenerationInput, ImageGenerationOutput]):
    """图片生成用例"""

    def __init__(self, client: ModelScopeClient | None = None) -> None:
        self._client = client or ModelScopeClient()

    async def execute(self, input_data: ImageGenerationInput) -> ImageGenerationOutput:
        """执行图片生成"""
        generation = ImageGeneration(
            prompt=input_data.prompt,
            model=input_data.model,
            width=input_data.width,
            height=input_data.height,
            steps=input_data.steps,
            seed=input_data.seed,
        )

        try:
            result = await self._client.generate(
                prompt=input_data.prompt,
                width=input_data.width,
                height=input_data.height,
                steps=input_data.steps,
                seed=input_data.seed,
            )
            generation.mark_completed(result["image_url"])
            return ImageGenerationOutput(
                task_id=generation.task_id,
                image_url=generation.image_url,
                status="completed",
            )
        except Exception as e:
            generation.mark_failed(str(e))
            return ImageGenerationOutput(
                task_id=generation.task_id,
                status="failed",
                error=str(e),
            )


__all__ = ["ImageGenerationUseCase", "ImageGenerationInput", "ImageGenerationOutput"]