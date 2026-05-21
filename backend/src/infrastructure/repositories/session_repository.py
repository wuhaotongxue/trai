#!/usr/bin/env python
# 文件名: session_repository.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 会话仓储 - 实现领域仓储接口,负责实体与数据库转换 (优化版: 添加缓存支持)

from __future__ import annotations

from datetime import datetime
from typing import Any

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from domain.entities.chat_session import ChatSession, SessionStatus
from domain.entities.message import Message, MessageRole
from infrastructure.database.models import ChatSessionModel, MessageModel
from infrastructure.services.query_cache_service import query_cache


class SessionRepository:
    """会话仓储 - 实现 ISessionRepository 接口 (性能优化版)"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def _to_domain(self, model: ChatSessionModel) -> ChatSession:
        """将数据库模型转换为领域实体

        Args:
            model: 数据库模型实例

        Returns:
            ChatSession: 领域实体
        """
        return ChatSession(
            session_id=model.t_session_id,
            title=model.t_title,
            user_id=model.t_user_id,
            model=model.t_model,
            messages=model.t_messages or [],
            status=SessionStatus.ACTIVE if model.t_deleted_at is None else SessionStatus.COMPLETED,
            created_at=model.t_created_at,
            updated_at=model.t_updated_at,
            metadata={
                "title": model.t_title,
                "extra_data": model.t_extra_data,
                "created_by": model.t_created_by,
                "updated_by": model.t_updated_by,
            },
        )

    def create_session(
        self,
        session_id: str,
        user_id: str | None,
        title: str | None,
        model: str,
        extra_data: dict[str, Any] | None = None,
        username: str | None = None,
        client_ip: str | None = None,
        created_by: str | None = None,
        created_by_name: str | None = None,
    ) -> ChatSession:
        """创建会话

        Args:
            session_id: 会话唯一标识
            user_id: 用户 ID
            title: 会话标题
            model: AI 模型名称
            extra_data: 扩展数据
            username: 用户姓名/昵称
            client_ip: 客户端 IP 地址
            created_by: 创建人 user_id
            created_by_name: 创建人姓名

        Returns:
            ChatSession: 创建的会话领域实体
        """
        db_session = ChatSessionModel(
            t_session_id=session_id,
            t_user_id=user_id,
            t_username=username,
            t_title=title,
            t_model=model,
            t_messages=[],
            t_extra_data=extra_data or {},
            t_client_ip=client_ip,
            t_created_by=created_by,
            t_created_by_name=created_by_name,
        )
        self._session.add(db_session)
        self._session.commit()
        self._session.refresh(db_session)
        return self._to_domain(db_session)

    def get_session(self, session_id: str) -> ChatSession | None:
        """获取会话 (带缓存优化)

        Args:
            session_id: 会话唯一标识

        Returns:
            ChatSession | None: 会话领域实体
        """
        # 尝试从缓存获取
        cache_key = f"session:{session_id}"
        cached = query_cache.get(cache_key)
        if cached is not None:
            logger.debug(f"Cache hit for session {session_id}")
            return cached

        # 缓存未命中, 查询数据库
        stmt = select(ChatSessionModel).where(
            ChatSessionModel.t_session_id == session_id,
            ChatSessionModel.t_deleted_at.is_(None),
        )
        model = self._session.scalar(stmt)
        result = self._to_domain(model) if model else None

        # 存入缓存(60秒TTL)
        if result is not None:
            query_cache.set(cache_key, result, ttl=60)

        return result

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
            list[ChatSession]: 会话领域实体列表
        """
        stmt = select(ChatSessionModel).where(ChatSessionModel.t_deleted_at.is_(None))
        if user_id:
            stmt = stmt.where(ChatSessionModel.t_user_id == user_id)
        stmt = stmt.order_by(ChatSessionModel.t_updated_at.desc()).limit(limit).offset(offset)
        models = list(self._session.scalars(stmt))
        return [self._to_domain(m) for m in models]

    def update_session(
        self,
        session_id: str,
        title: str | None = None,
        messages: list[dict[str, Any]] | None = None,
        extra_data: dict[str, Any] | None = None,
    ) -> ChatSession | None:
        """更新会话 (带缓存失效)

        Args:
            session_id: 会话唯一标识
            title: 会话标题(可选)
            messages: 消息列表(可选)
            extra_data: 扩展数据(可选)

        Returns:
            ChatSession | None: 更新后的会话领域实体
        """
        model = self._session.scalar(
            select(ChatSessionModel).where(
                ChatSessionModel.t_session_id == session_id,
                ChatSessionModel.t_deleted_at.is_(None),
            )
        )
        if not model:
            return None

        if title is not None:
            model.t_title = title
            # 同步更新 metadata，保持与 t_title 一致（会话列表读 metadata.title）
            current_metadata = dict(model.t_metadata) if model.t_metadata else {}
            current_metadata["title"] = title
            model.t_metadata = current_metadata
        if messages is not None:
            model.t_messages = messages
        if extra_data is not None:
            model.t_extra_data = extra_data

        model.t_updated_at = datetime.now()
        self._session.commit()
        self._session.refresh(model)

        # 更新缓存
        result = self._to_domain(model)
        query_cache.set(f"session:{session_id}", result, ttl=60)

        return result

    def delete_session(
        self,
        session_id: str,
        deleted_by: str | None = None,
        deleted_by_name: str | None = None,
        deleted_ip: str | None = None,
    ) -> bool:
        """删除会话(软删除)(带缓存失效)

        Args:
            session_id: 会话唯一标识
            deleted_by: 删除操作人 user_id
            deleted_by_name: 删除人姓名
            deleted_ip: 删除时的客户端 IP 地址

        Returns:
            bool: 是否删除成功
        """
        model = self._session.scalar(
            select(ChatSessionModel).where(
                ChatSessionModel.t_session_id == session_id,
                ChatSessionModel.t_deleted_at.is_(None),
            )
        )
        if not model:
            return False

        model.t_deleted_at = datetime.now()
        model.t_deleted_by = deleted_by
        model.t_deleted_by_name = deleted_by_name
        model.t_deleted_ip = deleted_ip
        self._session.commit()

        # 删除缓存
        query_cache.delete(f"session:{session_id}")

        return True


