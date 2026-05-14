#!/usr/bin/env python
# 文件名: chat_session.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: AI 对话会话实体

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any


class SessionStatus(StrEnum):
    """会话状态"""

    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ChatSession:
    """AI 对话会话实体"""

    model: str
    title: str | None = None
    user_id: str | None = None
    messages: list[dict[str, Any]] = field(default_factory=list)
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    status: SessionStatus = SessionStatus.ACTIVE
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    metadata: dict[str, Any] = field(default_factory=dict)

    def add_message(self, role: str, content: str) -> None:
        """添加消息"""
        self.messages.append(
            {
                "role": role,
                "content": content,
                "created_at": datetime.now().isoformat(),
            }
        )
        self.updated_at = datetime.now()

    def get_last_messages(self, count: int = 10) -> list[dict[str, Any]]:
        """获取最近 N 条消息

        Args:
            count: 消息数量(默认 10)

        Returns:
            list[dict]: 最近的消息列表
        """
        return self.messages[-count:] if count > 0 else []

    @property
    def message_count(self) -> int:
        """获取消息总数

        Returns:
            int: 消息数量
        """
        return len(self.messages)

    def clear_messages(self) -> None:
        """清空所有消息"""
        self.messages.clear()
        self.updated_at = datetime.now()

    def to_ai_format(self) -> list[dict[str, str]]:
        """转换为 AI API 所需的格式

        Returns:
            list[dict]: AI API 格式的消息列表
        """
        return [{"role": msg["role"], "content": msg["content"]} for msg in self.messages]

    def to_dict(self) -> dict[str, Any]:
        """转换为字典"""
        return {
            "session_id": self.session_id,
            "model": self.model,
            "messages": self.messages,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ChatSession:
        """从字典创建"""
        return cls(
            session_id=data["session_id"],
            model=data["model"],
            messages=data.get("messages", []),
            status=SessionStatus(data.get("status", "active")),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            metadata=data.get("metadata", {}),
        )


__all__ = ["ChatSession", "SessionStatus"]
