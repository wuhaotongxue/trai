#!/usr/bin/env python
# 文件名: user_model.py
# 作者: wuhao
# 日期: 2026_04_13
# 描述: 用户数据库模型

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, BigInteger, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class UserModel(Base):
    """用户模型"""

    __tablename__ = "t_users"
    __comment__ = "用户表,存储用户账户信息"

    t_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement="auto")
    """自增主键 ID"""

    t_user_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """用户唯一标识 UUID"""

    t_username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """用户名,唯一"""

    t_display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    """显示名称"""

    t_email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    """邮箱地址,唯一"""

    t_password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    """密码哈希(argon2)"""

    t_avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    """头像 URL"""

    t_mobile: Mapped[str | None] = mapped_column(String(32), nullable=True)
    """手机号"""

    t_position: Mapped[str | None] = mapped_column(String(128), nullable=True)
    """职位信息"""

    t_role: Mapped[str] = mapped_column(String(32), default="normal", nullable=False)
    """用户角色:admin/vip/normal"""

    t_status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    """用户状态:active/disabled/pending"""

    t_tenant_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    """租户 ID(多租户场景)"""

    t_wecom_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    """企业微信用户 ID(用于 SSO)"""

    t_wecom_data: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    """企业微信原始数据缓存"""

    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
    """创建时间"""

    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""

    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""

    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""

    t_deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    """软删除时间,为空表示未删除"""

    t_deleted_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """删除操作人 user_id"""


__all__ = ["UserModel"]
