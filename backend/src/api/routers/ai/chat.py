#!/usr/bin/env python
# 文件名: chat.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: AI 对话接口 - 集成对话历史持久化

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from typing import Annotated, Any

from application.usecases.chat import ChatInput, ChatUseCase
from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from infrastructure.ai.core.openai_client import OpenAIClient
from infrastructure.database import get_db_session
from infrastructure.services.chat_history_service import get_chat_history_service

router = APIRouter()


class ChatRequest(BaseModel):
    """对话请求"""

    messages: Annotated[list[dict[str, str]], Field(description="消息列表,每条消息包含 role 和 content")]
    model: Annotated[str, Field(default="gpt-4o", description="模型名称")] = "gpt-4o"
    temperature: Annotated[float, Field(ge=0, le=2, default=0.7, description="温度参数")] = 0.7
    max_tokens: Annotated[int, Field(ge=1, le=128000, default=4096, description="最大 token 数")] = 4096


class ChatResponse(BaseModel):
    """对话响应(非流式)"""

    content: str = Field(description="AI 响应内容")
    model: str = Field(description="实际使用的模型")
    usage: dict[str, Any] = Field(description="token 使用量")
    finish_reason: str = Field(description="结束原因")


@router.post("/chat", response_model=ChatResponse, tags=["AI"])
async def chat(
    request: ChatRequest,
    current_user: CurrentUser,
) -> ChatResponse:
    """AI 对话接口(非流式)

    Args:
        request: 对话请求参数
        current_user: 当前登录用户

    Returns:
        ChatResponse: AI 响应结果

    Raises:
        HTTPException: AI 服务错误(502)
    """
    current_user.get("user_id", "")

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
    """AI 对话接口(流式响应)

    Args:
        request: 对话请求参数
        current_user: 当前登录用户

    Returns:
        StreamingResponse: SSE 流式响应
    """
    current_user.get("user_id", "")

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
            error_data = f'data: {{"error": "{str(e)}"}}\n\n'
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
    model: Annotated[str, Body(description="模型名称")] = "gpt-4o",
    temperature: Annotated[float, Body(ge=0, le=2)] = 0.7,
    current_user: CurrentUser = None,
    db_session: Annotated[Session, Depends(get_db_session)] = None,
) -> ChatResponse:
    """在新会话中发送消息并自动创建/加载会话

    集成对话历史持久化功能:
    - 自动创建新会话或加载已有会话
    - 保存用户消息和AI回复到数据库
    - 支持多轮对话上下文

    Args:
        session_id: 会话 ID(如果为空则自动生成)
        content: 用户消息
        model: 模型名称
        temperature: 温度参数
        current_user: 当前登录用户
        db_session: 数据库会话

    Returns:
        ChatResponse: AI 响应

    Raises:
        HTTPException: AI 服务错误(502)
    """
    try:
        user_id = current_user.get("user_id") if current_user else None

        # 使用 ChatHistoryService 管理对话历史
        history_service = get_chat_history_service(db_session)

        # 如果 session_id 为空,生成新的
        if not session_id or session_id.strip() == "":
            session_id = str(uuid.uuid4())
            logger.info(f"自动生成新会话 ID: {session_id}")

        # 尝试加载现有会话历史
        chat_session = history_service.load_session_history(session_id)

        if not chat_session:
            # 会话不存在,通过仓储创建(使用默认值)
            from infrastructure.repositories.session_repository import SessionRepository

            repo = SessionRepository(db_session)
            chat_session = repo.create_session(
                session_id=session_id,
                user_id=user_id,
                title="新对话",
                model=model,
            )
            logger.info(f"创建新会话 | session_id={session_id}")

        # 保存用户消息到数据库
        user_msg_entity = history_service.save_message(
            session_id=session_id,
            role="user",
            content=content,
        )

        # 获取完整的消息历史(包含刚保存的用户消息)
        updated_session = history_service.load_session_history(session_id)
        messages_for_ai = updated_session.to_ai_format()

        # 调用 AI 服务
        client = OpenAIClient()
        use_case = ChatUseCase(ai_client=client)

        input_data = ChatInput(
            messages=messages_for_ai,
            model=model or "gpt-4o",
            temperature=temperature,
            max_tokens=4096,
        )
        result = await use_case.execute(input_data)

        # 保存 AI 回复到数据库
        ai_msg_entity = history_service.save_message(
            session_id=session_id,
            role="assistant",
            content=result.content,
        )

        # 如果是第一条消息,更新会话标题
        if updated_session.message_count <= 1:
            auto_title = content[:30] + ("..." if len(content) > 30 else "")
            history_service.update_session_title(session_id=session_id, title=auto_title)

        logger.info(
            f"对话完成 | session_id={session_id} | "
            f"user_len={len(content)} | ai_len={len(result.content)} | "
            f"tokens={result.usage}"
        )

        return ChatResponse(
            content=result.content,
            model=result.model,
            usage=result.usage,
            finish_reason=result.finish_reason or "stop",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"chat_with_session 执行失败 | error={e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 服务错误: {str(e)}"},
        )


__all__ = ["router"]