class MessageRepository:
    """消息仓储 - 实现 IMessageRepository 接口"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def _to_domain(self, model: MessageModel) -> Message:
        """将数据库模型转换为领域实体

        Args:
            model: 数据库模型实例

        Returns:
            Message: 消息领域实体
        """
        return Message(
            role=MessageRole(model.t_role),
            content=model.t_content,
            created_at=model.t_created_at,
            metadata={
                "message_id": model.t_id,
                "session_id": model.t_session_id,
                "image_keys": model.t_image_keys or [],
                "client_ip": model.t_client_ip,
                **(model.t_msg_metadata or {}),
            },
        )

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        msg_metadata: dict[str, Any] | None = None,
        image_keys: list[str] | None = None,
        created_by: str | None = None,
        client_ip: str | None = None,
    ) -> Message:
        """添加消息

        Args:
            session_id: 会话 ID
            role: 消息角色(system/user/assistant)
            content: 消息内容
            msg_metadata: 消息元数据(可选)
            image_keys: 关联的图片 S3 对象键列表(可选)
            created_by: 创建人 user_id(可选)
            client_ip: 客户端 IP 地址(可选)

        Returns:
            Message: 创建的消息领域实体
        """
        message = MessageModel(
            t_session_id=session_id,
            t_role=role,
            t_content=content,
            t_image_keys=image_keys or [],
            t_msg_metadata=msg_metadata or {},
            t_created_by=created_by,
            t_client_ip=client_ip,
        )
        self._session.add(message)
        self._session.commit()
        self._session.refresh(message)
        return self._to_domain(message)

    def get_messages(self, session_id: str) -> list[Message]:
        """获取会话消息

        Args:
            session_id: 会话 ID

        Returns:
            list[Message]: 消息领域实体列表
        """
        stmt = select(MessageModel).where(MessageModel.t_session_id == session_id).order_by(MessageModel.t_created_at)
        models = list(self._session.scalars(stmt))
        return [self._to_domain(m) for m in models]

    def delete_messages(self, session_id: str) -> int:
        """删除会话消息

        Args:
            session_id: 会话 ID

        Returns:
            int: 删除的消息数量
        """
        stmt = select(MessageModel).where(MessageModel.t_session_id == session_id)
        models = list(self._session.scalars(stmt))
        count = len(models)
        for msg in models:
            self._session.delete(msg)
        self._session.commit()
        return count


__all__ = ["SessionRepository", "MessageRepository"]
