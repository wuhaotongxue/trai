#!/usr/bin/env python
# 文件名: register.py
# 作者: wuhao
# 日期: 2026_04_09_21:00:00
# 描述: 用户注册接口

from __future__ import annotations

import re
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from infrastructure.database import get_db_session
from infrastructure.repositories.user_repository import UserRepository
from infrastructure.security.jwt import JWTService, get_jwt_service
from infrastructure.security.password import PasswordService, get_password_service

router = APIRouter()

# 用户名正则:字母,数字,下划线,3-32字符
USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{3,32}$")
# 邮箱正则
EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class RegisterRequest(BaseModel):
    """注册请求"""

    username: Annotated[str, Field(min_length=3, max_length=64, description="用户名")]
    password: Annotated[str, Field(min_length=6, max_length=128, description="密码")]
    email: Annotated[str, Field(description="邮箱地址")]
    display_name: Annotated[str | None, Field(default=None, max_length=128, description="显示名称")]


class RegisterResponse(BaseModel):
    """注册响应"""

    user_id: str = Field(description="用户唯一标识")
    username: str = Field(description="用户名")
    email: str = Field(description="邮箱地址")
    message: str = Field(default="注册成功", description="提示信息")


@router.post("/register", response_model=RegisterResponse, tags=["认证"])
async def register(
    request: RegisterRequest,
    password_service: Annotated[PasswordService, Depends(get_password_service)],
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
    session: Annotated[Session, Depends(get_db_session)],
) -> RegisterResponse:
    """用户注册

    Args:
        request: 注册请求参数
        password_service: 密码服务实例
        jwt_service: JWT 服务实例
        session: 数据库会话

    Returns:
        RegisterResponse: 注册成功返回用户信息

    Raises:
        HTTPException: 注册失败(400/409)
    """
    # 验证用户名格式
    if not USERNAME_PATTERN.match(request.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": "用户名格式不正确,需为字母,数字,下划线,3-32字符"},
        )

    # 验证邮箱格式
    if not EMAIL_PATTERN.match(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": "邮箱格式不正确"},
        )

    # 验证密码强度
    password = request.password
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": "密码长度至少8个字符"},
        )

    # 检查用户名/邮箱是否已存在
    user_repo = UserRepository(session)

    existing_user = user_repo.get_by_username(request.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": 409, "message": "用户名已存在"},
        )

    existing_email = user_repo.get_by_email(request.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": 409, "message": "邮箱已被注册"},
        )

    # 生成用户 ID
    user_id = str(uuid.uuid4())

    # 哈希密码
    password_hash = password_service.hash(password)

    # 设置显示名称
    display_name = request.display_name or request.username

    # 创建用户
    user = user_repo.create(
        user_id=user_id,
        username=request.username,
        display_name=display_name,
        email=request.email,
        password_hash=password_hash,
        role="normal",
        status="active",
    )

    return RegisterResponse(
        user_id=user.t_user_id,
        username=user.t_username,
        email=user.t_email,
        message="注册成功",
    )


__all__ = ["router"]
