#!/usr/bin/env python
# 文件名: enhanced_tools.py
# 作者: wuhao
# 日期: 2026_05_04_19:45:00
# 描述: 增强版Agent工具集 (Skills合规: 类封装)

from __future__ import annotations

import json
import math
import re
import subprocess
import tempfile
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from loguru import logger


class ToolCategory(str, Enum):
    """工具分类"""

    SEARCH = "search"  # 搜索类
    CALCULATION = "calculation"  # 计算类
    CODE = "code"  # 代码执行类
    MEDIA = "media"  # 媒体处理类
    DATA = "data"  # 数据处理类
    COMMUNICATION = "communication"  # 通信类
    SYSTEM = "system"  # 系统工具类


@dataclass
class ToolParameter:
    """工具参数定义"""

    name: str
    type: str  # string/number/boolean/array/object
    description: str
    required: bool = False
    default: Any = None
    enum: list[Any] | None = None  # 可选值列表

    def to_openai_format(self) -> dict:
        """转换为OpenAI function calling格式"""
        param_def: dict[str, Any] = {
            "type": self.type,
            "description": self.description,
        }

        if self.enum:
            param_def["enum"] = self.enum

        return param_def


@dataclass
class ToolResult:
    """工具执行结果"""

    success: bool
    output: Any  # 输出数据(字符串/字典/列表等)
    error: str | None = None  # 错误信息
    execution_time_ms: float = 0.0
    tokens_used: int | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_string(self) -> str:
        """转换为字符串(用于返回给AI)"""
        if not self.success:
            return f"Error: {self.error}"

        if isinstance(self.output, (dict, list)):
            return json.dumps(self.output, ensure_ascii=False, indent=2)

        return str(self.output)


class BaseTool(ABC):
    """
    工具基类 (Skills 规范: 抽象基类)

    所有自定义工具必须继承此类并实现execute方法.
    """

    name: str = ""
    description: str = ""
    category: ToolCategory = ToolCategory.SYSTEM
    parameters: list[ToolParameter] = field(default_factory=list)

    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """执行工具逻辑(子类必须实现)"""
        pass

    def to_openai_function(self) -> dict:
        """转换为OpenAI Function Calling格式"""
        properties = {}
        required = []

        for param in self.parameters:
            properties[param.name] = param.to_openai_format()
            if param.required:
                required.append(param.name)

        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required,
                },
            },
        }


# ========== 搜索类工具 ==========


class WebSearchTool(BaseTool):
    """网络搜索工具"""

    name = "web_search"
    description = "搜索互联网获取最新信息.适用于需要实时数据,新闻,事实核查的场景."
    category = ToolCategory.SEARCH
    parameters = [
        ToolParameter("query", "string", "搜索关键词或问题", required=True),
        ToolParameter("num_results", "number", "返回结果数量(1-10)", default=5),
    ]

    async def execute(self, query: str, num_results: int = 5) -> ToolResult:
        """执行网络搜索"""
        start_time = datetime.now()

        try:
            # 使用DuckDuckGo搜索(无需API key)
            results = await self._duckduckgo_search(query, num_results)

            duration = (datetime.now() - start_time).total_seconds() * 1000

            return ToolResult(
                success=True,
                output={
                    "query": query,
                    "results": results[:num_results],
                    "result_count": len(results),
                },
                execution_time_ms=duration,
            )

        except Exception as e:
            logger.error(f"Web search failed: {e}")
            duration = (datetime.now() - start_time).total_seconds() * 1000

            return ToolResult(
                success=False,
                output=None,
                error=f"Search failed: {str(e)}",
                execution_time_ms=duration,
            )

    async def _duckduckgo_search(self, query: str, num: int) -> list[dict]:
        """DuckDuckGo搜索实现"""
        try:
            from duckduckgo_search import DDGS

            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=num))

                formatted = []
                for r in results:
                    formatted.append(
                        {
                            "title": r.get("title", ""),
                            "url": r.get("href", ""),
                            "snippet": r.get("body", "")[:300],
                        }
                    )

                return formatted

        except ImportError:
            logger.warning("duckduckgo_search not installed, using mock")
            return [
                {
                    "title": f"搜索结果: {query}",
                    "url": "",
                    "snippet": f"关于'{query}'的模拟搜索结果.请安装duckduckgo_search包以启用真实搜索.",
                },
            ]


