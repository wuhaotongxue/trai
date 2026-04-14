#!/usr/bin/env python
# 文件名: logout.py
# 作者: wuhao
# 日期: 2026_04_09_21:00:00
# 描述: 用户登出接口

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from api.deps import CurrentUser

router = APIRouter()


class LogoutResponse(BaseModel):
    """登出响应"""

    message: str = Field(default="登出成功", description="提示信息")
    user_id: str = Field(description="登出的用户 ID")


@router.post("/logout", tags=["认证"])
async def logout(
    current_user: CurrentUser,
) -> LogoutResponse:
    """用户登出

    Args:
        current_user: 当前登录用户（从 Token 中解析）

    Returns:
        LogoutResponse: 登出成功信息

    Note:
        JWT 是无状态的，令牌一旦签发在过期前都有效
        真正的登出需要结合 Redis 黑名单或数据库存储
        此接口记录登出日志，实际的令牌失效由前端清除本地存储
    """
    user_id = current_user.get("user_id", "unknown")

    # TODO: 如果启用了 Token 黑名单，将令牌加入黑名单
    # await blacklist_service.add(token)

    return LogoutResponse(
        message="登出成功",
        user_id=user_id,
    )


__all__ = ["router"]
