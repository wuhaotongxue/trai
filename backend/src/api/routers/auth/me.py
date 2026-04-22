#!/usr/bin/env python
# 文件名: me.py
# 作者: wuhao
# 日期: 2026_04_09_21:00:00
# 描述: 获取当前用户信息接口

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from infrastructure.database import get_db_session
from infrastructure.repositories.user_repository import UserRepository

router = APIRouter()


class UserInfo(BaseModel):
    """用户信息"""

    user_id: str = Field(description="用户唯一标识")
    username: str = Field(description="用户名")
    email: str | None = Field(default=None, description="邮箱地址")
    display_name: str | None = Field(default=None, description="显示名称")
    avatar_url: str | None = Field(default=None, description="头像 URL")
    role: str = Field(default="normal", description="用户角色")
    status: str = Field(default="active", description="用户状态")
    tenant_id: str | None = Field(default=None, description="租户 ID")
    wecom_user_id: str | None = Field(default=None, description="企业微信 User ID")
    last_login_ip: str | None = Field(default=None, description="最后登录 IP")
    last_login_location: str | None = Field(default=None, description="最后登录地址")
    created_at: str | None = Field(default=None, description="创建时间")
    updated_at: str | None = Field(default=None, description="更新时间")


class MeResponse(BaseModel):
    """当前用户响应"""

    user: UserInfo = Field(description="用户信息")
    permissions: list[str] = Field(default_factory=list, description="用户权限列表")


@router.get("/me", response_model=MeResponse, tags=["认证"])
async def get_current_user_info(
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
) -> MeResponse:
    """获取当前登录用户信息

    Args:
        current_user: 当前登录用户(从 Token 中解析)
        session: 数据库会话

    Returns:
        MeResponse: 当前用户信息

    Raises:
        HTTPException: 用户不存在(404)
    """
    user_id = current_user.get("user_id", "")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 401, "message": "无效的认证信息"},
        )

    # 从数据库获取完整的用户信息
    user_repo = UserRepository(session)
    user = user_repo.get_by_user_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "用户不存在"},
        )

    # 基于角色生成权限列表
    permissions = _get_permissions_by_role(user.role.value)

    return MeResponse(
        user=UserInfo(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
            role=user.role.value,
            status=user.status.value,
            tenant_id=user.tenant_id,
            wecom_user_id=user.wecom_user_id,
            last_login_ip=user.last_login_ip,
            last_login_location=user.last_login_location,
            created_at=user.created_at.isoformat() if user.created_at else None,
            updated_at=user.updated_at.isoformat() if user.updated_at else None,
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
            "user:create",
            "user:delete",
            "user:list",
            "session:create",
            "session:delete",
            "session:list",
            "file:upload",
            "file:download",
            "file:delete",
            "admin:access",
        ],
        "manager": [
            "user:list",
            "session:create",
            "session:list",
            "file:upload",
            "file:download",
        ],
        "vip": [
            "session:create",
            "session:list",
            "file:upload",
            "file:download",
        ],
        "normal": base_permissions,
        "guest": ["user:read"],
    }

    return role_permissions.get(role, base_permissions)


__all__ = ["router"]
