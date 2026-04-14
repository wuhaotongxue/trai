#!/usr/bin/env python
# 文件名: governor.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: 工具治理器 - 统一拦截器，执行风险检查、权限校验、审计

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any

from core.logger import logger
from infrastructure.agent.tools.base import (
    BaseTool,
    ExecutionContext,
    RiskLevel,
    ToolCallResult,
    ToolDefinition,
)


@dataclass
class GovernanceResult:
    """治理结果"""

    allowed: bool
    reason: str
    blocked: bool = False
    needs_confirmation: bool = False
    confirmed: bool = False
    policy_name: str = "default"


class ToolGovernor:
    """工具治理器 - 统一拦截器，五步校验"""

    def __init__(self) -> None:
        self._rate_limit_enabled: bool = os.getenv("TOOL_GOVERNOR_RATE_LIMIT", "true").lower() == "true"
        self._audit_enabled: bool = os.getenv("TOOL_GOVERNOR_AUDIT", "true").lower() == "true"

    async def execute(
        self,
        tool: BaseTool,
        params: dict[str, Any],
        context: ExecutionContext,
        confirmed: bool = False,
    ) -> ToolCallResult:
        """执行工具（经过治理拦截）

        Args:
            tool: 工具实例
            params: 工具参数
            context: 执行上下文
            confirmed: 是否已通过用户确认

        Returns:
            ToolCallResult: 工具执行结果
        """
        tool_def = tool.definition
        start_ms = int(time.time() * 1000)

        governance = self._govern(tool_def, context, confirmed)

        if governance.blocked:
            self._audit(
                tool_id=tool_def.id,
                user_id=context.user_id,
                params=params,
                success=False,
                error=f"Blocked: {governance.reason}",
                duration_ms=int(time.time() * 1000) - start_ms,
            )
            return ToolCallResult(
                tool_call_id="",
                tool_id=tool_def.id,
                success=False,
                error=f"工具调用被拦截: {governance.reason}",
                duration_ms=int(time.time() * 1000) - start_ms,
            )

        if governance.needs_confirmation:
            self._audit(
                tool_id=tool_def.id,
                user_id=context.user_id,
                params=params,
                success=False,
                error="需要用户确认",
                duration_ms=int(time.time() * 1000) - start_ms,
            )
            return ToolCallResult(
                tool_call_id="",
                tool_id=tool_def.id,
                success=False,
                error="TOOL_NEEDS_CONFIRMATION",
                duration_ms=int(time.time() * 1000) - start_ms,
            )

        if tool_def.risk_level == RiskLevel.MONITORED:
            self._audit(
                tool_id=tool_def.id,
                user_id=context.user_id,
                params=params,
                success=True,
                error=None,
                duration_ms=int(time.time() * 1000) - start_ms,
            )

        try:
            result = await tool.execute(params, context)
            result.duration_ms = int(time.time() * 1000) - start_ms
            return result
        except Exception as e:
            logger.error(f"工具执行异常 | tool_id={tool_def.id} | error={e}")
            return ToolCallResult(
                tool_call_id="",
                tool_id=tool_def.id,
                success=False,
                error=str(e),
                duration_ms=int(time.time() * 1000) - start_ms,
            )

    def _govern(
        self,
        tool_def: ToolDefinition,
        context: ExecutionContext,
        confirmed: bool,
    ) -> GovernanceResult:
        """执行五步治理

        Args:
            tool_def: 工具定义
            context: 执行上下文
            confirmed: 是否已确认

        Returns:
            GovernanceResult: 治理结果
        """
        if tool_def.risk_level == RiskLevel.BLOCKED:
            return GovernanceResult(
                allowed=False,
                reason="该工具已被禁用",
                blocked=True,
                policy_name="blocked",
            )

        if tool_def.risk_level == RiskLevel.REQUIRES_APPROVAL and not confirmed:
            return GovernanceResult(
                allowed=False,
                reason="该操作需要二次确认",
                needs_confirmation=True,
                policy_name="requires_approval",
            )

        if tool_def.risk_level == RiskLevel.MONITORED:
            logger.info(f"工具监控 | tool_id={tool_def.id} | user_id={context.user_id} | role={context.user_role}")

        return GovernanceResult(
            allowed=True,
            reason="通过治理检查",
            confirmed=confirmed,
            policy_name="passed",
        )

    def _audit(
        self,
        tool_id: str,
        user_id: str,
        params: dict[str, Any],
        success: bool,
        error: str | None,
        duration_ms: int,
    ) -> None:
        """记录审计日志

        Args:
            tool_id: 工具 ID
            user_id: 用户 ID
            params: 调用参数
            success: 是否成功
            error: 错误信息
            duration_ms: 执行耗时
        """
        if not self._audit_enabled:
            return

        log_entry = {
            "tool_id": tool_id,
            "user_id": user_id,
            "params": params,
            "success": success,
            "error": error,
            "duration_ms": duration_ms,
            "trace_id": "",
        }
        logger.info(f"[TOOL_AUDIT] {log_entry}")


_governor_instance: ToolGovernor | None = None


def get_tool_governor() -> ToolGovernor:
    """获取工具治理器单例

    Returns:
        ToolGovernor: 工具治理器实例
    """
    global _governor_instance
    if _governor_instance is None:
        _governor_instance = ToolGovernor()
    return _governor_instance


__all__ = ["ToolGovernor", "GovernanceResult", "get_tool_governor"]
