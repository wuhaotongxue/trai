#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: openai_client.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: OpenAI 客户端适配器

from __future__ import annotations

import os
from typing import Any

import httpx
from loguru import logger

from trai.core.exceptions import ExternalServiceError


class OpenAIClient:
    """OpenAI 客户端"""

    def __init__(self) -> None:
        self._api_key: str = os.getenv("OPENAI_API_KEY", "")
        self._base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self._model: str = os.getenv("OPENAI_MODEL", "gpt-4o")
        self._timeout: int = int(os.getenv("OPENAI_TIMEOUT", "120"))

    async def chat(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        """发送对话请求

        Args:
            messages: 消息列表
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大 token 数

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
        payload = {
            "model": model or self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        logger.info(f"OpenAI 请求 | 模型: {payload['model']}")

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                return {
                    "content": data["choices"][0]["message"]["content"],
                    "model": data["model"],
                    "usage": data.get("usage", {}),
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


__all__ = ["OpenAIClient"]
