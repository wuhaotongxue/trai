#!/usr/bin/env python
# 文件名: image.py
# 作者: wuhao
# 日期: 2026_05_20_0830
# 描述: AI 图片生成接口，支持文生图、图生图、图片编辑，数据写入 t_image_records 表


from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status
from loguru import logger
from pydantic import BaseModel, Field

from api.deps import CurrentUserOptional
from application.ai.image_usecases import (
    ImageGenerationInput,
    ImageGenerationUseCase,
)
from domain.media.entities import ImageRecord, ImageRecordType
from infrastructure.ai.core.modelscope_client import ModelScopeClient
from infrastructure.ai.vision.vision_client import LocalModelScopeVisionClient
from infrastructure.database import get_session
from infrastructure.notifications.media_notify import media_notifier
from infrastructure.notify.feishu_ai_notify import (
    ImageEditedEvent,
    ImageGeneratedEvent,
    get_feishu_ai_notify_service,
)
from infrastructure.repositories.image_record_repository import ImageRecordRepository
from infrastructure.services.agent_audit_log_service import AgentAuditLogService

router = APIRouter()


class ImageTaskStore:
    """
    图片编辑任务状态仓库类, 在内存中维护任务进度.
    """

    _tasks: dict[str, dict[str, Any]] = {}

    @classmethod
    def create_task(cls, task_id: str, prompt: str, user_id: str, username: str) -> None:
        cls._tasks[task_id] = {
            "task_id": task_id,
            "status": "pending",
            "progress": 0,
            "stage": "initializing",
            "progress_message": "任务已提交, 等待处理",
            "prompt": prompt,
            "user_id": user_id,
            "username": username,
            "created_at": datetime.now(),
        }

    @classmethod
    def update_task(cls, task_id: str, **kwargs) -> None:
        if task_id in cls._tasks:
            cls._tasks[task_id].update(kwargs)
            cls._tasks[task_id]["updated_at"] = datetime.now()

    @classmethod
    def get_task(cls, task_id: str) -> dict[str, Any] | None:
        return cls._tasks.get(task_id)


