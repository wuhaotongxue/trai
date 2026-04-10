#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: image_generation.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 图片生成用例

from __future__ import annotations

from dataclasses import dataclass

from application.usecases.base import UseCase
from domain.entities.image_generation import (
    ImageGeneration,
    ImageSize,
    ImageStatus,
    ImageStyle,
)
from domain.interfaces.image_generation_interfaces import (
    IImageGenerationRepository,
)
from infrastructure.ai.modelscope_client import ModelScopeClient


@dataclass
class ImageGenerationInput:
    """图片生成输入"""
    prompt: str
    user_id: str = ""
    model: str = "AI-ModelScope/FLUX.1-dev"
    width: int = 1024
    height: int = 1024
    steps: int = 30
    seed: int = -1
    negative_prompt: str | None = None
    style: ImageStyle = ImageStyle.AUTO
    size: ImageSize = ImageSize.SQUARE_1K
    session_id: str | None = None
    trace_id: str | None = None


@dataclass
class ImageGenerationOutput:
    """图片生成输出"""
    task_id: str
    image_url: str | None = None
    status: str = "pending"
    error: str | None = None


class ImageGenerationUseCase(UseCase[ImageGenerationInput, ImageGenerationOutput]):
    """图片生成用例"""

    def __init__(
        self,
        client: ModelScopeClient | None = None,
        repository: IImageGenerationRepository | None = None,
    ) -> None:
        self._client = client or ModelScopeClient()
        self._repository = repository

    async def execute(
        self, input_data: ImageGenerationInput
    ) -> ImageGenerationOutput:
        """执行图片生成"""
        generation = ImageGeneration(
            prompt=input_data.prompt,
            user_id=input_data.user_id,
            model=input_data.model,
            width=input_data.width,
            height=input_data.height,
            steps=input_data.steps,
            seed=input_data.seed,
            negative_prompt=input_data.negative_prompt,
            style=input_data.style,
            size=input_data.size,
            session_id=input_data.session_id,
            trace_id=input_data.trace_id,
        )

        if self._repository:
            self._repository.create(generation)

        try:
            result = await self._client.generate(
                prompt=input_data.prompt,
                width=input_data.width,
                height=input_data.height,
                steps=input_data.steps,
                seed=input_data.seed,
            )
            image_url = result["image_url"]
            generation.mark_completed(image_url)

            if self._repository:
                self._repository.update_status(
                    generation.task_id,
                    generation.status.value,
                    result_url=image_url,
                )

            return ImageGenerationOutput(
                task_id=generation.task_id,
                image_url=image_url,
                status="completed",
            )
        except Exception as e:
            generation.mark_failed(str(e))

            if self._repository:
                self._repository.update_status(
                    generation.task_id,
                    generation.status.value,
                    error_message=str(e),
                )

            return ImageGenerationOutput(
                task_id=generation.task_id,
                status="failed",
                error=str(e),
            )


__all__ = ["ImageGenerationUseCase", "ImageGenerationInput", "ImageGenerationOutput"]