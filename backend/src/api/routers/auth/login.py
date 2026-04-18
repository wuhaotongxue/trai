#!/usr/bin/env python
# 文件名: login.py
# 作者: wuhao
# 日期: 2026_04_09_21:00:00
# 描述: 用户登录接口

from __future__ import annotations

import base64
import os
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from infrastructure.database import get_session
from infrastructure.repositories.user_repository import UserRepository
from infrastructure.security.jwt import JWTService, get_jwt_service
from infrastructure.security.password import PasswordService, get_password_service

router = APIRouter()

DEMO_USERNAME = os.getenv("DEMO_USERNAME", "wuhao")
DEMO_PASSWORD_PLAIN = os.getenv("DEMO_PASSWORD", "Tr@@2026...")
AES_KEY = os.getenv("AES_KEY", "TraiSecretKey32BytesLong!!").encode().ljust(32, b"0")[:32]
AES_IV = os.getenv("AES_IV", "TraiInitVector").encode().ljust(16, b"0")[:16]


def aes_encrypt(plaintext: str) -> str:
    """AES 加密密码"""
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    cipher = Cipher(algorithms.AES(AES_KEY), modes.CBC(AES_IV))
    encryptor = cipher.encryptor()
    padded = plaintext.encode().ljust(32, b" ")
    return base64.b64encode(encryptor.update(padded) + encryptor.finalize()).decode()


def aes_decrypt(ciphertext: str) -> str:
    """AES 解密密码"""
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    cipher = Cipher(algorithms.AES(AES_KEY), modes.CBC(AES_IV))
    decryptor = cipher.decryptor()
    padded = decryptor.update(base64.b64decode(ciphertext)) + decryptor.finalize()
    return padded.decode().strip()


class LoginRequest(BaseModel):
    """登录请求"""

    username: Annotated[str, Field(min_length=3, max_length=64, description="用户名")]
    password: Annotated[str, Field(min_length=6, max_length=128, description="密码")]


class EncryptedLoginRequest(BaseModel):
    """加密密码登录请求"""

    username: Annotated[str, Field(min_length=3, max_length=64, description="用户名")]
    encrypted_password: Annotated[str, Field(description="AES 加密的密码")]


class DemoAccountResponse(BaseModel):
    """Demo 账号响应"""

    username: str = Field(description="用户名")


class LoginResponse(BaseModel):
    """登录响应"""

    access_token: str = Field(description="访问令牌")
    refresh_token: str = Field(description="刷新令牌")
    token_type: str = Field(default="Bearer", description="令牌类型")
    expires_in: int = Field(description="访问令牌过期时间(秒)")
    user: dict[str, Any] = Field(description="用户信息")


@router.post("/login", response_model=LoginResponse, tags=["认证"])
async def login(
    request: LoginRequest,
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
    password_service: Annotated[PasswordService, Depends(get_password_service)],
    session: Annotated[Session, Depends(get_session)],
) -> LoginResponse:
    """用户登录

    Args:
        request: 登录请求参数(用户名、密码)
        jwt_service: JWT 服务实例
        password_service: 密码服务实例
        session: 数据库会话

    Returns:
        LoginResponse: 登录成功返回令牌和用户信息

    Raises:
        HTTPException: 认证失败(401)
    """
    # 从数据库查询用户
    user_repo = UserRepository(session)
    user = user_repo.get_by_username(request.username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 401, "message": "用户名或密码错误"},
        )

    # 检查是否为 demo 账号
    if request.username == DEMO_USERNAME and request.password == DEMO_PASSWORD_PLAIN:
        # demo 账号直接通过
        pass
    else:
        # 普通账号验证密码
        # 获取密码哈希并验证
        password_hash = user_repo.get_password_hash(user.user_id)
        if not password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": 401, "message": "用户名或密码错误"},
            )

        # 验证密码
        if not password_service.verify(request.password, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": 401, "message": "用户名或密码错误"},
            )

    # 检查用户状态
    if not user.is_active():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "账户已被禁用,请联系管理员"},
        )

    # 生成令牌
    access_token = jwt_service.create_access_token(
        user_id=user.user_id,
        username=user.username,
        role=user.role.value,
        tenant_id=user.tenant_id,
    )
    refresh_token = jwt_service.create_refresh_token(user_id=user.user_id)

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        expires_in=30 * 60,
        user={
            "user_id": user.user_id,
            "username": user.username,
            "display_name": user.display_name,
            "email": user.email,
            "role": user.role.value,
        },
    )


@router.post("/login/encrypted", response_model=LoginResponse, tags=["认证"])
async def login_with_encrypted_password(
    request: EncryptedLoginRequest,
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
    password_service: Annotated[PasswordService, Depends(get_password_service)],
    session: Annotated[Session, Depends(get_session)],
) -> LoginResponse:
    """使用加密密码登录（demo 账号专用）

    Args:
        request: 加密登录请求
        jwt_service: JWT 服务实例
        password_service: 密码服务实例
        session: 数据库会话

    Returns:
        LoginResponse: 登录成功返回令牌和用户信息
    """
    decrypted_password = aes_decrypt(request.encrypted_password)
    return await login(
        LoginRequest(username=request.username, password=decrypted_password),
        jwt_service,
        password_service,
        session,
    )


@router.get("/demo", response_model=DemoAccountResponse, tags=["认证"])
async def get_demo_account() -> DemoAccountResponse:
    """获取 demo 测试账号信息

    Returns:
        DemoAccountResponse: demo 账号信息
    """
    return DemoAccountResponse(username=DEMO_USERNAME)


__all__ = ["router"]
