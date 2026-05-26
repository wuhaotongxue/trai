#!/usr/bin/env python
# 文件名: chat.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: AI 对话用例

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from application.usecases.base import UseCase


@dataclass
class ChatInput:
    """对话输入"""

    messages: list[dict[str, str]]
    model: str = "gpt-4o"
    temperature: float = 0.7
    max_tokens: int = 4096
    stream: bool = False


@dataclass
class ChatOutput:
    """对话输出"""

    content: str
    model: str
    usage: dict[str, Any] = field(default_factory=dict)
    session_id: str | None = None


class ChatUseCase(UseCase[ChatInput, ChatOutput]):
    """AI 对话用例"""

    def __init__(self, ai_client: Any) -> None:
        self._ai_client = ai_client

    async def execute(self, input_data: ChatInput) -> ChatOutput:
        response = await self._ai_client.chat(
            messages=input_data.messages,
            model=input_data.model,
            temperature=input_data.temperature,
            max_tokens=input_data.max_tokens,
        )
        return ChatOutput(
            content=response["content"],
            model=response["model"],
            usage=response.get("usage", {}),
        )


__all__ = ["ChatUseCase", "ChatInput", "ChatOutput"]
