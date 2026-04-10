#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: openai_client.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: OpenAI 客户端适配器（支持 Vision 多模态、abort 中断、流式 token 统计）

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass, field
from typing import Any, AsyncIterator

import httpx
from loguru import logger

from core.exceptions import ExternalServiceError


@dataclass
class StreamEvent:
    """流式事件"""

    type: str
    content: str = ""
    tool_call_id: str = ""
    tool_name: str = ""
    tool_args: str = ""
    finish_reason: str = ""
    usage: dict[str, Any] = field(default_factory=dict)


class OpenAIClient:
    """OpenAI 客户端"""

    def __init__(self) -> None:
        self._api_key: str = os.getenv("OPENAI_API_KEY", "")
        self._base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self._model: str = os.getenv("OPENAI_MODEL", "gpt-4o")
        self._timeout: int = int(os.getenv("OPENAI_TIMEOUT", "120"))

    async def chat(
        self,
        messages: list[dict[str, Any]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: str | None = None,
    ) -> dict[str, Any]:
        """发送对话请求

        Args:
            messages: 消息列表（支持多模态 Vision 内容）
                文本消息: {"role": "user", "content": "text"}
                图片消息: {"role": "user", "content": [
                    {"type": "text", "text": "..."},
                    {"type": "image_url", "image_url": {"url": "https://..."}},
                ]}
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大 token 数
            tools: OpenAI tool_calls 格式的工具定义列表
            tool_choice: 工具选择策略: "auto" | "none" 或具体工具名

        Returns:
            dict: 响应结果
        """
        if not self._api_key:
            raise ExternalServiceError(
                message="OpenAI API 密钥未配置",
                details={"service": "openai"},
            )

        url = f"{self._base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": model or self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = tool_choice or "auto"

        logger.info(f"OpenAI 请求 | 模型: {payload['model']} | 工具数: {len(tools) if tools else 0}")

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                return {
                    "content": data["choices"][0]["message"].get("content", ""),
                    "model": data["model"],
                    "usage": data.get("usage", {}),
                    "tool_calls": data["choices"][0]["message"].get("tool_calls", []),
                    "finish_reason": data["choices"][0].get("finish_reason", ""),
                }

        except httpx.HTTPStatusError as e:
            logger.error(f"OpenAI HTTP 错误 | 状态码: {e.response.status_code}")
            raise ExternalServiceError(
                message=f"OpenAI API 请求失败: {e.response.status_code}",
                details={"status_code": e.response.status_code},
            )
        except Exception as e:
            logger.error(f"OpenAI 请求异常 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"OpenAI API 请求异常: {str(e)}",
                details={"error": str(e)},
            )

    async def chat_stream(
        self,
        messages: list[dict[str, Any]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict[str, Any]] | None = None,
        abort_event: asyncio.Event | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """发送流式对话请求（支持 Vision / abort / token 统计）

        事件流格式:
        - token: 普通文本片段
        - tool_call_start: 工具调用开始
        - tool_call_arg: 工具参数增量
        - tool_call_end: 工具调用结束
        - done: 流结束，包含 usage 统计

        Args:
            messages: 消息列表（支持多模态 Vision 内容）
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大 token 数
            tools: OpenAI tool_calls 格式的工具定义列表
            abort_event: 中断信号，为 None 则忽略

        Yields:
            StreamEvent: 流式事件
        """
        if not self._api_key:
            raise ExternalServiceError(
                message="OpenAI API 密钥未配置",
                details={"service": "openai"},
            )

        url = f"{self._base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": model or self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        if tools:
            payload["tools"] = tools

        logger.info(f"OpenAI 流式请求 | 模型: {payload['model']}")

        tool_call_id = ""
        tool_name = ""
        tool_args_parts: list[str] = []
        in_tool_call = False

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if abort_event and abort_event.is_set():
                            logger.info("流式请求被 abort 终止")
                            yield StreamEvent(type="abort", content="请求已被取消")
                            break

                        if not line or not line.startswith("data: "):
                            continue

                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break

                        import json
                        try:
                            chunk = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue

                        if "choices" not in chunk or not chunk["choices"]:
                            continue

                        choice = chunk["choices"][0]
                        delta = choice.get("delta", {})

                        if "content_block_delta" in delta:
                            cb_type = delta.get("type", "")
                            if cb_type == "text_delta":
                                text = delta.get("text", "")
                                if text:
                                    yield StreamEvent(type="token", content=text)
                            elif cb_type == "tool_use":
                                in_tool_call = True
                                tool_call_id = delta.get("id", "")
                                tool_name = delta.get("name", "")
                                arg_text = delta.get("input", "")
                                if arg_text:
                                    tool_args_parts.append(arg_text)
                                yield StreamEvent(
                                    type="tool_call_arg",
                                    tool_call_id=tool_call_id,
                                    tool_name=tool_name,
                                    content=arg_text,
                                )

                        elif "tool_call" in delta:
                            tc = delta["tool_call"]
                            if tc.get("type") == "function":
                                in_tool_call = True
                                tool_call_id = tc.get("id", "")
                                tool_name = tc.get("function", {}).get("name", "")
                                arg_text = tc.get("function", {}).get("arguments", "")
                                if arg_text:
                                    tool_args_parts.append(arg_text)
                                yield StreamEvent(
                                    type="tool_call_arg",
                                    tool_call_id=tool_call_id,
                                    tool_name=tool_name,
                                    content=arg_text,
                                )

                        elif "finish_reason" in choice:
                            finish_reason = choice.get("finish_reason", "")
                            if in_tool_call and tool_call_id:
                                yield StreamEvent(
                                    type="tool_call_end",
                                    tool_call_id=tool_call_id,
                                    tool_name=tool_name,
                                    content="".join(tool_args_parts),
                                    finish_reason=finish_reason,
                                )
                                in_tool_call = False
                                tool_call_id = ""
                                tool_name = ""
                                tool_args_parts = []

                            usage = chunk.get("usage", {})
                            if usage:
                                yield StreamEvent(
                                    type="done",
                                    finish_reason=finish_reason,
                                    usage={
                                        "prompt_tokens": usage.get("prompt_tokens", 0),
                                        "completion_tokens": usage.get("completion_tokens", 0),
                                        "total_tokens": usage.get("total_tokens", 0),
                                    },
                                )

        except httpx.HTTPStatusError as e:
            logger.error(f"OpenAI 流式 HTTP 错误 | 状态码: {e.response.status_code}")
            raise ExternalServiceError(
                message=f"OpenAI API 流式请求失败: {e.response.status_code}",
                details={"status_code": e.response.status_code},
            )
        except Exception as e:
            logger.error(f"OpenAI 流式请求异常 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"OpenAI API 流式请求异常: {str(e)}",
                details={"error": str(e)},
            )


__all__ = ["OpenAIClient", "StreamEvent"]
