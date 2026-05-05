#!/usr/bin/env python
# 文件名: calculator.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: 计算器工具 - 安全数学计算

from __future__ import annotations

import math
from typing import Any

from infrastructure.agent.tools.base import (
    BaseTool,
    ExecutionContext,
    RiskLevel,
    ToolCallResult,
    ToolCategory,
    ToolDefinition,
    ToolParameter,
)


class CalculatorTool(BaseTool):
    """计算器工具 - 支持基础数学运算"""

    _ALLOWED_FUNCTIONS: set[str] = {
        "abs",
        "round",
        "min",
        "max",
        "sum",
        "pow",
        "sqrt",
        "sin",
        "cos",
        "tan",
        "log",
        "log10",
        "pi",
        "e",
    }

    def __init__(self) -> None:
        super().__init__()

    @property
    def definition(self) -> ToolDefinition:
        if self._definition is None:
            self._definition = ToolDefinition(
                id="utility_calculator",
                name="计算器",
                description="执行基础数学计算,支持加减乘除,幂运算,开方,三角函数,对数等",
                category=ToolCategory.UTILITY,
                risk_level=RiskLevel.SAFE,
                parameters=[
                    ToolParameter(
                        name="expression",
                        description="数学表达式,如: 2+3*4, sqrt(16), pow(2, 10), sin(pi/2)",
                        type="string",
                        required=True,
                    ),
                ],
                requires_watermark=False,
                monthly_quota_check=False,
                audit_log=True,
            )
        return self._definition

    async def execute(self, params: dict[str, Any], context: ExecutionContext) -> ToolCallResult:
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
        import ast
        import operator

        expression = expression.strip().lower()
        if not expression:
            return None, "表达式不能为空"

        if len(expression) > 200:
            return None, "表达式过长, 限制200字符"

        # 允许的运算符
        operators = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.FloorDiv: operator.floordiv,
            ast.Pow: operator.pow,
            ast.Mod: operator.mod,
            ast.USub: operator.neg,
            ast.UAdd: operator.pos,
        }

        # 允许的函数和常量
        math_ctx = {
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

        def eval_node(node: ast.AST) -> Any:
            if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                return node.value
            elif isinstance(node, ast.BinOp):
                left = eval_node(node.left)
                right = eval_node(node.right)
                # 限制幂运算大小防止 DoS
                if isinstance(node.op, ast.Pow):
                    if right > 1000 or right < -1000:
                        raise ValueError("幂运算指数过大")
                    if left > 10000 or left < -10000:
                        raise ValueError("幂运算底数过大")
                if type(node.op) not in operators:
                    raise ValueError(f"不支持的运算符: {type(node.op).__name__}")
                return operators[type(node.op)](left, right)
            elif isinstance(node, ast.UnaryOp):
                operand = eval_node(node.operand)
                if type(node.op) not in operators:
                    raise ValueError(f"不支持的一元运算符: {type(node.op).__name__}")
                return operators[type(node.op)](operand)
            elif isinstance(node, ast.Call):
                if not isinstance(node.func, ast.Name):
                    raise ValueError("只支持调用简单函数")
                func_name = node.func.id
                if func_name not in math_ctx:
                    raise ValueError(f"不支持的函数: {func_name}")
                func = math_ctx[func_name]
                if not callable(func):
                    raise ValueError(f"{func_name} 不是一个可调用的函数")
                args = [eval_node(arg) for arg in node.args]
                return func(*args)
            elif isinstance(node, ast.Name):
                if node.id in math_ctx:
                    val = math_ctx[node.id]
                    if not isinstance(val, (int, float)):
                        raise ValueError(f"不支持的变量类型: {node.id}")
                    return val
                raise ValueError(f"不支持的变量: {node.id}")
            elif isinstance(node, ast.Expression):
                return eval_node(node.body)
            else:
                raise ValueError(f"不支持的表达式节点: {type(node).__name__}")

        try:
            tree = ast.parse(expression, mode="eval")
            result = eval_node(tree.body)

            if isinstance(result, (int, float)):
                if isinstance(result, float) and math.isnan(result):
                    return None, "计算结果无效(NaN)"
                if isinstance(result, float) and math.isinf(result):
                    return None, "计算结果无穷大(Inf)"
                return round(float(result), 10), None
            else:
                return None, "表达式必须返回数字"

        except ZeroDivisionError:
            return None, "除数不能为零"
        except SyntaxError:
            return None, "表达式语法错误"
        except ValueError as e:
            return None, str(e)
        except Exception as e:
            return None, f"计算错误: {e}"


__all__ = ["CalculatorTool"]
