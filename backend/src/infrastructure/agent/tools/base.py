#!/usr/bin/env python
# 文件名: base.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: Agent 工具定义 - 工具基类、枚举和统一数据结构

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class ToolCategory(StrEnum):
    """工具分类枚举"""

    MEETING = "meeting"
    CHAT = "chat"
    AUDIO = "audio"
    VIDEO = "video"
    IMAGE = "image"
    AI = "ai"
    NOTIFICATION = "notification"
    SYSTEM = "system"
    UTILITY = "utility"


class RiskLevel(StrEnum):
    """风险等级枚举"""

    SAFE = "safe"
    MONITORED = "monitored"
    REQUIRES_APPROVAL = "requires_approval"
    BLOCKED = "blocked"


@dataclass
class ToolParameter:
    """工具参数定义"""

    name: str
    description: str
    type: str
    required: bool = True
    default: Any = None
    enum: list[str] | None = None


@dataclass
class ToolDefinition:
    """工具定义"""

    id: str
    name: str
    description: str
    category: ToolCategory
    risk_level: RiskLevel
    parameters: list[ToolParameter] = field(default_factory=list)
    requires_watermark: bool = False
    watermark_skip_allowed: bool = False
    monthly_quota_check: bool = True
    audit_log: bool = True
    version: str = "1.0.0"


@dataclass
class ToolCallResult:
    """工具执行结果"""

    tool_call_id: str
    tool_id: str
    success: bool
    output: str | None = None
    error: str | None = None
    duration_ms: int = 0


@dataclass
class ExecutionContext:
    """执行上下文"""

    user_id: str
    user_role: str = "normal"
    session_id: str | None = None
    agent_id: str | None = None
    trace_id: str | None = None
    tenant_id: str | None = None


class BaseTool(ABC):
    """工具基类 - 所有工具必须继承此类"""

    def __init__(self) -> None:
        self._definition: ToolDefinition | None = None

    @property
    @abstractmethod
    def definition(self) -> ToolDefinition:
        """返回工具定义"""
        pass

    @abstractmethod
    async def execute(self, params: dict[str, Any], context: ExecutionContext) -> ToolCallResult:
        """执行工具

        Args:
            params: 工具参数
            context: 执行上下文

        Returns:
            ToolCallResult: 执行结果
        """
        pass

    def check_availability(self) -> bool:
        """检查工具可用性

        Returns:
            bool: 是否可用
        """
        return True

    def health_check(self) -> bool:
        """健康检查

        Returns:
            bool: 是否健康
        """
        return True


__all__ = [
    "ToolCategory",
    "RiskLevel",
    "ToolParameter",
    "ToolDefinition",
    "ToolCallResult",
    "ExecutionContext",
    "BaseTool",
]
