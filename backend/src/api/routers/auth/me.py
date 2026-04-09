#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: me.py
# 作者: wuhao
# 日期: 2026_04_09_21:00:00
# 描述: 获取当前用户信息接口

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from api.deps import CurrentUser

router = APIRouter()


class UserInfo(BaseModel):
    """用户信息"""
    user_id: str = Field(description="用户唯一标识")
    username: str = Field(description="用户名")
    email: str | None = Field(default=None, description="邮箱地址")
    display_name: str | None = Field(default=None, description="显示名称")
    avatar_url: str | None = Field(default=None, description="头像 URL")
    role: str = Field(default="normal", description="用户角色")
    tenant_id: str | None = Field(default=None, description="租户 ID")
    created_at: str | None = Field(default=None, description="创建时间")


class MeResponse(BaseModel):
    """当前用户响应"""
    user: UserInfo = Field(description="用户信息")
    permissions: list[str] = Field(default_factory=list, description="用户权限列表")


@router.get("/me", response_model=MeResponse, tags=["认证"])
async def get_current_user_info(
    current_user: CurrentUser,
) -> MeResponse:
    """获取当前登录用户信息

    Args:
        current_user: 当前登录用户（从 Token 中解析）

    Returns:
        MeResponse: 当前用户信息

    Note:
        实际的用户详情需要从数据库查询补充
        此接口基于 Token 信息返回基本数据
    """
    user_id = current_user.get("user_id", "")
    username = current_user.get("username", "")
    role = current_user.get("role", "normal")
    tenant_id = current_user.get("tenant_id")

    # TODO: 从数据库获取完整的用户信息
    # user = await user_repo.get_by_user_id(user_id)

    # 基于角色生成权限列表
    permissions = _get_permissions_by_role(role)

    return MeResponse(
        user=UserInfo(
            user_id=user_id,
            username=username,
            role=role,
            tenant_id=tenant_id,
            email=None,
            display_name=None,
            avatar_url=None,
            created_at=None,
        ),
        permissions=permissions,
    )


def _get_permissions_by_role(role: str) -> list[str]:
    """根据角色获取权限列表

    Args:
        role: 用户角色

    Returns:
        list[str]: 权限列表
    """
    base_permissions = ["user:read", "user:update"]

    role_permissions = {
        "admin": [
            "user:create", "user:delete", "user:list",
            "session:create", "session:delete", "session:list",
            "file:upload", "file:download", "file:delete",
            "admin:access",
        ],
        "manager": [
            "user:list",
            "session:create", "session:list",
            "file:upload", "file:download",
        ],
        "vip": [
            "session:create", "session:list",
            "file:upload", "file:download",
        ],
        "normal": base_permissions,
        "guest": ["user:read"],
    }

    return role_permissions.get(role, base_permissions)


__all__ = ["router"]
