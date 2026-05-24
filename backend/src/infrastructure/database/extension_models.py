#!/usr/bin/env python
# 文件名: extension_models.py
# 作者: wuhao
# 日期: 2026_05_24_13:01:17
# 描述: 多智能体与知识库及追踪模型

import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class AgentModel(Base):
    """
    用户自建智能体数据库模型.

    参数:
        无

    返回:
        None: 无返回值

    异常:
        Exception: 捕获并记录所有执行异常
    """

    __tablename__ = "agents"
    __table_args__ = {"comment": "用户自建智能体表"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="主键 ID")
    name: Mapped[str] = mapped_column(String(255), nullable=False, comment="智能体名称")
    creator_id: Mapped[str] = mapped_column(String(255), nullable=False, comment="创建者 ID (企微 UserID)")
    system_prompt: Mapped[str] = mapped_column(Text, nullable=True, comment="系统提示词")
    tools: Mapped[dict] = mapped_column(JSON, nullable=False, default=list, comment="挂载的工具列表")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(0), server_default=func.current_timestamp(0), nullable=False, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(0),
        server_default=func.current_timestamp(0),
        onupdate=func.current_timestamp(0),
        nullable=False,
        comment="更新时间",
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="软删除标记")


class KnowledgeBaseModel(Base):
    """
    用户自建知识库数据库模型.

    参数:
        无

    返回:
        None: 无返回值

    异常:
        Exception: 捕获并记录所有执行异常
    """

    __tablename__ = "knowledge_bases"
    __table_args__ = {"comment": "知识库表"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="主键 ID")
    name: Mapped[str] = mapped_column(String(255), nullable=False, comment="知识库名称")
    description: Mapped[str] = mapped_column(Text, nullable=True, comment="知识库描述")
    creator_id: Mapped[str] = mapped_column(String(255), nullable=False, comment="创建者 ID")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(0), server_default=func.current_timestamp(0), nullable=False, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(0),
        server_default=func.current_timestamp(0),
        onupdate=func.current_timestamp(0),
        nullable=False,
        comment="更新时间",
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="软删除标记")


class AITraceLogModel(Base):
    """
    AI 调用全链路追踪日志模型.

    参数:
        无

    返回:
        None: 无返回值

    异常:
        Exception: 捕获并记录所有执行异常
    """

    __tablename__ = "ai_trace_logs"
    __table_args__ = {"comment": "AI调用追踪日志表"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="主键 ID")
    session_id: Mapped[str] = mapped_column(String(255), nullable=False, comment="关联会话 ID")
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, comment="调用者 ID (用于追溯企业微信员工)")
    prompt_tokens: Mapped[int] = mapped_column(nullable=False, default=0, comment="提示词消耗 Tokens")
    completion_tokens: Mapped[int] = mapped_column(nullable=False, default=0, comment="生成消耗 Tokens")
    duration_ms: Mapped[int] = mapped_column(nullable=False, default=0, comment="耗时毫秒")
    tools_used: Mapped[dict] = mapped_column(JSON, nullable=False, default=list, comment="调用的工具列表")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(0), server_default=func.current_timestamp(0), nullable=False, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(0),
        server_default=func.current_timestamp(0),
        onupdate=func.current_timestamp(0),
        nullable=False,
        comment="更新时间",
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="软删除标记")


class KnowledgeBaseDocumentModel(Base):
    """
    知识库关联文档模型.

    参数:
        无

    返回:
        None: 无返回值

    异常:
        Exception: 捕获并记录所有执行异常
    """

    __tablename__ = "kb_documents"
    __table_args__ = {"comment": "知识库上传文档记录表"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="主键 ID")
    kb_id: Mapped[str] = mapped_column(String(255), nullable=False, comment="所属知识库 ID")
    creator_id: Mapped[str] = mapped_column(String(255), nullable=False, comment="创建者 ID (用于追溯)")
    file_name: Mapped[str] = mapped_column(String(255), nullable=False, comment="原始文件名")
    file_type: Mapped[str] = mapped_column(String(50), nullable=False, comment="文件类型如 PDF, Word")
    s3_object_key: Mapped[str] = mapped_column(String(500), nullable=False, comment="S3存储对象键")
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending", comment="解析状态: pending, parsing, completed, failed"
    )
    chunk_count: Mapped[int] = mapped_column(nullable=False, default=0, comment="切片总数")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(0), server_default=func.current_timestamp(0), nullable=False, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(0),
        server_default=func.current_timestamp(0),
        onupdate=func.current_timestamp(0),
        nullable=False,
        comment="更新时间",
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="软删除标记")
