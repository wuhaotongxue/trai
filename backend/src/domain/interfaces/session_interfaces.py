#!/usr/bin/env python
# 文件名: session_interfaces.py
# 作者: wuhao
# 日期: 2026_04_09_20:22:00
# 描述: 会话领域仓储接口定义

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Protocol

if TYPE_CHECKING:
    from domain.entities.chat_session import ChatSession
    from domain.entities.message import Message


class ISessionRepository(Protocol):
    """会话仓储接口

    定义对话会话数据的持久化操作契约
    """

    def create_session(
        self,
        session_id: str,
        user_id: str | None,
        title: str | None,
        model: str,
        extra_data: dict[str, Any] | None = None,
    ) -> ChatSession:
        """创建会话

        Args:
            session_id: 会话唯一标识
            user_id: 用户 ID
            title: 会话标题
            model: AI 模型名称
            extra_data: 扩展数据

        Returns:
            ChatSession: 创建的会话实体
        """
        ...

    def get_session(self, session_id: str) -> ChatSession | None:
        """获取会话

        Args:
            session_id: 会话唯一标识

        Returns:
            ChatSession | None: 会话实体
        """
        ...

    def list_sessions(
        self,
        user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ChatSession]:
        """获取会话列表

        Args:
            user_id: 用户 ID(可选)
            limit: 每页数量(默认 50)
            offset: 偏移量(默认 0)

        Returns:
            list[ChatSession]: 会话实体列表
        """
        ...

    def update_session(
        self,
        session_id: str,
        title: str | None = None,
        messages: list[dict[str, Any]] | None = None,
        extra_data: dict[str, Any] | None = None,
    ) -> ChatSession | None:
        """更新会话

        Args:
            session_id: 会话唯一标识
            title: 会话标题(可选)
            messages: 消息列表(可选)
            extra_data: 扩展数据(可选)

        Returns:
            ChatSession | None: 更新后的会话实体
        """
        ...

    def delete_session(self, session_id: str) -> bool:
        """删除会话

        Args:
            session_id: 会话唯一标识

        Returns:
            bool: 是否删除成功
        """
        ...


class IMessageRepository(Protocol):
    """消息仓储接口

    定义对话消息数据的持久化操作契约
    """

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        msg_metadata: dict[str, Any] | None = None,
    ) -> Message:
        """添加消息

        Args:
            session_id: 会话 ID
            role: 消息角色(system/user/assistant)
            content: 消息内容
            msg_metadata: 消息元数据(可选)

        Returns:
            Message: 创建的消息实体
        """
        ...

    def get_messages(self, session_id: str) -> list[Message]:
        """获取会话消息

        Args:
            session_id: 会话 ID

        Returns:
            list[Message]: 消息实体列表
        """
        ...

    def delete_messages(self, session_id: str) -> int:
        """删除会话消息

        Args:
            session_id: 会话 ID

        Returns:
            int: 删除的消息数量
        """
        ...


__all__ = ["ISessionRepository", "IMessageRepository"]
