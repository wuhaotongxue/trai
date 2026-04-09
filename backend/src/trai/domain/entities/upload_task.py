#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: upload_task.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 上传任务实体

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any
import uuid


class FileType(str, Enum):
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


class UploadStatus(str, Enum):
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
    status: UploadStatus = UploadStatus.PENDING
    file_path: str | None = None
    file_url: str | None = None
    thumbnail_url: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: datetime | None = None

    def mark_completed(self, file_path: str, file_url: str) -> None:
        """标记完成"""
        self.status = UploadStatus.COMPLETED
        self.file_path = file_path
        self.file_url = file_url
        self.completed_at = datetime.now()

    def mark_failed(self, error: str) -> None:
        """标记失败"""
        self.status = UploadStatus.FAILED
        self.metadata["error"] = error
        self.completed_at = datetime.now()

    def to_dict(self) -> dict[str, Any]:
        """转换为字典"""
        return {
            "task_id": self.task_id,
            "filename": self.filename,
            "file_size": self.file_size,
            "content_type": self.content_type,
            "file_type": self.file_type.value,
            "status": self.status.value,
            "file_path": self.file_path,
            "file_url": self.file_url,
            "thumbnail_url": self.thumbnail_url,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


__all__ = ["UploadTask", "FileType", "UploadStatus"]
