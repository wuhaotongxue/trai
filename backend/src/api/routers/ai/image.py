#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: image.py
# 作者: wuhao
# 日期: 2026_05_20_0820
# 描述: AI 图片生成接口

from __future__ import annotations

import os
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel, Field

from api.deps import CurrentUserOptional
from application.usecases.image_generation import (
    ImageGenerationInput,
    ImageGenerationUseCase,
)
from infrastructure.ai.modelscope_client import ModelScopeClient
from infrastructure.ai.vision_client import LocalModelScopeVisionClient
from infrastructure.database import get_session
from infrastructure.notify.feishu_ai_notify import (
    ImageEditedEvent,
    ImageGeneratedEvent,
    get_feishu_ai_notify_service,
)

router = APIRouter()


def _send_image_generated_notify(
    user_id: str,
    user_name: str,
    prompt: str,
    image_url: str,
    model: str,
    task_id: str,
    width: int,
    height: int,
) -> None:
    """后台发送文生图完成飞书通知（不阻塞主请求）"""
    if not os.getenv("NOTIFY_FEISHU_IMAGE_ENABLED", "true").lower() == "true":
        return
    try:
        service = get_feishu_ai_notify_service()
        event = ImageGeneratedEvent(
            user_id=user_id,
            user_name=user_name,
            prompt=prompt,
            image_url=image_url,
            model=model,
            task_id=task_id,
            width=width,
            height=height,
        )
        service.notify_image_generated(event)
    except Exception:
        pass


def _send_image_edited_notify(
    user_id: str,
    user_name: str,
    prompt: str,
    source_image_url: str,
    result_image_url: str,
    model: str,
    task_id: str,
    width: int,
    height: int,
    steps: int,
    seed: int,
) -> None:
    """后台发送图片编辑完成飞书通知（不阻塞主请求）"""
    if not os.getenv("NOTIFY_FEISHU_IMAGE_ENABLED", "true").lower() == "true":
        return
    try:
        service = get_feishu_ai_notify_service()
        event = ImageEditedEvent(
            user_id=user_id,
            user_name=user_name,
            prompt=prompt,
            source_image_url=source_image_url,
            result_image_url=result_image_url,
            model=model,
            task_id=task_id,
            width=width,
            height=height,
            steps=steps,
            seed=seed,
        )
        service.notify_image_edited(event)
    except Exception:
        pass


class ImageGenerationRequest(BaseModel):
    """图片生成请求"""

    prompt: Annotated[str, Field(min_length=1, max_length=2000, description="图片描述")]
    model: Annotated[str, Field(default="AI-ModelScope/FLUX.1-dev", description="模型名称")] = (
        "AI-ModelScope/FLUX.1-dev"
    )
    width: Annotated[int, Field(ge=256, le=4096, default=1024, description="图片宽度")] = 1024
    height: Annotated[int, Field(ge=256, le=4096, default=1024, description="图片高度")] = 1024
    steps: Annotated[int, Field(ge=1, le=100, default=30, description="采样步数")] = 30
    seed: Annotated[int, Field(ge=-1, default=-1, description="随机种子,-1 表示随机")] = -1


class ImageGenerationResponse(BaseModel):
    """图片生成响应"""

    task_id: str = Field(description="任务 ID")
    status: str = Field(description="任务状态")
    image_url: str | None = Field(default=None, description="生成的图片 URL（远程 API）")
    image_base64: str | None = Field(default=None, description="生成的图片 base64（本地模型）")
    error: str | None = Field(default=None, description="错误信息")


class ImageToImageRequest(BaseModel):
    """图生图请求"""

    prompt: Annotated[str, Field(min_length=1, max_length=2000, description="图片修改描述")]
    image_url: Annotated[str, Field(min_length=1, max_length=2000000, description="参考图片 URL 或 data URL")]
    model: Annotated[str, Field(default="AI-ModelScope/FLUX.1-dev", description="模型名称")] = (
        "AI-ModelScope/FLUX.1-dev"
    )
    width: Annotated[int, Field(ge=256, le=4096, default=1024, description="图片宽度")] = 1024
    height: Annotated[int, Field(ge=256, le=4096, default=1024, description="图片高度")] = 1024
    steps: Annotated[int, Field(ge=1, le=100, default=30, description="采样步数")] = 30
    seed: Annotated[int, Field(ge=-1, default=-1, description="随机种子,-1 表示随机")] = -1


