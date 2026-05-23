#!/usr/bin/env python
# 文件名: chat_history_service.py
# 作者: wuhao
# 日期: 2026_05_04
# 描述: 对话历史持久化服务 - 提供统一的对话历史加载和保存接口

from __future__ import annotations

from typing import Any

from infrastructure.repositories.message_repository import MessageRepository
from loguru import logger
from sqlalchemy.orm import Session

from domain.entities.chat_session import ChatSession
from domain.entities.message import Message
from infrastructure.database.database import get_session
from infrastructure.repositories.session_repository import SessionRepository


class ChatHistoryService:
    """对话历史持久化服务

    提供统一的接口用于加载和保存对话历史,
    主要供 Agent 执行器和 API 层使用.
    封装了复杂的数据库操作和实体转换逻辑.
    """

    def __init__(self, db_session: Session | None = None) -> None:
        """初始化服务

        Args:
            db_session: 数据库会话(可选,如果不提供则自动创建)
        """
        self._db_session = db_session
        self._session_repo: SessionRepository | None = None
        self._message_repo: MessageRepository | None = None

    def _get_repos(self) -> tuple[SessionRepository, MessageRepository]:
        """获取仓储实例

        Returns:
            tuple: (SessionRepository, MessageRepository)
        """
        from infrastructure.repositories.session_repository import (
            MessageRepository,
            SessionRepository,
        )

        if self._session_repo is None or self._message_repo is None:
            if self._db_session is None:
                db_session = get_session()
                self._session_repo = SessionRepository(db_session)
                self._message_repo = MessageRepository(db_session)
            else:
                self._session_repo = SessionRepository(self._db_session)
                self._message_repo = MessageRepository(self._db_session)
        return self._session_repo, self._message_repo

    def load_session_history(
        self,
        session_id: str,
        max_messages: int | None = None,
    ) -> ChatSession | None:
        """加载会话历史

        从数据库加载完整的会话信息,包括消息历史.

        Args:
            session_id: 会话 ID
            max_messages: 最大消息数量(可选,用于限制上下文长度)

        Returns:
            ChatSession | None: 会话领域实体,如果不存在则返回 None
        """
        session_repo, message_repo = self._get_repos()

        # 加载会话实体
        session_entity = session_repo.get_session(session_id)
        if not session_entity:
            logger.warning(f"会话不存在 | session_id={session_id}")
            return None

        # 加载消息历史
        message_entities = message_repo.get_messages(session_id)

        # 转换为字典格式并更新到会话实体
        messages_dict = [msg.to_dict() for msg in message_entities]

        # 如果指定了最大消息数量,则截取最近的消息
        if max_messages and len(messages_dict) > max_messages:
            messages_dict = messages_dict[-max_messages:]
            logger.info(f"截取最近 {max_messages} 条消息 | session_id={session_id}")

        # 更新会话实体的消息列表
        session_entity.messages = messages_dict

        logger.info(
            f"加载会话历史成功 | session_id={session_id} | 消息数={len(messages_dict)} | model={session_entity.model}"
        )

        return session_entity

    def save_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> Message:
        """保存单条消息

        Args:
            session_id: 会话 ID
            role: 消息角色(user/assistant/system)
            content: 消息内容
            metadata: 消息元数据(可选)

        Returns:
            Message: 保存后的消息领域实体

        Raises:
            ValueError: 会话不存在
        """
        session_repo, message_repo = self._get_repos()

        # 检查会话是否存在
        chat_session = session_repo.get_session(session_id)
        if not chat_session:
            raise ValueError(f"会话不存在: {session_id}")

        # 保存消息
        message_entity = message_repo.add_message(
            session_id=session_id,
            role=role,
            content=content,
            msg_metadata=metadata,
        )

        # 更新会话的消息历史(追加新消息)
        current_messages = chat_session.messages.copy()
        current_messages.append(message_entity.to_dict())
        session_repo.update_session(
            session_id=session_id,
            messages=current_messages,
        )

        logger.info(f"保存消息成功 | session_id={session_id} | role={role} | content_length={len(content)}")

        return message_entity

    def save_conversation_turn(
        self,
        session_id: str,
        user_content: str,
        assistant_content: str,
        user_metadata: dict[str, Any] | None = None,
        assistant_metadata: dict[str, Any] | None = None,
    ) -> tuple[Message, Message]:
        """保存一个完整的对话轮次(用户消息 + AI 回复)

        Args:
            session_id: 会话 ID
            user_content: 用户消息内容
            assistant_content: AI 回复内容
            user_metadata: 用户消息元数据(可选)
            assistant_metadata: AI 回复元数据(可选)

        Returns:
            tuple[Message, Message]: (用户消息实体, AI 消息实体)

        Raises:
            ValueError: 会话不存在
        """
        session_repo, message_repo = self._get_repos()

        # 检查会话是否存在
        chat_session = session_repo.get_session(session_id)
        if not chat_session:
            raise ValueError(f"会话不存在: {session_id}")

        # 保存用户消息
        user_msg = message_repo.add_message(
            session_id=session_id,
            role="user",
            content=user_content,
            msg_metadata=user_metadata,
        )

        # 保存 AI 回复
        assistant_msg = message_repo.add_message(
            session_id=session_id,
            role="assistant",
            content=assistant_content,
            msg_metadata=assistant_metadata,
        )

        # 更新会话的消息历史
        current_messages = chat_session.messages.copy()
        current_messages.append(user_msg.to_dict())
        current_messages.append(assistant_msg.to_dict())
        session_repo.update_session(
            session_id=session_id,
            messages=current_messages,
        )

        logger.info(
            f"保存对话轮次成功 | session_id={session_id} | "
            f"user_len={len(user_content)} | assistant_len={len(assistant_content)}"
        )

        return user_msg, assistant_msg

    def update_session_extra_data(self, session_id: str, patch: dict[str, Any]) -> bool:
        session_repo, _ = self._get_repos()
        chat_session = session_repo.get_session(session_id)
        if not chat_session:
            raise ValueError(f"会话不存在: {session_id}")

        current_extra = {}
        if isinstance(chat_session.metadata, dict):
            extra = chat_session.metadata.get("extra_data")
            if isinstance(extra, dict):
                current_extra = extra

        merged = {**current_extra, **patch}
        updated = session_repo.update_session(session_id=session_id, extra_data=merged)
        return updated is not None

    def get_messages_for_ai(
        self,
        session_id: str,
        max_tokens: int | None = None,
    ) -> list[dict[str, str]]:
        """获取用于 AI API 调用的消息格式

        将消息历史转换为 AI API 所需的格式,
        可选地根据 token 数量限制进行截断.

        Args:
            session_id: 会话 ID
            max_tokens: 最大 token 数量(可选)

        Returns:
            list[dict]: AI API 格式的消息列表 [{"role": "...", "content": "..."}]
        """
        session_entity = self.load_session_history(session_id)
        if not session_entity:
            return []

        # 使用领域实体的 to_ai_format 方法
        ai_messages = session_entity.to_ai_format()

        # 如果需要限制 token 数量,从最早的消息开始删除
        if max_tokens:
            from core.token_counter import get_token_counter

            token_counter = get_token_counter()
            total_tokens = token_counter.count_messages_tokens(ai_messages)

            while total_tokens > max_tokens and len(ai_messages) > 1:
                # 删除最旧的非系统消息
                removed = False
                for i, msg in enumerate(ai_messages):
                    if msg["role"] != "system":
                        ai_messages.pop(i)
                        total_tokens = token_counter.count_messages_tokens(ai_messages)
                        removed = True
                        break
                if not removed:
                    break

            logger.info(
                f"Token 限制处理完成 | session_id={session_id} | "
                f"原始token数≈{total_tokens} | 限制={max_tokens} | "
                f"最终消息数={len(ai_messages)}"
            )

        return ai_messages

    def update_session_title(
        self,
        session_id: str,
        title: str,
    ) -> bool:
        """更新会话标题

        通常在第一条消息后自动调用,根据用户输入生成标题.

        Args:
            session_id: 会话 ID
            title: 新标题

        Returns:
            bool: 是否更新成功
        """
        session_repo, _ = self._get_repos()

        result = session_repo.update_session(session_id=session_id, title=title)
        if result:
            logger.info(f"更新会话标题成功 | session_id={session_id} | title={title}")
        else:
            logger.warning(f"更新会话标题失败 | session_id={session_id}")

        return result is not None


def get_chat_history_service(
    db_session: Session | None = None,
) -> ChatHistoryService:
    """获取对话历史服务实例(工厂函数)

    Args:
        db_session: 数据库会话(可选)

    Returns:
        ChatHistoryService: 服务实例
    """
    return ChatHistoryService(db_session)


__all__ = [
    "ChatHistoryService",
    "get_chat_history_service",
]
