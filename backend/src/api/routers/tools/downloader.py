#!/usr/bin/env python
# 文件名: downloader.py
# 作者: wuhao
# 日期: 2026_05_29_08:11:45
# 描述: 视频下载工具路由, 提供 Bilibili 视频下载接口, 支持 S3 上传与通知推送

from __future__ import annotations

import os
from datetime import datetime
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from api.deps import get_current_user_optional
from infrastructure.ai.core.openai_client import OpenAIClient
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


class DeleteRequest(BaseModel):
    """
    删除记录请求模型
    """

    task_ids: list[str] = Field(..., description="要删除的任务 ID 列表")


class VideoDownloaderRouter:
    """
    视频下载工具路由类
    """

    @staticmethod
    async def _generate_henan_expert_message(title: str, username: str) -> str:
        """使用 DeepSeek 生成河南地理专家的通知内容"""
        try:
            client = OpenAIClient(provider="deepseek")
            # 今天是周五 2026-05-29
            prompt = (
                "你是一位专业的'河南地理专家'。今天是 2026-05-29 周五，心情非常愉悦。\n"
                f"用户 '{username}' 刚刚成功下载了一个视频《{title}》。\n"
                "请以专家的口吻，结合'周五'的轻松氛围，随机推荐一个河南的著名景点（不要重复推荐龙门石窟、少林寺等过于大众的，可以推荐一些如老君山、云台山、太行大峡谷、清明上河园等），"
                "并给出一句富有地理底蕴的周五祝福。\n"
                "要求：字数在 60 字以内，语气专业且亲切，不要出现 AI 常见的口癖。"
            )
            res = await client.chat(messages=[{"role": "user", "content": prompt}])
            return res.get("content", "祝您周五愉快，探索大美河南！")
        except Exception as e:
            from loguru import logger

            logger.warning(f"DeepSeek generation failed: {e}")
            return "祝您周五愉快，大美河南欢迎您！"

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
        background_tasks: BackgroundTasks,
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
        user_id = current_user.get("user_id") if current_user else None
        username = current_user.get("username", "Guest") if current_user else "Guest"
        client_ip = fastapi_req.client.host if fastapi_req.client else "unknown"

        # 如果是游客, 使用 IP 标识
        if not user_id:
            user_id = f"guest_{client_ip}"
            username = f"游客({client_ip})"

        # 0. 查库去重: 如果该用户已下载过此 URL 且未删除, 则直接返回 S3 地址
        try:
            exist_query = (
                select(VideoDownloadModel)
                .where(VideoDownloadModel.t_user_id == user_id)
                .where(VideoDownloadModel.t_source_url == req.url)
                .where(VideoDownloadModel.t_status == "completed")
            )
            exist_record = db_session.execute(exist_query).scalars().first()
            if exist_record:
                from loguru import logger

                logger.info(f"Duplicate download detected for URL: {req.url}, returning existing record.")

                # 异步推送通知
                async def send_duplicate_notification():
                    from loguru import logger

                    enabled = os.getenv("NOTIFY_ENABLED", "false").lower() == "true"
                    logger.info(f"Duplicate notification triggered. NOTIFY_ENABLED={enabled}")
                    if not enabled:
                        return

                    # 生成河南地理专家内容
                    expert_msg = await VideoDownloaderRouter._generate_henan_expert_message(
                        exist_record.t_title, username
                    )

                    # 飞书
                    feishu_enabled = os.getenv("NOTIFY_FEISHU_ENABLED", "false").lower() == "true"
                    feishu_webhook = os.getenv("NOTIFY_FEISHU_WEBHOOK")
                    logger.info(
                        f"Feishu duplicate check: enabled={feishu_enabled}, webhook_exists={bool(feishu_webhook)}"
                    )
                    if feishu_enabled and feishu_webhook:
                        try:
                            feishu_service = NotifyServiceFactory.create_feishu(feishu_webhook)
                            msg = (
                                f"## 🧭 河南地理专家核心观测\n\n"
                                f"> **状态:** 已从历史记录恢复\n"
                                f"> **标题:** {exist_record.t_title}\n"
                                f"> **用户:** {username}\n\n"
                                f"{expert_msg}\n\n"
                                f"--- \n"
                                f"🔗 [点击预览视频]({exist_record.t_s3_url})"
                            )
                            feishu_service.send(
                                NotifyMessage(title="TRAI 视频助手", content=msg, msg_type=NotifyType.MARKDOWN)
                            )
                            logger.info("Feishu duplicate notification sent")
                        except Exception as e:
                            logger.warning(f"Failed to send duplicate notification to feishu: {e}")

                    # 企业微信
                    wecom_enabled = os.getenv("NOTIFY_WECOM_ENABLED", "false").lower() == "true"
                    wecom_webhook = os.getenv("NOTIFY_WECOM_WEBHOOK")
                    logger.info(f"WeCom duplicate check: enabled={wecom_enabled}, webhook_exists={bool(wecom_webhook)}")
                    if wecom_enabled and wecom_webhook:
                        try:
                            wecom_service = NotifyServiceFactory.create_wecom(wecom_webhook)
                            msg = (
                                f"🧭 **河南地理专家核心观测**\n\n"
                                f"状态: 已从历史记录恢复\n"
                                f"标题: {exist_record.t_title}\n"
                                f"用户: {username}\n\n"
                                f"{expert_msg}\n\n"
                                f"--- \n"
                                f"🔗 [点击预览视频]({exist_record.t_s3_url})"
                            )
                            wecom_service.send(
                                NotifyMessage(title="TRAI 视频助手", content=msg, msg_type=NotifyType.MARKDOWN)
                            )
                            logger.info("WeCom duplicate notification sent")
                        except Exception as e:
                            logger.warning(f"Failed to send duplicate notification to wecom: {e}")

                background_tasks.add_task(send_duplicate_notification)

                return {
                    "code": 200,
                    "msg": "已从历史记录中恢复",
                    "data": {
                        "title": exist_record.t_title,
                        "s3_url": exist_record.t_s3_url,
                        "video_id": exist_record.t_task_id,  # 复用 task_id
                        "task_id": exist_record.t_task_id,
                        "file_size": exist_record.t_file_size,
                        "platform": exist_record.t_extra_data.get("platform", "Unknown")
                        if exist_record.t_extra_data
                        else "Unknown",
                        "is_duplicate": True,
                    },
                    "req_id": req_id,
                    "ts": ts,
                }
        except Exception as e:
            from loguru import logger

            logger.warning(f"Failed to check duplicate download: {e}")

        # 1. 执行本地下载
        downloader = BilibiliDownloader()
        result = await downloader.download_bilibili(req.url)

        if not result["success"]:
            return {"code": 500, "msg": result["error"], "data": None, "req_id": req_id, "ts": ts}

        local_file_path = result["file_path"]
        video_id = result["video_id"]
        title = result["title"]
        source_platform = "Bilibili"  # 目前仅支持 B站

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
                t_extra_data={"platform": source_platform},
            )
            db_session.add(download_record)
            db_session.commit()

            # 4. 推送通知 (异步)
            async def send_notifications():
                from loguru import logger

                # 检查全局通知开关
                enabled = os.getenv("NOTIFY_ENABLED", "false").lower() == "true"
                logger.info(f"Notification triggered. NOTIFY_ENABLED={enabled}")
                if not enabled:
                    return

                # 生成河南地理专家内容
                expert_msg = await VideoDownloaderRouter._generate_henan_expert_message(title, username)

                # 飞书通知
                feishu_enabled = os.getenv("NOTIFY_FEISHU_ENABLED", "false").lower() == "true"
                feishu_webhook = os.getenv("NOTIFY_FEISHU_WEBHOOK")
                logger.info(
                    f"Feishu notification check: enabled={feishu_enabled}, webhook_exists={bool(feishu_webhook)}"
                )

                if feishu_enabled and feishu_webhook:
                    try:
                        feishu_service = NotifyServiceFactory.create_feishu(feishu_webhook)
                        msg = (
                            f"## 🧭 河南地理专家核心观测\n\n"
                            f"> **状态:** 视频下载成功\n"
                            f"> **平台:** {source_platform}\n"
                            f"> **标题:** {title}\n"
                            f"> **用户:** {username}\n"
                            f"> **大小:** {file_size / 1024 / 1024:.2f} MB\n\n"
                            f"{expert_msg}\n\n"
                            f"--- \n"
                            f"🔗 [点击预览视频]({presigned_url})"
                        )
                        feishu_service.send(
                            NotifyMessage(
                                title="TRAI 视频下载助手",
                                content=msg,
                                level=NotifyLevel.INFO,
                                msg_type=NotifyType.MARKDOWN,
                            )
                        )
                        logger.info("Feishu notification sent successfully")
                    except Exception as e:
                        logger.warning(f"Failed to send feishu notification: {e}")

                # 企业微信通知
                wecom_enabled = os.getenv("NOTIFY_WECOM_ENABLED", "false").lower() == "true"
                wecom_webhook = os.getenv("NOTIFY_WECOM_WEBHOOK")
                logger.info(f"WeCom notification check: enabled={wecom_enabled}, webhook_exists={bool(wecom_webhook)}")

                if wecom_enabled and wecom_webhook:
                    try:
                        wecom_service = NotifyServiceFactory.create_wecom(wecom_webhook)
                        msg = (
                            f"🧭 **河南地理专家核心观测**\n\n"
                            f"状态: 视频下载成功\n"
                            f"平台: {source_platform}\n"
                            f"标题: {title}\n"
                            f"用户: {username}\n"
                            f"大小: {file_size / 1024 / 1024:.2f} MB\n\n"
                            f"{expert_msg}\n\n"
                            f"--- \n"
                            f"🔗 [点击预览视频]({presigned_url})"
                        )
                        wecom_service.send(
                            NotifyMessage(
                                title="TRAI 视频下载助手",
                                content=msg,
                                level=NotifyLevel.INFO,
                                msg_type=NotifyType.MARKDOWN,
                            )
                        )
                        logger.info("WeCom notification sent successfully")
                    except Exception as e:
                        logger.warning(f"Failed to send wecom notification: {e}")

            background_tasks.add_task(send_notifications)

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
                    "platform": source_platform,
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

    @staticmethod
    @router.get(
        "/history",
        summary="获取视频下载历史",
        description="查询当前用户的视频下载历史记录, 支持分页.",
    )
    async def get_download_history(
        fastapi_req: Request,
        db_session: Annotated[Session, Depends(get_db_session)],
        current_user: Annotated[dict[str, Any] | None, Depends(get_current_user_optional)] = None,
        limit: int = Query(20, description="获取记录数量"),
        offset: int = Query(0, description="偏移量"),
    ):
        """
        获取下载历史记录

        参数:
            fastapi_req (Request): FastAPI 请求对象
            db_session (Session): 数据库会话
            current_user (dict): 当前用户信息
            limit (int): 限制数量
            offset (int): 偏移量
        返回值:
            统一响应格式
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        user_id = current_user.get("user_id") if current_user else None

        # 游客标识
        if not user_id:
            client_ip = fastapi_req.client.host if fastapi_req.client else "unknown"
            user_id = f"guest_{client_ip}"

        try:
            # 1. 查询总数
            count_query = (
                select(func.count()).select_from(VideoDownloadModel).where(VideoDownloadModel.t_user_id == user_id)
            )
            total = db_session.execute(count_query).scalar() or 0

            # 2. 查询记录
            query = (
                select(VideoDownloadModel)
                .where(VideoDownloadModel.t_user_id == user_id)
                .order_by(desc(VideoDownloadModel.t_created_at))
                .offset(offset)
                .limit(limit)
            )
            result = db_session.execute(query)
            records = result.scalars().all()

            history_data = []
            for r in records:
                history_data.append(
                    {
                        "task_id": r.t_task_id,
                        "title": r.t_title,
                        "source_url": r.t_source_url,
                        "s3_url": r.t_s3_url,
                        "file_size": r.t_file_size,
                        "status": r.t_status,
                        "platform": r.t_extra_data.get("platform", "Unknown") if r.t_extra_data else "Unknown",
                        "created_at": r.t_created_at.isoformat(),
                    }
                )

            return {
                "code": 200,
                "msg": "OK",
                "data": {
                    "items": history_data,
                    "total": total,
                    "limit": limit,
                    "offset": offset,
                },
                "req_id": req_id,
                "ts": ts,
            }
        except Exception as e:
            from loguru import logger

            logger.error(f"Failed to fetch download history: {str(e)}")
            return {
                "code": 500,
                "msg": f"查询失败: {str(e)}",
                "data": {"items": [], "total": 0},
                "req_id": req_id,
                "ts": ts,
            }

    @staticmethod
    @router.post(
        "/delete",
        summary="删除视频下载记录",
        description="支持单条或批量删除下载记录.",
    )
    async def delete_video(
        req: DeleteRequest,
        fastapi_req: Request,
        db_session: Annotated[Session, Depends(get_db_session)],
        current_user: Annotated[dict[str, Any] | None, Depends(get_current_user_optional)] = None,
    ):
        """
        删除下载记录 (目前为硬删除)

        参数:
            req (DeleteRequest): 包含要删除的任务 ID 列表
            fastapi_req (Request): FastAPI 请求对象
            db_session (Session): 数据库会话
            current_user (dict): 当前用户信息
        返回值:
            统一响应格式
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        user_id = current_user.get("user_id") if current_user else None

        # 游客标识
        if not user_id:
            client_ip = fastapi_req.client.host if fastapi_req.client else "unknown"
            user_id = f"guest_{client_ip}"

        try:
            from sqlalchemy import delete

            stmt = delete(VideoDownloadModel).where(
                VideoDownloadModel.t_task_id.in_(req.task_ids), VideoDownloadModel.t_user_id == user_id
            )
            db_session.execute(stmt)
            db_session.commit()

            return {
                "code": 200,
                "msg": f"成功删除 {len(req.task_ids)} 条记录",
                "data": None,
                "req_id": req_id,
                "ts": ts,
            }
        except Exception as e:
            from loguru import logger

            logger.error(f"Failed to delete download records: {str(e)}")
            return {"code": 500, "msg": f"删除失败: {str(e)}", "data": None, "req_id": req_id, "ts": ts}


__all__ = ["VideoDownloaderRouter", "router"]
