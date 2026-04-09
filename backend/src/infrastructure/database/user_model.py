#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: user_model.py
# 作者: wuhao
# 日期: 2026_04_09_14:05:00
# 描述: 用户数据模型，对应数据库 users 表

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String, index
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class UserModel(Base):
    """用户数据模型

    对应数据库 users 表，存储用户账户信息
    """
    __tablename__ = "users"
    __comment__ = "用户账户表，存储用户登录凭证和基本信息"
    __table_args__ = (
        index("ix_users_tenant_id", "tenant_id"),
        index("ix_users_wecom_user_id", "wecom_user_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    """数据库自增主键 ID"""

    user_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """用户唯一标识 UUID，用于业务关联"""

    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """用户名（登录账号）"""

    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    """密码哈希（passlib + bcrypt），禁止明文存储"""

    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    """用户显示名称"""

    email: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    """用户邮箱地址"""

    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    """用户头像 URL"""

    role: Mapped[str] = mapped_column(String(32), nullable=False, default="normal")
    """用户角色：admin/vip/normal"""

    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    """用户状态：active/disabled/pending"""

    tenant_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """租户 ID，用于多租户数据隔离"""

    wecom_user_id: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True)
    """企业微信用户 ID，用于 SSO 登录绑定"""

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
    """创建时间"""

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    """最后更新时间"""

    is_deleted: Mapped[bool] = mapped_column(default=False, nullable=False)
    """软删除标记，True 表示已删除"""


__all__ = ["UserModel"]