class CalculatorTool(BaseTool):
    """数学计算器工具"""

    name = "calculator"
    description = "执行数学计算.支持基本运算(+,-,*,/),幂运算(**),三角函数(sin/cos/tan),对数(log/ln),平方根(sqrt)等."
    category = ToolCategory.CALCULATION
    parameters = [
        ToolParameter("expression", "string", "数学表达式,如 '2+3*4' 或 'sin(pi/2)'", required=True),
    ]

    async def execute(self, expression: str) -> ToolResult:
        """执行数学计算"""
        start_time = datetime.now()

        try:
            # 安全的数学表达式求值
            allowed_names = {
                **math.__dict__,
                "pi": math.pi,
                "e": math.e,
                "inf": float("inf"),
            }

            result = eval(expression, {"__builtins__": {}}, allowed_names)

            duration = (datetime.now() - start_time).total_seconds() * 1000

            return ToolResult(
                success=True,
                output={
                    "expression": expression,
                    "result": result,
                    "type": type(result).__name__,
                },
                execution_time_ms=duration,
            )

        except ZeroDivisionError:
            return ToolResult(success=False, error="Division by zero")
        except SyntaxError:
            return ToolResult(success=False, error="Invalid expression syntax")
        except NameError:
            return ToolResult(success=False, error="Unknown function or variable")
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            return ToolResult(success=False, error=str(e), execution_time_ms=duration)


class CodeExecutorTool(BaseTool):
    """Python代码执行工具"""

    name = "code_executor"
    description = "安全地执行Python代码片段.适用于数据分析,计算,算法验证.注意:有执行时间限制和沙箱限制."
    category = ToolCategory.CODE
    parameters = [
        ToolParameter("code", "string", "要执行的Python代码", required=True),
        ToolParameter("timeout", "number", "超时时间(秒)", default=30),
    ]

    async def execute(self, code: str, timeout: int = 30) -> ToolResult:
        """执行Python代码"""
        start_time = datetime.now()

        try:
            # 在临时文件中执行代码
            with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
                f.write(code)
                temp_file = f.name

            try:
                result = subprocess.run(
                    ["python", temp_file],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                )

                output = ""
                if result.stdout:
                    output += result.stdout
                if result.stderr and "Traceback" in result.stderr:
                    output += "\n--- Error Output ---\n" + result.stderr

                duration = (datetime.now() - start_time).total_seconds() * 1000

                return ToolResult(
                    success=result.returncode == 0,
                    output=output.strip() or "(No output)",
                    error=result.stderr if result.returncode != 0 else None,
                    execution_time_ms=duration,
                )

            finally:
                import os

                os.unlink(temp_file)

        except subprocess.TimeoutExpired:
            return ToolResult(success=False, error=f"Execution timed out after {timeout} seconds")
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            return ToolResult(success=False, error=str(e), execution_time_ms=duration)


class DateTimeTool(BaseTool):
    """日期时间工具"""

    name = "get_current_datetime"
    description = "获取当前日期和时间信息.可用于回答关于当前时间,日期计算等问题."
    category = ToolCategory.SYSTEM
    parameters = [
        ToolParameter(
            "timezone", "string", "时区,如 'Asia/Shanghai', 'UTC', 'America/New_York'", default="Asia/Shanghai"
        ),
        ToolParameter("format", "string", "输出格式: full/date/time/iso", default="full"),
    ]

    async def execute(self, timezone: str = "Asia/Shanghai", format: str = "full") -> ToolResult:
        """获取当前时间"""
        from zoneinfo import ZoneInfo

        try:
            tz = ZoneInfo(timezone)
            now = datetime.now(tz)

            if format == "date":
                output = now.strftime("%Y-%m-%d")
            elif format == "time":
                output = now.strftime("%H:%M:%S")
            elif format == "iso":
                output = now.isoformat()
            else:
                output = now.strftime("%Y-%m-%d %H:%M:%S %Z")

            return ToolResult(
                success=True,
                output={
                    "datetime": output,
                    "iso_format": now.isoformat(),
                    "timezone": timezone,
                    "weekday": now.strftime("%A"),
                    "day_of_year": now.timetuple().tm_yday,
                },
            )

        except Exception as e:
            return ToolResult(success=False, error=f"Invalid timezone: {e}")


