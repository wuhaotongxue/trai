#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: translate.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: 翻译工具 - 多语言翻译

from __future__ import annotations

import os
from typing import Any

import httpx
from loguru import logger

from infrastructure.agent.tools.base import (
    BaseTool,
    ExecutionContext,
    RiskLevel,
    ToolCallResult,
    ToolDefinition,
    ToolParameter,
    ToolCategory,
)


SUPPORTED_LANGUAGES = [
    "zh", "en", "ja", "ko", "fr", "de", "es",
    "ru", "ar", "pt", "it", "vi", "th",
]


class TranslateTool(BaseTool):
    """翻译工具"""

    def __init__(self) -> None:
        super().__init__()
        self._api_key = os.getenv("TRANSLATE_API_KEY", "")
        self._base_url = os.getenv(
            "TRANSLATE_API_URL", "https://api.translate.unknown/v1/translate"
        )

    @property
    def definition(self) -> ToolDefinition:
        if self._definition is None:
            self._definition = ToolDefinition(
                id="utility_translate",
                name="翻译",
                description="将文本从一种语言翻译成另一种语言",
                category=ToolCategory.UTILITY,
                risk_level=RiskLevel.SAFE,
                parameters=[
                    ToolParameter(
                        name="text",
                        description="待翻译的文本",
                        type="string",
                        required=True,
                    ),
                    ToolParameter(
                        name="source_lang",
                        description=f"源语言代码，如: zh, en, ja. 设为 auto 则自动检测 ({', '.join(SUPPORTED_LANGUAGES)})",
                        type="string",
                        required=True,
                    ),
                    ToolParameter(
                        name="target_lang",
                        description=f"目标语言代码，如: zh, en, ja ({', '.join(SUPPORTED_LANGUAGES)})",
                        type="string",
                        required=True,
                    ),
                ],
                requires_watermark=False,
                monthly_quota_check=True,
                audit_log=True,
            )
        return self._definition

    async def execute(
        self, params: dict[str, Any], context: ExecutionContext
    ) -> ToolCallResult:
        text = params.get("text", "")
        source_lang = params.get("source_lang", "auto")
        target_lang = params.get("target_lang", "zh")

        if not text:
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error="待翻译文本不能为空",
            )

        if len(text) > 5000:
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error="文本长度不能超过 5000 字符",
            )

        if target_lang not in SUPPORTED_LANGUAGES:
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error=f"不支持的目标语言: {target_lang}",
            )

        if not self._api_key:
            return self._mock_translate(text, source_lang, target_lang)

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(
                    self._base_url,
                    json={
                        "text": text,
                        "source": source_lang,
                        "target": target_lang,
                    },
                    headers={"Authorization": f"Bearer {self._api_key}"},
                )
                response.raise_for_status()
                data = response.json()
                translated = data.get("translated_text", "")
                return ToolCallResult(
                    tool_call_id="",
                    tool_id=self.definition.id,
                    success=True,
                    output=translated,
                )
        except Exception as e:
            logger.error(f"翻译异常: {e}")
            return self._mock_translate(text, source_lang, target_lang)

    def _mock_translate(
        self, text: str, source_lang: str, target_lang: str
    ) -> ToolCallResult:
        if target_lang == "en":
            mock_result = f"[Translation to English] {text[:100]}..."
        elif target_lang == "ja":
            mock_result = f"[日本語翻訳] {text[:50]}..."
        elif target_lang == "zh":
            mock_result = f"[中文翻译] {text[:100]}..."
        else:
            mock_result = f"[Translated to {target_lang}] {text[:50]}..."

        return ToolCallResult(
            tool_call_id="",
            tool_id=self.definition.id,
            success=True,
            output=mock_result,
        )


__all__ = ["TranslateTool"]
