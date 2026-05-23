#!/usr/bin/env python
# 文件名: video.py
# 作者: wuhao
# 日期: 2026_05_20
# 描述: 视频生成 API，支持 Wan2.1-T2V-1.3B 本地模型，结果上传 S3 并推送飞书通知


from __future__ import annotations

import os
import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status
from loguru import logger
from pydantic import BaseModel, Field

from api.deps import CurrentUserOptional
from infrastructure.notify.feishu_ai_notify import (
    VideoGeneratedEvent,
    get_feishu_ai_notify_service,
)
from infrastructure.storage.s3_storage import S3StorageService

router = APIRouter()


def _get_client_ip(request: Request) -> str:
    """从请求中提取真实 IP（支持代理）"""
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


class VideoGenerationRequest(BaseModel):
    """视频生成请求"""

    prompt: Annotated[str, Field(min_length=1, max_length=2000, description="视频描述")]
    model: Annotated[str, Field(default="Wan-AI/Wan2.1-T2V-1.3B", description="模型名称")] = "Wan-AI/Wan2.1-T2V-1.3B"
    frames: Annotated[int, Field(default=81, ge=1, le=200, description="视频帧数（约 5fps，81帧约 16 秒）")] = 81
    resolution: Annotated[str, Field(default="1280x720", description="分辨率，如 1280x720 / 1920x1080")] = "1280x720"


class VideoGenerationResponse(BaseModel):
    """视频生成响应"""

    task_id: str = Field(description="任务 ID")
    status: str = Field(description="任务状态")
    video_url: str | None = Field(default=None, description="视频 S3 Presigned URL")
    video_base64: str | None = Field(default=None, description="视频 base64（备用）")
    object_key: str | None = Field(default=None, description="S3 对象键")
    public_url: str | None = Field(default=None, description="S3 公共域名 URL")
    frames: int = Field(description="视频帧数")
    resolution: str = Field(description="分辨率")
    error: str | None = Field(default=None, description="错误信息")
    inference_time_seconds: int | None = Field(default=None, description="模型推理耗时（秒）")
    total_time_seconds: int | None = Field(default=None, description="总耗时（秒），包含模型加载+推理+编码")


