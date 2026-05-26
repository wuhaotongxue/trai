#!/usr/bin/env python
# 文件名: search.py
# 作者: wuhao
# 日期: 2026_05_23_15:04:37
# 描述: 搜索工具 - 联网搜索(带安全过滤)

from __future__ import annotations

import re
from typing import Any

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None


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
                description="搜索互联网上的相关信息,返回标题,摘要和链接",
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

        def clean_html(text: str) -> str:
            text = re.sub(r"<[^>]+>", "", text)
            text = text.replace("&#x27;", "'").replace("&quot;", '"').replace("&amp;", "&").replace("&nbsp;", " ")
            return text.strip()

        # 使用 DDGS 进行真实搜索
        def get_real_results(q: str) -> list[dict]:
            if DDGS is None:
                # 降级处理
                return [
                    {
                        "title": f"关于 {q} (模拟数据，因为未安装 duckduckgo_search)",
                        "link": "https://example.com",
                        "snippet": "请安装 duckduckgo_search 包以启用真实的联网搜索。",
                    }
                ]

            try:
                with DDGS() as ddgs:
                    results = list(ddgs.text(q, max_results=self._max_results))
                return results
            except Exception as e:
                return [{"title": f"搜索出错: {q}", "link": "", "snippet": f"执行真实搜索时发生异常: {str(e)}"}]

        results = get_real_results(query)

        if not results:
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=True,
                output="未找到相关结果",
            )

        # 将结果格式化为字符串返回给 LLM
        formatted_results = []
        sources = []
        for i, res in enumerate(results):
            title = res.get("title", "No Title")
            body = res.get("body", res.get("snippet", "No Content"))
            href = res.get("href", res.get("link", ""))
            formatted_results.append(f"[{i + 1}] {title}\n链接: {href}\n摘要: {body}")
            sources.append({"title": title, "link": href, "snippet": body})

        output_str = "\n\n".join(formatted_results)

        # 我们把 sources 格式化并包含在返回的 ToolCallResult 中
        # 如果 ToolCallResult 没有 data 字段，我们可以将 sources 附加到某个允许的字段或者自定义方式
        # 为了兼容目前的 ToolCallResult 定义，直接返回 output，并在前端解析 output 或者确保上层可以通过其他方式拿到 sources

        return ToolCallResult(
            tool_call_id="", tool_id=self.definition.id, success=True, output=output_str, sources=sources
        )


__all__ = ["SearchTool"]
