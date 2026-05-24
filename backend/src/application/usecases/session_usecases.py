#!/usr/bin/env python
# 文件名: session_usecases.py
# 作者: wuhao
# 日期: 2026_05_04_16:00:00
# 描述: 会话管理 UseCase 完整版 (Skills合规: 业务逻辑封装在Application层)

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any

from loguru import logger

from application.usecases.base import UseCase
from infrastructure.ai.core.openai_client import OpenAIClient
from infrastructure.database.database import get_session
from infrastructure.repositories.session_repository import (
    MessageRepository,
    SessionRepository,
)
from infrastructure.services.chat_history_service import get_chat_history_service
from infrastructure.services.query_cache_service import query_cache


@dataclass
class CreateSessionInput:
    """创建会话输入 DTO"""

    user_id: str | None = None
    title: str | None = None
    model: str = "gpt-4o"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class SessionOutput:
    """会话输出 DTO"""

    session_id: str
    title: str | None
    model: str
    message_count: int = 0
    created_at: str = ""
    updated_at: str = ""
    messages: list[dict[str, Any]] = field(default_factory=list)


class CreateSessionUseCase(UseCase[CreateSessionInput, SessionOutput]):
    """
    创建会话 UseCase (Skills 规范: 业务逻辑在Application层)

    职责:
    - 输入验证
    - 会话创建
    - 默认值设置
    """

    async def execute(self, input_data: CreateSessionInput) -> SessionOutput:
        """执行创建会话业务逻辑"""

        # 输入验证
        if input_data.model and len(input_data.model) > 64:
            raise ValueError("Model name too long (max 64 characters)")

        with get_session() as db_session:
            repo = SessionRepository(db_session)

            session_id = str(uuid.uuid4())
            title = input_data.title or "新对话"

            session_entity = repo.create_session(
                session_id=session_id,
                user_id=input_data.user_id,
                title=title,
                model=input_data.model,
                metadata=input_data.metadata,
            )

            logger.info(f"Session created | session_id={session_id} | user={input_data.user_id}")

            return SessionOutput(
                session_id=session_entity.session_id,
                title=session_entity.metadata.get("title"),
                model=session_entity.model,
                message_count=0,
                created_at=session_entity.created_at.isoformat() if session_entity.created_at else "",
                updated_at=session_entity.updated_at.isoformat() if session_entity.updated_at else "",
            )


@dataclass
class ListSessionsInput:
    """列表查询输入 DTO"""

    user_id: str
    limit: int = 50
    offset: int = 0


class ListSessionsUseCase(UseCase[ListSessionsInput, list[SessionOutput]]):
    """
    查询会话列表 UseCase

    职责:
    - 权限验证(只能查看自己的)
    - 分页处理
    - 缓存优化
    """

    async def execute(self, input_data: ListSessionsInput) -> list[SessionOutput]:
        """执行列表查询业务逻辑"""

        with get_session() as db_session:
            session_repo = SessionRepository(db_session)
            message_repo = MessageRepository(db_session)

            # 查询领域实体
            session_entities = session_repo.list_sessions(
                user_id=input_data.user_id,
                limit=min(input_data.limit, 100),  # 最大100条
                offset=max(input_data.offset, 0),
            )

            # 转换为输出DTO
            results = []
            for s in session_entities:
                messages = message_repo.get_messages(s.session_id)

                results.append(
                    SessionOutput(
                        session_id=s.session_id,
                        title=s.metadata.get("title"),
                        model=s.model,
                        message_count=len(messages),
                        created_at=s.created_at.isoformat() if s.created_at else "",
                        updated_at=s.updated_at.isoformat() if s.updated_at else "",
                    )
                )

            logger.info(f"Sessions listed | user={input_data.user_id} | count={len(results)}")

            return results


@dataclass
class GetSessionDetailInput:
    """获取详情输入 DTO"""

    session_id: str
    user_id: str
    role: str = "normal"


class GetSessionDetailUseCase(UseCase[GetSessionDetailInput, SessionOutput]):
    """
    获取会话详情 UseCase

    职责:
    - 会话存在性检查
    - 权限验证(管理员可查看所有)
    - 加载完整消息历史
    """

    async def execute(self, input_data: GetSessionDetailInput) -> SessionOutput:
        """执行获取详情业务逻辑"""

        with get_session() as db_session:
            history_service = get_chat_history_service(db_session)

            chat_session = history_service.load_session_history(input_data.session_id)

            if not chat_session:
                raise ValueError(f"Session not found: {input_data.session_id}")

            # 权限校验
            if input_data.role != "admin" and chat_session.metadata.get("user_id") != input_data.user_id:
                raise PermissionError("No permission to access this session")

            logger.info(f"Session detail retrieved | session_id={input_data.session_id} | user={input_data.user_id}")

            return SessionOutput(
                session_id=chat_session.session_id,
                title=chat_session.metadata.get("title"),
                model=chat_session.model,
                message_count=len(chat_session.messages),
                created_at=chat_session.created_at.isoformat() if chat_session.created_at else "",
                updated_at=chat_session.updated_at.isoformat() if chat_session.updated_at else "",
                messages=chat_session.messages,
            )


@dataclass
class SendMessageInput:
    """发送消息输入 DTO"""

    session_id: str
    content: str
    user_id: str
    role: str = "normal"


@dataclass
class SendMessageOutput:
    """发送消息输出 DTO"""

    session_id: str
    user_message: dict[str, Any]
    assistant_message: dict[str, Any]