def _send_video_generated_notify(
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
    """后台发送视频生成完成通知（飞书 + 企业微信）"""
    from loguru import logger

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
            _update_notify_status(task_id, True, "feishu_success")
        except Exception as e:
            logger.error(f"[通知] 飞书视频推送失败 | task_id={task_id} | error={e}")
            _update_notify_status(task_id, False, "feishu_failed")

    # --- 企业微信通知（wuhao 群 + wudu 群）---
    if os.getenv("NOTIFY_WECOM_ENABLED", "true").lower() == "true":
        try:
            from infrastructure.notify.factory import NotifyServiceFactory

            prompt_short = prompt[:100] + ("..." if len(prompt) > 100 else "")
            content_lines = [
                "\U0001f3ac AI 视频生成完成",
                "",
                f"\U0001f389 用户: {user_name}",
                f"\U0001f3a5 模型: {model}",
                f"\U0001f3a5 分辨率: {resolution}",
                f"\U0001f4ca 帧数: {frames}",
                f"\U0001f517 任务ID: {task_id[:16]}...",
                "",
                f"\U0001f4d7 Prompt: {prompt_short}",
                "",
                "\U0001f517 Presigned URL (30天有效期):",
                f"{video_url}",
                "",
                "\U0001f517 公共域名 URL:",
                f"{public_url}",
                "",
                f"\U0001f4e6 S3对象键: {object_key}",
            ]
            wecom_content = "\n".join(content_lines)

            # 发到 wuhao 群
            wecom_wuhao_url = os.getenv("NOTIFY_WECOM_WUHAO_WEBHOOK", "")
            if wecom_wuhao_url:
                try:
                    svc = NotifyServiceFactory.create_wecom(wecom_wuhao_url)
                    svc.send_text(wecom_content)
                    logger.info(f"[通知] 企业微信(wuhao)视频推送完成 | task_id={task_id}")
                except Exception as e:
                    logger.error(f"[通知] 企业微信(wuhao)视频推送失败 | task_id={task_id} | error={e}")

            # 发到 wudu 群
            wecom_wudu_url = os.getenv("NOTIFY_WECOM_WUDU_WEBHOOK", "")
            if wecom_wudu_url and wecom_wudu_url != wecom_wuhao_url:
                try:
                    wudu_svc = NotifyServiceFactory.create_wecom(wecom_wudu_url)
                    wudu_svc.send_text(wecom_content)
                    logger.info(f"[通知] 企业微信(wudu)视频推送完成 | task_id={task_id}")
                except Exception as e:
                    logger.error(f"[通知] 企业微信(wudu)视频推送失败 | task_id={task_id} | error={e}")

        except Exception as e:
            logger.error(f"[通知] 企业微信视频推送异常 | task_id={task_id} | error={e}")


def _update_notify_status(task_id: str, notified: bool, notify_status: str) -> None:
    """更新通知状态到数据库（视频通知状态存储在 extra_data）"""
    try:
        from infrastructure.database import get_session
        from infrastructure.repositories.session_repository import SessionRepository

        with get_session() as db:
            repo = SessionRepository(db)
            repo.update_session_extra_data(
                session_id=task_id,
                patch={"feishu_notified": notified, "notify_status": notify_status},
            )
            db.commit()
    except Exception:
        pass


@router.post("/video/generate", response_model=None, tags=["AI"])
async def generate_video(
    request_http: Request,
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUserOptional = None,
) -> VideoGenerationResponse:
    """AI 视频生成接口（Wan2.1-T2V-1.3B 本地模型）

    模型下载: modelscope download --model Wan-AI/Wan2.1-T2V-1.3B

    Args:
        request_http: HTTP 请求
        request: 视频生成参数
        current_user: 当前登录用户

    Returns:
        VideoGenerationResponse: 生成结果
    """
    user_id = current_user.get("user_id", "") if current_user else ""
    tenant_id = current_user.get("tenant_id") if current_user else ""
    username = current_user.get("username", user_id) if current_user else user_id
    client_ip = _get_client_ip(request_http)
    safe_tenant_id = tenant_id or "default"
    safe_user_id = user_id or "anonymous"

    task_id = str(uuid.uuid4())

    logger.info(
        f"[视频生成请求] user_id={user_id} | prompt={request.prompt[:50]}... | "
        f"frames={request.frames} | resolution={request.resolution}"
    )

    try:
        # Step 0: 环境检查
        import socket
        import time as _time

        hostname = socket.gethostname()
        try:
            host_ip = socket.gethostbyname(hostname)
        except Exception:
            host_ip = "unknown"

        # 记录总开始时间，用于计算预估剩余时间
        _start_time = _time.time()
        _prev_time = _start_time

        logger.info(
            f"[0/5] 环境检查 | hostname={hostname} | IP={host_ip} | "
            f"user_id={user_id} | tenant_id={safe_tenant_id} | task_id={task_id}"
        )

        # Step 1: 调用本地模型生成视频
        logger.info(f"[1/5] === 开始调用 Wan2.1-T2V-1.3B 生成视频 === | task_id={task_id}")
        from infrastructure.ai.local_video_client import LocalVideoClient

        client = LocalVideoClient()
        logger.info(
            f"[1/5] LocalVideoClient 实例化完成 | model={request.model} | frames={request.frames} | resolution={request.resolution}"
        )

        result = await client.generate(
            prompt=request.prompt,
            frames=request.frames,
            resolution=request.resolution,
            task_id=task_id,
        )

        _end_time = _time.time()
        _total_time = int(_end_time - _start_time)
        inference_time = result.get("inference_time_seconds", 0)

        video_base64 = result.get("video_base64", "")
        if not video_base64:
            raise RuntimeError("视频生成未返回 video_base64")

        video_bytes = __import__("base64").b64decode(video_base64)
        size_bytes = len(video_bytes)
        logger.info(
            f"[2/5] === 视频生成完成，等待上传 === | task_id={task_id} | "
            f"大小: {size_bytes:,} bytes ({size_bytes / 1024 / 1024:.2f} MB) | "
            f"帧数: {result.get('frames')} | 分辨率: {result.get('resolution')}"
        )

        # Step 3: 上传 S3
        safe_task_id = task_id.replace("-", "")
        object_key = f"private/tenants/{safe_tenant_id}/ai_videos/{safe_user_id}/{safe_task_id}.mp4"
        logger.info(f"[3/5] === 开始上传 S3 === | task_id={task_id} | bucket=trai | object_key={object_key}")

        storage = S3StorageService()
        storage.upload_bytes(
            data=video_bytes,
            object_key=object_key,
            content_type="video/mp4",
        )
        logger.info(f"[3/5] === S3 上传完成 === | task_id={task_id} | 大小: {size_bytes:,} bytes")

        # Step 4: 生成 URL（域名 + IP 两个都要）
        video_url = storage.get_long_term_url(object_key, expires_days=30)
        public_url = storage.get_file_url(object_key)
        s3_endpoint = storage._endpoint
        logger.info(
            f"[4/5] === URL 生成完成 === | task_id={task_id}\n"
            f"    [S3]        对象键: {object_key}\n"
            f"    [Presigned] URL (30天): {video_url}\n"
            f"    [公共域名]  URL: {public_url}\n"
            f"    [S3节点]    {s3_endpoint}"
        )

        # Step 5: 发送飞书通知（同时发到图片推送 webhook）
        logger.info(f"[5/5] === 发送飞书通知 === | task_id={task_id}")
        background_tasks.add_task(
            _send_video_generated_notify,
            user_id,
            username,
            request.prompt,
            video_url,
            object_key,
            public_url,
            request.model,
            task_id,
            request.frames,
            request.resolution,
        )

        logger.info(
            f"=== 视频生成全部完成 === | task_id={task_id} | "
            f"大小: {size_bytes:,} bytes | 帧数: {request.frames} | 分辨率: {request.resolution} | "
            f"推理耗时: {inference_time}秒 | 总耗时: {_total_time}秒\n"
            f"    Presigned URL: {video_url}\n"
            f"    公共域名 URL: {public_url}"
        )

        return VideoGenerationResponse(
            task_id=task_id,
            status="completed",
            video_url=video_url,
            video_base64=video_base64[:100] if video_base64 else None,
            object_key=object_key,
            public_url=public_url,
            frames=request.frames,
            resolution=request.resolution,
            error=None,
            inference_time_seconds=inference_time,
            total_time_seconds=_total_time,
        )

    except Exception as e:
        logger.error(f"视频生成失败 | task_id={task_id} | error={type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 视频生成服务错误: {str(e)}"},
        )


__all__ = ["router"]
