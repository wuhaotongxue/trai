#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: user_repository.py
# 作者: wuhao
# 日期: 2026_04_09_14:10:00
# 描述: 用户仓储

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from infrastructure.database.user_model import UserModel


class UserRepository:
    """用户仓储"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create(
        self,
        user_id: str,
        username: str,
        password_hash: str,
        display_name: str,
        email: str,
        role: str = "normal",
        status: str = "active",
        tenant_id: str | None = None,
        wecom_user_id: str | None = None,
        avatar_url: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> UserModel:
        """创建用户

        Args:
            user_id: 用户唯一标识 UUID
            username: 用户名（登录账号）
            password_hash: 密码哈希值
            display_name: 显示名称
            email: 邮箱地址
            role: 用户角色（默认 normal）
            status: 用户状态（默认 active）
            tenant_id: 租户 ID（可选）
            wecom_user_id: 企业微信用户 ID（可选）
            avatar_url: 头像 URL（可选）
            metadata: 扩展元数据（可选）

        Returns:
            UserModel: 创建的用户记录
        """
        user = UserModel(
            user_id=user_id,
            username=username,
            password_hash=password_hash,
            display_name=display_name,
            email=email,
            role=role,
            status=status,
            tenant_id=tenant_id,
            wecom_user_id=wecom_user_id,
            avatar_url=avatar_url,
        )
        self._session.add(user)
        self._session.commit()
        self._session.refresh(user)
        return user

    def get_by_user_id(self, user_id: str, tenant_id: str | None = None) -> UserModel | None:
        """根据 user_id 获取用户

        Args:
            user_id: 用户唯一标识
            tenant_id: 租户 ID（可选，用于多租户隔离校验）

        Returns:
            UserModel | None: 用户记录，不存在或已删除返回 None
        """
        stmt = select(UserModel).where(
            UserModel.user_id == user_id,
            UserModel.is_deleted.is_(False),
        )
        if tenant_id:
            stmt = stmt.where(UserModel.tenant_id == tenant_id)
        return self._session.scalar(stmt)

    def get_by_username(self, username: str, tenant_id: str | None = None) -> UserModel | None:
        """根据用户名获取用户

        Args:
            username: 用户名
            tenant_id: 租户 ID（可选，用于多租户隔离校验）

        Returns:
            UserModel | None: 用户记录
        """
        stmt = select(UserModel).where(
            UserModel.username == username,
            UserModel.is_deleted.is_(False),
        )
        if tenant_id:
            stmt = stmt.where(UserModel.tenant_id == tenant_id)
        return self._session.scalar(stmt)

    def get_by_email(self, email: str, tenant_id: str | None = None) -> UserModel | None:
        """根据邮箱获取用户

        Args:
            email: 邮箱地址
            tenant_id: 租户 ID（可选）

        Returns:
            UserModel | None: 用户记录
        """
        stmt = select(UserModel).where(
            UserModel.email == email,
            UserModel.is_deleted.is_(False),
        )
        if tenant_id:
            stmt = stmt.where(UserModel.tenant_id == tenant_id)
        return self._session.scalar(stmt)

    def get_by_wecom_user_id(self, wecom_user_id: str) -> UserModel | None:
        """根据企业微信用户 ID 获取用户（用于 SSO 登录）

        Args:
            wecom_user_id: 企业微信用户 ID

        Returns:
            UserModel | None: 用户记录
        """
        stmt = select(UserModel).where(
            UserModel.wecom_user_id == wecom_user_id,
            UserModel.is_deleted.is_(False),
        )
        return self._session.scalar(stmt)

    def update(
        self,
        user_id: str,
        display_name: str | None = None,
        email: str | None = None,
        avatar_url: str | None = None,
        role: str | None = None,
        status: str | None = None,
        password_hash: str | None = None,
        tenant_id: str | None = None,
        wecom_user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> UserModel | None:
        """更新用户信息

        Args:
            user_id: 用户唯一标识
            display_name: 显示名称（可选）
            email: 邮箱地址（可选）
            avatar_url: 头像 URL（可选）
            role: 用户角色（可选）
            status: 用户状态（可选）
            password_hash: 密码哈希（可选）
            tenant_id: 租户 ID（可选）
            wecom_user_id: 企业微信用户 ID（可选）
            metadata: 扩展元数据（可选）

        Returns:
            UserModel | None: 更新后的用户记录
        """
        user = self.get_by_user_id(user_id, tenant_id)
        if not user:
            return None

        if display_name is not None:
            user.display_name = display_name
        if email is not None:
            user.email = email
        if avatar_url is not None:
            user.avatar_url = avatar_url
        if role is not None:
            user.role = role
        if status is not None:
            user.status = status
        if password_hash is not None:
            user.password_hash = password_hash
        if tenant_id is not None:
            user.tenant_id = tenant_id
        if wecom_user_id is not None:
            user.wecom_user_id = wecom_user_id

        user.updated_at = datetime.now()
        self._session.commit()
        self._session.refresh(user)
        return user

    def soft_delete(self, user_id: str, tenant_id: str | None = None) -> bool:
        """软删除用户

        Args:
            user_id: 用户唯一标识
            tenant_id: 租户 ID（可选）

        Returns:
            bool: 是否删除成功
        """
        user = self.get_by_user_id(user_id, tenant_id)
        if not user:
            return False

        user.is_deleted = True
        user.updated_at = datetime.now()
        self._session.commit()
        return True

    def list_users(
        self,
        tenant_id: str | None = None,
        role: str | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[UserModel]:
        """获取用户列表

        Args:
            tenant_id: 租户 ID（可选，为空时返回所有租户用户）
            role: 用户角色过滤（可选）
            status: 用户状态过滤（可选）
            limit: 每页数量（默认 50）
            offset: 偏移量（默认 0）

        Returns:
            list[UserModel]: 用户记录列表
        """
        stmt = select(UserModel).where(UserModel.is_deleted.is_(False))
        if tenant_id:
            stmt = stmt.where(UserModel.tenant_id == tenant_id)
        if role:
            stmt = stmt.where(UserModel.role == role)
        if status:
            stmt = stmt.where(UserModel.status == status)
        stmt = stmt.order_by(UserModel.created_at.desc()).limit(limit).offset(offset)
        return list(self._session.scalars(stmt))

    def count(self, tenant_id: str | None = None, role: str | None = None, status: str | None = None) -> int:
        """统计用户数量

        Args:
            tenant_id: 租户 ID（可选）
            role: 用户角色过滤（可选）
            status: 用户状态过滤（可选）

        Returns:
            int: 用户总数
        """
        stmt = select(func.count(UserModel.id)).where(UserModel.is_deleted.is_(False))
        if tenant_id:
            stmt = stmt.where(UserModel.tenant_id == tenant_id)
        if role:
            stmt = stmt.where(UserModel.role == role)
        if status:
            stmt = stmt.where(UserModel.status == status)
        return self._session.scalar(stmt) or 0


__all__ = ["UserRepository"]
