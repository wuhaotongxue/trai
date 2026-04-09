#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: user.py
# 作者: wuhao
# 日期: 2026_04_09_13:55:00
# 描述: 用户领域实体

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any
import uuid


class UserRole(str, Enum):
    """用户角色"""
    ADMIN = "admin"
    VIP = "vip"
    NORMAL = "normal"


class UserStatus(str, Enum):
    """用户状态"""
    ACTIVE = "active"
    DISABLED = "disabled"
    PENDING = "pending"


@dataclass
class User:
    """用户领域实体"""
    username: str
    display_name: str
    email: str
    user_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    avatar_url: str | None = None
    role: UserRole = UserRole.NORMAL
    status: UserStatus = UserStatus.ACTIVE
    tenant_id: str | None = None
    wecom_user_id: str | None = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    metadata: dict[str, Any] = field(default_factory=dict)

    def enable(self) -> None:
        """启用用户

        将用户状态设置为活跃
        """
        self.status = UserStatus.ACTIVE
        self.updated_at = datetime.now()

    def disable(self) -> None:
        """禁用用户

        将用户状态设置为禁用
        """
        self.status = UserStatus.DISABLED
        self.updated_at = datetime.now()

    def update_profile(self, display_name: str, email: str, avatar_url: str | None = None) -> None:
        """更新用户资料

        Args:
            display_name: 新的显示名称
            email: 新的邮箱地址
            avatar_url: 新的头像 URL（可选）
        """
        self.display_name = display_name
        self.email = email
        if avatar_url is not None:
            self.avatar_url = avatar_url
        self.updated_at = datetime.now()

    def is_active(self) -> bool:
        """检查用户是否处于活跃状态

        Returns:
            bool: 用户是否活跃
        """
        return self.status == UserStatus.ACTIVE

    def is_admin(self) -> bool:
        """检查用户是否为管理员

        Returns:
            bool: 用户是否为管理员
        """
        return self.role == UserRole.ADMIN

    def is_vip(self) -> bool:
        """检查用户是否为 VIP

        Returns:
            bool: 用户是否为 VIP
        """
        return self.role == UserRole.VIP

    def to_dict(self) -> dict[str, Any]:
        """转换为字典

        Returns:
            dict[str, Any]: 用户信息的字典表示
        """
        return {
            "user_id": self.user_id,
            "username": self.username,
            "display_name": self.display_name,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "role": self.role.value,
            "status": self.status.value,
            "tenant_id": self.tenant_id,
            "wecom_user_id": self.wecom_user_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> User:
        """从字典创建用户实体

        Args:
            data: 包含用户信息的字典

        Returns:
            User: 用户实体实例
        """
        return cls(
            user_id=data["user_id"],
            username=data["username"],
            display_name=data["display_name"],
            email=data["email"],
            avatar_url=data.get("avatar_url"),
            role=UserRole(data.get("role", "normal")),
            status=UserStatus(data.get("status", "active")),
            tenant_id=data.get("tenant_id"),
            wecom_user_id=data.get("wecom_user_id"),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            metadata=data.get("metadata", {}),
        )


__all__ = ["User", "UserRole", "UserStatus"]