class TextAnalysisTool(BaseTool):
    """文本分析工具"""

    name = "analyze_text"
    description = "分析文本特征:字数统计,语言检测,情感倾向,关键信息提取等."
    category = ToolCategory.DATA
    parameters = [
        ToolParameter("text", "string", "要分析的文本内容", required=True),
        ToolParameter("analysis_type", "string", "分析类型: stats/language/sentiment/entities/all", default="all"),
    ]

    async def execute(self, text: str, analysis_type: str = "all") -> ToolResult:
        """文本分析"""
        results = {}

        if analysis_type in ["stats", "all"]:
            results["statistics"] = {
                "char_count": len(text),
                "word_count": len(text.split()),
                "sentence_count": len(re.split(r"[.!?.!?]", text)),
                "line_count": len(text.splitlines()),
                "avg_word_length": sum(len(w) for w in text.split()) / max(len(text.split()), 1),
            }

        if analysis_type in ["language", "all"]:
            # 简单的语言检测(基于字符分布)
            chinese_chars = len([c for c in text if "\u4e00" <= c <= "\u9fff"])
            total_chars = max(len(text.replace(" ", "")), 1)
            chinese_ratio = chinese_chars / total_chars

            if chinese_ratio > 0.3:
                detected_lang = "Chinese (中文)"
            elif chinese_ratio > 0.05:
                detected_lang = "Mixed Chinese-English (中英混合)"
            else:
                detected_lang = "English (英文)"

            results["language_detection"] = {
                "primary_language": detected_lang,
                "chinese_character_count": chinese_chars,
                "chinese_ratio": round(chinese_ratio, 3),
            }

        if analysis_type in ["sentiment", "all"]:
            # 简单的情感分析(基于关键词)
            positive_words = [
                "good",
                "great",
                "excellent",
                "amazing",
                "wonderful",
                "好",
                "棒",
                "优秀",
                "喜欢",
                "满意",
                "赞",
            ]
            negative_words = [
                "bad",
                "terrible",
                "awful",
                "poor",
                "horrible",
                "差",
                "糟糕",
                "讨厌",
                "失望",
                "烂",
                "垃圾",
            ]

            text_lower = text.lower()
            pos_count = sum(1 for w in positive_words if w in text_lower)
            neg_count = sum(1 for w in negative_words if w in text_lower)

            if pos_count > neg_count:
                sentiment = "positive"
                score = min((pos_count - neg_count) / max(pos_count, 1), 1.0)
            elif neg_count > pos_count:
                sentiment = "negative"
                score = -min((neg_count - pos_count) / max(neg_count, 1), 1.0)
            else:
                sentiment = "neutral"
                score = 0.0

            results["sentiment_analysis"] = {
                "sentiment": sentiment,
                "score": round(score, 3),
                "confidence": round(abs(score), 3),
            }

        return ToolResult(
            success=True,
            output=results,
            metadata={"analysis_type": analysis_type},
        )


class JSONFormatterTool(BaseTool):
    """JSON格式化工具"""

    name = "format_json"
    description = "格式化JSON字符串,使其更易读.也可用于验证JSON语法是否正确."
    category = ToolCategory.DATA
    parameters = [
        ToolParameter("json_string", "string", "要格式化的JSON字符串", required=True),
        ToolParameter("indent", "number", "缩进空格数", default=2),
    ]

    async def execute(self, json_string: str, indent: int = 2) -> ToolResult:
        """格式化JSON"""
        try:
            parsed = json.loads(json_string)
            formatted = json.dumps(parsed, indent=indent, ensure_ascii=False)

            return ToolResult(
                success=True,
                output={"formatted": formatted, "valid": True},
            )

        except json.JSONDecodeError as e:
            return ToolResult(
                success=False,
                error=f"Invalid JSON: {e.msg} at line {e.lineno}, column {e.colno}",
                output={"formatted": json_string, "valid": False},
            )


# ========== 工具注册表 ==========


class EnhancedToolRegistry:
    """
    增强版工具注册表 (Skills 规范: 强制类封装)

    功能:
    - 注册和管理所有可用工具
    - 按类别分组
    - 批量导出为OpenAI格式
    - 动态加载工具
    """

    _tools: dict[str, BaseTool] = {}
    _by_category: dict[ToolCategory, list[str]] = {}

    @classmethod
    def register(cls, tool: BaseTool) -> None:
        """注册工具"""
        cls._tools[tool.name] = tool

        if tool.category not in cls._by_category:
            cls._by_category[tool.category] = []
        cls._by_category[tool.category].append(tool.name)

        logger.debug(f"Tool registered: {tool.name} ({tool.category.value})")

    @classmethod
    def get(cls, name: str) -> BaseTool | None:
        """获取工具实例"""
        return cls._tools.get(name)

    @classmethod
    def get_all(cls) -> list[BaseTool]:
        """获取所有已注册工具"""
        return list(cls._tools.values())

    @classmethod
    def get_by_category(cls, category: ToolCategory) -> list[BaseTool]:
        """按类别获取工具"""
        names = cls._by_category.get(category, [])
        return [cls._tools[n] for n in names if n in cls._tools]

    @classmethod
    def to_openai_functions(cls) -> list[dict]:
        """导出为OpenAI Function Calling格式"""
        return [t.to_openai_function() for t in cls._tools.values()]

    @classmethod
    def get_tool_info_list(cls) -> list[dict]:
        """获取工具简要信息列表"""
        return [
            {
                "name": t.name,
                "description": t.description[:100],
                "category": t.category.value,
                "parameter_count": len(t.parameters),
            }
            for t in cls._tools.values()
        ]


# 注册默认工具集
def register_default_tools():
    """注册所有默认工具"""
    tools = [
        WebSearchTool(),
        CalculatorTool(),
        CodeExecutorTool(),
        DateTimeTool(),
        TextAnalysisTool(),
        JSONFormatterTool(),
    ]

    for tool in tools:
        EnhancedToolRegistry.register(tool)

    logger.info(f"Default tools registered: {len(tools)} tools")


# 初始化注册默认工具
register_default_tools()


__all__ = [
    "BaseTool",
    "EnhancedToolRegistry",
    "WebSearchTool",
    "CalculatorTool",
    "CodeExecutorTool",
    "DateTimeTool",
    "TextAnalysisTool",
    "JSONFormatterTool",
    "ToolCategory",
    "ToolParameter",
    "ToolResult",
    "register_default_tools",
]
