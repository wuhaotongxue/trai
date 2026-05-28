#!/usr/bin/env python
# 文件名: downloader.py
# 作者: wuhao
# 日期: 2026_05_26_21:05:00
# 描述: 视频下载工具路由, 提供 Bilibili 视频下载接口

from __future__ import annotations

import os
from datetime import datetime
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import get_current_user_optional
from infrastructure.database.database import get_db_session
from infrastructure.database.models import VideoDownloadModel
from infrastructure.notify.base import NotifyLevel, NotifyMessage, NotifyType
from infrastructure.notify.factory import NotifyServiceFactory
from infrastructure.storage.s3_storage import S3StorageService
from infrastructure.tools.video_downloader import BilibiliDownloader

router = APIRouter(prefix="/tools/video", tags=["工具"])


class DownloadRequest(BaseModel):
    """
    视频下载请求模型
    """

    url: str = Field(..., description="视频链接, 例如 Bilibili 播放页地址")


class VideoDownloaderRouter:
    """
    视频下载路由处理器类, 封装所有下载相关的接口逻辑
    """

    @staticmethod
    @router.post(
        "/download",
        summary="下载 Bilibili 视频",
        description="接收 Bilibili 视频链接, 使用 yt-dlp 进行高清解析并下载, 随后上传 S3 并推送通知.",
    )
    async def download_video(
        req: DownloadRequest,
        fastapi_req: Request,
        db_session: Annotated[Session, Depends(get_db_session)],
        current_user: Annotated[dict[str, Any] | None, Depends(get_current_user_optional)] = None,
    ):
        """
        执行视频下载任务 (全链路: 下载 -> S3 上传 -> 落库 -> 通知)

        参数:
            req (DownloadRequest): 包含视频 URL 的请求对象
            fastapi_req (Request): FastAPI 请求对象
            db_session (Session): 数据库会话
            current_user (dict): 当前用户信息
        返回值:
            统一响应格式: code/msg/data
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        user_id = current_user.get("user_id", "guest") if current_user else "guest"
        username = current_user.get("username", "Guest") if current_user else "Guest"
        client_ip = fastapi_req.client.host if fastapi_req.client else "unknown"

        # 1. 执行本地下载
        downloader = BilibiliDownloader()
        result = await downloader.download_bilibili(req.url)

        if not result["success"]:
            return {"code": 500, "msg": result["error"], "data": None, "req_id": req_id, "ts": ts}

        local_file_path = result["file_path"]
        video_id = result["video_id"]
        title = result["title"]

        try:
            # 2. 上传至 S3
            s3_service = S3StorageService()
            file_ext = os.path.splitext(local_file_path)[1] or ".mp4"
            object_key = f"downloads/videos/{video_id}{file_ext}"

            # 获取文件大小
            file_size = os.path.getsize(local_file_path)

            # 上传到 S3
            s3_service.upload_file(
                file_path=local_file_path,
                object_key=object_key,
                content_type="video/mp4",
            )

            # 获取长期预签名 URL
            presigned_url = s3_service.get_long_term_url(object_key, expires_days=7)

            # 3. 记录落库
            download_record = VideoDownloadModel(
                t_task_id=req_id,
                t_user_id=user_id,
                t_username=username,
                t_title=title,
                t_source_url=req.url,
                t_s3_key=object_key,
                t_s3_url=presigned_url,
                t_file_size=file_size,
                t_status="completed",
                t_client_ip=client_ip,
            )
            db_session.add(download_record)
            db_session.commit()

            # 4. 推送通知 (异步)
            def send_notifications():
                # 飞书通知
                feishu_webhook = os.getenv("FEISHU_WEBHOOK_URL")
                if feishu_webhook:
                    try:
                        feishu_service = NotifyServiceFactory.create_feishu(feishu_webhook)
                        msg = f"🎬 **视频下载成功**\n\n**标题:** {title}\n**用户:** {username}\n**大小:** {file_size / 1024 / 1024:.2f} MB\n**预览:** [点击查看]({presigned_url})"
                        feishu_service.send(
                            NotifyMessage(
                                title="TRAI 视频下载助手",
                                content=msg,
                                level=NotifyLevel.INFO,
                                msg_type=NotifyType.MARKDOWN,
                            )
                        )
                    except Exception as e:
                        from loguru import logger

                        logger.warning(f"Failed to send feishu notification: {e}")

                # 企业微信通知
                wecom_webhook = os.getenv("WECOM_WEBHOOK_URL") or os.getenv("WECOM_CHAT_WEBHOOK_URL")
                if wecom_webhook:
                    try:
                        wecom_service = NotifyServiceFactory.create_wecom(wecom_webhook)
                        msg = f"🎬 **视频下载成功**\n\n标题: {title}\n用户: {username}\n预览: {presigned_url}"
                        wecom_service.send(
                            NotifyMessage(
                                title="TRAI 视频下载助手",
                                content=msg,
                                level=NotifyLevel.INFO,
                                msg_type=NotifyType.MARKDOWN,
                            )
                        )
                    except Exception as e:
                        from loguru import logger

                        logger.warning(f"Failed to send wecom notification: {e}")

            import asyncio

            asyncio.create_task(asyncio.to_thread(send_notifications))

            # 5. 清理本地文件
            if os.path.exists(local_file_path):
                os.remove(local_file_path)

            return {
                "code": 200,
                "msg": "OK",
                "data": {
                    "title": title,
                    "s3_url": presigned_url,
                    "video_id": video_id,
                    "task_id": req_id,
                    "file_size": file_size,
                },
                "req_id": req_id,
                "ts": ts,
            }

        except Exception as e:
            from loguru import logger

            logger.error(f"Failed to complete download flow: {str(e)}")
            # 即使 S3/DB 失败, 如果本地文件还在也尝试清理
            if os.path.exists(local_file_path):
                os.remove(local_file_path)

            return {
                "code": 500,
                "msg": f"全链路处理失败: {str(e)}",
                "data": None,
                "req_id": req_id,
                "ts": ts,
            }


__all__ = ["VideoDownloaderRouter", "router"]

