#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: image.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: AI 图片生成接口

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Body

from trai.application.usecases.image_generation import (
    ImageGenerationInput,
    ImageGenerationUseCase,
)
from trai.infrastructure.ai.modelscope_client import ModelScopeClient

router = APIRouter()


@router.post("/image")
async def generate_image(
    prompt: str = Body(..., description="图片描述"),
    model: str = Body("AI-ModelScope/FLUX.1-dev", description="模型名称"),
    width: int = Body(1024, ge=256, le=4096, description="图片宽度"),
    height: int = Body(1024, ge=256, le=4096, description="图片高度"),
    steps: int = Body(30, ge=1, le=100, description="采样步数"),
    seed: int = Body(-1, ge=-1, description="随机种子，-1 表示随机"),
) -> dict[str, Any]:
    """AI 图片生成接口

    Args:
        prompt: 图片描述
        model: 模型名称
        width: 图片宽度 (256-4096)
        height: 图片高度 (256-4096)
        steps: 采样步数 (1-100)
        seed: 随机种子，-1 表示随机

    Returns:
        dict: 生成结果
    """
    client = ModelScopeClient()
    use_case = ImageGenerationUseCase(client=client)

    input_data = ImageGenerationInput(
        prompt=prompt,
        model=model,
        width=width,
        height=height,
        steps=steps,
        seed=seed,
    )
    result = await use_case.execute(input_data)

    return {
        "task_id": result.task_id,
        "status": result.status,
        "image_url": result.image_url,
        "error": result.error,
    }


__all__ = ["router"]