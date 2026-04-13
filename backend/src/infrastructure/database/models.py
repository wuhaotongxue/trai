#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: models.py
# 作者: wuhao
# 日期: 2026_04_10_09:21:00
# 描述: 数据模型

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Integer, String, BigInteger, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class ChatSessionModel(Base):
    """AI 对话会话模型"""
    __tablename__ = "t_chat_sessions"
    __comment__ = "AI 对话会话表，存储会话元数据和消息历史"

    t_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement="auto")
    """自增主键 ID"""
    t_session_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """会话唯一标识 UUID"""
    t_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    """用户 ID"""
    t_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    """会话标题"""
    t_model: Mapped[str] = mapped_column(String(64), nullable=False)
    """使用的 AI 模型名称"""
    t_messages: Mapped[dict[str, Any]] = mapped_column(JSON, default=list)
    """消息历史 JSON 数组"""
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    """扩展数据字段"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""
    t_deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    """软删除时间，为空表示未删除"""
    t_deleted_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """删除操作人 user_id"""


class MessageModel(Base):
    """AI 对话消息模型"""
    __tablename__ = "t_messages"
    __comment__ = "AI 对话消息表，存储单条消息内容"

    t_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement="auto")
    """自增主键 ID"""
    t_session_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """关联的会话 session_id"""
    t_role: Mapped[str] = mapped_column(String(32), nullable=False)
    """消息角色：system/user/assistant"""
    t_content: Mapped[str] = mapped_column(Text, nullable=False)
    """消息内容"""
    t_msg_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    """消息扩展元数据"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""


class QuotaPlanModel(Base):
    """配额套餐模型"""
    __tablename__ = "t_quota_plans"
    __comment__ = "配额套餐表，定义各角色的月度配额上限"

    t_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement="auto")
    """自增主键 ID"""
    t_plan_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    """套餐名称"""
    t_user_role: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    """用户角色：admin/vip/normal/guest"""
    t_image_generation_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """图片生成配额（0 表示无限制）"""
    t_audio_synthesis_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音合成配额（0 表示无限制）"""
    t_transcription_minutes_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音转录配额（分钟）"""
    t_meeting_summary_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """会议摘要配额"""
    t_ai_translation_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 翻译配额"""
    t_ai_summarization_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 摘要配额"""
    t_agent_tool_call_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """Agent 工具调用配额（0 表示无限制）"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""


class UserQuotaUsageModel(Base):
    """用户配额使用模型"""
    __tablename__ = "t_user_quota_usage"
    __comment__ = "用户配额使用表，按自然月记录各类型配额消耗"

    t_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement="auto")
    """自增主键 ID"""
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    t_billing_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    """账单月份 YYYY-MM"""
    t_image_generation_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """图片生成已用次数"""
    t_audio_synthesis_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音合成已用次数"""
    t_transcription_minutes_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音转录已用分钟数"""
    t_meeting_summary_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """会议摘要已用次数"""
    t_ai_translation_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 翻译已用次数"""
    t_ai_summarization_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 摘要已用次数"""
    t_agent_tool_call_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """Agent 工具调用已用次数"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""


class QuotaTransactionLogModel(Base):
    """配额变动流水模型"""
    __tablename__ = "t_quota_transaction_log"
    __comment__ = "配额变动流水表，记录每次配额增减及原因"

    t_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement="auto")
    """自增主键 ID"""
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    t_billing_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    """账单月份 YYYY-MM"""
    t_transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    """交易类型：deduct/reset/grant/purchase"""
    t_quota_type: Mapped[str] = mapped_column(String(50), nullable=False)
    """配额类型"""
    t_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    """变动数量（正数为增加，负数为扣减）"""
    t_balance_before: Mapped[int] = mapped_column(Integer, nullable=False)
    """变动前余额"""
    t_balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    """变动后余额"""
    t_tool_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    """关联工具 ID"""
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """关联会话 session_id"""
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """链路追踪 ID"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""


class ImageGenerationModel(Base):
    """AI 图片生成模型"""
    __tablename__ = "t_image_generations"
    __comment__ = "AI 图片生成任务表，存储图片生成请求和结果"

    t_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement="auto")
    """自增主键 ID"""
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """任务唯一标识 UUID"""
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    t_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    """图片生成提示词"""
    t_negative_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    """反向提示词"""
    t_style: Mapped[str] = mapped_column(String(32), default="auto", nullable=False)
    """图片风格"""
    t_size: Mapped[str] = mapped_column(String(16), default="1024x1024", nullable=False)
    """图片尺寸"""
    t_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    """任务状态：pending/processing/completed/failed"""
    t_result_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    """生成结果 URL"""
    t_error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    """错误信息"""
    t_model: Mapped[str] = mapped_column(String(64), nullable=True)
    """使用的模型"""
    t_width: Mapped[int] = mapped_column(Integer, default=1024, nullable=False)
    """图片宽度"""
    t_height: Mapped[int] = mapped_column(Integer, default=1024, nullable=False)
    """图片高度"""
    t_steps: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    """采样步数"""
    t_seed: Mapped[int] = mapped_column(Integer, default=-1, nullable=False)
    """随机种子"""
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """关联会话 session_id"""
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """链路追踪 ID"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""


class UploadTaskModel(Base):
    """文件上传任务模型"""
    __tablename__ = "t_upload_tasks"
    __comment__ = "文件上传任务表，存储上传请求和结果"

    t_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement="auto")
    """自增主键 ID"""
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """任务唯一标识 UUID"""
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    t_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    """文件名"""
    t_file_type: Mapped[str] = mapped_column(String(32), nullable=False)
    """文件类型：image/video/audio/document"""
    t_file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    """文件大小（字节）"""
    t_content_type: Mapped[str] = mapped_column(String(64), nullable=False)
    """MIME 类型"""
    t_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    """任务状态：pending/uploading/completed/failed"""
    t_file_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    """文件访问 URL"""
    t_error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    """错误信息"""
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """关联会话 session_id"""
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """链路追踪 ID"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""


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
