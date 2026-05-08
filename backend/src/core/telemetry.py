#!/usr/bin/env python
# 文件名: telemetry.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: 可观测性集成 (简化版，无 opentelemetry 依赖)

from __future__ import annotations

from typing import Any

from core.logger import get_logger

logger = get_logger()

_tracer = None


def get_tracer(name: str = "trai") -> Any:
    """获取 Tracer 实例 (简化版)

    Args:
        name: tracer 名称

    Returns:
        Any: tracer 实例
    """
    global _tracer
    if _tracer is not None:
        return _tracer

    logger.info("Telemetry initialized (simple mode, no opentelemetry)")
    _tracer = object()
    return _tracer


class SpanBuilder:
    """Span 构建器 (简化版)"""

    def __init__(self, tracer: Any, name: str) -> None:
        self._tracer = tracer
        self._name = name
        self._span = None
        self._attributes: dict[str, Any] = {}

    def with_attribute(self, key: str, value: Any) -> SpanBuilder:
        self._attributes[key] = value
        return self

    def with_attributes(self, **kwargs: Any) -> SpanBuilder:
        self._attributes.update(kwargs)
        return self

    def start(self) -> SpanBuilder:
        return self

    def end(self) -> None:
        pass

    def set_status(self, code: Any, message: str = "") -> None:
        pass

    def record_exception(self, exception: Exception) -> None:
        pass

    def add_event(self, name: str, attributes: dict[str, Any] | None = None) -> None:
        pass

    def __enter__(self) -> SpanBuilder:
        return self.start()

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if exc_type:
            self.record_exception(exc_val)
        self.end()


def create_span(
    name: str,
    tracer: Any | None = None,
    **attributes: Any,
) -> SpanBuilder:
    """创建 Span 的快捷方法"""
    if tracer is None:
        tracer = get_tracer()
    builder = SpanBuilder(tracer, name)
    if attributes:
        builder.with_attributes(**attributes)
    return builder


def trace_ai_call(
    model: str,
    messages: list[dict[str, str]],
    user_id: str | None = None,
    session_id: str | None = None,
) -> SpanBuilder:
    """追踪 AI 对话调用"""
    tracer = get_tracer()
    return (
        create_span("ai.chat", tracer)
        .with_attribute("gen_ai.system", "openai")
        .with_attribute("gen_ai.request.model", model)
        .with_attribute("gen_ai.request.message_count", len(messages))
        .with_attribute("trai.user_id", user_id or "")
        .with_attribute("trai.session_id", session_id or "")
    )


def trace_tool_call(
    tool_name: str,
    risk_level: str = "low",
    user_id: str | None = None,
) -> SpanBuilder:
    """追踪工具调用"""
    tracer = get_tracer()
    return (
        create_span(f"tool.{tool_name}", tracer)
        .with_attribute("trai.tool.name", tool_name)
        .with_attribute("trai.tool.risk_level", risk_level)
        .with_attribute("trai.user_id", user_id or "")
    )


def trace_db_call(
    operation: str,
    table: str,
    latency_ms: float,
    status: str,
) -> SpanBuilder:
    """追踪数据库调用"""
    tracer = get_tracer()
    return (
        create_span(f"db.{operation}", tracer)
        .with_attribute("db.system", "postgresql")
        .with_attribute("db.operation", operation)
        .with_attribute("db.table", table)
        .with_attribute("db.latency_ms", latency_ms)
        .with_attribute("db.status", status)
    )


def init_telemetry() -> None:
    """初始化遥测模块"""
    get_tracer()
    logger.info("Telemetry module initialized (simple mode)")


__all__ = [
    "get_tracer",
    "SpanBuilder",
    "create_span",
    "trace_ai_call",
    "trace_tool_call",
    "trace_db_call",
    "init_telemetry",
]
