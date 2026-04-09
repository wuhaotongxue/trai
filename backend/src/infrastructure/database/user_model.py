#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: user_model.py
# 作者: wuhao
# 日期: 2026_04_09_21:20:00
# 描述: 用户数据库模型

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class UserModel(Base):
    """用户模型

    对应数据库中的 users 表，存储用户基本信息
    """
    __tablename__ = "users"
    __comment__ = "用户表，存储用户账户信息"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    """自增主键 ID"""

    user_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """用户唯一标识 UUID"""

    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """用户名，唯一"""

    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    """显示名称"""

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    """邮箱地址，唯一"""

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    """密码哈希（argon2/ bcrypt）"""

    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    """头像 URL"""

    role: Mapped[str] = mapped_column(String(32), default="normal", nullable=False)
    """用户角色：admin/vip/normal"""

    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    """用户状态：active/disabled/pending"""

    tenant_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    """租户 ID（多租户场景）"""

    wecom_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    """企业微信用户 ID（用于 SSO）"""

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
    """创建时间"""

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""

    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    """软删除时间，为空表示未删除"""


__all__ = ["UserModel"]
