#!/usr/bin/env python
# 文件名: video.py
# 作者: wuhao
# 日期: 2026_05_28_11:58:59
# 描述: 视频生成 API, 支持 Wan2.1-T2V-1.3B 本地模型, 结果上传 S3 并推送飞书通知

from __future__ import annotations

import base64
import os
import time
import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Request
from loguru import logger
from pydantic import BaseModel, Field

from api.deps import CurrentUserOptional
from core.exceptions import ExternalServiceError
from infrastructure.ai.video.local_video_client import LocalVideoClient
from infrastructure.notifications.media_notify import media_notifier
from infrastructure.notify.feishu_ai_notify import (
    VideoGeneratedEvent,
    get_feishu_ai_notify_service,
)
from infrastructure.storage.s3_storage import S3StorageService

router = APIRouter()


class VideoApiUtils:
    """
    视频 API 工具类, 封装内部使用的辅助函数
    """

    @staticmethod
    def get_client_ip(request: Request) -> str:
        """
        从请求中提取真实 IP (支持代理)

        参数:
            request (Request): FastAPI 请求对象
        返回值:
            str: 客户端真实 IP 地址
        """
        forwarded = request.headers.get("X-Forwarded-For")
        if request.client:
            host = request.client.host or ""
        else:
            host = ""
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        return host

    @staticmethod
    def build_object_key(tenant_id: str, user_id: str, task_id: str) -> str:
        """
        构建视频结果的 S3 对象键.

        参数:
            tenant_id (str): 租户 ID.
            user_id (str): 用户 ID.
            task_id (str): 任务 ID.

        返回值:
            str: 视频对象键.

        异常:
            无.
        """
        safe_tenant_id = tenant_id or "default"
        safe_user_id = user_id or "anonymous"
        return f"private/tenants/{safe_tenant_id}/ai_generated/videos/{safe_user_id}/{task_id}.mp4"

    @staticmethod
    def upload_video_to_s3(video_base64: str, object_key: str) -> tuple[str, str]:
        """
        将生成的视频上传到 S3, 并返回访问地址.

        参数:
            video_base64 (str): 视频的 Base64 数据.
            object_key (str): S3 对象键.

        返回值:
            tuple[str, str]: (预签名访问地址, 公共域名地址).

        异常:
            ExternalServiceError: 视频数据为空或上传失败时抛出.
        """
        if not video_base64:
            raise ExternalServiceError(message="视频生成成功, 但未返回视频数据")

        try:
            video_bytes = base64.b64decode(video_base64)
        except Exception as error:
            raise ExternalServiceError(
                message="视频数据解码失败",
                details={"error": str(error)},
            ) from error

        s3_storage = S3StorageService()
        s3_storage.upload_bytes(
            data=video_bytes,
            object_key=object_key,
            content_type="video/mp4",
        )
        video_url = s3_storage.get_long_term_url(object_key, expires_days=30)
        public_url = s3_storage.get_file_url(object_key)
        return video_url, public_url

    @staticmethod
    def send_video_generated_notify(
        user_id: str,
        user_name: str,
        prompt: str,
        video_url: str,
        object_key: str,
        public_url: str,
        model: str,
        task_id: str,
        frames: int,
        resolution: str,
    ) -> None:
        """
        后台发送视频生成完成通知 (飞书 + 企业微信)

        参数:
            user_id (str): 用户 ID
            user_name (str): 用户名
            prompt (str): 生成提示词
            video_url (str): 视频下载地址
            object_key (str): S3 对象键
            public_url (str): 公共访问地址
            model (str): 模型名称
            task_id (str): 任务 ID
            frames (int): 视频帧数
            resolution (str): 视频分辨率
        返回值:
            None
        """
        # --- 飞书通知 ---
        if os.getenv("NOTIFY_FEISHU_VIDEO_ENABLED", "true").lower() == "true":
            try:
                service = get_feishu_ai_notify_service()
                event = VideoGeneratedEvent(
                    user_id=user_id,
                    user_name=user_name,
                    prompt=prompt,
                    video_url=video_url,
                    object_key=object_key,
                    public_url=public_url,
                    model=model,
                    task_id=task_id,
                    frames=frames,
                    resolution=resolution,
                )
                feishu_result = service.notify_video_generated(event)
                logger.info(f"[通知] 飞书视频推送完成 | task_id={task_id} | result={feishu_result}")
            except Exception as e:
                logger.error(f"[通知] 飞书推送失败 | task_id={task_id} | error={str(e)}")

        try:
            media_notifier.notify(
                media_type="video", prompt=prompt, file_url=public_url or video_url, duration=frames // 5
            )
        except Exception as e:
            logger.error(f"[通知] 媒体推送失败 | task_id={task_id} | error={str(e)}")


