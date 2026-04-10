#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: session.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: 会话管理接口

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from infrastructure.repositories.session_repository import (
    MessageRepository,
    SessionRepository,
)
from infrastructure.database import get_session

router = APIRouter()


class CreateSessionRequest(BaseModel):
    """创建会话请求"""
    title: Annotated[str | None, Field(default=None, max_length=255, description="会话标题")] = None
    model: Annotated[str, Field(default="gpt-4o", description="模型名称")] = "gpt-4o"


class SessionItem(BaseModel):
    """会话项"""
    session_id: str = Field(description="会话唯一标识")
    title: str | None = Field(description="会话标题")
    model: str = Field(description="模型名称")
    message_count: int = Field(default=0, description="消息数量")
    created_at: str | None = Field(description="创建时间")
    updated_at: str | None = Field(description="更新时间")


class CreateSessionResponse(BaseModel):
    """创建会话响应"""
    session_id: str = Field(description="会话唯一标识")
    title: str | None = Field(description="会话标题")
    model: str = Field(description="模型名称")
    message: str = Field(default="会话创建成功", description="提示信息")


class SessionListResponse(BaseModel):
    """会话列表响应"""
    total: int = Field(description="会话总数")
    sessions: list[SessionItem] = Field(description="会话列表")


class SessionDetailResponse(BaseModel):
    """会话详情响应"""
    session_id: str = Field(description="会话唯一标识")
    title: str | None = Field(description="会话标题")
    model: str = Field(description="模型名称")
    messages: list[dict[str, Any]] = Field(description="消息列表")
    created_at: str | None = Field(description="创建时间")
    updated_at: str | None = Field(description="更新时间")


class SendMessageRequest(BaseModel):
    """发送消息请求"""
    content: Annotated[str, Field(min_length=1, max_length=32000, description="消息���容")]
    role: Annotated[str, Field(default="user", description="消息角色")] = "user"


class SendMessageResponse(BaseModel):
    """发送消息响应"""
    session_id: str = Field(description="会话 ID")
    user_message: dict[str, Any] = Field(description="用户消息")
    assistant_message: dict[str, Any] = Field(description="助手回复")


class ActionResponse(BaseModel):
    """操作响应"""
    message: str = Field(description="提示信息")


@router.post("/sessions", response_model=CreateSessionResponse, tags=["会话"])
async def create_session(
    request: CreateSessionRequest,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> CreateSessionResponse:
    """创建新会话

    Args:
        request: 创建会话参数
        current_user: 当前登录用户
        session: 数据库会话

    Returns:
        CreateSessionResponse: 创建的会话信息
    """
    user_id = current_user.get("user_id")

    session_repo = SessionRepository(session)
    import uuid
    from datetime import datetime

    session_id = str(uuid.uuid4())
    title = request.title or "新对话"
    model = request.model

    db_session = session_repo.create_session(
        session_id=session_id,
        user_id=user_id,
        title=title,
        model=model,
    )

    return CreateSessionResponse(
        session_id=db_session.session_id,
        title=db_session.title,
        model=db_session.model,
        message="会话创建成功",
    )


@router.get("/sessions", response_model=SessionListResponse, tags=["会话"])
async def list_sessions(
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> SessionListResponse:
    """获取当前用户的会话列表

    Args:
        current_user: 当前登录用户
        session: 数据库会话
        limit: 每页数量
        offset: 偏移量

    Returns:
        SessionListResponse: 会话列表
    """
    user_id = current_user.get("user_id")

    session_repo = SessionRepository(session)
    message_repo = MessageRepository(session)

    sessions = session_repo.list_sessions(
        user_id=user_id,
        limit=limit,
        offset=offset,
    )

    items = []
    for s in sessions:
        messages = message_repo.get_messages(s.session_id)
        items.append(SessionItem(
            session_id=s.session_id,
            title=s.title,
            model=s.model,
            message_count=len(messages),
            created_at=s.created_at.isoformat() if s.created_at else None,
            updated_at=s.updated_at.isoformat() if s.updated_at else None,
        ))

    return SessionListResponse(
        total=len(items),
        sessions=items,
    )


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse, tags=["会话"])
async def get_session(
    session_id: str,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> SessionDetailResponse:
    """获取会话详情

    Args:
        session_id: 会话 ID
        current_user: 当前登录用户
        session: 数据库会话

    Returns:
        SessionDetailResponse: 会话详情

    Raises:
        HTTPException: 会话不存在（404）
    """
    user_id = current_user.get("user_id")

    session_repo = SessionRepository(session)
    message_repo = MessageRepository(session)

    chat_session = session_repo.get_session(session_id)
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "会话不存在"},
        )

    # 非管理员只能查看自己的会话
    role = current_user.get("role", "normal")
    if role != "admin" and chat_session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权访问此会话"},
        )

    messages = message_repo.get_messages(session_id)
    messages_dict = [{"role": m.role, "content": m.content} for m in messages]

    return SessionDetailResponse(
        session_id=chat_session.session_id,
        title=chat_session.title,
        model=chat_session.model,
        messages=messages_dict,
        created_at=chat_session.created_at.isoformat() if chat_session.created_at else None,
        updated_at=chat_session.updated_at.isoformat() if chat_session.updated_at else None,
    )


@router.delete("/sessions/{session_id}", response_model=ActionResponse, tags=["会话"])
async def delete_session(
    session_id: str,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> ActionResponse:
    """删除会话

    Args:
        session_id: 会话 ID
        current_user: 当前登录用户
        session: 数据库会话

    Returns:
        ActionResponse: 操作结果

    Raises:
        HTTPException: 会话不存在（404）
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "normal")

    session_repo = SessionRepository(session)
    message_repo = MessageRepository(session)

    chat_session = session_repo.get_session(session_id)
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "会话不存在"},
        )

    # 非管理员只能删除自己的会话
    if role != "admin" and chat_session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权删除此会话"},
        )

    # 删除消息和会话
    message_repo.delete_messages(session_id)
    session_repo.delete_session(session_id)

    return ActionResponse(message="会话已删除")


__all__ = ["router"]
