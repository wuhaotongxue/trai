#!/usr/bin/env python
# 文件名: deps.py
# 作者: wuhao
# 日期: 2026_04_09_20:30:00
# 描述: API 依赖注入

from __future__ import annotations

from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.exceptions import AuthenticationError
from infrastructure.security.jwt import JWTService, get_jwt_service
from infrastructure.security.password import get_password_service

security = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
) -> dict[str, Any]:
    """获取当前登录用户

    Args:
        credentials: HTTP Bearer 凭证
        jwt_service: JWT 服务实例

    Returns:
        dict: 用户信息字典

    Raises:
        HTTPException: 认证失败
    """
    try:
        payload = jwt_service.verify_token(credentials.credentials)
        return {
            "user_id": payload.get("sub"),
            "username": payload.get("username"),
            "role": payload.get("role", "normal"),
            "tenant_id": payload.get("tenant_id"),
        }
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 401, "message": e.message},
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(*allowed_roles: str):
    """角色权限装饰器

    Args:
        *allowed_roles: 允许的角色列表

    Returns:
        依赖函数
    """

    def role_checker(
        current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    ) -> dict[str, Any]:
        user_role = current_user.get("role", "normal")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": 403,
                    "message": f"权限不足，需要角色: {', '.join(allowed_roles)}",
                },
            )
        return current_user

    return role_checker


# 常用角色依赖
require_admin = require_role("admin")
require_vip = require_role("admin", "vip")
require_manager = require_role("admin", "manager")


CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
AdminUser = Annotated[dict[str, Any], Depends(require_admin)]
VIPUser = Annotated[dict[str, Any], Depends(require_vip)]
ManagerUser = Annotated[dict[str, Any], Depends(require_manager)]


__all__ = [
    "get_current_user",
    "require_role",
    "require_admin",
    "require_vip",
    "require_manager",
    "get_password_service",
    "get_jwt_service",
    "CurrentUser",
    "AdminUser",
    "VIPUser",
    "ManagerUser",
]
