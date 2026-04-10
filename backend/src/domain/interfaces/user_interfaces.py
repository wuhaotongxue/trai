#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: user_interfaces.py
# 作者: wuhao
# 日期: 2026_04_09_20:22:00
# 描述: 用户领域仓储接口定义

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Protocol

if TYPE_CHECKING:
    from domain.entities.user import User


class IUserRepository(Protocol):
    """用户仓储接口

    定义用户数据的持久化操作契约
    """

    def create(self, **kwargs: Any) -> User:
        """创建用户

        Args:
            **kwargs: 用户创建参数

        Returns:
            User: 创建的用户实体
        """
        ...

    def get_by_user_id(self, user_id: str, tenant_id: str | None = None) -> User | None:
        """根据 user_id 获取用户

        Args:
            user_id: 用户唯一标识
            tenant_id: 租户 ID（可选，用于多租户隔离校验）

        Returns:
            User | None: 用户实体，不存在或已删除返回 None
        """
        ...

    def get_by_username(self, username: str, tenant_id: str | None = None) -> User | None:
        """根据用户名获取用户

        Args:
            username: 用户名
            tenant_id: 租户 ID（可选）

        Returns:
            User | None: 用户实体
        """
        ...

    def get_by_email(self, email: str, tenant_id: str | None = None) -> User | None:
        """根据邮箱获取用户

        Args:
            email: 邮箱地址
            tenant_id: 租户 ID（可选）

        Returns:
            User | None: 用户实体
        """
        ...

    def get_by_wecom_user_id(self, wecom_user_id: str) -> User | None:
        """根据企业微信用户 ID 获取用户

        Args:
            wecom_user_id: 企业微信用户 ID

        Returns:
            User | None: 用户实体
        """
        ...

    def update(self, user_id: str, **kwargs: Any) -> User | None:
        """更新用户信息

        Args:
            user_id: 用户唯一标识
            **kwargs: 待更新的字段

        Returns:
            User | None: 更新后的用户实体
        """
        ...

    def soft_delete(self, user_id: str, tenant_id: str | None = None) -> bool:
        """软删除用户

        Args:
            user_id: 用户唯一标识
            tenant_id: 租户 ID（可选）

        Returns:
            bool: 是否删除成功
        """
        ...

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
        ...

    def count(self, tenant_id: str | None = None, role: str | None = None, status: str | None = None) -> int:
        """统计用户数量

        Args:
            tenant_id: 租户 ID（可选）
            role: 用户角色过滤（可选）
            status: 用户状态过滤（可选）

        Returns:
            int: 用户总数
        """
        ...


__all__ = ["IUserRepository"]