class VideoGenerationRequest(BaseModel):
    """
    视频生成请求模型
    """

    prompt: Annotated[str, Field(min_length=1, max_length=2000, description="视频描述")]
    model: Annotated[str, Field(default="Wan-AI/Wan2.1-T2V-1.3B", description="模型名称")] = "Wan-AI/Wan2.1-T2V-1.3B"
    frames: Annotated[int, Field(default=81, ge=1, le=200, description="视频帧数 (约 5fps, 81帧约 16 秒)")] = 81
    resolution: Annotated[str, Field(default="1280x720", description="分辨率, 如 1280x720 / 1920x1080")] = "1280x720"


class VideoGenerationResponse(BaseModel):
    """
    视频生成响应模型
    """

    task_id: str = Field(description="任务 ID")
    status: str = Field(description="任务状态")
    video_url: str | None = Field(default=None, description="视频 S3 Presigned URL")
    video_base64: str | None = Field(default=None, description="视频 base64 (备用)")
    object_key: str | None = Field(default=None, description="S3 对象键")
    public_url: str | None = Field(default=None, description="S3 公共域名 URL")
    frames: int = Field(description="视频帧数")
    resolution: str = Field(description="分辨率")
    error: str | None = Field(default=None, description="错误信息")
    inference_time_seconds: int | None = Field(default=None, description="模型推理耗时 (秒)")
    total_time_seconds: int | None = Field(default=None, description="总耗时 (秒), 包含模型加载+推理+编码")


class VideoApiRouter:
    """
    视频 API 路由处理器类, 封装视频生成相关接口
    """

    @staticmethod
    @router.post(
        "/video/generate",
        response_model=VideoGenerationResponse,
        summary="AI 视频生成",
        description="基于 Wan2.1 本地模型, 接收文本提示词并生成视频, 异步处理并支持通知推送",
        tags=["AI 能力"],
    )
    async def generate_video(
        req: VideoGenerationRequest,
        background_tasks: BackgroundTasks,
        request: Request,
        current_user: CurrentUserOptional = None,
    ) -> VideoGenerationResponse:
        """
        创建视频生成任务, 并在当前请求内返回生成结果.

        参数:
            req (VideoGenerationRequest): 生成参数
            background_tasks (BackgroundTasks): 后台任务管理器
            request (Request): 请求对象
            current_user (CurrentUserOptional): 当前用户
        返回值:
            VideoGenerationResponse: 包含视频访问地址和状态的响应对象

        异常:
            无. 失败信息通过响应体返回.
        """
        task_id = str(uuid.uuid4())
        started_at = time.monotonic()
        client_ip = VideoApiUtils.get_client_ip(request)
        user_id = str(current_user.get("user_id", "")) if current_user else "anonymous"
        user_name = current_user.get("username", "") if current_user else f"guest_{client_ip}"
        tenant_id = str(current_user.get("tenant_id", "default")) if current_user else "default"

        logger.info(f"[视频生成] 接收任务 | task_id={task_id} | user={user_name} | prompt={req.prompt[:50]}...")

        try:
            local_video_client = LocalVideoClient()
            result = await local_video_client.generate(
                prompt=req.prompt,
                frames=req.frames,
                resolution=req.resolution,
                task_id=task_id,
            )
            object_key = VideoApiUtils.build_object_key(tenant_id=tenant_id, user_id=user_id, task_id=task_id)
            video_url, public_url = VideoApiUtils.upload_video_to_s3(
                video_base64=str(result.get("video_base64", "")),
                object_key=object_key,
            )
            inference_time_seconds = int(result.get("inference_time_seconds", 0) or 0) or None
            total_time_seconds = int(time.monotonic() - started_at)

            background_tasks.add_task(
                VideoApiUtils.send_video_generated_notify,
                user_id,
                user_name,
                req.prompt,
                video_url,
                object_key,
                public_url,
                req.model,
                task_id,
                int(result.get("frames", req.frames) or req.frames),
                str(result.get("resolution", req.resolution) or req.resolution),
            )

            return VideoGenerationResponse(
                task_id=task_id,
                status="completed",
                video_url=video_url,
                video_base64=None,
                object_key=object_key,
                public_url=public_url,
                frames=int(result.get("frames", req.frames) or req.frames),
                resolution=str(result.get("resolution", req.resolution) or req.resolution),
                error=None,
                inference_time_seconds=inference_time_seconds,
                total_time_seconds=total_time_seconds,
            )
        except Exception as error:
            logger.error(f"[视频生成] 任务失败 | task_id={task_id} | error={str(error)}")
            return VideoGenerationResponse(
                task_id=task_id,
                status="failed",
                video_url=None,
                video_base64=None,
                object_key=None,
                public_url=None,
                frames=req.frames,
                resolution=req.resolution,
                error=str(error),
                inference_time_seconds=None,
                total_time_seconds=int(time.monotonic() - started_at),
            )