class ImageStatusRequest(BaseModel):
    """图片生成状态查询请求"""

    task_id: Annotated[str, Field(description="任务 ID")]


class ImageEditRequest(BaseModel):
    """图片编辑请求"""

    image_url: Annotated[str, Field(min_length=1, max_length=10000000, description="原图片 URL 或 base64（最大约 7.5MB）")]
    prompt: Annotated[str, Field(min_length=1, max_length=2000, description="编辑描述")]
    mask: Annotated[str | None, Field(default=None, max_length=2000000, description="蒙版图片 URL 或 base64")] = None
    model: Annotated[str, Field(default="Qwen/Qwen-Image-Edit-2511", description="模型名称")] = "Qwen/Qwen-Image-Edit-2511"
    width: Annotated[int | None, Field(default=None, ge=256, le=2048, description="输出宽度")] = None
    height: Annotated[int | None, Field(default=None, ge=256, le=2048, description="输出高度")] = None
    steps: Annotated[int, Field(default=25, ge=1, le=100, description="采样步数")] = 25
    seed: Annotated[int, Field(default=-1, ge=-1, description="随机种子,-1 表示随机")] = -1


@router.post("/image", response_model=ImageGenerationResponse, tags=["AI"])
async def generate_image(
    request: ImageGenerationRequest,
    current_user: CurrentUserOptional = None,
    background_tasks: BackgroundTasks | None = None,
) -> ImageGenerationResponse:
    """AI 图片生成接口(文生图)

    Args:
        request: 图片生成参数
        current_user: 当前登录用户

    Returns:
        ImageGenerationResponse: 生成结果

    Raises:
        HTTPException: AI 服务错误(502)
    """
    from infrastructure.repositories.image_generation_repository import (
        ImageGenerationRepository,
    )

    user_id = current_user.get("user_id", "") if current_user else ""
    tenant_id = current_user.get("tenant_id") if current_user else None

    try:
        with get_session() as db:
            repo = ImageGenerationRepository(db)
            client = ModelScopeClient()
            use_case = ImageGenerationUseCase(client=client, repository=repo)

            input_data = ImageGenerationInput(
                prompt=request.prompt,
                user_id=user_id,
                tenant_id=tenant_id,
                model=request.model,
                width=request.width,
                height=request.height,
                steps=request.steps,
                seed=request.seed if request.seed >= 0 else -1,
            )
            result = await use_case.execute(input_data)

            if result.status == "completed" and result.image_url:
                user_name = current_user.get("username", user_id) if current_user else user_id
                bg = background_tasks
                if bg is not None:
                    bg.add_task(_send_image_generated_notify, user_id, user_name, request.prompt, result.image_url,
                                request.model, result.task_id, request.width, request.height)
                else:
                    _send_image_generated_notify(user_id, user_name, request.prompt, result.image_url,
                                                 request.model, result.task_id, request.width, request.height)

            return ImageGenerationResponse(
                task_id=result.task_id,
                status=result.status,
                image_url=result.image_url,
                image_base64=result.image_base64,
                error=result.error,
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 图片生成服务错误: {str(e)}"},
        )


