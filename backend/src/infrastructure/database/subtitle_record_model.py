#!/usr/bin/env python
# 文件名: subtitle_record_model.py
# 作者: wuhao
# 日期: 2026_05_23
# 描述: 字幕生成记录数据库模型

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class SubtitleRecordModel(Base):
    __tablename__ = "subtitle_records"
    __table_args__ = {"comment": "字幕生成记录表"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="主键 ID"
    )
    task_id: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True, comment="任务 ID"
    )
    task_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="subtitle", comment="任务类型: subtitle/separate/clone"
    )
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="用户 ID")
    file_name: Mapped[str] = mapped_column(String(255), nullable=False, comment="原始文件名")
    target_lang: Mapped[str] = mapped_column(String(16), nullable=False, comment="目标语言")
    burn_mode: Mapped[str] = mapped_column(String(16), nullable=False, comment="烧录模式")
    zh_srt_url: Mapped[str | None] = mapped_column(String(1024), nullable=True, comment="中文字幕 URL")
    target_srt_url: Mapped[str | None] = mapped_column(String(1024), nullable=True, comment="目标语言字幕 URL")
    output_video_url: Mapped[str | None] = mapped_column(String(1024), nullable=True, comment="输出视频 URL")
    vocal_url: Mapped[str | None] = mapped_column(String(1024), nullable=True, comment="纯人声 URL")
    bgm_url: Mapped[str | None] = mapped_column(String(1024), nullable=True, comment="纯伴奏 URL")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending", comment="任务状态")
    error_message: Mapped[str | None] = mapped_column(String(2048), nullable=True, comment="错误信息")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(0),
        server_default=func.current_timestamp(0),
        nullable=False,
        comment="创建时间",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(0),
        server_default=func.current_timestamp(0),
        onupdate=func.current_timestamp(0),
        nullable=False,
        comment="更新时间",
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, comment="软删除标记"
    )
