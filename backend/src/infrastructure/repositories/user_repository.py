#!/usr/bin/env python
# 文件名: user_repository.py
# 作者: wuhao
# 日期: 2026_04_09_21:20:00
# 描述: 用户数据库仓储实现

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from domain.entities.user import User, UserRole, UserStatus
from domain.interfaces.user_interfaces import IUserRepository
from infrastructure.database.user_model import UserModel


class UserRepository(IUserRepository):
    """用户数据库仓储

    实现 IUserRepository 接口，负责用户数据的持久化操作
    使用 SQLAlchemy ORM 与 PostgreSQL 数据库交互
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    def _to_entity(self, model: UserModel) -> User:
        """将数据库模型转换为领域实体

        Args:
            model: 用户数据库模型

        Returns:
            User: 用户领域实体
        """
        return User(
            user_id=model.t_user_id,
            username=model.t_username,
            display_name=model.t_display_name,
            email=model.t_email,
            avatar_url=model.t_avatar_url,
            role=UserRole(model.t_role),
            status=UserStatus(model.t_status),
            tenant_id=model.t_tenant_id,
            wecom_user_id=model.t_wecom_user_id,
            created_at=model.t_created_at,
            updated_at=model.t_updated_at,
        )

    def _to_model(self, user: User, password_hash: str) -> UserModel:
        """将领域实体转换为数据库模型

        Args:
            user: 用户领域实体
            password_hash: 密码哈希

        Returns:
            UserModel: 用户数据库模型
        """
        return UserModel(
            t_user_id=user.user_id,
            t_username=user.username,
            t_display_name=user.display_name,
            t_email=user.email,
            t_password_hash=password_hash,
            t_avatar_url=user.avatar_url,
            t_role=user.role.value,
            t_status=user.status.value,
            t_tenant_id=user.tenant_id,
            t_wecom_user_id=user.wecom_user_id,
            t_created_at=user.created_at,
            t_updated_at=user.updated_at,
        )

    def create(self, **kwargs: Any) -> User:
        """创建用户

        Args:
            **kwargs: 用户创建参数

        Returns:
            User: 创建的用户实体
        """
        user_id = kwargs.get("user_id") or str(uuid.uuid4())
        password_hash = kwargs.get("password_hash", "")

        user = User(
            user_id=user_id,
            username=kwargs["username"],
            display_name=kwargs.get("display_name", kwargs["username"]),
            email=kwargs["email"],
            password_hash=password_hash,
            avatar_url=kwargs.get("avatar_url"),
            role=UserRole(kwargs.get("role", "normal")),
            status=UserStatus(kwargs.get("status", "active")),
            tenant_id=kwargs.get("tenant_id"),
            wecom_user_id=kwargs.get("wecom_user_id"),
        )

        model = self._to_model(user, password_hash)
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)

        logger.info(f"用户创建成功: {user.username} ({user.user_id})")
        return self._to_entity(model)

    def get_by_user_id(self, user_id: str, tenant_id: str | None = None) -> User | None:
        """根据 user_id 获取用户

        Args:
            user_id: 用户唯一标识
            tenant_id: 租户 ID（可选）

        Returns:
            User | None: 用户实体，不存在或已删除返回 None
        """
        stmt = select(UserModel).where(
            UserModel.t_user_id == user_id,
            UserModel.t_deleted_at.is_(None),
        )
        model = self._session.scalar(stmt)
        return self._to_entity(model) if model else None

    def get_by_username(self, username: str, tenant_id: str | None = None) -> User | None:
        """根据用户名获取用户

        Args:
            username: 用户名
            tenant_id: 租户 ID（可选）

        Returns:
            User | None: 用户实体
        """
        stmt = select(UserModel).where(
            UserModel.t_username == username,
            UserModel.t_deleted_at.is_(None),
        )
        model = self._session.scalar(stmt)
        return self._to_entity(model) if model else None

    def get_by_email(self, email: str, tenant_id: str | None = None) -> User | None:
        """根据邮箱获取用户

        Args:
            email: 邮箱地址
            tenant_id: 租户 ID（可选）

        Returns:
            User | None: 用户实体
        """
        stmt = select(UserModel).where(
            UserModel.t_email == email,
            UserModel.t_deleted_at.is_(None),
        )
        model = self._session.scalar(stmt)
        return self._to_entity(model) if model else None

    def get_by_wecom_user_id(self, wecom_user_id: str) -> User | None:
        """根据企业微信用户 ID 获取用户

        Args:
            wecom_user_id: 企业微信用户 ID

        Returns:
            User | None: 用户实体
        """
        stmt = select(UserModel).where(
            UserModel.t_wecom_user_id == wecom_user_id,
            UserModel.t_deleted_at.is_(None),
        )
        model = self._session.scalar(stmt)
        return self._to_entity(model) if model else None

    def get_password_hash(self, user_id: str) -> str | None:
        """获取用户密码哈希

        Args:
            user_id: 用户 ID

        Returns:
            str | None: 密码哈希
        """
        stmt = select(UserModel.t_password_hash).where(UserModel.t_user_id == user_id)
        return self._session.scalar(stmt)

    def update(self, user_id: str, **kwargs: Any) -> User | None:
        """更��用户信息

        Args:
            user_id: 用户唯一标识
            **kwargs: 待更新的字段

        Returns:
            User | None: 更新后的用户实体
        """
        stmt = (
            update(UserModel)
            .where(UserModel.t_user_id == user_id, UserModel.t_deleted_at.is_(None))
            .values(**kwargs, t_updated_at=datetime.now())
            .returning(UserModel)
        )
        model = self._session.scalar(stmt)

        if model:
            self._session.commit()
            self._session.refresh(model)
            logger.info(f"用户更新成功: {user_id}")
            return self._to_entity(model)

        return None

    def soft_delete(self, user_id: str, tenant_id: str | None = None) -> bool:
        """软删除用户

        Args:
            user_id: 用户唯一标识
            tenant_id: 租户 ID（可选）

        Returns:
            bool: 是否删除成功
        """
        stmt = (
            update(UserModel)
            .where(UserModel.t_user_id == user_id, UserModel.t_deleted_at.is_(None))
            .values(t_deleted_at=datetime.now())
        )
        result = self._session.execute(stmt)
        self._session.commit()

        if result.rowcount > 0:
            logger.info(f"用户软删除成功: {user_id}")
            return True
        return False

    def list_users(
        self,
        tenant_id: str | None = None,
        role: str | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[User]:
        """获取用户列表

        Args:
            tenant_id: 租户 ID（可选）
            role: 用户角色过滤（可选）
            status: 用户状态过滤（可选）
            limit: 每页数量（默认 50）
            offset: 偏移量（默认 0）

        Returns:
            list[User]: 用户实体列表
        """
        stmt = select(UserModel).where(UserModel.t_deleted_at.is_(None))

        if tenant_id:
            stmt = stmt.where(UserModel.t_tenant_id == tenant_id)
        if role:
            stmt = stmt.where(UserModel.t_role == role)
        if status:
            stmt = stmt.where(UserModel.t_status == status)

        stmt = stmt.offset(offset).limit(limit)
        models = self._session.scalars(stmt).all()
        return [self._to_entity(m) for m in models]

    def count(self, tenant_id: str | None = None, role: str | None = None, status: str | None = None) -> int:
        """统计用户数量

        Args:
            tenant_id: 租户 ID（可选）
            role: 用户角色过滤（可选）
            status: 用户状态过滤（可选）

        Returns:
            int: 用户总数
        """
        stmt = select(UserModel).where(UserModel.t_deleted_at.is_(None))

        if tenant_id:
            stmt = stmt.where(UserModel.t_tenant_id == tenant_id)
        if role:
            stmt = stmt.where(UserModel.t_role == role)
        if status:
            stmt = stmt.where(UserModel.t_status == status)

        return len(self._session.scalars(stmt).all())


__all__ = ["UserRepository"]
