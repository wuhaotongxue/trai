#!/usr/bin/env python
# 文件名: session.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 会话管理用例 - 使用领域实体进行业务逻辑处理

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any

from application.usecases.base import UseCase

from infrastructure.ai.core.openai_client import OpenAIClient
from infrastructure.database.database import get_session
from infrastructure.repositories.session_repository import (
    MessageRepository,
    SessionRepository,
)


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
        with get_session() as db_session:
            repo = SessionRepository(db_session)

            session_id = str(uuid.uuid4())
            session_entity = repo.create_session(
                session_id=session_id,
                user_id=input_data.user_id,
                title=input_data.title or "新对话",
                model=input_data.model,
                metadata=input_data.metadata,
            )

            return SessionOutput(
                session_id=session_entity.session_id,
                title=session_entity.metadata.get("title"),
                model=session_entity.model,
                messages=session_entity.messages,
                created_at=session_entity.created_at.isoformat(),
                updated_at=session_entity.updated_at.isoformat(),
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
        with get_session() as db_session:
            session_repo = SessionRepository(db_session)
            message_repo = MessageRepository(db_session)

            chat_session = session_repo.get_session(input_data.session_id)
            if not chat_session:
                raise ValueError(f"会话不存在: {input_data.session_id}")

            # 保存用户消息(使用领域实体)
            user_msg_entity = message_repo.add_message(
                session_id=input_data.session_id,
                role=input_data.role,
                content=input_data.content,
            )

            # 获取历史消息(返回领域实体列表)
            messages_entities = message_repo.get_messages(input_data.session_id)

            # 转换为 AI API 格式
            messages_dict = [msg.to_dict() for msg in messages_entities]

            # 调用 AI
            ai_response = await self._ai_client.chat(messages=messages_dict)

            # 保存 AI 响应
            assistant_msg_entity = message_repo.add_message(
                session_id=input_data.session_id,
                role="assistant",
                content=ai_response["content"],
            )

            # 更新会话的消息历史
            updated_messages = messages_dict + [assistant_msg_entity.to_dict()]
            session_repo.update_session(
                session_id=input_data.session_id,
                messages=updated_messages,
            )

            return SendMessageOutput(
                session_id=input_data.session_id,
                user_message=user_msg_entity.to_dict(),
                assistant_message=assistant_msg_entity.to_dict(),
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
        with get_session() as db_session:
            repo = SessionRepository(db_session)

            # 获取领域实体列表
            session_entities = repo.list_sessions(
                user_id=input_data.user_id,
                limit=input_data.limit,
                offset=input_data.offset,
            )

            return ListSessionsOutput(
                sessions=[
                    SessionOutput(
                        session_id=s.session_id,
                        title=s.metadata.get("title"),
                        model=s.model,
                        messages=s.messages,
                        created_at=s.created_at.isoformat(),
                        updated_at=s.updated_at.isoformat(),
                    )
                    for s in session_entities
                ],
                total=len(session_entities),
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
        with get_session() as db_session:
            repo = SessionRepository(db_session)
            message_repo = MessageRepository(db_session)

            # 获取领域实体
            session_entity = repo.get_session(input_data.session_id)
            if not session_entity:
                raise ValueError(f"会话不存在: {input_data.session_id}")

            # 获取消息领域实体列表
            message_entities = message_repo.get_messages(input_data.session_id)

            # 转换为字典格式
            messages_dict = [msg.to_dict() for msg in message_entities]

            return GetSessionOutput(
                session_id=session_entity.session_id,
                title=session_entity.metadata.get("title"),
                model=session_entity.model,
                messages=messages_dict,
                created_at=session_entity.created_at.isoformat(),
                updated_at=session_entity.updated_at.isoformat(),
            )


@dataclass
class DeleteSessionInput:
    """删除会话输入"""

    session_id: str


class DeleteSessionUseCase(UseCase[DeleteSessionInput, bool]):
    """删除会话用例"""

    async def execute(self, input_data: DeleteSessionInput) -> bool:
        """执行删除会话"""
        with get_session() as db_session:
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
