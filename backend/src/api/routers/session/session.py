#!/usr/bin/env python
# 文件名: session.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: 会话管理接口

from __future__ import annotations

import asyncio
import json
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from core.context_manager import ContextManager, get_context_manager
from core.policy_engine import PolicyContext, PolicyDecision, get_policy_engine
from infrastructure.database import get_session
from infrastructure.repositories.session_repository import (
    MessageRepository,
    SessionRepository,
)

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


@router.post("/sessions/{session_id}/messages", response_model=SendMessageResponse, tags=["会话"])
async def send_message(
    session_id: str,
    request: SendMessageRequest,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> SendMessageResponse:
    """发送消息（联动 AI 对话）

    Args:
        session_id: 会话 ID
        request: 消息内容
        current_user: 当前登录用户
        session: 数据库会话

    Returns:
        SendMessageResponse: 发送结果

    Raises:
        HTTPException: 会话不存在（404）或无权访问（403）
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "normal")

    session_repo = SessionRepository(session)
    message_repo = MessageRepository(session)

    # 检查会话是否存在
    chat_session = session_repo.get_session(session_id)
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "会话不存在"},
        )

    # 权限校验：非管理员只能访问自己的会话
    if role != "admin" and chat_session.t_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权访问此会话"},
        )

    # 保存用户消息
    user_msg = message_repo.add_message(
        session_id=session_id,
        role=request.role or "user",
        content=request.content,
    )

    # 获取历史消息
    messages = message_repo.get_messages(session_id)
    messages_dict = [{"role": m.t_role, "content": m.t_content} for m in messages]

    # 上下文管理：检查并压缩超限上下文
    context_manager: ContextManager = get_context_manager()
    managed_messages, context_stats = context_manager.check_and_manage(messages_dict, session_id)

    # 调用 AI
    try:
        from infrastructure.ai.openai_client import OpenAIClient

        ai_client = OpenAIClient()
        ai_response = await ai_client.chat(
            messages=managed_messages,
            model=chat_session.model or "gpt-4o",
        )

        # 保存 AI 响应
        message_repo.add_message(
            session_id=session_id,
            role="assistant",
            content=ai_response["content"],
        )

        # 更新会话摘要（标题）
        if len(messages) == 1:
            title = request.content[:30] + ("..." if len(request.content) > 30 else "")
            session_repo.update_session(session_id=session_id, title=title)

        return SendMessageResponse(
            session_id=session_id,
            user_message={"role": user_msg.t_role, "content": user_msg.t_content},
            assistant_message={"role": "assistant", "content": ai_response["content"]},
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 服务调用失败: {str(e)}"},
        )


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
        session_id=db_session.t_session_id,
        title=db_session.t_title,
        model=db_session.t_model,
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
        messages = message_repo.get_messages(s.t_session_id)
        items.append(
            SessionItem(
                session_id=s.t_session_id,
                title=s.t_title,
                model=s.t_model,
                message_count=len(messages),
                created_at=s.t_created_at.isoformat() if s.t_created_at else None,
                updated_at=s.t_updated_at.isoformat() if s.t_updated_at else None,
            )
        )

    return SessionListResponse(
        total=len(items),
        sessions=items,
    )


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse, tags=["会话"])
async def get_session_detail(
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
    if role != "admin" and chat_session.t_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权访问此会话"},
        )

    messages = message_repo.get_messages(session_id)
    messages_dict = [{"role": m.t_role, "content": m.t_content} for m in messages]

    return SessionDetailResponse(
        session_id=chat_session.t_session_id,
        title=chat_session.t_title,
        model=chat_session.t_model,
        messages=messages_dict,
        created_at=chat_session.t_created_at.isoformat() if chat_session.t_created_at else None,
        updated_at=chat_session.t_updated_at.isoformat() if chat_session.t_updated_at else None,
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

    # PolicyEngine 三态决策
    policy_engine = get_policy_engine()
    policy_ctx = PolicyContext(
        user_id=user_id,
        role=role,
        resource_type="session",
        resource_id=session_id,
        action="delete_session",
        session_id=session_id,
    )
    policy_result = policy_engine.evaluate(policy_ctx)

    if policy_result.decision == PolicyDecision.DENY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": 403,
                "message": policy_result.reason,
                "policy": policy_result.policy_name,
            },
        )

    if policy_result.decision == PolicyDecision.ASK:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": 403,
                "message": policy_result.reason,
                "policy": policy_result.policy_name,
                "require_confirmation": True,
            },
        )

    # 删除消息和会话
    message_repo.delete_messages(session_id)
    session_repo.delete_session(session_id)

    return ActionResponse(message="会话已删除")


@router.post("/sessions/{session_id}/messages/stream", tags=["会话"])
async def send_message_stream(
    session_id: str,
    request: SendMessageRequest,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
):
    """发送消息（流式响应，支持 abort 中断）

    SSE 事件格式:
    - token: 文本片段 {"event": "token", "data": "..."}
    - tool_call_end: 工具调用结束 {"event": "tool_call_end", "data": {...}}
    - usage: token 统计 {"event": "usage", "data": {...}}
    - done: 完成 {"event": "done", "data": ""}
    - error: 错误 {"event": "error", "data": "..."}

    abort: 前端可通过 DELETE /sessions/{session_id}/messages/stream 终止当前流

    Args:
        session_id: 会话 ID
        request: 消息内容
        current_user: 当前登录用户
        session: 数据库会话

    Returns:
        StreamingResponse: SSE 流式响应
    """
    import asyncio

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

    if role != "admin" and chat_session.t_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权访问此会话"},
        )

    message_repo.add_message(
        session_id=session_id,
        role=request.role or "user",
        content=request.content,
    )

    messages = message_repo.get_messages(session_id)
    messages_dict = [{"role": m.t_role, "content": m.t_content} for m in messages]

    context_manager: ContextManager = get_context_manager()
    managed_messages, context_stats = context_manager.check_and_manage(messages_dict, session_id)

    abort_event = asyncio.Event()

    _active_abort_events[session_id] = abort_event

    from fastapi.responses import StreamingResponse

    from infrastructure.ai.openai_client import OpenAIClient

    async def generate():
        client = OpenAIClient()
        full_content = ""

        try:
            async for event in client.chat_stream(
                messages=managed_messages,
                model=chat_session.model or "gpt-4o",
                abort_event=abort_event,
            ):
                if event.type == "token":
                    full_content += event.content
                    data = json.dumps({"event": "token", "data": event.content})
                    yield f"data: {data}\n\n".encode()

                elif event.type == "tool_call_end":
                    data = json.dumps(
                        {
                            "event": "tool_call_end",
                            "data": {
                                "tool_call_id": event.tool_call_id,
                                "tool_name": event.tool_name,
                                "arguments": event.content,
                            },
                        }
                    )
                    yield f"data: {data}\n\n".encode()

                elif event.type == "done":
                    data = json.dumps(
                        {
                            "event": "usage",
                            "data": event.usage,
                        }
                    )
                    yield f"data: {data}\n\n".encode()
                    data = json.dumps({"event": "done", "data": ""})
                    yield f"data: {data}\n\n".encode()

                elif event.type == "abort":
                    data = json.dumps({"event": "error", "data": "请求已取消"})
                    yield f"data: {data}\n\n".encode()

        except Exception as e:
            logger.error(f"流式请求异常: {e}")
            error_data = json.dumps({"event": "error", "data": str(e)})
            yield f"data: {error_data}\n\n".encode()

        finally:
            _active_abort_events.pop(session_id, None)

            if full_content:
                message_repo.add_message(
                    session_id=session_id,
                    role="assistant",
                    content=full_content,
                )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


_active_abort_events: dict[str, asyncio.Event] = {}


@router.delete("/sessions/{session_id}/messages/stream", tags=["会话"])
async def abort_stream(
    session_id: str,
    current_user: CurrentUser,
) -> dict[str, str]:
    """中断指定会话的流式请求

    Args:
        session_id: 会话 ID
        current_user: 当前登录用户

    Returns:
        dict: 操作结果
    """
    abort_event = _active_abort_events.get(session_id)
    if abort_event:
        abort_event.set()
        return {"message": "流式请求已终止", "session_id": session_id}

    return {"message": "当前无活跃流式请求", "session_id": session_id}


class PolicyConfirmRequest(BaseModel):
    """策略确认请求"""

    action: Annotated[str, Field(description="操作名称")]
    resource_type: Annotated[str, Field(description="资源类型")]
    resource_id: Annotated[str | None, Field(default=None, description="资源 ID")] = None


class PolicyConfirmResponse(BaseModel):
    """策略确认响应"""

    confirmed: bool = Field(description="是否确认成功")
    message: str = Field(description="提示信息")


@router.post("/policy/confirm", response_model=PolicyConfirmResponse, tags=["策略"])
async def policy_confirm(
    request: PolicyConfirmRequest,
    current_user: CurrentUser,
) -> PolicyConfirmResponse:
    """确认危险操作

    当高危操作返回 ASK 状态时，前端调用此接口完成二次确认。
    确认成功后，操作可直接执行。

    Args:
        request: 确认请求参数
        current_user: 当前登录用户

    Returns:
        PolicyConfirmResponse: 确认结果
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "normal")

    policy_engine = get_policy_engine()
    policy_ctx = PolicyContext(
        user_id=user_id,
        role=role,
        resource_type=request.resource_type,
        resource_id=request.resource_id,
        action=request.action,
        session_id=request.resource_id,
    )

    success = policy_engine.confirm_action(policy_ctx)

    return PolicyConfirmResponse(
        confirmed=success,
        message="操作已确认" if success else "确认失败，请重试",
    )


__all__ = ["router"]
