#!/usr/bin/env python
# 文件名: loader.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: 工具加载器 - 自动发现并注册所有工具

from __future__ import annotations

import os
from typing import Any

from loguru import logger

from infrastructure.agent.tools.base import ToolDefinition
from infrastructure.agent.tools.registry import get_tool_registry, register_tool


def _import_tool_module(tool_name: str) -> Any | None:
    """动态导入工具模块

    Args:
        tool_name: 工具模块名(不含路径)

    Returns:
        工具类或 None
    """
    try:
        if tool_name == "weather":
            from infrastructure.agent.tools.weather import WeatherTool

            return WeatherTool
        if tool_name == "calculator":
            from infrastructure.agent.tools.calculator import CalculatorTool

            return CalculatorTool
        if tool_name == "search":
            from infrastructure.agent.tools.search import SearchTool

            return SearchTool
        if tool_name == "translate":
            from infrastructure.agent.tools.translate import TranslateTool

            return TranslateTool
        if tool_name == "video_dubbing":
            from infrastructure.agent.tools.video_dubbing import VideoDubbingTool

            return VideoDubbingTool
        if tool_name == "music_creator":
            from infrastructure.agent.tools.music_creator import MusicCreatorTool

            return MusicCreatorTool
        if tool_name == "video_generator":
            from infrastructure.agent.tools.video_generator import VideoGeneratorTool

            return VideoGeneratorTool
        if tool_name == "wecom_contact":
            from infrastructure.agent.tools.wecom_contact_tool import WeComContactTool

            return WeComContactTool
        if tool_name == "video_to_audio":
            from infrastructure.agent.tools.video_to_audio import VideoToAudioTool

            return VideoToAudioTool
    except ImportError as e:
        logger.warning(f"工具模块导入失败 | tool={tool_name} | error={e}")
    return None


def load_all_tools() -> list[ToolDefinition]:
    """加载所有可用工具

    从环境变量 TOOL_ENABLED_LIST 读取需要加载的工具列表,
    默认为全部工具.

    Returns:
        list[ToolDefinition]: 已注册的工具定义列表
    """
    get_tool_registry()

    enabled_str = os.getenv(
        "TOOL_ENABLED_LIST",
        "weather,calculator,search,translate,wecom_contact,video_dubbing,music_creator,video_generator,video_to_audio",
    )
    tool_names = [t.strip() for t in enabled_str.split(",") if t.strip()]

    registered: list[ToolDefinition] = []

    for tool_name in tool_names:
        tool_cls = _import_tool_module(tool_name)
        if tool_cls is None:
            continue

        tool_instance = tool_cls()
        register_tool(tool_instance)
        registered.append(tool_instance.definition)

        logger.info(
            f"工具注册完成 | id={tool_instance.definition.id} | "
            f"category={tool_instance.definition.category.value} | "
            f"risk={tool_instance.definition.risk_level.value}"
        )

    logger.info(f"工具加载完成 | 共 {len(registered)} 个工具")
    return registered


def get_openai_tools_format(
    definitions: list[ToolDefinition],
) -> list[dict[str, Any]]:
    """将工具定义转换为 OpenAI tool_calls 格式

    Args:
        definitions: 工具定义列表

    Returns:
        list[dict]: OpenAI tools 格式
    """
    tools = []
    for d in definitions:
        params_props: dict[str, Any] = {}
        required: list[str] = []

        for p in d.parameters:
            param_def: dict[str, Any] = {
                "description": p.description,
                "type": p.type,
            }
            if p.enum:
                param_def["enum"] = p.enum
            params_props[p.name] = param_def
            if p.required:
                required.append(p.name)

        tools.append(
            {
                "type": "function",
                "function": {
                    "name": d.id,
                    "description": d.description,
                    "parameters": {
                        "type": "object",
                        "properties": params_props,
                        "required": required,
                    },
                },
            }
        )

    return tools


__all__ = ["load_all_tools", "get_openai_tools_format"]
