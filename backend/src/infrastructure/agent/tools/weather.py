#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: weather.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: 天气查询工具

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


class WeatherTool(BaseTool):
    """天气查询工具"""

    def __init__(self) -> None:
        super().__init__()
        self._api_key = os.getenv("WEATHER_API_KEY", "")
        self._base_url = os.getenv(
            "WEATHER_API_URL", "https://api.seniverse.com/v3/weather"
        )

    @property
    def definition(self) -> ToolDefinition:
        if self._definition is None:
            self._definition = ToolDefinition(
                id="weather_current",
                name="天气查询",
                description="查询指定城市的当前天气情况，包括温度、湿度、风力、空气质量等",
                category=ToolCategory.UTILITY,
                risk_level=RiskLevel.SAFE,
                parameters=[
                    ToolParameter(
                        name="city",
                        description="城市名称，如：北京、上海、Shanghai",
                        type="string",
                        required=True,
                    ),
                    ToolParameter(
                        name="lang",
                        description="返回语言，zh-Hans（简体中文）或 en（英文）",
                        type="string",
                        required=False,
                        default="zh-Hans",
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
        city = params.get("city", "")
        lang = params.get("lang", "zh-Hans")

        if not city:
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error="城市名称不能为空",
            )

        if not self._api_key:
            return await self._mock_weather(city)

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    self._base_url,
                    params={
                        "key": self._api_key,
                        "location": city,
                        "language": lang,
                        "unit": "c",
                    },
                )
                response.raise_for_status()
                data = response.json()

                weather_data = data.get("results", [{}])[0]
                now = weather_data.get("now", {})

                output = (
                    f"{city}当前天气:\\n"
                    f"- 温度: {now.get('temperature', 'N/A')}°C\\n"
                    f"- 天气: {now.get('text', 'N/A')}\\n"
                    f"- 湿度: {now.get('humidity', 'N/A')}%\\n"
                    f"- 风力: {now.get('wind_direction', '')}{now.get('wind_speed', '')}级\\n"
                    f"- 更新时间: {weather_data.get('last_update', 'N/A')}"
                )

                return ToolCallResult(
                    tool_call_id="",
                    tool_id=self.definition.id,
                    success=True,
                    output=output,
                )

        except httpx.HTTPStatusError as e:
            logger.error(f"天气 API HTTP 错误: {e.response.status_code}")
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error=f"天气查询失败: HTTP {e.response.status_code}",
            )
        except Exception as e:
            logger.error(f"天气查询异常: {e}")
            return await self._mock_weather(city)

    async def _mock_weather(self, city: str) -> ToolCallResult:
        """Mock 数据，用于未配置 API Key 时"""
        output = (
            f"{city}当前天气（Mock数据）:\\n"
            f"- 温度: 22°C\\n"
            f"- 天气: 多云\\n"
            f"- 湿度: 65%\\n"
            f"- 风力: 东南风3级\\n"
            f"- 更新时间: 2026-04-10T10:00:00+08:00"
        )
        return ToolCallResult(
            tool_call_id="",
            tool_id=self.definition.id,
            success=True,
            output=output,
        )


__all__ = ["WeatherTool"]
