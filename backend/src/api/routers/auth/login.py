#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: login.py
# 作者: wuhao
# 日期: 2026_04_09_21:00:00
# 描述: 用户登录接口

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from infrastructure.security.jwt import JWTService, get_jwt_service
from infrastructure.security.password import PasswordService, get_password_service

router = APIRouter()


class LoginRequest(BaseModel):
    """登录请求"""
    username: Annotated[str, Field(min_length=3, max_length=64, description="用户名")]
    password: Annotated[str, Field(min_length=6, max_length=128, description="密码")]


class LoginResponse(BaseModel):
    """登录响应"""
    access_token: str = Field(description="访问令牌")
    refresh_token: str = Field(description="刷新令牌")
    token_type: str = Field(default="Bearer", description="令牌类型")
    expires_in: int = Field(description="访问令牌过期时间（秒）")
    user: dict[str, Any] = Field(description="用户信息")


@router.post("/login", response_model=LoginResponse, tags=["认证"])
async def login(
    request: LoginRequest,
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
) -> LoginResponse:
    """用户登录

    Args:
        request: 登录请求参数（用户名、密码）
        jwt_service: JWT 服务实例

    Returns:
        LoginResponse: 登录成功返回令牌和用户信息

    Raises:
        HTTPException: 认证失败（401）

    Note:
        实际的用户验证需要配合 UserRepository 从数据库查询用户信息
        此接口为框架实现，数据库集成后续完善
    """
    # TODO: 集成 UserRepository 进行真实用户验证
    # 目前返回示例数据，实际使用时替换为数据库查询

    # 生成令牌
    access_token = jwt_service.create_access_token(
        user_id="demo_user_id",
        username=request.username,
        role="normal",
        tenant_id=None,
    )
    refresh_token = jwt_service.create_refresh_token(
        user_id="demo_user_id",
    )

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        expires_in=30 * 60,
        user={
            "user_id": "demo_user_id",
            "username": request.username,
            "role": "normal",
        },
    )


__all__ = ["router"]
