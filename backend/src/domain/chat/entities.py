#!/usr/bin/env python
# 文件名: entities.py
# 作者: wuhao
# 日期: 2026_05_26_21:05:00
# 描述: 聊天领域实体定义, 包含会话(ChatSession)与消息(Message)

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any


class SessionStatus(StrEnum):
    """会话状态枚举"""

    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"


class MessageRole(StrEnum):
    """消息角色枚举"""

    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


@dataclass
class Message:
    """
    对话消息实体, 表示单条对话内容
    """

    role: MessageRole
    content: str
    created_at: datetime = field(default_factory=datetime.now)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """
        将消息实体转换为可序列化的字典格式

        参数:
            None
        返回值:
            dict[str, Any]: 包含角色、内容、时间戳和元数据的字典
        """
        return {
            "role": self.role.value,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Message:
        """
        从字典数据重建消息实体对象

        参数:
            data (dict[str, Any]): 包含消息属性的字典
        返回值:
            Message: 初始化后的消息实体对象
        """
        return cls(
            role=MessageRole(data["role"]),
            content=data["content"],
            created_at=datetime.fromisoformat(data["created_at"]),
            metadata=data.get("metadata", {}),
        )


@dataclass
class ChatSession:
    """
    对话会话实体, 封装多轮对话的状态与消息历史
    """

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
        """
        向当前会话历史中追加一条新消息并更新活跃时间

        参数:
            role (str): 消息发送者的角色 (system/user/assistant)
            content (str): 消息文本内容
        返回值:
            None
        """
        self.messages.append(
            {
                "role": role,
                "content": content,
                "created_at": datetime.now().isoformat(),
            }
        )
        self.updated_at = datetime.now()

    def get_last_messages(self, count: int = 10) -> list[dict[str, Any]]:
        """
        获取会话中最近的 N 条历史消息

        参数:
            count (int): 需要返回的消息条数
        返回值:
            list[dict[str, Any]]: 最近的消息列表
        """
        return self.messages[-count:] if count > 0 else []

    @property
    def message_count(self) -> int:
        """
        获取当前会话包含的消息总数

        返回值:
            int: 消息总数
        """
        return len(self.messages)

    def clear_messages(self) -> None:
        """
        清空当前会话的所有历史消息记录

        参数:
            None
        返回值:
            None
        """
        self.messages.clear()
        self.updated_at = datetime.now()

    def to_ai_format(self) -> list[dict[str, str]]:
        """
        转换为符合 AI 模型 API (如 OpenAI/LLM) 要求的标准消息格式列表

        返回值:
            list[dict[str, str]]: 仅包含 role 和 content 的精简消息列表
        """
        return [{"role": msg["role"], "content": msg["content"]} for msg in self.messages]

    def to_dict(self) -> dict[str, Any]:
        """
        将整个会话实体转换为可序列化的字典

        返回值:
            dict[str, Any]: 会话完整属性字典
        """
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
        """
        从字典数据恢复会话实体对象

        参数:
            data (dict[str, Any]): 包含会话属性的字典
        返回值:
            ChatSession: 恢复后的会话对象
        """
        return cls(
            session_id=data["session_id"],
            model=data["model"],
            messages=data.get("messages", []),
            status=SessionStatus(data.get("status", "active")),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            metadata=data.get("metadata", {}),
        )


__all__ = ["ChatSession", "SessionStatus", "Message", "MessageRole"]
