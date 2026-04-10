#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: chat.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: AI 对话接口

from __future__ import annotations

from typing import Annotated, Any, AsyncIterator

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from application.usecases.chat import ChatInput, ChatOutput, ChatUseCase
from infrastructure.ai.openai_client import OpenAIClient
from infrastructure.database import get_session

router = APIRouter()


class ChatRequest(BaseModel):
    """对话请求"""
    messages: Annotated[list[dict[str, str]], Field(description="消息列表，每条消息包含 role 和 content")]
    model: Annotated[str, Field(default="gpt-4o", description="模型名称")] = "gpt-4o"
    temperature: Annotated[float, Field(ge=0, le=2, default=0.7, description="温度参数")] = 0.7
    max_tokens: Annotated[int, Field(ge=1, le=128000, default=4096, description="最大 token 数")] = 4096


class ChatResponse(BaseModel):
    """对话响应（非流式）"""
    content: str = Field(description="AI 响应内容")
    model: str = Field(description="实际使用的模型")
    usage: dict[str, Any] = Field(description="token 使用量")
    finish_reason: str = Field(description="结束原因")


@router.post("/chat", response_model=ChatResponse, tags=["AI"])
async def chat(
    request: ChatRequest,
    current_user: CurrentUser,
) -> ChatResponse:
    """AI 对话接口（非流式）

    Args:
        request: 对话请求参数
        current_user: 当前登录用户

    Returns:
        ChatResponse: AI 响应结果

    Raises:
        HTTPException: AI 服务错误（502）
    """
    user_id = current_user.get("user_id", "")

    try:
        client = OpenAIClient()
        use_case = ChatUseCase(ai_client=client)

        input_data = ChatInput(
            messages=request.messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
        result = await use_case.execute(input_data)

        return ChatResponse(
            content=result.content,
            model=result.model,
            usage=result.usage,
            finish_reason=result.finish_reason or "stop",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 服务错误: {str(e)}"},
        )


@router.post("/chat/stream", tags=["AI"])
async def chat_stream(
    request: ChatRequest,
    current_user: CurrentUser,
) -> StreamingResponse:
    """AI 对话接口（流式响应）

    Args:
        request: 对话请求参数
        current_user: 当前登录用户

    Returns:
        StreamingResponse: SSE 流式响应
    """
    user_id = current_user.get("user_id", "")

    async def generate() -> AsyncIterator[bytes]:
        try:
            client = OpenAIClient()
            async for chunk in client.chat_stream(
                messages=request.messages,
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            ):
                # 格式化 SSE 事件
                data = f"data: {chunk}\n\n"
                yield data.encode("utf-8")

            yield b"data: [DONE]\n\n"

        except Exception as e:
            error_data = f"data: {{\"error\": \"{str(e)}\"}}\n\n"
            yield error_data.encode("utf-8")

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat/new", response_model=ChatResponse, tags=["AI"])
async def chat_with_session(
    session_id: Annotated[str, Body(description="会话 ID")],
    content: Annotated[str, Body(description="用户消息内容")],
    model: Annotated[str, Body(default="gpt-4o", description="模型名称")] = "gpt-4o",
    temperature: Annotated[float, Body(ge=0, le=2, default=0.7)] = 0.7,
    current_user: CurrentUser = None,
) -> ChatResponse:
    """在新会话中发送消息并自动创建会话

    Args:
        session_id: 会话 ID
        content: 用户消息
        model: 模型名称
        temperature: 温度参数
        current_user: 当前登录用户

    Returns:
        ChatResponse: AI 响应
    """
    # 此接口需要集成会话管理和 AI ��话
    # 暂时返回占位响应
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={"code": 501, "message": "此接口正在开发中，请使用 /chat 接口配合 /api/sessions/{id}/messages"},
    )


__all__ = ["router"]