def _get_client_ip(request: Request) -> str:
    """从请求中提取真实 IP（支持代理）"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    if request.client:
        return request.client.host or ""
    return ""


def _create_image_record(
    repo: ImageRecordRepository,
    record_type: ImageRecordType,
    prompt: str,
    model: str,
    task_id: str,
    user_id: str,
    username: str,
    client_ip: str,
    request_ip: str,
    user_agent: str,
    is_guest: bool,
    tenant_id: str,
    source_image_url: str = "",
    source_image_url_2: str = "",
    source_image_object_key: str = "",
    source_image_object_key_2: str = "",
    width: int = 1024,
    height: int = 1024,
    steps: int = 25,
    seed: int = -1,
    session_id: str = "",
) -> ImageRecord:
    """创建图片记录并写入数据库"""
    record = ImageRecord(
        record_type=record_type,
        prompt=prompt,
        model=model,
        task_id=task_id,
        user_id=user_id,
        username=username,
        client_ip=client_ip,
        request_ip=request_ip,
        user_agent=user_agent,
        is_guest=is_guest,
        tenant_id=tenant_id,
        source_image_url=source_image_url,
        source_image_url_2=source_image_url_2,
        source_image_object_key=source_image_object_key,
        source_image_object_key_2=source_image_object_key_2,
        width=width,
        height=height,
        steps=steps,
        seed=seed,
        session_id=session_id,
        created_by=user_id,
    )
    repo.create(record)
    return record


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
    """后台发送文生图完成通知（不阻塞主请求）"""
    if os.getenv("NOTIFY_FEISHU_IMAGE_ENABLED", "true").lower() == "true":
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
            _update_notify_status(task_id, True, "success")
        except Exception as e:
            logger.warning(f"飞书原生图片生成通知失败: {e}")
            _update_notify_status(task_id, False, "failed")

    try:
        media_notifier.notify(
            media_type="image",
            prompt=prompt,
            file_url=image_url,
            duration=3.0,
            persona="河南地理专家",
        )
        AgentAuditLogService.write_log_with_new_session(
            action="image_notify_completed",
            level="info",
            path="/ai/image/notify",
            message="图片生成通知发送完成",
            user_id=user_id,
            username=user_name,
            status_code=200,
            metadata={"task_id": task_id, "model": model, "log_type": "image"},
        )
    except Exception as e:
        logger.error(f"媒体统一推送异常(image): {e}")


def _send_image_edited_notify(
    user_id: str,
    user_name: str,
    prompt: str,
    source_image_url: str,
    source_image_url_2: str,
    result_image_url: str,
    model: str,
    task_id: str,
    width: int,
    height: int,
    steps: int,
    seed: int,
) -> None:
    """后台发送图片编辑完成通知（不阻塞主请求）"""
    if os.getenv("NOTIFY_FEISHU_IMAGE_ENABLED", "true").lower() == "true":
        try:
            service = get_feishu_ai_notify_service()
            event = ImageEditedEvent(
                user_id=user_id,
                user_name=user_name,
                prompt=prompt,
                source_image_url=source_image_url,
                source_image_url_2=source_image_url_2,
                result_image_url=result_image_url,
                model=model,
                task_id=task_id,
                width=width,
                height=height,
                steps=steps,
                seed=seed,
            )
            service.notify_image_edited(event)
            _update_notify_status(task_id, True, "success")
        except Exception as e:
            logger.warning(f"飞书原生图片编辑通知失败: {e}")
            _update_notify_status(task_id, False, "failed")

    try:
        media_notifier.notify(
            media_type="image",
            prompt=prompt,
            file_url=result_image_url,
            duration=3.0,
            persona="河南地理专家",
        )
        AgentAuditLogService.write_log_with_new_session(
            action="image_edit_notify_completed",
            level="info",
            path="/ai/image/edit/notify",
            message="图片编辑通知发送完成",
            user_id=user_id,
            username=user_name,
            status_code=200,
            metadata={"task_id": task_id, "model": model, "log_type": "image_edit"},
        )
    except Exception as e:
        logger.error(f"媒体统一推送异常(image_edit): {e}")


def _update_notify_status(task_id: str, notified: bool, notify_status: str) -> None:
    """更新通知状态到数据库"""
    try:
        from infrastructure.database import get_session

        with get_session() as db:
            repo = ImageRecordRepository(db)
            repo.update_notify_status(task_id, notified, notify_status)
            db.commit()
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
    image_url: str | None = Field(default=None, description="生成的图片 URL（远程 API / S3 Presigned）")
    image_base64: str | None = Field(default=None, description="生成的图片 base64（本地模型）")
    object_key: str | None = Field(default=None, description="S3 对象键")
    public_url: str | None = Field(default=None, description="S3 公共域名 URL")
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
    """图片编辑请求（支持单图和双图联动编辑）"""

    image_url: Annotated[
        str, Field(min_length=1, max_length=10000000, description="原图片 URL 或 base64（最大约 7.5MB）")
    ]
    image_url_2: Annotated[
        str | None, Field(default=None, max_length=10000000, description="第二张图片 URL 或 base64（双图联动编辑模式）")
    ] = None
    prompt: Annotated[str, Field(min_length=1, max_length=2000, description="编辑描述")]
    mask: Annotated[str | None, Field(default=None, max_length=2000000, description="蒙版图片 URL 或 base64")] = None
    model: Annotated[str, Field(default="Qwen/Qwen-Image-Edit-2511", description="模型名称")] = (
        "Qwen/Qwen-Image-Edit-2511"
    )
    width: Annotated[int | None, Field(default=None, ge=256, le=2048, description="输出宽度")] = None
    height: Annotated[int | None, Field(default=None, ge=256, le=2048, description="输出高度")] = None
    steps: Annotated[int, Field(default=25, ge=1, le=100, description="采样步数")] = 25
    seed: Annotated[int, Field(default=-1, ge=-1, description="随机种子,-1 表示随机")] = -1


@router.get("/image/status/{task_id}", tags=["AI"], summary="查询图片任务状态")
async def get_image_status(task_id: str) -> dict[str, Any]:
    """查询 AI 图片任务的实时进度和状态"""
    task = ImageTaskStore.get_task(task_id)
    if task:
        return {
            "code": 200,
            "msg": "OK",
            "data": task,
        }

    # 如果内存中没有, 尝试从数据库读取最终结果
    try:
        with get_session() as db:
            repo = ImageRecordRepository(db)
            record = repo.get_by_id(task_id)
            if record:
                return {
                    "code": 200,
                    "msg": "OK",
                    "data": {
                        "task_id": task_id,
                        "status": record.status.value,
                        "image_url": record.result_url,
                        "image_base64": record.result_base64,
                        "error": record.error_message,
                    },
                }
    except Exception:
        pass

    raise HTTPException(status_code=404, detail="任务不存在")


async def _execute_image_edit_task(
    task_id: str,
    image_url: str,
    image_url_2: str | None,
    prompt: str,
    width: int | None,
    height: int | None,
    steps: int,
    seed: int,
    user_id: str,
    username: str,
    tenant_id: str,
    client_ip: str,
    user_agent: str,
    is_guest: bool,
    source_image_url: str,
    source_image_url_2: str,
    source_image_object_key: str,
    source_image_object_key_2: str,
    record_type: ImageRecordType,
    actual_width: int,
    actual_height: int,
) -> None:
    """后台执行图片编辑任务"""
    from domain.media.entities import ImageRecordStatus

    try:
        ImageTaskStore.update_task(task_id, status="processing", stage="initializing", progress=10)

        async def progress_callback(msg: str, curr: int, total: int) -> None:
            progress = int((curr / total) * 100)
            ImageTaskStore.update_task(
                task_id,
                stage="processing",
                progress=progress,
                progress_message=msg,
            )

        client = ModelScopeClient()
        result = await client.image_edit(
            image_input=image_url,
            prompt=prompt,
            width=width,
            height=height,
            steps=steps,
            seed=seed if seed >= 0 else None,
            user_id=user_id,
            tenant_id=tenant_id,
            image_input_2=image_url_2,
            progress_callback=progress_callback,
        )

        result_url = result.get("image_url", "")
        result_base64 = result.get("image_base64", "")

        with get_session() as db:
            image_record_repo = ImageRecordRepository(db)
            image_record_repo.update_status(
                task_id=task_id,
                status=ImageRecordStatus.COMPLETED,
                result_url=result_url,
                result_base64=result_base64,
            )
            db.commit()

        ImageTaskStore.update_task(
            task_id,
            status="completed",
            progress=100,
            stage="done",
            image_url=result_url,
            image_base64=result_base64,
        )

        if result.get("status") == "completed" and result_url:
            _send_image_edited_notify(
                user_id,
                username,
                prompt,
                source_image_url,
                source_image_url_2,
                result_url,
                "Qwen/Qwen-Image-Edit-2511",
                task_id,
                actual_width,
                actual_height,
                steps,
                seed,
            )

    except Exception as e:
        logger.error(f"图片编辑后台任务失败 | task_id={task_id} | error={e}")
        ImageTaskStore.update_task(task_id, status="failed", error=str(e), stage="failed")
        try:
            with get_session() as db:
                repo = ImageRecordRepository(db)
                repo.update_status(
                    task_id=task_id,
                    status=ImageRecordStatus.FAILED,
                    error_message=str(e),
                )
                db.commit()
        except Exception:
            pass


@router.post("/image", response_model=None, tags=["AI"])
async def generate_image(
    request_http: Request,
    request: ImageGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUserOptional = None,
) -> ImageGenerationResponse:
    """AI 图片生成接口（文生图）

    Args:
        request_http: HTTP 请求（用于获取 IP）
        request: 图片生成参数
        current_user: 当前登录用户

    Returns:
        ImageGenerationResponse: 生成结果

    Raises:
        HTTPException: AI 服务错误（502）
    """
    from domain.media.entities import ImageRecordStatus
    from infrastructure.repositories.image_generation_repository import (
        ImageGenerationRepository,
    )

    user_id = current_user.get("user_id", "") if current_user else ""
    tenant_id = current_user.get("tenant_id") if current_user else ""
    username = current_user.get("username", user_id) if current_user else user_id
    is_guest = current_user is None
    client_ip = _get_client_ip(request_http)
    user_agent = request_http.headers.get("User-Agent", "")[:500]

    task_id = str(uuid.uuid4())

    try:
        with get_session() as db:
            image_record_repo = ImageRecordRepository(db)
            image_gen_repo = ImageGenerationRepository(db)

            _create_image_record(
                repo=image_record_repo,
                record_type=ImageRecordType.TEXT_TO_IMAGE,
                prompt=request.prompt,
                model=request.model,
                task_id=task_id,
                user_id=user_id,
                username=username,
                client_ip=client_ip,
                request_ip=client_ip,
                user_agent=user_agent,
                is_guest=is_guest,
                tenant_id=tenant_id,
                width=request.width,
                height=request.height,
                steps=request.steps,
                seed=request.seed,
            )
            db.commit()

            client = ModelScopeClient()
            use_case = ImageGenerationUseCase(client=client, repository=image_gen_repo)

            input_data = ImageGenerationInput(
                prompt=request.prompt,
                user_id=user_id,
                tenant_id=tenant_id,
                model=request.model,
                width=request.width,
                height=request.height,
                steps=request.steps,
                seed=request.seed if request.seed >= 0 else -1,
                task_id=task_id,
            )
            result = await use_case.execute(input_data)

            if result.status == "completed" and (result.image_url or result.image_base64):
                image_record_repo.update_status(
                    task_id=task_id,
                    status=ImageRecordStatus.COMPLETED,
                    result_url=result.image_url or "",
                    result_base64=result.image_base64 or "",
                )
                db.commit()

                if result.image_url:
                    background_tasks.add_task(
                        _send_image_generated_notify,
                        user_id,
                        username,
                        request.prompt,
                        result.image_url,
                        request.model,
                        task_id,
                        request.width,
                        request.height,
                    )
                    background_tasks.add_task(
                        media_notifier.notify,
                        media_type="image",
                        prompt=request.prompt,
                        file_url=result.image_url,
                        duration=0.0,
                    )

            return ImageGenerationResponse(
                task_id=result.task_id,
                status=result.status,
                image_url=result.image_url,
                image_base64=result.image_base64,
                object_key=result.object_key,
                public_url=result.public_url,
                error=result.error,
            )

    except Exception as e:
        try:
            with get_session() as db:
                repo = ImageRecordRepository(db)
                repo.update_status(
                    task_id=task_id,
                    status=ImageRecordStatus.FAILED,
                    error_message=str(e),
                )
                db.commit()
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 图片生成服务错误: {str(e)}"},
        )


@router.post("/image_to_image", response_model=ImageGenerationResponse, tags=["AI"])
async def generate_image_to_image(
    request_http: Request,
    request: ImageToImageRequest,
    current_user: CurrentUserOptional = None,
) -> ImageGenerationResponse:
    """AI 图生图接口

    Args:
        request_http: HTTP 请求（用于获取 IP）
        request: 图生图参数
        current_user: 当前登录用户

    Returns:
        ImageGenerationResponse: 生成结果

    Raises:
        HTTPException: AI 服务错误（502）
    """
    from domain.media.entities import ImageRecordStatus
    from infrastructure.repositories.image_generation_repository import (
        ImageGenerationRepository,
    )

    user_id = current_user.get("user_id", "") if current_user else ""
    tenant_id = current_user.get("tenant_id") if current_user else ""
    username = current_user.get("username", user_id) if current_user else user_id
    is_guest = current_user is None
    client_ip = _get_client_ip(request_http)
    user_agent = request_http.headers.get("User-Agent", "")[:500]

    task_id = str(uuid.uuid4())

    try:
        prompt = request.prompt.strip() if request.prompt else ""

        if not prompt:
            vision_client = LocalModelScopeVisionClient()
            image_url = request.image_url

            if image_url.startswith("data:"):
                image_data = image_url.split(",", 1)[1]
                vision_result = await vision_client.analyze_image(
                    image_data,
                    prompt="请详细描述这张图片的内容，包括主题、颜色、风格、人物或物体等",
                )
                if vision_result.error:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"code": 502, "message": f"图片分析失败: {vision_result.error}"},
                    )
                prompt = f"根据图片内容生成类似风格的图片: {vision_result.content}"
            else:
                prompt = "生成与参考图片风格相似的图片"

        with get_session() as db:
            image_record_repo = ImageRecordRepository(db)
            image_gen_repo = ImageGenerationRepository(db)

            _create_image_record(
                repo=image_record_repo,
                record_type=ImageRecordType.IMAGE_TO_IMAGE,
                prompt=prompt,
                model=request.model,
                task_id=task_id,
                user_id=user_id,
                username=username,
                client_ip=client_ip,
                request_ip=client_ip,
                user_agent=user_agent,
                is_guest=is_guest,
                tenant_id=tenant_id,
                source_image_url=request.image_url,
                width=request.width,
                height=request.height,
                steps=request.steps,
                seed=request.seed,
            )
            db.commit()

            use_case = ImageGenerationUseCase(client=ModelScopeClient(), repository=image_gen_repo)

            input_data = ImageGenerationInput(
                prompt=prompt,
                user_id=user_id,
                tenant_id=tenant_id,
                model=request.model,
                width=request.width,
                height=request.height,
                steps=request.steps,
                seed=request.seed if request.seed >= 0 else -1,
                task_id=task_id,
            )
            result = await use_case.execute(input_data)

            if result.status == "completed" and result.image_url:
                image_record_repo.update_status(
                    task_id=task_id,
                    status=ImageRecordStatus.COMPLETED,
                    result_url=result.image_url,
                    result_base64=result.image_base64 or "",
                )
                db.commit()

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
        try:
            with get_session() as db:
                repo = ImageRecordRepository(db)
                repo.update_status(
                    task_id=task_id,
                    status=ImageRecordStatus.FAILED,
                    error_message=str(e),
                )
                db.commit()
        except Exception:
            pass
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
        {"id": "Qwen/Qwen-Image-Edit-2511", "name": "Qwen Image Edit", "description": "图片编辑模型"},
    ]

    return {
        "models": models,
        "default": "AI-ModelScope/FLUX.1-dev",
    }


@router.post("/image/edit", response_model=None, tags=["AI"])
async def edit_image(
    request_http: Request,
    request: ImageEditRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUserOptional = None,
) -> ImageGenerationResponse:
    """AI 图片编辑接口（Qwen-Image-Edit-2511，支持单图/双图联动编辑）

    - 单图模式：传入 image_url，第二张图为空
    - 双图联动：传入 image_url + image_url_2，两张图会融合生成新图

    Args:
        request_http: HTTP 请求（用于获取 IP）
        request: 图片编辑参数
        current_user: 当前登录用户

    Returns:
        ImageGenerationResponse: 编辑结果

    Raises:
        HTTPException: AI 服务错误（502）
    """
    import base64

    from domain.media.entities import ImageRecordStatus
    from infrastructure.storage.s3_storage import S3StorageService

    user_id = current_user.get("user_id", "") if current_user else ""
    tenant_id = current_user.get("tenant_id") if current_user else ""
    username = current_user.get("username", user_id) if current_user else user_id
    is_guest = current_user is None
    client_ip = _get_client_ip(request_http)
    user_agent = request_http.headers.get("User-Agent", "")[:500]
    safe_tenant_id = tenant_id or "default"
    safe_user_id = user_id or "anonymous"

    task_id = str(uuid.uuid4())
    actual_width = request.width or 1024
    actual_height = request.height or 1024
    is_dual = request.image_url_2 is not None

    # 上传原图到 S3，记录对象键
    storage = S3StorageService()

    def _decode_base64(data_url: str) -> bytes:
        if data_url.startswith("data:"):
            b64_part = data_url.split(",", 1)[1]
        else:
            b64_part = data_url
        return base64.b64decode(b64_part)

    def _detect_ext(b64_data: str) -> tuple[str, str]:
        try:
            raw = _decode_base64(b64_data[:100])
            if raw.startswith(b"\xff\xd8\xff"):
                return "jpg", "image/jpeg"
            if raw.startswith(b"\x89PNG"):
                return "png", "image/png"
            if raw.startswith(b"GIF"):
                return "gif", "image/gif"
        except Exception:
            pass
        return "png", "image/png"

    source_object_key = ""
    source_object_key_2 = ""

    try:
        # 上传第一张原图
        img1_bytes = _decode_base64(request.image_url)
        ext1, mime1 = _detect_ext(request.image_url)
        source_object_key = f"private/tenants/{safe_tenant_id}/ai_source/images/{safe_user_id}/{task_id}_1.{ext1}"
        storage.upload_bytes(img1_bytes, source_object_key, mime1)

        # 上传第二张原图（双图模式）
        if is_dual and request.image_url_2:
            img2_bytes = _decode_base64(request.image_url_2)
            ext2, mime2 = _detect_ext(request.image_url_2)
            source_object_key_2 = f"private/tenants/{safe_tenant_id}/ai_source/images/{safe_user_id}/{task_id}_2.{ext2}"
            storage.upload_bytes(img2_bytes, source_object_key_2, mime2)

    except Exception as e:
        logger.warning(f"原图 S3 上传失败，继续处理: {e}")
        source_object_key = ""
        source_object_key_2 = ""

    # 飞书通知使用 S3 URL（而非原始 base64）
    source_image_url = storage.get_file_url(source_object_key) if source_object_key else request.image_url
    source_image_url_2 = (
        storage.get_file_url(source_object_key_2) if source_object_key_2 else (request.image_url_2 or "")
    )

    # 构建记录类型
    record_type = ImageRecordType.IMAGE_EDIT_DUAL if is_dual else ImageRecordType.IMAGE_EDIT

    try:
        with get_session() as db:
            image_record_repo = ImageRecordRepository(db)

            _create_image_record(
                repo=image_record_repo,
                record_type=record_type,
                prompt=request.prompt,
                model=request.model,
                task_id=task_id,
                user_id=user_id,
                username=username,
                client_ip=client_ip,
                request_ip=client_ip,
                user_agent=user_agent,
                is_guest=is_guest,
                tenant_id=tenant_id,
                source_image_url=source_image_url,
                source_image_url_2=source_image_url_2,
                source_image_object_key=source_object_key,
                source_image_object_key_2=source_object_key_2,
                width=actual_width,
                height=actual_height,
                steps=request.steps,
                seed=request.seed,
            )
            db.commit()

        # 创建内存任务状态
        ImageTaskStore.create_task(task_id, request.prompt, user_id, username)

        # 启动后台任务
        background_tasks.add_task(
            _execute_image_edit_task,
            task_id=task_id,
            image_url=request.image_url,
            image_url_2=request.image_url_2,
            prompt=request.prompt,
            width=request.width,
            height=request.height,
            steps=request.steps,
            seed=request.seed,
            user_id=user_id,
            username=username,
            tenant_id=tenant_id,
            client_ip=client_ip,
            user_agent=user_agent,
            is_guest=is_guest,
            source_image_url=source_image_url,
            source_image_url_2=source_image_url_2,
            source_image_object_key=source_object_key,
            source_image_object_key_2=source_object_key_2,
            record_type=record_type,
            actual_width=actual_width,
            actual_height=actual_height,
        )

        return ImageGenerationResponse(
            task_id=task_id,
            status="pending",
            image_url=None,
            image_base64=None,
            error=None,
        )

    except Exception as e:
        try:
            with get_session() as db:
                repo = ImageRecordRepository(db)
                repo.update_status(
                    task_id=task_id,
                    status=ImageRecordStatus.FAILED,
                    error_message=str(e),
                )
                db.commit()
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 图片编辑服务错误: {str(e)}"},
        )


__all__ = ["router"]
