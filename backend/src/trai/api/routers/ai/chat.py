#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: chat.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: AI 对话接口

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Body

from trai.application.usecases.chat import ChatInput, ChatOutput, ChatUseCase
from trai.infrastructure.ai.openai_client import OpenAIClient

router = APIRouter()


def get_chat_use_case() -> ChatUseCase:
    """获取对话用例实例"""
    client = OpenAIClient()
    return ChatUseCase(ai_client=client)


@router.post("/chat")
async def chat(
    messages: list[dict[str, str]] = Body(..., description="消息列表"),
    model: str = Body("gpt-4o", description="模型名称"),
    temperature: float = Body(0.7, ge=0, le=2, description="温度参数"),
    max_tokens: int = Body(4096, ge=1, le=128000, description="最大 token 数"),
) -> dict[str, Any]:
    """AI 对话接口

    Args:
        messages: 消息列表，每条消息包含 role 和 content
        model: 模型名称
        temperature: 温度参数 (0-2)
        max_tokens: 最大 token 数

    Returns:
        dict: AI 响应结果
    """
    use_case = get_chat_use_case()
    input_data = ChatInput(
        messages=messages,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    result = await use_case.execute(input_data)
    return {
        "content": result.content,
        "model": result.model,
        "usage": result.usage,
    }


__all__ = ["router"]
