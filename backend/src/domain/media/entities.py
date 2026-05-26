#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: entities.py
# 作者: wuhao
# 日期: 2026_05_26_20:45:12
# 描述: 媒体领域实体定义, 包含图片记录(ImageRecord)与上传任务(UploadTask)

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any


class ImageRecordType(StrEnum):
    """图片记录类型枚举"""

    TEXT_TO_IMAGE = "text_to_image"
    IMAGE_TO_IMAGE = "image_to_image"
    IMAGE_EDIT = "image_edit"
    IMAGE_EDIT_DUAL = "image_edit_dual"


class ImageRecordStatus(StrEnum):
    """图片记录状态枚举"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class FileType(StrEnum):
    """文件类型枚举"""

    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    ARCHIVE = "archive"
    CODE = "code"
    FONT = "font"
    MODEL3D = "3d"
    OTHER = "other"


class UploadStatus(StrEnum):
    """上传状态枚举"""

    PENDING = "pending"
    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ImageRecord:
    """
    AI 图片处理记录实体
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
    source_image_url_2: str = ""
    source_image_object_key: str = ""
    source_image_object_key_2: str = ""
    result_url: str = ""
    result_base64: str = ""
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
    notify_status: str = "pending"
    extra_data: dict[str, Any] = field(default_factory=dict)

    def mark_completed(self, result_url: str, result_base64: str = "") -> None:
        """标记任务为完成"""
        self.status = ImageRecordStatus.COMPLETED
        self.result_url = result_url
        self.result_base64 = result_base64
        self.completed_at = datetime.now()
        self.updated_at = datetime.now()

    def mark_failed(self, error_message: str) -> None:
        """标记任务为失败"""
        self.status = ImageRecordStatus.FAILED
        self.error_message = error_message
        self.updated_at = datetime.now()
        self.completed_at = datetime.now()

    def mark_processing(self) -> None:
        """标记任务为处理中"""
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
            "source_image_url_2": self.source_image_url_2,
            "source_image_object_key": self.source_image_object_key,
            "source_image_object_key_2": self.source_image_object_key_2,
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


@dataclass
class UploadTask:
    """
    文件上传任务实体
    """

    filename: str
    file_size: int
    content_type: str
    file_type: FileType = FileType.OTHER
    task_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    status: UploadStatus = UploadStatus.PENDING
    file_url: str | None = None
    error_message: str | None = None
    session_id: str | None = None
    trace_id: str | None = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: datetime | None = None

    def mark_completed(self, file_path: str, file_url: str) -> None:
        """标记上传任务完成"""
        self.status = UploadStatus.COMPLETED
        self.file_url = file_url
        self.completed_at = datetime.now()

    def mark_failed(self, error: str) -> None:
        """标记上传任务失败"""
        self.status = UploadStatus.FAILED
        self.error_message = error
        self.completed_at = datetime.now()

    def to_dict(self) -> dict[str, Any]:
        """转换为字典"""
        return {
            "task_id": self.task_id,
            "user_id": self.user_id,
            "filename": self.filename,
            "file_size": self.file_size,
            "content_type": self.content_type,
            "file_type": self.file_type.value,
            "status": self.status.value,
            "file_url": self.file_url,
            "error_message": self.error_message,
            "session_id": self.session_id,
            "trace_id": self.trace_id,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


__all__ = ["ImageRecord", "ImageRecordType", "ImageRecordStatus", "UploadTask", "FileType", "UploadStatus"]
