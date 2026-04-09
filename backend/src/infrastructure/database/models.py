#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: models.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 数据模型

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class ChatSessionModel(Base):
    """对话会话模型"""
    __tablename__ = "chat_sessions"
    __comment__ = "AI 对话会话表，存储会话元数据和消息历史"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    """自增主键 ID"""
    session_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """会话唯一标识 UUID"""
    user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    """用户 ID，用于多用户场景"""
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    """会话标题，可由用户自定义"""
    model: Mapped[str] = mapped_column(String(64), nullable=False)
    """使用的 AI 模型名称"""
    messages: Mapped[dict[str, Any]] = mapped_column(JSON, default=list)
    """消息历史 JSON 数组"""
    extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    """扩展数据字段，用于存储自定义元数据"""
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    """软删除时间，为空表示未删除"""


class MessageModel(Base):
    """消息模型"""
    __tablename__ = "messages"
    __comment__ = "AI 对话消息表，存储单条消息内容"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    """自增主键 ID"""
    session_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """关联的会话 ID"""
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    """消息角色：system/user/assistant"""
    content: Mapped[str] = mapped_column(Text, nullable=False)
    """消息内容"""
    msg_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    """消息扩展元数据"""
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""


__all__ = ["Base", "ChatSessionModel", "MessageModel", "UserModel"]
