#!/usr/bin/env python
# 文件名: image.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: AI 图片生成接口

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from api.deps import CurrentUser
from application.usecases.image_generation import (
    ImageGenerationInput,
    ImageGenerationUseCase,
)
from infrastructure.ai.modelscope_client import ModelScopeClient
from infrastructure.database import get_session

router = APIRouter()


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
    image_url: str | None = Field(default=None, description="生成的图片 URL")
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


@router.post("/image", response_model=ImageGenerationResponse, tags=["AI"])
async def generate_image(
    request: ImageGenerationRequest,
    current_user: CurrentUser,
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

    user_id = current_user.get("user_id", "")

    try:
        with get_session() as db:
            repo = ImageGenerationRepository(db)
            client = ModelScopeClient()
            use_case = ImageGenerationUseCase(client=client, repository=repo)

            input_data = ImageGenerationInput(
                prompt=request.prompt,
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
    current_user: CurrentUser,
) -> ImageGenerationResponse:
    from infrastructure.repositories.image_generation_repository import (
        ImageGenerationRepository,
    )

    user_id = current_user.get("user_id", "")

    try:
        db = get_session()
        repo = ImageGenerationRepository(db)
        client = ModelScopeClient()
        use_case = ImageGenerationUseCase(client=client, repository=repo)

        input_data = ImageGenerationInput(
            prompt=request.prompt,
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
            error=result.error,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 图生图服务错误: {str(e)}"},
        )


@router.get("/image/models", tags=["AI"])
async def list_image_models(
    current_user: CurrentUser,
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


__all__ = ["router"]
