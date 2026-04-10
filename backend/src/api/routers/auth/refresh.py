#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: refresh.py
# 作者: wuhao
# 日期: 2026_04_09_21:00:00
# 描述: 刷新令牌接口

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.exceptions import AuthenticationError
from infrastructure.security.jwt import JWTService, get_jwt_service
from infrastructure.repositories.user_repository import UserRepository
from infrastructure.database import get_session

router = APIRouter()


class RefreshRequest(BaseModel):
    """刷新令牌请求"""
    refresh_token: str = Field(description="刷新令牌")


class RefreshResponse(BaseModel):
    """刷新令牌响应"""
    access_token: str = Field(description="新的访问令牌")
    refresh_token: str = Field(description="新的刷新令牌（可选）")
    token_type: str = Field(default="Bearer", description="令牌类型")
    expires_in: int = Field(description="访问令牌过期时间（秒）")


@router.post("/refresh", response_model=RefreshResponse, tags=["认证"])
async def refresh_token(
    request: RefreshRequest,
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
    session: Annotated[Session, Depends(get_session)],
) -> RefreshResponse:
    """刷新访问令牌

    Args:
        request: 刷新令牌请求
        jwt_service: JWT 服务实例
        session: 数据库会话

    Returns:
        RefreshResponse: 新的令牌对

    Raises:
        HTTPException: 刷新令牌无效或已过期（401）
    """
    try:
        # 验证刷新令牌
        payload = jwt_service.verify_token(request.refresh_token, expected_type="refresh")

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": 401, "message": "刷新令牌无效"},
            )

        # 从数据库获取最新的用户信息
        user_repo = UserRepository(session)
        user = user_repo.get_by_user_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": 401, "message": "用户不存在"},
            )

        # 检查用户状态
        if not user.is_active():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": 403, "message": "账户已被禁用"},
            )

        # 生成新的令牌对
        new_access_token = jwt_service.create_access_token(
            user_id=user.user_id,
            username=user.username,
            role=user.role.value,
            tenant_id=user.tenant_id,
        )
        new_refresh_token = jwt_service.create_refresh_token(user_id=user.user_id)

        return RefreshResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="Bearer",
            expires_in=30 * 60,
        )

    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 401, "message": e.message},
        )


__all__ = ["router"]
