#!/usr/bin/env python
# 文件名: upload_task.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 上传任务实体

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any


class FileType(StrEnum):
    """文件类型"""

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
    """上传状态"""

    PENDING = "pending"
    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class UploadTask:
    """上传任务实体"""

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
        """标记完成"""
        self.status = UploadStatus.COMPLETED
        self.file_url = file_url
        self.completed_at = datetime.now()

    def mark_failed(self, error: str) -> None:
        """标记失败"""
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


__all__ = ["UploadTask", "FileType", "UploadStatus"]
