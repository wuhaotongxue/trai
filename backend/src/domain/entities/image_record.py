#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: image_record.py
# 作者: wuhao
# 日期: 2026_05_20_0830
# 描述: AI 图片记录实体，统一存储文生图和图生图任务


from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any


class ImageRecordType(StrEnum):
    """图片记录类型"""

    TEXT_TO_IMAGE = "text_to_image"
    """文生图"""

    IMAGE_TO_IMAGE = "image_to_image"
    """图生图"""

    IMAGE_EDIT = "image_edit"
    """图片编辑"""


class ImageRecordStatus(StrEnum):
    """图片记录状态"""

    PENDING = "pending"
    """等待中"""

    PROCESSING = "processing"
    """处理中"""

    COMPLETED = "completed"
    """已完成"""

    FAILED = "failed"
    """失败"""


@dataclass
class ImageRecord:
    """AI 图片记录实体

    统一存储文生图、图生图、图片编辑三种类型任务的完整信息，
    支持追溯：请求人 IP、登录用户/游客、操作人、任务参数、结果 URL。
    """

    record_type: ImageRecordType
    prompt: str
    model: str = "AI-ModelScope/FLUX.1-dev"
    task_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    username: str = ""
    client_ip: str = ""
    user_agent: str = ""
    request_ip: str = ""
    is_guest: bool = False
    tenant_id: str = ""

    source_image_url: str = ""
    """源图片 URL（图生图/图片编辑）"""

    result_url: str = ""
    """结果图片 S3 URL"""

    result_base64: str = ""
    """结果图片 base64（临时，存入 S3 后清空）"""

    status: ImageRecordStatus = ImageRecordStatus.PENDING
    error_message: str = ""

    width: int = 1024
    height: int = 1024
    steps: int = 25
    seed: int = -1

    session_id: str = ""
    trace_id: str = ""

    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    completed_at: datetime | None = None

    created_by: str = ""
    updated_by: str = ""

    feishu_notified: bool = False
    """是否已发送飞书通知"""

    notify_status: str = "pending"
    """通知状态: pending/success/failed"""

    extra_data: dict[str, Any] = field(default_factory=dict)

    def mark_completed(self, result_url: str, result_base64: str = "") -> None:
        """标记任务完成"""
        self.status = ImageRecordStatus.COMPLETED
        self.result_url = result_url
        self.result_base64 = result_base64
        self.completed_at = datetime.now()
        self.updated_at = datetime.now()

    def mark_failed(self, error_message: str) -> None:
        """标记任务失败"""
        self.status = ImageRecordStatus.FAILED
        self.error_message = error_message
        self.updated_at = datetime.now()
        self.completed_at = datetime.now()

    def mark_processing(self) -> None:
        """标记处理中"""
        self.status = ImageRecordStatus.PROCESSING
        self.updated_at = datetime.now()

    def to_dict(self) -> dict[str, Any]:
        """转换为字典"""
        return {
            "task_id": self.task_id,
            "record_type": self.record_type.value,
            "user_id": self.user_id,
            "username": self.username,
            "client_ip": self.client_ip,
            "request_ip": self.request_ip,
            "is_guest": self.is_guest,
            "tenant_id": self.tenant_id,
            "prompt": self.prompt,
            "source_image_url": self.source_image_url,
            "result_url": self.result_url,
            "model": self.model,
            "status": self.status.value,
            "error_message": self.error_message,
            "width": self.width,
            "height": self.height,
            "steps": self.steps,
            "seed": self.seed,
            "session_id": self.session_id,
            "trace_id": self.trace_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_by": self.created_by,
            "updated_by": self.updated_by,
            "feishu_notified": self.feishu_notified,
            "notify_status": self.notify_status,
            "extra_data": self.extra_data,
        }


__all__ = ["ImageRecord", "ImageRecordType", "ImageRecordStatus"]
