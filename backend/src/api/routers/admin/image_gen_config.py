#!/usr/bin/env python
# 文件名: image_gen_config.py
# 作者: wuhao
# 日期: 2026-04-23
# 描述: 管理后台 - AI 图片生成配置

from __future__ import annotations

import os
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from api.deps import AdminUser
from core.logger import logger

router = APIRouter()


class ImageGenConfigResponse(BaseModel):
    """图片生成配置响应"""

    provider: str = Field(description="当前提供商: modelscope/openai/api")
    default_model: str = Field(description="默认模型")
    modelscope_model: str = Field(description="ModelScope 模型")
    openai_model: str = Field(description="OpenAI DALL-E 模型")
    api_base_url: str = Field(description="自定义 API 地址")
    api_key_configured: bool = Field(description="API Key 是否已配置")


class ImageGenConfigUpdateRequest(BaseModel):
    """图片生成配置更新请求"""

    provider: Annotated[
        str,
        Field(description="提供商: modelscope/openai/api")
    ]
    default_model: Annotated[
        str,
        Field(min_length=1, max_length=100, description="默认模型")
    ]
    modelscope_model: Annotated[
        str,
        Field(min_length=1, max_length=100, description="ModelScope 模型")
    ] = "Z-Image-Turbo"
    openai_model: Annotated[
        str,
        Field(min_length=1, max_length=100, description="OpenAI DALL-E 模型")
    ] = "dall-e-3"
    api_base_url: Annotated[
        str,
        Field(description="自定义 API 地址")
    ] = ""


@router.get("/image_gen_config", response_model=ImageGenConfigResponse, tags=["管理后台"])
async def get_image_gen_config(admin: AdminUser) -> ImageGenConfigResponse:
    """获取图片生成配置

    Args:
        admin: 管理员用户

    Returns:
        ImageGenConfigResponse: 配置信息
    """
    provider = os.getenv("IMAGE_GENERATION_PROVIDER", "modelscope").lower()
    default_model = os.getenv("IMAGE_DEFAULT_MODEL", "Z-Image-Turbo")
    modelscope_model = os.getenv("MODELSCOPE_IMAGE_MODEL", "Z-Image-Turbo")
    openai_model = os.getenv("IMAGE_API_MODEL", "dall-e-3")
    api_base_url = os.getenv("IMAGE_API_BASE_URL", "")

    modelscope_key = bool(os.getenv("MODELSCOPE_API_KEY", ""))
    dashscope_key = bool(os.getenv("DASHSCOPE_API_KEY", ""))
    openai_key = bool(os.getenv("IMAGE_API_KEY", ""))

    return ImageGenConfigResponse(
        provider=provider,
        default_model=default_model,
        modelscope_model=modelscope_model,
        openai_model=openai_model,
        api_base_url=api_base_url,
        api_key_configured=modelscope_key or dashscope_key or openai_key,
    )


@router.put("/image_gen_config", response_model=ImageGenConfigResponse, tags=["管理后台"])
async def update_image_gen_config(
    request: ImageGenConfigUpdateRequest,
    admin: AdminUser,
) -> ImageGenConfigResponse:
    """更新图片生成配置

    注意: 此接口仅更新环境变量配置,实际生效需要重启服务.
    生产环境建议直接通过环境变量或配置中心管理.

    Args:
        request: 更新参数
        admin: 管理员用户

    Returns:
        ImageGenConfigResponse: 更新后的配置

    Raises:
        HTTPException: 无效的提供商
    """
    valid_providers = ["modelscope", "openai", "api"]
    if request.provider not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": 400,
                "message": f"无效的提供商: {request.provider}, 必须是 {valid_providers} 之一"
            },
        )

    os.environ["IMAGE_GENERATION_PROVIDER"] = request.provider
    os.environ["IMAGE_DEFAULT_MODEL"] = request.default_model
    os.environ["MODELSCOPE_IMAGE_MODEL"] = request.modelscope_model
    os.environ["IMAGE_API_MODEL"] = request.openai_model
    if request.api_base_url:
        os.environ["IMAGE_API_BASE_URL"] = request.api_base_url

    logger.info(
        f"管理员 {admin.get('user_id')} 更新图片生成配置 | "
        f"provider={request.provider}, default_model={request.default_model}"
    )

    return ImageGenConfigResponse(
        provider=request.provider,
        default_model=request.default_model,
        modelscope_model=request.modelscope_model,
        openai_model=request.openai_model,
        api_base_url=request.api_base_url or "",
        api_key_configured=True,
    )


@router.get("/image_gen_models", tags=["管理后台"])
async def list_image_gen_models(admin: AdminUser) -> dict[str, Any]:
    """获取所有可用的图片生成模型

    Args:
        admin: 管理员用户

    Returns:
        dict: 模型列表
    """
    models = {
        "modelscope": [
            {"id": "Z-Image-Turbo", "name": "Z-Image-Turbo", "description": "ModelScope 极速图片生成"},
            {"id": "AI-ModelScope/FLUX.1-dev", "name": "FLUX.1 Dev", "description": "高质量图片生成"},
            {"id": "AI-ModelScope/FLUX.1-schnell", "name": "FLUX.1 Schnell", "description": "快速图片生成"},
            {"id": "AI-ModelScope/SD3-Medium", "name": "SD3 Medium", "description": "Stable Diffusion 3"},
            {"id": "AI-ModelScope/Wanx", "name": "Wanx", "description": "阿里图片生成模型"},
        ],
        "openai": [
            {"id": "dall-e-3", "name": "DALL-E 3", "description": "OpenAI 高质量图片生成"},
            {"id": "dall-e-2", "name": "DALL-E 2", "description": "OpenAI 快速图片生成"},
        ],
    }

    return models


__all__ = ["router"]
