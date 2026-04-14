#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: calculator.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: 计算器工具 - 安全数学计算

from __future__ import annotations

import math
import re
from typing import Any

from infrastructure.agent.tools.base import (
    BaseTool,
    ExecutionContext,
    RiskLevel,
    ToolCallResult,
    ToolDefinition,
    ToolParameter,
    ToolCategory,
)


class CalculatorTool(BaseTool):
    """计算器工具 - 支持基础数学运算"""

    _ALLOWED_FUNCTIONS: set[str] = {
        "abs", "round", "min", "max", "sum", "pow", "sqrt",
        "sin", "cos", "tan", "log", "log10", "pi", "e",
    }

    def __init__(self) -> None:
        super().__init__()

    @property
    def definition(self) -> ToolDefinition:
        if self._definition is None:
            self._definition = ToolDefinition(
                id="utility_calculator",
                name="计算器",
                description="执行基础数学计算，支持加减乘除、幂运算、开方、三角函数、对数等",
                category=ToolCategory.UTILITY,
                risk_level=RiskLevel.SAFE,
                parameters=[
                    ToolParameter(
                        name="expression",
                        description="数学表达式，如: 2+3*4, sqrt(16), pow(2, 10), sin(pi/2)",
                        type="string",
                        required=True,
                    ),
                ],
                requires_watermark=False,
                monthly_quota_check=False,
                audit_log=True,
            )
        return self._definition

    async def execute(
        self, params: dict[str, Any], context: ExecutionContext
    ) -> ToolCallResult:
        expression = params.get("expression", "")

        if not expression:
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error="表达式不能为空",
            )

        result, error = self._safe_eval(expression)

        if error:
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error=error,
            )

        return ToolCallResult(
            tool_call_id="",
            tool_id=self.definition.id,
            success=True,
            output=f"{expression} = {result}",
        )

    def _safe_eval(self, expression: str) -> tuple[float | None, str | None]:
        """安全求值

        Args:
            expression: 数学表达式

        Returns:
            tuple: (结果, 错误信息)
        """
        expression = expression.strip().lower()

        if not re.match(r'^[\d\s\+\-\*\/\.\(\)\,\%]+$', expression):
            return None, "表达式包含非法字符"

        math_ctx = {
            "__builtins__": {},
            "sqrt": math.sqrt,
            "pow": pow,
            "sin": math.sin,
            "cos": math.cos,
            "tan": math.tan,
            "log": math.log,
            "log10": math.log10,
            "pi": math.pi,
            "e": math.e,
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "sum": sum,
        }

        try:
            result = eval(expression, math_ctx)
            if isinstance(result, float) and math.isnan(result):
                return None, "计算结果无效"
            if isinstance(result, float) and math.isinf(result):
                return None, "计算结果无穷大"
            return round(result, 10), None
        except ZeroDivisionError:
            return None, "除数不能为零"
        except SyntaxError:
            return None, "表达式语法错误"
        except NameError:
            return None, "表达式包含不支持的函数"
        except Exception as e:
            return None, f"计算错误: {e}"


__all__ = ["CalculatorTool"]
