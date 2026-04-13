#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: user.py
# 作者: wuhao
# 日期: 2026_04_09_21:10:00
# 描述: 用户管理接口（管理员用）

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser, require_admin
from infrastructure.security.password import PasswordService, get_password_service
from infrastructure.repositories.user_repository import UserRepository
from infrastructure.database import get_session

router = APIRouter()


class UserListItem(BaseModel):
    """用户列表项"""
    user_id: str = Field(description="用户唯一标识")
    username: str = Field(description="用户名")
    display_name: str = Field(description="显示名称")
    email: str = Field(description="邮箱地址")
    avatar_url: str | None = Field(default=None, description="头像 URL")
    role: str = Field(description="用户角色")
    status: str = Field(description="用户状态")
    tenant_id: str | None = Field(default=None, description="租户 ID")
    created_at: str | None = Field(default=None, description="创建时间")


class UserListResponse(BaseModel):
    """用户列表响应"""
    total: int = Field(description="用户总数")
    users: list[UserListItem] = Field(description="用户列表")


class UpdateUserRequest(BaseModel):
    """更新用户请求"""
    display_name: str | None = Field(default=None, description="显示名称")
    email: str | None = Field(default=None, description="邮箱地址")
    avatar_url: str | None = Field(default=None, description="头像 URL")
    role: str | None = Field(default=None, description="用户角色")
    status: str | None = Field(default=None, description="用户状态")


class ActionResponse(BaseModel):
    """操作响应"""
    message: str = Field(description="提示信息")
    user_id: str = Field(description="用户 ID")


@router.get("/users", response_model=UserListResponse, tags=["管理"])
async def list_users(
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_session)],
    role: Annotated[str | None, Query(description="按角色过滤")] = None,
    status_filter: Annotated[str | None, Query(alias="status", description="按状态过滤")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> UserListResponse:
    """获取用户列表（仅管理员）

    Args:
        current_user: 当前登录管理员
        session: 数据库会话
        role: 角色过滤
        status_filter: 状态过滤
        limit: 每页数量
        offset: 偏移量

    Returns:
        UserListResponse: 用户列表和总数
    """
    user_repo = UserRepository(session)

    users = user_repo.list_users(
        role=role,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    total = user_repo.count(role=role, status=status_filter)

    return UserListResponse(
        total=total,
        users=[
            UserListItem(
                user_id=u.t_user_id,
                username=u.t_username,
                display_name=u.t_display_name,
                email=u.t_email,
                avatar_url=u.t_avatar_url,
                role=u.t_role.value,
                status=u.t_status.value,
                tenant_id=u.t_tenant_id,
                created_at=u.t_created_at.isoformat() if u.t_created_at else None,
            )
            for u in users
        ],
    )


@router.get("/users/{user_id}", response_model=UserListItem, tags=["管理"])
async def get_user(
    user_id: str,
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_session)],
) -> UserListItem:
    """获取指定用户信息（仅管理员）

    Args:
        user_id: 用户 ID
        current_user: 当前登录管理员
        session: 数据库会话

    Returns:
        UserListItem: 用户信息

    Raises:
        HTTPException: 用户不存在（404）
    """
    user_repo = UserRepository(session)
    user = user_repo.get_by_user_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "用户不存在"},
        )

    return UserListItem(
        user_id=user.t_user_id,
        username=user.t_username,
        display_name=user.t_display_name,
        email=user.t_email,
        avatar_url=user.t_avatar_url,
        role=user.t_role.value,
        status=user.t_status.value,
        tenant_id=user.t_tenant_id,
        created_at=user.t_created_at.isoformat() if user.t_created_at else None,
    )


@router.put("/users/{user_id}", response_model=ActionResponse, tags=["管理"])
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_session)],
) -> ActionResponse:
    """更新用户信息（仅管理员）

    Args:
        user_id: 用户 ID
        request: 更新内容
        current_user: 当前登录管理员
        session: 数据库会话

    Returns:
        ActionResponse: 操作结果

    Raises:
        HTTPException: 用户不存在（404）
    """
    user_repo = UserRepository(session)

    # 检查用户是否存在
    existing = user_repo.get_by_user_id(user_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "用户不存在"},
        )

    # 构建更新字段
    update_data = {}
    if request.display_name is not None:
        update_data["display_name"] = request.display_name
    if request.email is not None:
        update_data["email"] = request.email
    if request.avatar_url is not None:
        update_data["avatar_url"] = request.avatar_url
    if request.role is not None:
        update_data["role"] = request.role
    if request.status is not None:
        update_data["status"] = request.status

    if update_data:
        user_repo.update(user_id, **update_data)

    return ActionResponse(
        message="用户信息已更新",
        user_id=user_id,
    )


@router.delete("/users/{user_id}", response_model=ActionResponse, tags=["管理"])
async def delete_user(
    user_id: str,
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_session)],
) -> ActionResponse:
    """删除用户（仅管理员，物理删除）

    Args:
        user_id: 用户 ID
        current_user: 当前登录管理员
        session: 数据库会话

    Returns:
        ActionResponse: 操作结果

    Raises:
        HTTPException: 用户不存在（404）/ 禁止删除自己（400）
    """
    admin_user_id = current_user.get("user_id", "")

    # 禁止删除自己
    if user_id == admin_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": "不能删除自己的账户"},
        )

    user_repo = UserRepository(session)

    # 检查用户是否存在
    existing = user_repo.get_by_user_id(user_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "用户不存在"},
        )

    # 软删除
    user_repo.soft_delete(user_id)

    return ActionResponse(
        message=f"用户 {existing.t_username} 已删除",
        user_id=user_id,
    )


__all__ = ["router"]
