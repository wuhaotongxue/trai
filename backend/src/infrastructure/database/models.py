#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: models.py
# 作者: wuhao
# 日期: 2026_04_10_09:21:00
# 描述: 数据模型

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base
from infrastructure.database.user_model import UserModel


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


class QuotaPlanModel(Base):
    """配额套餐模型"""
    __tablename__ = "quota_plans"
    __comment__ = "配额套餐表，定义各角色的月度配额上限"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    """自增主键 ID"""
    plan_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    """套餐名称"""
    user_role: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    """用户角色：admin/vip/normal/guest"""
    image_generation_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """图片生成配额（0 表示无限制）"""
    audio_synthesis_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音合成配额（0 表示无限制）"""
    transcription_minutes_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音转录配额（0 表示无限制）"""
    meeting_summary_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """会议摘要配额（0 表示无限制）"""
    ai_translation_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 翻译配额（0 表示无限制）"""
    ai_summarization_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 摘要配额（0 表示无限制）"""
    agent_tool_call_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """Agent 工具调用配额（0 表示无限制）"""
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """更新时间"""


class UserQuotaUsageModel(Base):
    """用户配额使用模型"""
    __tablename__ = "user_quota_usage"
    __comment__ = "用户配额使用表，按自然月记录各类型配额消耗"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    """自增主键 ID"""
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    billing_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    """账单月份 YYYY-MM"""
    image_generation_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """图片生成已用次数"""
    audio_synthesis_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音合成已用次数"""
    transcription_minutes_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音转录已用分钟数"""
    meeting_summary_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """会议摘要已用次数"""
    ai_translation_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 翻译已用次数"""
    ai_summarization_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 摘要已用次数"""
    agent_tool_call_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """Agent 工具调用已用次数"""
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """更新时间"""

    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class QuotaTransactionLogModel(Base):
    """配额变动流水模型"""
    __tablename__ = "quota_transaction_log"
    __comment__ = "配额变动流水表，记录每次配额增减及原因"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    """自增主键 ID"""
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    billing_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    """账单月份 YYYY-MM"""
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    """交易类型：deduct/reset/grant/purchase"""
    quota_type: Mapped[str] = mapped_column(String(50), nullable=False)
    """配额类型"""
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    """变动数量（正数为增加，负数为扣减）"""
    balance_before: Mapped[int] = mapped_column(Integer, nullable=False)
    """变动前余额"""
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    """变动后余额"""
    tool_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    """关联工具 ID"""
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """关联会话 ID"""
    trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """链路追踪 ID"""
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""


class ImageGenerationModel(Base):
    """图片生成模型"""
    __tablename__ = "image_generations"
    __comment__ = "AI 图片生成任务表，存储图片生成请求和结果"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    """自增主键 ID"""
    task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """任务唯一标识 UUID"""
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    """图片生成提示词"""
    negative_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    """反向提示词"""
    style: Mapped[str] = mapped_column(String(32), default="auto", nullable=False)
    """图片风格"""
    size: Mapped[str] = mapped_column(String(16), default="1024x1024", nullable=False)
    """图片尺寸"""
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    """任务状态：pending/processing/completed/failed"""
    result_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    """生成结果 URL"""
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    """错误信息"""
    model: Mapped[str] = mapped_column(String(64), nullable=True)
    """使用的模型"""
    width: Mapped[int] = mapped_column(Integer, default=1024, nullable=False)
    """图片宽度"""
    height: Mapped[int] = mapped_column(Integer, default=1024, nullable=False)
    """图片高度"""
    steps: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    """采样步数"""
    seed: Mapped[int] = mapped_column(Integer, default=-1, nullable=False)
    """随机种子"""
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """关联会话 ID"""
    trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """链路追踪 ID"""
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """更新时间"""


class UploadTaskModel(Base):
    """上传任务模型"""
    __tablename__ = "upload_tasks"
    __comment__ = "文件上传任务表，存储上传请求和结果"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    """自增主键 ID"""
    task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """任务唯一标识 UUID"""
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    """文件名"""
    file_type: Mapped[str] = mapped_column(String(32), nullable=False)
    """文件类型：image/video/audio/document"""
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    """文件大小（字节）"""
    content_type: Mapped[str] = mapped_column(String(64), nullable=False)
    """MIME 类型"""
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    """任务状态：pending/uploading/completed/failed"""
    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    """文件访问 URL"""
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    """错误信息"""
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """关联会话 ID"""
    trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """链路追踪 ID"""
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """更新时间"""


__all__ = [
    "Base",
    "ChatSessionModel",
    "MessageModel",
    "UserModel",
    "QuotaPlanModel",
    "UserQuotaUsageModel",
    "QuotaTransactionLogModel",
    "ImageGenerationModel",
    "UploadTaskModel",
]
