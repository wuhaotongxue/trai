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
from infrastructure.security.blacklist import TokenBlacklistService, get_blacklist_service
from infrastructure.security.jwt import JWTService, get_jwt_service
from infrastructure.security.password import get_password_service

security = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
    blacklist_service: Annotated[TokenBlacklistService, Depends(get_blacklist_service)],
) -> dict[str, Any] | None:
    """获取当前登录用户(可选)

    如果未提供 Token 或 Token 无效, 不抛出异常, 而是返回 None

    Args:
        credentials: HTTP Bearer 凭证
        jwt_service: JWT 服务实例
        blacklist_service: 黑名单服务实例

    Returns:
        dict | None: 用户信息字典或 None
    """
    if not credentials or not credentials.credentials:
        return None

    try:
        token = credentials.credentials
        if blacklist_service.is_blacklisted(token):
            return None

        payload = jwt_service.verify_token(token)
        return {
            "user_id": payload.get("sub"),
            "username": payload.get("username"),
            "role": payload.get("role", "normal"),
            "tenant_id": payload.get("tenant_id"),
        }
    except Exception:
        return None


def get_current_user(
    current_user_opt: Annotated[dict[str, Any] | None, Depends(get_current_user_optional)],
) -> dict[str, Any]:
    """获取当前登录用户(必须)

    Args:
        current_user_opt: 可选用户信息

    Returns:
        dict: 用户信息字典

    Raises:
        HTTPException: 认证失败
    """
    if not current_user_opt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 401, "message": "无效的令牌或已过期"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user_opt


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
                    "message": f"权限不足,需要角色: {', '.join(allowed_roles)}",
                },
            )
        return current_user

    return role_checker


# 常用角色依赖
require_admin = require_role("admin")
require_vip = require_role("admin", "vip")
require_manager = require_role("admin", "manager")


CurrentUserOptional = Annotated[dict[str, Any] | None, Depends(get_current_user_optional)]
CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
AdminUser = Annotated[dict[str, Any], Depends(require_admin)]
VIPUser = Annotated[dict[str, Any], Depends(require_vip)]
ManagerUser = Annotated[dict[str, Any], Depends(require_manager)]


__all__ = [
    "get_current_user",
    "get_current_user_optional",
    "CurrentUser",
    "CurrentUserOptional",
    "AdminUser","require_role",
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
