#!/usr/bin/env python
# 文件名: logout.py
# 作者: wuhao
# 日期: 2026_04_09_21:00:00
# 描述: 用户登出接口

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from api.deps import CurrentUser, security
from infrastructure.security.blacklist import TokenBlacklistService, get_blacklist_service
from infrastructure.security.jwt import JWTService, get_jwt_service

router = APIRouter()


class LogoutResponse(BaseModel):
    """登出响应"""

    message: str = Field(default="登出成功", description="提示信息")
    user_id: str = Field(description="登出的用户 ID")


@router.post("/logout", tags=["认证"])
async def logout(
    current_user: CurrentUser,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
    blacklist_service: Annotated[TokenBlacklistService, Depends(get_blacklist_service)],
) -> LogoutResponse:
    """用户登出

    Args:
        current_user: 当前登录用户(从 Token 中解析)
        credentials: HTTP Bearer 凭证
        jwt_service: JWT 服务实例
        blacklist_service: 黑名单服务实例

    Returns:
        LogoutResponse: 登出成功信息

    Note:
        JWT 是无状态的,令牌一旦签发在过期前都有效
        真正的登出需要结合 Redis 黑名单或数据库存储
        此接口记录登出日志,实际的令牌失效由前端清除本地存储
    """
    user_id = current_user.get("user_id", "unknown")
    token = credentials.credentials

    # 获取 Token 剩余有效时间
    try:
        payload = jwt_service.get_token_payload(token)
        exp = payload.get("exp", 0)
        now = int(datetime.now(UTC).timestamp())
        expire_seconds = exp - now
        if expire_seconds > 0:
            blacklist_service.add(token, expire_seconds)
    except Exception:
        pass

    return LogoutResponse(
        message="登出成功",
        user_id=user_id,
    )


__all__ = ["router"]
