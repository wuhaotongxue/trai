#!/usr/bin/env python
# 文件名: task_flow_service.py
# 作者: wuhao
# 日期: 2026_05_29_09:45:00
# 描述: 核心任务流服务, 封装 S3 上传、数据库记录持久化与多端通知推送逻辑.

import os
from datetime import datetime
from typing import Any

from loguru import logger
from sqlalchemy.orm import Session

from infrastructure.ai.core.openai_client import OpenAIClient
from infrastructure.notify.base import NotifyMessage, NotifyType
from infrastructure.notify.factory import NotifyServiceFactory
from infrastructure.storage.s3_storage import S3StorageService


class TaskFlowService:
    """
    核心任务流服务类, 提供标准化的任务处理流水线.
    """

    def __init__(self, db: Session):
        """
        初始化任务流服务.

        参数:
            db (Session): 数据库会话.
        """
        self._db = db
        self._s3 = S3StorageService()

    async def process_and_notify(
        self,
        task_id: str,
        user_id: str,
        username: str,
        local_file_path: str | None,
        s3_prefix: str,
        record_model_class: Any,
        task_data: dict[str, Any],
        notify_title: str,
        expert_prompt: str | None = None,
    ) -> str:
        """
        执行标准化的 处理 -> 上传 -> 记录 -> 通知 流程.

        参数:
            task_id (str): 任务 ID.
            user_id (str): 用户 ID.
            username (str): 用户名.
            local_file_path (str): 本地文件路径 (可选).
            s3_prefix (str): S3 存储前缀 (如 'audio/separation').
            record_model_class (Any): 数据库模型类.
            task_data (dict): 写入数据库的额外数据.
            notify_title (str): 通知标题.
            expert_prompt (str): 如果提供, 将调用 DeepSeek 生成专家点评.

        返回值:
            str: 结果访问 URL (S3 预签名地址).
        """
        s3_url = ""
        object_key = ""
        file_size = 0

        # 1. S3 上传
        if local_file_path and os.path.exists(local_file_path):
            file_ext = os.path.splitext(local_file_path)[1]
            object_key = f"{s3_prefix}/{task_id}{file_ext}"
            file_size = os.path.getsize(local_file_path)

            # 自动识别 Content-Type
            content_type = "application/octet-stream"
            if file_ext.lower() in [".mp4", ".mov"]:
                content_type = "video/mp4"
            elif file_ext.lower() in [".mp3", ".wav"]:
                content_type = "audio/mpeg"

            self._s3.upload_file(local_file_path, object_key, content_type=content_type)
            s3_url = self._s3.get_long_term_url(object_key, expires_days=7)
            logger.info(f"Task {task_id} file uploaded to S3: {object_key}")

        # 2. 数据库持久化
        record_data = {
            "t_task_id": task_id,
            "t_user_id": user_id,
            "t_username": username,
            "t_status": "completed",
            "t_created_at": datetime.now(),
        }

        # 合并传入的业务数据
        if s3_url:
            if hasattr(record_model_class, "t_s3_url"):
                record_data["t_s3_url"] = s3_url
            if hasattr(record_model_class, "t_s3_key"):
                record_data["t_s3_key"] = object_key
            if hasattr(record_model_class, "t_file_size"):
                record_data["t_file_size"] = file_size
            if hasattr(record_model_class, "t_result_url"):
                record_data["t_result_url"] = s3_url

        record_data.update(task_data)

        # 移除 model 中不存在的 key
        valid_keys = record_model_class.__table__.columns.keys()
        final_data = {k: v for k, v in record_data.items() if k in valid_keys}

        new_record = record_model_class(**final_data)
        self._db.add(new_record)
        self._db.commit()
        logger.info(f"Task {task_id} record saved to database.")

        # 3. 生成专家点评 (DeepSeek)
        expert_msg = ""
        if expert_prompt:
            try:
                ai_client = OpenAIClient(provider="deepseek")
                # 增强提示词，加入周五认知
                full_prompt = (
                    f"今天是 2026-05-29 周五。请作为一位'河南地理专家'，针对以下任务给出点评：\n"
                    f"{expert_prompt}\n"
                    "要求：口吻专业亲切，融入周五愉悦氛围，推荐一个河南景点，字数 60 字以内。"
                )
                ai_res = await ai_client.chat(messages=[{"role": "user", "content": full_prompt}])
                expert_msg = ai_res.get("content", "")
            except Exception as e:
                logger.warning(f"Failed to generate expert msg: {e}")

        # 4. 推送通知
        self._send_notifications(notify_title, username, s3_url, expert_msg, task_data.get("t_title", "未命名任务"))

        return s3_url

    def _send_notifications(self, title: str, username: str, url: str, expert_msg: str, item_name: str):
        """发送多端通知"""
        # 强制重新加载环境变量，确保在异步线程中也能读取到最新配置
        from run import EnvFileLoader

        EnvFileLoader.load_local_envs()

        enabled = os.getenv("NOTIFY_ENABLED", "false").lower() == "true"
        logger.info(f"Notification status: {enabled}")
        if not enabled:
            return

        # 格式化消息内容
        msg_content = (
            f"## 🧭 河南地理专家核心观测\n\n"
            f"> **事项:** {title}\n"
            f"> **目标:** {item_name}\n"
            f"> **操作人:** {username}\n\n"
            f"{expert_msg if expert_msg else '任务已圆满完成，祝您周五愉快！'}\n\n"
            f"--- \n"
            f"🔗 [点击查看详情/下载]({url})"
        )

        # 飞书
        feishu_enabled = os.getenv("NOTIFY_FEISHU_ENABLED", "false").lower() == "true"
        logger.info(f"Feishu notification enabled: {feishu_enabled}")
        if feishu_enabled:
            webhook = os.getenv("NOTIFY_FEISHU_WEBHOOK")
            logger.info(f"Feishu webhook present: {bool(webhook)}")
            if webhook:
                try:
                    NotifyServiceFactory.create_feishu(webhook).send(
                        NotifyMessage(title="TRAI 助手", content=msg_content, msg_type=NotifyType.MARKDOWN)
                    )
                    logger.info("Feishu notification sent successfully.")
                except Exception as e:
                    logger.warning(f"Feishu notify fail: {e}")

        # 企微
        wecom_enabled = os.getenv("NOTIFY_WECOM_ENABLED", "false").lower() == "true"
        logger.info(f"WeCom notification enabled: {wecom_enabled}")
        if wecom_enabled:
            webhook = os.getenv("NOTIFY_WECOM_WEBHOOK")
            logger.info(f"WeCom webhook present: {bool(webhook)}")
            if webhook:
                try:
                    NotifyServiceFactory.create_wecom(webhook).send(
                        NotifyMessage(title="TRAI 助手", content=msg_content, msg_type=NotifyType.MARKDOWN)
                    )
                    logger.info("WeCom notification sent successfully.")
                except Exception as e:
                    logger.warning(f"WeCom notify fail: {e}")
