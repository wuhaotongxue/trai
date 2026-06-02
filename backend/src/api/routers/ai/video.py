#!/usr/bin/env python
# 文件名: video.py
# 作者: wuhao
# 日期: 2026_05_28_11:58:59
# 描述: 视频生成 API, 支持 Wan2.1-T2V-1.3B 本地模型, 结果上传 S3 并推送飞书通知

from __future__ import annotations

import base64
import os
import re
import time
import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Request
from loguru import logger
from pydantic import BaseModel, Field

from api.deps import CurrentUserOptional
from core.exceptions import ExternalServiceError
from infrastructure.database import get_session
from infrastructure.database.models import VideoRecordModel
from infrastructure.notifications.media_notify import media_notifier
from infrastructure.notify.feishu_ai_notify import (
    VideoGeneratedEvent,
    get_feishu_ai_notify_service,
)
from infrastructure.services.agent_audit_log_service import AgentAuditLogService
from infrastructure.storage.s3_storage import S3StorageService

router = APIRouter()


class VideoTaskStore:
    """
    视频任务状态仓库类, 在内存中维护视频生成任务的实时进度.
    """

    _tasks: dict[str, dict[str, Any]] = {}

    @classmethod
    def _create_record(cls, task: dict[str, Any]) -> None:
        """
        创建视频数据库记录.

        参数:
            task (dict[str, Any]): 任务状态字典.

        返回值:
            None.

        异常:
            无.
        """
        logger.info(f"[视频生成] 创建数据库记录 | task_id={task.get('task_id', '')} | status={task.get('status', '')}")
        with get_session() as db:
            db.add(
                VideoRecordModel(
                    t_task_id=str(task.get("task_id", "")),
                    t_user_id=str(task.get("user_id", "")),
                    t_username=str(task.get("user_name", "")) or None,
                    t_client_ip=str(task.get("client_ip", "")) or None,
                    t_user_agent=str(task.get("user_agent", "")) or None,
                    t_tenant_id=str(task.get("tenant_id", "")) or None,
                    t_prompt=str(task.get("prompt", "")),
                    t_status=str(task.get("status", "queued")),
                    t_stage=str(task.get("stage", "queued")),
                    t_progress_message=str(task.get("progress_message", "")) or None,
                    t_current_step=int(task.get("current_step", 0) or 0),
                    t_total_steps=int(task.get("total_steps", 9) or 9),
                    t_model=str(task.get("model", "")) or None,
                    t_frames=int(task.get("frames", 81) or 81),
                    t_resolution=str(task.get("resolution", "1280x720") or "1280x720"),
                    t_created_by=str(task.get("user_id", "")) or None,
                )
            )
            AgentAuditLogService(db).write_log(
                action="video_generate_submitted",
                level="info",
                path="/ai/video/generate",
                message="视频生成任务已提交",
                user_id=str(task.get("user_id", "")),
                username=str(task.get("user_name", "")),
                client_ip=str(task.get("client_ip", "")),
                status_code=200,
                method="POST",
                metadata={
                    "task_id": str(task.get("task_id", "")),
                    "frames": int(task.get("frames", 81) or 81),
                    "resolution": str(task.get("resolution", "1280x720")),
                    "log_type": "video",
                },
            )
            db.commit()

    @classmethod
    def _update_record(cls, task_id: str, fields: dict[str, Any]) -> None:
        """
        更新视频数据库记录.

        参数:
            task_id (str): 任务 ID.
            fields (dict[str, Any]): 需要更新的任务字段.

        返回值:
            None.

        异常:
            无.
        """
        with get_session() as db:
            record = db.query(VideoRecordModel).filter(VideoRecordModel.t_task_id == task_id).one_or_none()
            if record is None:
                return
            mapping = {
                "status": "t_status",
                "stage": "t_stage",
                "progress_message": "t_progress_message",
                "current_step": "t_current_step",
                "total_steps": "t_total_steps",
                "video_url": "t_result_url",
                "public_url": "t_public_url",
                "object_key": "t_object_key",
                "error": "t_error_message",
                "frames": "t_frames",
                "resolution": "t_resolution",
                "inference_time_seconds": "t_inference_time_seconds",
                "total_time_seconds": "t_total_time_seconds",
            }
            for source_key, target_key in mapping.items():
                if source_key in fields:
                    setattr(record, target_key, fields[source_key])
            record.t_updated_at = datetime.now()
            if fields.get("status") in {"completed", "failed", "cancelled"}:
                record.t_completed_at = datetime.now()
            db.commit()

    @classmethod
    def create_task(
        cls,
        task_id: str,
        prompt: str,
        model: str,
        frames: int,
        resolution: str,
        user_id: str,
        user_name: str,
        tenant_id: str,
        client_ip: str,
        user_agent: str,
        enable_optimization: bool = True,
    ) -> None:
        """
        创建视频生成任务的初始状态.

        参数:
            task_id (str): 任务 ID.
            prompt (str): 视频提示词.
            model (str): 模型名称.
            frames (int): 视频帧数.
            resolution (str): 分辨率.
            user_id (str): 用户 ID.
            user_name (str): 用户名.
            tenant_id (str): 租户 ID.

        返回值:
            None.

        异常:
            无.
        """
        cls._tasks[task_id] = {
            "task_id": task_id,
            "status": "queued",
            "stage": "queued",
            "progress_message": "任务已进入队列",
            "current_step": 0,
            "total_steps": 9,
            "queue_position": 0,
            "video_url": None,
            "video_base64": None,
            "object_key": None,
            "public_url": None,
            "frames": frames,
            "resolution": resolution,
            "error": None,
            "inference_time_seconds": None,
            "total_time_seconds": None,
            "prompt": prompt,
            "model": model,
            "user_id": user_id,
            "user_name": user_name,
            "tenant_id": tenant_id,
            "client_ip": client_ip,
            "user_agent": user_agent,
            "started_at": time.monotonic(),
            "enable_optimization": enable_optimization,
            "optimized_prompt": None,
        }
        cls._create_record(cls._tasks[task_id])

    @classmethod
    def update_task(cls, task_id: str, **fields: Any) -> None:
        """
        更新视频任务状态.

        参数:
            task_id (str): 任务 ID.
            **fields (Any): 需要更新的字段.

        返回值:
            None.

        异常:
            无.
        """
        task = cls._tasks.get(task_id)
        if task is None:
            return
        task.update(fields)
        started_at = task.get("started_at")
        if isinstance(started_at, (int, float)):
            task["total_time_seconds"] = int(time.monotonic() - started_at)
        cls._update_record(task_id, task)

    @classmethod
    def get_task(cls, task_id: str) -> dict[str, Any] | None:
        """
        获取指定任务的状态快照.

        参数:
            task_id (str): 任务 ID.

        返回值:
            dict[str, Any] | None: 任务状态字典或 None.

        异常:
            无.
        """
        task = cls._tasks.get(task_id)
        if task is None:
            return None
        task_copy = task.copy()
        task_copy["queue_position"] = cls.get_queue_position(task_id)
        return task_copy

    @classmethod
    def get_queue_position(cls, task_id: str) -> int:
        """
        计算任务在队列中的位置.

        参数:
            task_id (str): 任务 ID.

        返回值:
            int: 队列位置, 非排队状态返回 0.

        异常:
            无.
        """
        task = cls._tasks.get(task_id)
        if task is None or task.get("status") != "queued":
            return 0
        queued_before = [
            item_id for item_id, item in cls._tasks.items() if item.get("status") == "queued" and item_id < task_id
        ]
        return len(queued_before) + 1


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
    def parse_progress_line(line: str) -> dict[str, Any] | None:
        """
        解析本地视频子进程输出, 转换为前端可展示的进度字段.

        参数:
            line (str): 子进程输出的一行日志.

        返回值:
            dict[str, Any] | None: 可更新的进度字段, 无需展示时返回 None.

        异常:
            无.
        """
        step_match = re.match(r"^\[(\d+)/(\d+)\]\s*(.+)$", line)
        if step_match:
            current_step = int(step_match.group(1))
            message = step_match.group(3).strip()
            stage_map = {
                1: "initializing",
                2: "preparing_runtime",
                3: "loading_model",
                4: "model_ready",
                5: "inferencing",
                6: "assembling_video",
                7: "encoding_video",
            }
            return {
                "status": "processing",
                "stage": stage_map.get(current_step, "processing"),
                "progress_message": message,
                "current_step": current_step,
                "total_steps": 9,
            }

        if line.startswith("[推理心跳]"):
            return {
                "status": "processing",
                "stage": "inferencing",
                "progress_message": line,
                "current_step": 5,
                "total_steps": 9,
            }

        if line.startswith("Loading models from:"):
            return {
                "status": "processing",
                "stage": "loading_model",
                "progress_message": "正在加载模型文件",
                "current_step": 3,
                "total_steps": 9,
            }

        return None

    @staticmethod
    async def send_video_generated_notify(
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
            await media_notifier.notify(
                media_type="video",
                prompt=prompt,
                file_url=public_url or video_url,
                duration=frames // 5,
                persona="河南地理专家",
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
    enable_optimization: Annotated[bool, Field(default=True, description="是否启用提示词优化")] = True


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
    optimized_prompt: str | None = Field(default=None, description="优化后的提示词")
    frames: int = Field(description="视频帧数")
    resolution: str = Field(description="分辨率")
    error: str | None = Field(default=None, description="错误信息")
    inference_time_seconds: int | None = Field(default=None, description="模型推理耗时 (秒)")
    total_time_seconds: int | None = Field(default=None, description="总耗时 (秒), 包含模型加载+推理+编码")
    stage: str | None = Field(default=None, description="当前阶段")
    progress_message: str | None = Field(default=None, description="当前进度描述")
    current_step: int | None = Field(default=None, description="当前步骤序号")
    total_steps: int | None = Field(default=None, description="总步骤数")
    queue_position: int | None = Field(default=None, description="排队位置")


class VideoApiRouter:
    """
    视频 API 路由处理器类, 封装视频生成相关接口
    """

    @staticmethod
    async def _execute_video_task(task_id: str) -> None:
        """
        在后台执行视频生成、上传和通知流程.

        参数:
            task_id (str): 任务 ID.

        返回值:
            None.

        异常:
            无. 所有失败信息都会写回任务状态.
        """
        task = VideoTaskStore.get_task(task_id)
        if task is None:
            return

        VideoTaskStore.update_task(
            task_id,
            status="processing",
            stage="preparing",
            progress_message="正在分配 GPU 资源",
            current_step=0,
            total_steps=9,
        )
        AgentAuditLogService.write_log_with_new_session(
            action="video_generate_processing",
            level="info",
            path="/ai/video/generate",
            message="视频生成任务开始处理",
            user_id=str(task.get("user_id", "")),
            username=str(task.get("user_name", "")),
            client_ip=str(task.get("client_ip", "")),
            status_code=200,
            metadata={"task_id": task_id, "log_type": "video"},
        )

        try:
            from infrastructure.ai.core.prompt_optimizer import PromptOptimizer
            from infrastructure.ai.video.agnes_video_client import AgnesVideoClient

            local_video_client = AgnesVideoClient()
            logger.info(f"[视频生成] 后台任务启动 | task_id={task_id}")

            prompt_to_use = str(task.get("prompt", ""))
            optimized_prompt = prompt_to_use
            if task.get("enable_optimization", True):
                optimizer = PromptOptimizer()
                optimized_prompt = await optimizer.optimize_video_prompt(prompt_to_use)
                VideoTaskStore.update_task(task_id, optimized_prompt=optimized_prompt)

            def progress_callback(line: str) -> None:
                parsed = VideoApiUtils.parse_progress_line(line)
                if parsed is not None:
                    VideoTaskStore.update_task(task_id, **parsed)

            result = await local_video_client.generate(
                prompt=optimized_prompt,
                frames=int(task.get("frames", 81) or 81),
                resolution=str(task.get("resolution", "1280x720") or "1280x720"),
                task_id=task_id,
                progress_callback=progress_callback,
            )

            object_key = VideoApiUtils.build_object_key(
                tenant_id=str(task.get("tenant_id", "default") or "default"),
                user_id=str(task.get("user_id", "anonymous") or "anonymous"),
                task_id=task_id,
            )
            inference_time_seconds = int(result.get("inference_time_seconds", 0) or 0) or None

            VideoTaskStore.update_task(
                task_id,
                stage="uploading",
                progress_message="正在上传视频到 S3",
                current_step=8,
                total_steps=9,
                inference_time_seconds=inference_time_seconds,
                object_key=object_key,
            )

            video_url, public_url = VideoApiUtils.upload_video_to_s3(
                video_base64=str(result.get("video_base64", "")),
                object_key=object_key,
            )

            VideoTaskStore.update_task(
                task_id,
                stage="notifying",
                progress_message="正在发送飞书和企业微信通知",
                current_step=9,
                total_steps=9,
                video_url=video_url,
                public_url=public_url,
                frames=int(result.get("frames", task.get("frames", 81)) or task.get("frames", 81)),
                resolution=str(
                    result.get("resolution", task.get("resolution", "1280x720")) or task.get("resolution", "1280x720")
                ),
            )

            await VideoApiUtils.send_video_generated_notify(
                user_id=str(task.get("user_id", "anonymous") or "anonymous"),
                user_name=str(task.get("user_name", "guest") or "guest"),
                prompt=str(task.get("prompt", "")),
                video_url=video_url,
                object_key=object_key,
                public_url=public_url,
                model=str(task.get("model", "Wan-AI/Wan2.1-T2V-1.3B")),
                task_id=task_id,
                frames=int(result.get("frames", task.get("frames", 81)) or task.get("frames", 81)),
                resolution=str(
                    result.get("resolution", task.get("resolution", "1280x720")) or task.get("resolution", "1280x720")
                ),
            )
            AgentAuditLogService.write_log_with_new_session(
                action="video_generate_completed",
                level="info",
                path="/ai/video/generate",
                message="视频生成任务完成",
                user_id=str(task.get("user_id", "")),
                username=str(task.get("user_name", "")),
                client_ip=str(task.get("client_ip", "")),
                status_code=200,
                metadata={"task_id": task_id, "object_key": object_key, "log_type": "video"},
            )

            VideoTaskStore.update_task(
                task_id,
                status="completed",
                stage="completed",
                progress_message="视频生成完成",
                current_step=9,
                total_steps=9,
                video_base64=None,
            )
        except Exception as error:
            logger.error(f"[视频生成] 任务失败 | task_id={task_id} | error={str(error)}")
            AgentAuditLogService.write_log_with_new_session(
                action="video_generate_failed",
                level="error",
                path="/ai/video/generate",
                message="视频生成任务失败",
                user_id=str(task.get("user_id", "")),
                username=str(task.get("user_name", "")),
                client_ip=str(task.get("client_ip", "")),
                status_code=500,
                error=str(error),
                metadata={"task_id": task_id, "log_type": "video"},
            )
            VideoTaskStore.update_task(
                task_id,
                status="failed",
                stage="failed",
                progress_message="视频生成失败",
                error=str(error),
            )

    @staticmethod
    def _build_response(task_id: str) -> VideoGenerationResponse:
        """
        将任务状态字典转换为标准响应模型.

        参数:
            task_id (str): 任务 ID.

        返回值:
            VideoGenerationResponse: 标准响应对象.

        异常:
            ExternalServiceError: 任务不存在时抛出.
        """
        task = VideoTaskStore.get_task(task_id)
        if task is None:
            raise ExternalServiceError(message=f"视频任务不存在: {task_id}")

        return VideoGenerationResponse(
            task_id=task_id,
            status=str(task.get("status", "queued")),
            video_url=task.get("video_url"),
            video_base64=None,
            object_key=task.get("object_key"),
            public_url=task.get("public_url"),
            frames=int(task.get("frames", 81) or 81),
            resolution=str(task.get("resolution", "1280x720") or "1280x720"),
            error=task.get("error"),
            inference_time_seconds=task.get("inference_time_seconds"),
            total_time_seconds=task.get("total_time_seconds"),
            stage=task.get("stage"),
            progress_message=task.get("progress_message"),
            current_step=task.get("current_step"),
            total_steps=task.get("total_steps"),
            queue_position=task.get("queue_position"),
            optimized_prompt=task.get("optimized_prompt"),
        )

    @staticmethod
    @router.post(
        "/video/generate",
        response_model=VideoGenerationResponse,
        summary="AI 视频生成",
        description="基于 Wan2.1 本地模型, 接收文本提示词并创建视频生成任务, 前端可轮询查询进度与结果",
        tags=["AI 能力"],
    )
    async def generate_video(
        req: VideoGenerationRequest,
        background_tasks: BackgroundTasks,
        request: Request,
        current_user: CurrentUserOptional = None,
    ) -> VideoGenerationResponse:
        """
        创建视频生成任务, 立即返回任务状态.

        参数:
            req (VideoGenerationRequest): 生成参数
            background_tasks (BackgroundTasks): 后台任务管理器
            request (Request): 请求对象
            current_user (CurrentUserOptional): 当前用户
        返回值:
            VideoGenerationResponse: 包含任务 ID 和初始进度的响应对象.

        异常:
            无. 失败信息通过响应体返回.
        """
        task_id = str(uuid.uuid4())
        client_ip = VideoApiUtils.get_client_ip(request)
        user_id = str(current_user.get("user_id", "")) if current_user else "anonymous"
        user_name = current_user.get("username", "") if current_user else f"guest_{client_ip}"
        tenant_id = str(current_user.get("tenant_id", "default")) if current_user else "default"

        logger.info(f"[视频生成] 接收任务 | task_id={task_id} | user={user_name} | prompt={req.prompt[:50]}...")
        VideoTaskStore.create_task(
            task_id=task_id,
            prompt=req.prompt,
            model=req.model,
            frames=req.frames,
            resolution=req.resolution,
            user_id=user_id,
            user_name=user_name,
            tenant_id=tenant_id,
            client_ip=client_ip,
            user_agent=request.headers.get("User-Agent", "")[:500],
            enable_optimization=req.enable_optimization,
        )
        background_tasks.add_task(VideoApiRouter._execute_video_task, task_id)
        return VideoApiRouter._build_response(task_id)

    @staticmethod
    @router.get(
        "/video/status/{task_id}",
        response_model=VideoGenerationResponse,
        summary="查询视频生成状态",
        description="根据任务 ID 查询视频生成的实时阶段、步骤和结果地址",
        tags=["AI 能力"],
    )
    async def get_video_status(task_id: str) -> VideoGenerationResponse:
        """
        查询视频生成任务状态.

        参数:
            task_id (str): 任务 ID.

        返回值:
            VideoGenerationResponse: 任务的实时状态快照.

        异常:
            ExternalServiceError: 任务不存在时抛出.
        """
        return VideoApiRouter._build_response(task_id)