class SendMessageUseCase(UseCase[SendMessageInput, SendMessageOutput]):
    """
    发送消息 UseCase (核心业务逻辑)

    职责:
    - 会话存在性和权限验证
    - 上下文管理和压缩
    - AI服务调用
    - 对话历史持久化
    - 自动标题生成(首条消息时)
    """

    def __init__(self) -> None:
        self._ai_client = OpenAIClient()

    async def execute(self, input_data: SendMessageInput) -> SendMessageOutput:
        """执行发送消息业务逻辑(完整版)"""

        from core.context_manager import ContextManager, get_context_manager

        with get_session() as db_session:
            history_service = get_chat_history_service(db_session)

            # 加载会话
            chat_session = history_service.load_session_history(input_data.session_id)
            if not chat_session:
                raise ValueError(f"Session not found: {input_data.session_id}")

            # 权限验证
            if input_data.role != "admin" and chat_session.metadata.get("user_id") != input_data.user_id:
                raise PermissionError("No permission to access this session")

            # 记录当前消息数量(用于判断是否首条消息)
            message_count_before = chat_session.message_count

            # 上下文管理
            context_manager: ContextManager = get_context_manager()
            messages_dict = chat_session.to_ai_format()
            managed_messages, context_stats = context_manager.check_and_manage(messages_dict, input_data.session_id)

            # 调用AI服务
            try:
                ai_response = await self._ai_client.chat(
                    messages=managed_messages,
                    model=chat_session.model or "gpt-4o",
                )

                # 保存对话轮次(原子操作)
                user_msg_entity, assistant_msg_entity = history_service.save_conversation_turn(
                    session_id=input_data.session_id,
                    user_content=input_data.content,
                    assistant_content=ai_response["content"],
                )

                # 首条消息时自动生成标题
                if message_count_before == 0:
                    title = input_data.content[:30]
                    if len(input_data.content) > 30:
                        title += "..."
                    history_service.update_session_title(session_id=input_data.session_id, title=title)

                logger.info(
                    f"Message sent | session_id={input_data.session_id} | "
                    f"user_len={len(input_data.content)} | ai_len={len(ai_response['content'])}"
                )

                return SendMessageOutput(
                    session_id=input_data.session_id,
                    user_message=user_msg_entity.to_dict(),
                    assistant_message=assistant_msg_entity.to_dict(),
                )

            except Exception as e:
                logger.error(f"AI service call failed | error={e}")
                raise RuntimeError(f"AI service error: {str(e)}")


@dataclass
class RenameSessionInput:
    """重命名输入 DTO"""

    session_id: str
    new_title: str
    user_id: str
    role: str = "normal"


class RenameSessionUseCase(UseCase[RenameSessionInput, SessionOutput]):
    """
    重命名会话 UseCase

    职责:
    - 标题长度验证
    - 权限检查
    - 更新标题
    """

    async def execute(self, input_data: RenameSessionInput) -> SessionOutput:
        """执行重命名业务逻辑"""

        # 输入验证
        if not input_data.new_title or len(input_data.new_title.strip()) == 0:
            raise ValueError("Title cannot be empty")

        if len(input_data.new_title) > 255:
            raise ValueError("Title too long (max 255 characters)")

        with get_session() as db_session:
            history_service = get_chat_history_service(db_session)

            chat_session = history_service.load_session_history(input_data.session_id)
            if not chat_session:
                raise ValueError(f"Session not found: {input_data.session_id}")

            # 权限验证
            if input_data.role != "admin" and chat_session.metadata.get("user_id") != input_data.user_id:
                raise PermissionError("No permission to modify this session")

            # 执行更新
            success = history_service.update_session_title(
                session_id=input_data.session_id, title=input_data.new_title.strip()
            )

            if not success:
                raise RuntimeError("Failed to update session title")

            # 返回更新后的数据
            updated = history_service.load_session_history(input_data.session_id)

            logger.info(f"Session renamed | session_id={input_data.session_id}")

            return SessionOutput(
                session_id=updated.session_id,
                title=updated.metadata.get("title"),
                model=updated.model,
                message_count=len(updated.messages),
                created_at=updated.created_at.isoformat() if updated.created_at else "",
                updated_at=updated.updated_at.isoformat() if updated.updated_at else "",
            )


@dataclass
class DeleteSessionInput:
    """删除会话输入 DTO"""

    session_id: str
    user_id: str
    role: str = "normal"


class DeleteSessionUseCase(UseCase[DeleteSessionInput, bool]):
    """
    删除会话 UseCase

    职责:
    - 存在性检查
    - 权限验证
    - 软删除执行
    - 关联消息清理
    - 缓存失效
    """

    async def execute(self, input_data: DeleteSessionInput) -> bool:
        """执行删除业务逻辑"""

        with get_session() as db_session:
            session_repo = SessionRepository(db_session)
            message_repo = MessageRepository(db_session)

            chat_session = session_repo.get_session(input_data.session_id)
            if not chat_session:
                raise ValueError(f"Session not found: {input_data.session_id}")

            # 权限验证
            if input_data.role != "admin" and chat_session.metadata.get("user_id") != input_data.user_id:
                raise PermissionError("No permission to delete this session")

            # 先删除关联消息
            message_repo.delete_messages(input_data.session_id)

            # 再软删除会话
            success = session_repo.delete_session(input_data.session_id)

            if success:
                # 清除缓存
                query_cache.delete(f"session:{input_data.session_id}")
                logger.info(f"Session deleted | session_id={input_data.session_id}")

            return success


__all__ = [
    "CreateSessionUseCase",
    "ListSessionsUseCase",
    "GetSessionDetailUseCase",
    "SendMessageUseCase",
    "RenameSessionUseCase",
    "DeleteSessionUseCase",
    # DTOs
    "CreateSessionInput",
    "ListSessionsInput",
    "GetSessionDetailInput",
    "SendMessageInput",
    "RenameSessionInput",
    "DeleteSessionInput",
    "SessionOutput",
    "SendMessageOutput",
]
