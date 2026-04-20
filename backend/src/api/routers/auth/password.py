#!/usr/bin/env python
# 文件名: password.py
# 作者: wuhao
# 日期: 2026_04_09_21:05:00
# 描述: 密码管理接口(修改密码/忘记密码/重置密码)

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from infrastructure.database import get_db_session
from infrastructure.repositories.user_repository import UserRepository
from infrastructure.security.password import PasswordService, get_password_service

router = APIRouter()


class ChangePasswordRequest(BaseModel):
    """修改密码请求"""

    old_password: Annotated[str, Field(min_length=6, max_length=128, description="旧密码")]
    new_password: Annotated[str, Field(min_length=6, max_length=128, description="新密码")]


class ResetPasswordRequest(BaseModel):
    """重置密码请求(管理员用)"""

    user_id: Annotated[str, Field(description="用户 ID")]
    new_password: Annotated[str, Field(min_length=6, max_length=128, description="新密码")]


class PasswordResponse(BaseModel):
    """密码操作响应"""

    message: str = Field(description="提示信息")


@router.post("/password/change", response_model=PasswordResponse, tags=["认证"])
async def change_password(
    request: ChangePasswordRequest,
    current_user: CurrentUser,
    password_service: Annotated[PasswordService, Depends(get_password_service)],
    session: Annotated[Session, Depends(get_db_session)],
) -> PasswordResponse:
    """修改当前用户密码

    Args:
        request: 修改密码请求(旧密码、新密码)
        current_user: 当前登录用户
        password_service: 密码服务实例
        session: 数据库会话

    Returns:
        PasswordResponse: 操作成功信息

    Raises:
        HTTPException: 验证失败(400/401)
    """
    user_id = current_user.get("user_id", "")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 401, "message": "无效的认证信息"},
        )

    user_repo = UserRepository(session)

    # 获取当前密码哈希
    password_hash = user_repo.get_password_hash(user_id)
    if not password_hash:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "用户不存在"},
        )

    # 验证旧密码
    if not password_service.verify(request.old_password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 401, "message": "旧密码不正确"},
        )

    # 验证新密码不能与旧密码相同
    if request.old_password == request.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": "新密码不能与旧密码相同"},
        )

    # 哈希新密码并更新
    new_hash = password_service.hash(request.new_password)
    user_repo.update(user_id, password_hash=new_hash)

    return PasswordResponse(message="密码修改成功")


@router.post("/password/reset", response_model=PasswordResponse, tags=["认证"])
async def reset_password(
    request: ResetPasswordRequest,
    current_user: CurrentUser,
    password_service: Annotated[PasswordService, Depends(get_password_service)],
    session: Annotated[Session, Depends(get_db_session)],
) -> PasswordResponse:
    """重置用户密码(仅管理员)

    Args:
        request: 重置密码请求
        current_user: 当前登录用户
        password_service: 密码服务实例
        session: 数据库会话

    Returns:
        PasswordResponse: 操作成功信息

    Raises:
        HTTPException: 权限不足(403)
    """
    # 检查是否为管理员
    role = current_user.get("role", "")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "权限不足,仅管理员可执行此操作"},
        )

    user_repo = UserRepository(session)

    # 检查目标用户是否存在
    target_user = user_repo.get_by_user_id(request.user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "用户不存在"},
        )

    # 哈希新密码并更新
    new_hash = password_service.hash(request.new_password)
    user_repo.update(request.user_id, password_hash=new_hash)

    return PasswordResponse(message=f"用户 {target_user.t_username} 的密码已重置")


__all__ = ["router"]
