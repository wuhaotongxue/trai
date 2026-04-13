#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: session.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 会话管理用例

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any

from application.usecases.base import UseCase
from domain.entities.chat_session import ChatSession, SessionStatus
from infrastructure.ai.openai_client import OpenAIClient
from infrastructure.repositories.session_repository import (
    MessageRepository,
    SessionRepository,
)
from infrastructure.database.database import get_session


@dataclass
class CreateSessionInput:
    """创建会话输入"""
    user_id: str | None = None
    title: str | None = None
    model: str = "gpt-4o"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class SessionOutput:
    """会话输出"""
    session_id: str
    title: str | None
    model: str
    messages: list[dict[str, Any]]
    created_at: str
    updated_at: str


class CreateSessionUseCase(UseCase[CreateSessionInput, SessionOutput]):
    """创建会话用例"""

    def __init__(self) -> None:
        pass

    async def execute(self, input_data: CreateSessionInput) -> SessionOutput:
        """执行创建会话"""
        db_session = get_session()
        repo = SessionRepository(db_session)

        session_id = str(uuid.uuid4())
        session = repo.create_session(
            session_id=session_id,
            user_id=input_data.user_id,
            title=input_data.title or "新对话",
            model=input_data.model,
            metadata=input_data.metadata,
        )

        return SessionOutput(
            session_id=session.t_session_id,
            title=session.t_title,
            model=session.t_model,
            messages=session.t_messages,
            created_at=session.t_created_at.isoformat(),
            updated_at=session.t_updated_at.isoformat(),
        )


@dataclass
class SendMessageInput:
    """发送消息输入"""
    session_id: str
    content: str
    role: str = "user"


@dataclass
class SendMessageOutput:
    """发送消息输出"""
    session_id: str
    user_message: dict[str, Any]
    assistant_message: dict[str, Any]


class SendMessageUseCase(UseCase[SendMessageInput, SendMessageOutput]):
    """发送消息用例"""

    def __init__(self) -> None:
        self._ai_client = OpenAIClient()

    async def execute(self, input_data: SendMessageInput) -> SendMessageOutput:
        """执行发送消息"""
        db_session = get_session()
        session_repo = SessionRepository(db_session)
        message_repo = MessageRepository(db_session)

        chat_session = session_repo.get_session(input_data.session_id)
        if not chat_session:
            raise ValueError(f"会话不存在: {input_data.session_id}")

        message_repo.add_message(
            session_id=input_data.session_id,
            role=input_data.role,
            content=input_data.content,
        )

        messages = message_repo.get_messages(input_data.session_id)
        messages_dict = [{"role": m.t_role, "content": m.t_content} for m in messages]

        ai_response = await self._ai_client.chat(messages=messages_dict)

        assistant_msg = message_repo.add_message(
            session_id=input_data.session_id,
            role="assistant",
            content=ai_response["content"],
        )

        session_repo.update_session(
            session_id=input_data.session_id,
            messages=messages_dict + [{"role": "assistant", "content": ai_response["content"]}],
        )

        return SendMessageOutput(
            session_id=input_data.session_id,
            user_message={"role": input_data.role, "content": input_data.content},
            assistant_message={"role": "assistant", "content": ai_response["content"]},
        )


@dataclass
class ListSessionsInput:
    """获取会话列表输入"""
    user_id: str | None = None
    limit: int = 50
    offset: int = 0


@dataclass
class ListSessionsOutput:
    """获取会话列表输出"""
    sessions: list[SessionOutput]
    total: int


class ListSessionsUseCase(UseCase[ListSessionsInput, ListSessionsOutput]):
    """获取会话列表用例"""

    async def execute(self, input_data: ListSessionsInput) -> ListSessionsOutput:
        """执行获取会话列表"""
        db_session = get_session()
        repo = SessionRepository(db_session)

        sessions = repo.list_sessions(
            user_id=input_data.user_id,
            limit=input_data.limit,
            offset=input_data.offset,
        )

        return ListSessionsOutput(
            sessions=[
                SessionOutput(
                    session_id=s.t_session_id,
                    title=s.t_title,
                    model=s.t_model,
                    messages=s.t_messages,
                    created_at=s.t_created_at.isoformat(),
                    updated_at=s.t_updated_at.isoformat(),
                )
                for s in sessions
            ],
            total=len(sessions),
        )


@dataclass
class GetSessionInput:
    """获取会话输入"""
    session_id: str


@dataclass
class GetSessionOutput:
    """获取会话输出"""
    session_id: str
    title: str | None
    model: str
    messages: list[dict[str, Any]]
    created_at: str
    updated_at: str


class GetSessionUseCase(UseCase[GetSessionInput, GetSessionOutput]):
    """获取会话用例"""

    async def execute(self, input_data: GetSessionInput) -> GetSessionOutput:
        """执行获取会话"""
        db_session = get_session()
        repo = SessionRepository(db_session)
        message_repo = MessageRepository(db_session)

        session = repo.get_session(input_data.session_id)
        if not session:
            raise ValueError(f"会话不存在: {input_data.session_id}")

        messages = message_repo.get_messages(input_data.session_id)
        messages_dict = [{"role": m.t_role, "content": m.t_content} for m in messages]

        return GetSessionOutput(
            session_id=session.t_session_id,
            title=session.t_title,
            model=session.t_model,
            messages=messages_dict,
            created_at=session.t_created_at.isoformat(),
            updated_at=session.t_updated_at.isoformat(),
        )


@dataclass
class DeleteSessionInput:
    """删除会话输入"""
    session_id: str


class DeleteSessionUseCase(UseCase[DeleteSessionInput, bool]):
    """删除会话用例"""

    async def execute(self, input_data: DeleteSessionInput) -> bool:
        """执行删除会话"""
        db_session = get_session()
        repo = SessionRepository(db_session)
        message_repo = MessageRepository(db_session)

        message_repo.delete_messages(input_data.session_id)
        return repo.delete_session(input_data.session_id)


__all__ = [
    "CreateSessionUseCase",
    "CreateSessionInput",
    "SessionOutput",
    "SendMessageUseCase",
    "SendMessageInput",
    "SendMessageOutput",
    "ListSessionsUseCase",
    "ListSessionsInput",
    "ListSessionsOutput",
    "GetSessionUseCase",
    "GetSessionInput",
    "GetSessionOutput",
    "DeleteSessionUseCase",
    "DeleteSessionInput",
]
