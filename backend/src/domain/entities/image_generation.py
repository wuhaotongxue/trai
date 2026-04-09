#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: image_generation.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 图片生成实体

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any
import uuid


class ImageStyle(str, Enum):
    """图片风格"""
    REALISTIC = "realistic"
    ARTISTIC = "artistic"
    CARTOON = "cartoon"
    ABSTRACT = "abstract"
    ANIME = "anime"


class ImageSize(str, Enum):
    """图片尺寸"""
    SQUARE_1K = "1024x1024"
    PORTRAIT_1K = "1024x1792"
    LANDSCAPE_1K = "1792x1024"


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
    status: str = "pending"
    image_url: str | None = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: datetime | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def mark_completed(self, image_url: str) -> None:
        """标记完成"""
        self.status = "completed"
        self.image_url = image_url
        self.completed_at = datetime.now()

    def mark_failed(self, error: str) -> None:
        """标记失败"""
        self.status = "failed"
        self.metadata["error"] = error
        self.completed_at = datetime.now()

    def to_dict(self) -> dict[str, Any]:
        """转换为字典"""
        return {
            "task_id": self.task_id,
            "model": self.model,
            "prompt": self.prompt,
            "width": self.width,
            "height": self.height,
            "steps": self.steps,
            "seed": self.seed,
            "status": self.status,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "metadata": self.metadata,
        }


__all__ = ["ImageGeneration", "ImageStyle", "ImageSize"]