@router.post("/image_to_image", response_model=ImageGenerationResponse, tags=["AI"])
async def generate_image_to_image(
    request: ImageToImageRequest,
    current_user: CurrentUserOptional = None,
) -> ImageGenerationResponse:
    from infrastructure.repositories.image_generation_repository import (
        ImageGenerationRepository,
    )

    user_id = current_user.get("user_id", "") if current_user else ""

    try:
        prompt = request.prompt.strip() if request.prompt else ""
        
        if not prompt:
            vision_client = LocalModelScopeVisionClient()
            image_url = request.image_url
            
            if image_url.startswith("data:"):
                image_data = image_url.split(",", 1)[1]
                result = await vision_client.analyze_image(
                    image_data,
                    prompt="请详细描述这张图片的内容，包括主题、颜色、风格、人物或物体等"
                )
                if result.error:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"code": 502, "message": f"图片分析失败: {result.error}"},
                    )
                prompt = f"根据图片内容生成类似风格的图片: {result.content}"
            else:
                prompt = "生成与参考图片风格相似的图片"

        with get_session() as db:
            repo = ImageGenerationRepository(db)
            client = ModelScopeClient()
            use_case = ImageGenerationUseCase(client=client, repository=repo)

            input_data = ImageGenerationInput(
                prompt=prompt,
                user_id=user_id,
                model=request.model,
                width=request.width,
                height=request.height,
                steps=request.steps,
                seed=request.seed if request.seed >= 0 else -1,
            )
            result = await use_case.execute(input_data)

            return ImageGenerationResponse(
                task_id=result.task_id,
                status=result.status,
                image_url=result.image_url,
                image_base64=result.image_base64,
                error=result.error,
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 图生图服务错误: {str(e)}"},
        )


@router.get("/image/models", tags=["AI"])
async def list_image_models(
    current_user: CurrentUserOptional = None,
) -> dict[str, Any]:
    """获取支持的图片生成模型列表

    Args:
        current_user: 当前登录用户

    Returns:
        dict: 模型列表
    """
    models = [
        {"id": "AI-ModelScope/FLUX.1-dev", "name": "FLUX.1 Dev", "description": "高质量图片生成"},
        {"id": "AI-ModelScope/FLUX.1-schnell", "name": "FLUX.1 Schnell", "description": "快速图片生成"},
        {"id": "AI-ModelScope/SD3-Medium", "name": "SD3 Medium", "description": "Stable Diffusion 3"},
        {"id": "AI-ModelScope/Wanx", "name": "Wanx", "description": "阿里图片生成模型"},
    ]

    return {
        "models": models,
        "default": "AI-ModelScope/FLUX.1-dev",
    }


@router.post("/image/edit", response_model=ImageGenerationResponse, tags=["AI"])
async def edit_image(
    request: ImageEditRequest,
    current_user: CurrentUserOptional = None,
    background_tasks: BackgroundTasks | None = None,
) -> ImageGenerationResponse:
    """AI 图片编辑接口（Qwen-Image-Edit-2511）

    Args:
        request: 图片编辑参数
        current_user: 当前登录用户

    Returns:
        ImageGenerationResponse: 编辑结果

    Raises:
        HTTPException: AI 服务错误（502）
    """
    user_id = current_user.get("user_id", "") if current_user else ""
    tenant_id = current_user.get("tenant_id") if current_user else None

    try:
        client = ModelScopeClient()
        result = await client.image_edit(
            image_input=request.image_url,
            prompt=request.prompt,
            width=request.width,
            height=request.height,
            steps=request.steps,
            seed=request.seed if request.seed >= 0 else None,
            user_id=user_id,
            tenant_id=tenant_id,
        )

        if result.get("status") == "completed" and result.get("image_url"):
            user_name = current_user.get("username", user_id) if current_user else user_id
            actual_width = result.get("width") or request.width or 1024
            actual_height = result.get("height") or request.height or 1024
            actual_seed = result.get("seed", request.seed)
            bg = background_tasks
            if bg is not None:
                bg.add_task(
                    _send_image_edited_notify,
                    user_id, user_name, request.prompt,
                    request.image_url, result.get("image_url", ""),
                    request.model, result.get("task_id", ""),
                    actual_width, actual_height,
                    request.steps, actual_seed,
                )
            else:
                _send_image_edited_notify(
                    user_id, user_name, request.prompt,
                    request.image_url, result.get("image_url", ""),
                    request.model, result.get("task_id", ""),
                    actual_width, actual_height,
                    request.steps, actual_seed,
                )

        return ImageGenerationResponse(
            task_id=result.get("task_id", ""),
            status=result.get("status", "completed"),
            image_url=result.get("image_url"),
            image_base64=result.get("image_base64"),
            error=None,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 图片编辑服务错误: {str(e)}"},
        )


__all__ = ["router"]
