#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: session.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 会话管理接口

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Body, Header

from application.usecases.session import (
    CreateSessionInput,
    CreateSessionUseCase,
    DeleteSessionInput,
    DeleteSessionUseCase,
    GetSessionInput,
    GetSessionUseCase,
    ListSessionsInput,
    ListSessionsUseCase,
    SendMessageInput,
    SendMessageUseCase,
)

router = APIRouter()


@router.post("/sessions")
async def create_session(
    user_id: str | None = Body(None, description="用户 ID"),
    title: str | None = Body(None, description="会话标题"),
    model: str = Body("gpt-4o", description="模型名称"),
) -> dict[str, Any]:
    """创建新会话

    Args:
        user_id: 用户 ID
        title: 会话标题
        model: 模型名称

    Returns:
        dict: 创建的会话信息
    """
    use_case = CreateSessionUseCase()
    input_data = CreateSessionInput(
        user_id=user_id,
        title=title,
        model=model,
    )
    result = await use_case.execute(input_data)

    return {
        "code": 0,
        "message": "会话创建成功",
        "data": {
            "session_id": result.session_id,
            "title": result.title,
            "model": result.model,
            "messages": result.messages,
            "created_at": result.created_at,
            "updated_at": result.updated_at,
        },
    }


@router.get("/sessions")
async def list_sessions(
    user_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """获取会话列表

    Args:
        user_id: 用户 ID
        limit: 返回数量限制
        offset: 偏移量

    Returns:
        dict: 会话列表
    """
    use_case = ListSessionsUseCase()
    input_data = ListSessionsInput(
        user_id=user_id,
        limit=limit,
        offset=offset,
    )
    result = await use_case.execute(input_data)

    return {
        "code": 0,
        "message": "获取成功",
        "data": {
            "sessions": [
                {
                    "session_id": s.session_id,
                    "title": s.title,
                    "model": s.model,
                    "messages": s.messages,
                    "created_at": s.created_at,
                    "updated_at": s.updated_at,
                }
                for s in result.sessions
            ],
            "total": result.total,
        },
    }


@router.get("/sessions/{session_id}")
async def get_session(session_id: str) -> dict[str, Any]:
    """获取会话详情

    Args:
        session_id: 会话 ID

    Returns:
        dict: 会话详情
    """
    use_case = GetSessionUseCase()
    input_data = GetSessionInput(session_id=session_id)
    result = await use_case.execute(input_data)

    return {
        "code": 0,
        "message": "获取成功",
        "data": {
            "session_id": result.session_id,
            "title": result.title,
            "model": result.model,
            "messages": result.messages,
            "created_at": result.created_at,
            "updated_at": result.updated_at,
        },
    }


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    content: str = Body(..., description="消息内容"),
    role: str = Body("user", description="消息角色"),
) -> dict[str, Any]:
    """发送消息

    Args:
        session_id: 会话 ID
        content: 消息内容
        role: 消息角色

    Returns:
        dict: 消息响应
    """
    use_case = SendMessageUseCase()
    input_data = SendMessageInput(
        session_id=session_id,
        content=content,
        role=role,
    )
    result = await use_case.execute(input_data)

    return {
        "code": 0,
        "message": "发送成功",
        "data": {
            "session_id": result.session_id,
            "user_message": result.user_message,
            "assistant_message": result.assistant_message,
        },
    }


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str) -> dict[str, Any]:
    """删除会话

    Args:
        session_id: 会话 ID

    Returns:
        dict: 删除结果
    """
    use_case = DeleteSessionUseCase()
    input_data = DeleteSessionInput(session_id=session_id)
    success = await use_case.execute(input_data)

    return {
        "code": 0,
        "message": "删除成功" if success else "删除失败",
        "data": {"success": success},
    }


__all__ = ["router"]
