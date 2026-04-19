#!/usr/bin/env python
# 文件名: search.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: 搜索工具 - 联网搜索(带安全过滤)

from __future__ import annotations

from typing import Any

from duckduckgo_search import DDGS
from loguru import logger

from infrastructure.agent.tools.base import (
    BaseTool,
    ExecutionContext,
    RiskLevel,
    ToolCallResult,
    ToolCategory,
    ToolDefinition,
    ToolParameter,
)


class SearchTool(BaseTool):
    """搜索工具"""

    FORBIDDEN_PATTERNS = [
        "password",
        "token",
        "secret",
        "key",
        "eval(",
        "exec(",
        "import ",
        "open(",
        ".exe",
        ".dll",
        ".bat",
    ]

    def __init__(self) -> None:
        super().__init__()
        self._max_results = 3

    @property
    def definition(self) -> ToolDefinition:
        if self._definition is None:
            self._definition = ToolDefinition(
                id="utility_search",
                name="联网搜索",
                description="搜索互联网上的相关信息,返回标题、摘要和链接",
                category=ToolCategory.UTILITY,
                risk_level=RiskLevel.MONITORED,
                parameters=[
                    ToolParameter(
                        name="query",
                        description="搜索关键词",
                        type="string",
                        required=True,
                    ),
                ],
                requires_watermark=False,
                monthly_quota_check=True,
                audit_log=True,
            )
        return self._definition

    async def execute(self, params: dict[str, Any], context: ExecutionContext) -> ToolCallResult:
        query = params.get("query", "")

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
                    error="搜索内容包含敏感词,已被拦截",
                )

        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=self._max_results))
        except Exception as e:
            logger.error(f"DuckDuckGo搜索异常: {e}")
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error=f"搜索失败: {str(e)}",
            )

        if not results:
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=True,
                output="未找到相关结果",
            )

        return ToolCallResult(
            tool_call_id="",
            tool_id=self.definition.id,
            success=True,
            output=" ||| ".join([f"{r['title']}({r['href']}): {r['body'][:300]}" for r in results]),
        )


__all__ = ["SearchTool"]
