#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: session_repository.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 会话仓储

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from infrastructure.database.models import ChatSessionModel, MessageModel


class SessionRepository:
    """会话仓储"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create_session(
        self,
        session_id: str,
        user_id: str | None,
        title: str | None,
        model: str,
        extra_data: dict[str, Any] | None = None,
    ) -> ChatSessionModel:
        """创建会话"""
        session = ChatSessionModel(
            session_id=session_id,
            user_id=user_id,
            title=title,
            model=model,
            extra_data=extra_data or {},
        )
        self._session.add(session)
        self._session.commit()
        self._session.refresh(session)
        return session

    def get_session(self, session_id: str) -> ChatSessionModel | None:
        """获取会话"""
        stmt = select(ChatSessionModel).where(
            ChatSessionModel.session_id == session_id,
            ChatSessionModel.deleted_at.is_(None),
        )
        return self._session.scalar(stmt)

    def list_sessions(
        self,
        user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ChatSessionModel]:
        """获取会话列表"""
        stmt = select(ChatSessionModel).where(
            ChatSessionModel.deleted_at.is_(None)
        )
        if user_id:
            stmt = stmt.where(ChatSessionModel.user_id == user_id)
        stmt = stmt.order_by(ChatSessionModel.updated_at.desc()).limit(limit).offset(offset)
        return list(self._session.scalars(stmt))

    def update_session(
        self,
        session_id: str,
        title: str | None = None,
        messages: list[dict[str, Any]] | None = None,
        extra_data: dict[str, Any] | None = None,
    ) -> ChatSessionModel | None:
        """更新会话"""
        session = self.get_session(session_id)
        if not session:
            return None

        if title is not None:
            session.title = title
        if messages is not None:
            session.messages = messages
        if extra_data is not None:
            session.extra_data = extra_data

        session.updated_at = datetime.now()
        self._session.commit()
        self._session.refresh(session)
        return session

    def delete_session(self, session_id: str) -> bool:
        """删除会话"""
        session = self.get_session(session_id)
        if not session:
            return False

        session.deleted_at = datetime.now()
        self._session.commit()
        return True


class MessageRepository:
    """消息仓储"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        msg_metadata: dict[str, Any] | None = None,
    ) -> MessageModel:
        """添加消息"""
        message = MessageModel(
            session_id=session_id,
            role=role,
            content=content,
            msg_metadata=msg_metadata or {},
        )
        self._session.add(message)
        self._session.commit()
        self._session.refresh(message)
        return message

    def get_messages(self, session_id: str) -> list[MessageModel]:
        """获取会话消息"""
        stmt = select(MessageModel).where(
            MessageModel.session_id == session_id
        ).order_by(MessageModel.created_at)
        return list(self._session.scalars(stmt))

    def delete_messages(self, session_id: str) -> int:
        """删除会话消息"""
        stmt = select(MessageModel).where(MessageModel.session_id == session_id)
        messages = list(self._session.scalars(stmt))
        count = len(messages)
        for msg in messages:
            self._session.delete(msg)
        self._session.commit()
        return count


__all__ = ["SessionRepository", "MessageRepository"]
