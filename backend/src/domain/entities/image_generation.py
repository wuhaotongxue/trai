#!/usr/bin/env python
# 文件名: image_generation.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 图片生成实体

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any


class ImageStyle(StrEnum):
    """图片风格"""

    REALISTIC = "realistic"
    ARTISTIC = "artistic"
    CARTOON = "cartoon"
    ABSTRACT = "abstract"
    ANIME = "anime"
    AUTO = "auto"


class ImageSize(StrEnum):
    """图片尺寸"""

    SQUARE_1K = "1024x1024"
    PORTRAIT_1K = "1024x1792"
    LANDSCAPE_1K = "1792x1024"


class ImageStatus(StrEnum):
    """图片生成状态"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ImageGeneration:
    """图片生成实体"""

    prompt: str
    model: str = "AI-ModelScope/FLUX.1-dev"
    width: int = 1024
    height: int = 1024
    steps: int = 30
    seed: int = -1
    task_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    style: ImageStyle = ImageStyle.AUTO
    size: ImageSize = ImageSize.SQUARE_1K
    status: ImageStatus = ImageStatus.PENDING
    result_url: str | None = None
    error_message: str | None = None
    negative_prompt: str | None = None
    session_id: str | None = None
    trace_id: str | None = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: datetime | None = None

    @classmethod
    def with_task_id(cls, task_id: str, **kwargs: Any) -> "ImageGeneration":
        """使用外部指定的 task_id 创建实体（避免内部自动生成导致 ID 不一致）"""
        entity = cls(**kwargs)
        entity.task_id = task_id
        return entity

    def mark_completed(self, image_url: str) -> None:
        """标记完成"""
        self.status = ImageStatus.COMPLETED
        self.result_url = image_url
        self.completed_at = datetime.now()

    def mark_failed(self, error: str) -> None:
        """标记失败"""
        self.status = ImageStatus.FAILED
        self.error_message = error
        self.completed_at = datetime.now()

    def to_dict(self) -> dict[str, Any]:
        """转换为字典"""
        return {
            "task_id": self.task_id,
            "user_id": self.user_id,
            "model": self.model,
            "prompt": self.prompt,
            "negative_prompt": self.negative_prompt,
            "style": self.style.value,
            "size": self.size.value,
            "width": self.width,
            "height": self.height,
            "steps": self.steps,
            "seed": self.seed,
            "status": self.status.value,
            "result_url": self.result_url,
            "error_message": self.error_message,
            "session_id": self.session_id,
            "trace_id": self.trace_id,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


__all__ = ["ImageGeneration", "ImageStyle", "ImageSize", "ImageStatus"]
