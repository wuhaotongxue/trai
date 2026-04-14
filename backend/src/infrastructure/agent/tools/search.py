#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: search.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: 搜索工具 - 联网搜索（带安全过滤）

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


class SearchTool(BaseTool):
    """搜索工具"""

    FORBIDDEN_PATTERNS = [
        "password", "token", "secret", "key",
        "eval(", "exec(", "import ", "open(",
        ".exe", ".dll", ".bat",
    ]

    def __init__(self) -> None:
        super().__init__()
        self._api_key = os.getenv("SEARCH_API_KEY", "")
        self._base_url = os.getenv(
            "SEARCH_API_URL", "https://api.search.unknown/v1/search"
        )
        self._max_results = int(os.getenv("SEARCH_MAX_RESULTS", "5"))

    @property
    def definition(self) -> ToolDefinition:
        if self._definition is None:
            self._definition = ToolDefinition(
                id="utility_search",
                name="联网搜索",
                description="搜索互联网上的相关信息，返回标题、摘要和链接",
                category=ToolCategory.UTILITY,
                risk_level=RiskLevel.MONITORED,
                parameters=[
                    ToolParameter(
                        name="query",
                        description="搜索关键词",
                        type="string",
                        required=True,
                    ),
                    ToolParameter(
                        name="max_results",
                        description="最大返回结果数，默认5",
                        type="integer",
                        required=False,
                        default=5,
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
        query = params.get("query", "")
        max_results = params.get("max_results", self._max_results)

        if not query:
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error="搜索关键词不能为空",
            )

        for pattern in self.FORBIDDEN_PATTERNS:
            if pattern in query.lower():
                return ToolCallResult(
                    tool_call_id="",
                    tool_id=self.definition.id,
                    success=False,
                    error="搜索内容包含敏感词，已被拦截",
                )

        if not self._api_key:
            return await self._mock_search(query, max_results)

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.get(
                    self._base_url,
                    params={"q": query, "num": max_results},
                    headers={"Authorization": f"Bearer {self._api_key}"},
                )
                response.raise_for_status()
                data = response.json()
                return self._parse_search_results(query, data)
        except Exception as e:
            logger.error(f"搜索异常: {e}")
            return await self._mock_search(query, max_results)

    def _parse_search_results(
        self, query: str, data: dict[str, Any]
    ) -> ToolCallResult:
        results = data.get("results", [])[: self._max_results]

        if not results:
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=True,
                output=f"未找到与「{query}」相关的搜索结果",
            )

        lines = [f"搜索「{query}」找到 {len(results)} 条结果:\\n"]
        for i, r in enumerate(results, 1):
            lines.append(f"{i}. {r.get('title', 'N/A')}")
            lines.append(f"   {r.get('snippet', 'N/A')}")
            lines.append(f"   {r.get('url', '')}\\n")

        return ToolCallResult(
            tool_call_id="",
            tool_id=self.definition.id,
            success=True,
            output="\n".join(lines),
        )

    async def _mock_search(
        self, query: str, max_results: int
    ) -> ToolCallResult:
        lines = [
            f"搜索「{query}」找到 3 条结果（Mock数据）:\\n",
            f"1. {query} - 相关介绍",
            f"   这里是关于 {query} 的简要说明...\\n",
            f"2. {query} 的使用方法",
            f"   本页面介绍 {query} 的基本操作步骤...\\n",
            f"3. {query} 常见问题",
            f"   FAQ: 收集了 {query} 相关的常见问题与解答...",
        ]
        return ToolCallResult(
            tool_call_id="",
            tool_id=self.definition.id,
            success=True,
            output="\n".join(lines),
        )


__all__ = ["SearchTool"]
