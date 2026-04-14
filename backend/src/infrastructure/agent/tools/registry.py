#!/usr/bin/env python
# 文件名: registry.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: 工具注册表 - 统一管理工具定义和适配器

from __future__ import annotations

from typing import Any

from infrastructure.agent.tools.base import (
    BaseTool,
    ToolCategory,
    ToolDefinition,
)


class ToolRegistry:
    """工具注册表 - 全局单例,管理所有工具"""

    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}
        self._definitions: dict[str, ToolDefinition] = {}
        self._adapters: dict[str, dict[str, Any]] = {}

    def register(self, tool: BaseTool) -> None:
        """注册工具

        Args:
            tool: 工具实例
        """
        tool_id = tool.definition.id
        self._tools[tool_id] = tool
        self._definitions[tool_id] = tool.definition

    def register_adapter(self, tool_id: str, platform: str, adapter: Any) -> None:
        """注册平台适配器

        Args:
            tool_id: 工具 ID
            platform: 平台名称: backend | frontend | client
            adapter: 适配器实例
        """
        if tool_id not in self._adapters:
            self._adapters[tool_id] = {}
        self._adapters[tool_id][platform] = adapter

    def get_tool(self, tool_id: str) -> BaseTool | None:
        """获取工具实例

        Args:
            tool_id: 工具 ID

        Returns:
            BaseTool | None: 工具实例
        """
        return self._tools.get(tool_id)

    def get_definition(self, tool_id: str) -> ToolDefinition | None:
        """获取工具定义

        Args:
            tool_id: 工具 ID

        Returns:
            ToolDefinition | None: 工具定义
        """
        return self._definitions.get(tool_id)

    def get_all_definitions(self) -> list[ToolDefinition]:
        """获取所有工具定义

        Returns:
            list[ToolDefinition]: 工具定义列表
        """
        return list(self._definitions.values())

    def get_tools_by_category(self, category: ToolCategory) -> list[ToolDefinition]:
        """按分类获取工具定义

        Args:
            category: 工具分类

        Returns:
            list[ToolDefinition]: 工具定义列表
        """
        return [d for d in self._definitions.values() if d.category == category]

    def get_tools_for_user(self, role: str) -> list[ToolDefinition]:
        """获取用户可用的工具定义

        根据角色过滤,返回该角色可使用的工具定义列表.
        目前所有已注册工具都对所有角色可见,
        实际权限控制在 ToolGovernor 中处理.

        Args:
            role: 用户角色

        Returns:
            list[ToolDefinition]: 工具定义列表
        """
        return list(self._definitions.values())

    def get_adapter(self, tool_id: str, platform: str) -> Any | None:
        """获取平台适配器

        Args:
            tool_id: 工具 ID
            platform: 平台名称

        Returns:
            Any | None: 适配器实例
        """
        return self._adapters.get(tool_id, {}).get(platform)

    def list_tool_ids(self) -> list[str]:
        """列出所有已注册的工具 ID

        Returns:
            list[str]: 工具 ID 列表
        """
        return list(self._tools.keys())


_registry_instance: ToolRegistry | None = None


def get_tool_registry() -> ToolRegistry:
    """获取工具注册表单例

    Returns:
        ToolRegistry: 工具注册表实例
    """
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = ToolRegistry()
    return _registry_instance


def register_tool(tool: BaseTool) -> None:
    """快捷注册工具函数

    Args:
        tool: 工具实例
    """
    get_tool_registry().register(tool)


__all__ = ["ToolRegistry", "get_tool_registry", "register_tool"]
