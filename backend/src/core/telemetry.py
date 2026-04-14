#!/usr/bin/env python
# 文件名: telemetry.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: OpenTelemetry 可观测性集成

from __future__ import annotations

import os
from typing import Any

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.trace import Span, Status, StatusCode

from core.logger import get_logger

logger = get_logger()

_tracer: trace.Tracer | None = None


def get_tracer(name: str = "trai") -> trace.Tracer:
    """获取 Tracer 实例

    Args:
        name: tracer 名称

    Returns:
        trace.Tracer: tracer 实例
    """
    global _tracer
    if _tracer is not None:
        return _tracer

    # 构建 Resource
    resource = Resource.create(
        {
            "service.name": "trai-api",
            "service.version": os.getenv("APP_VERSION", "0.1.0"),
            "deployment.environment": os.getenv("DEPLOY_ENV", "development"),
        }
    )

    # 创建 TracerProvider
    provider = TracerProvider(resource=resource)

    # 添加 Console 导出器(开发环境)
    if os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT"):
        try:
            otlp_exporter = OTLPSpanExporter()
            provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
            logger.info("OpenTelemetry OTLP exporter configured")
        except Exception as e:
            logger.warning(f"Failed to configure OTLP exporter: {e}")

    if os.getenv("OTEL_CONSOLE_EXPORT", "false").lower() == "true":
        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))

    trace.set_tracer_provider(provider)
    _tracer = trace.get_tracer(name)

    logger.info("OpenTelemetry tracer initialized")
    return _tracer


class SpanBuilder:
    """Span 构建器"""

    def __init__(self, tracer: trace.Tracer, name: str) -> None:
        self._tracer = tracer
        self._name = name
        self._span: Span | None = None
        self._attributes: dict[str, Any] = {}

    def with_attribute(self, key: str, value: Any) -> SpanBuilder:
        """添加属性"""
        self._attributes[key] = value
        return self

    def with_attributes(self, **kwargs: Any) -> SpanBuilder:
        """批量添加属性"""
        self._attributes.update(kwargs)
        return self

    def start(self) -> SpanBuilder:
        """启动 Span"""
        self._span = self._tracer.start_span(self._name)
        for key, value in self._attributes.items():
            self._span.set_attribute(key, value)
        return self

    def end(self) -> None:
        """结束 Span"""
        if self._span:
            self._span.end()
            self._span = None

    def set_status(self, code: StatusCode, message: str = "") -> None:
        """设置状态"""
        if self._span:
            self._span.set_status(Status(code, message))

    def record_exception(self, exception: Exception) -> None:
        """记录异常"""
        if self._span:
            self._span.record_exception(exception)
            self._span.set_status(Status(StatusCode.ERROR, str(exception)))

    def add_event(self, name: str, attributes: dict[str, Any] | None = None) -> None:
        """添加事件"""
        if self._span:
            self._span.add_event(name, attributes or {})

    def __enter__(self) -> SpanBuilder:
        return self.start()

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if exc_type:
            self.record_exception(exc_val)
        self.end()


def create_span(
    name: str,
    tracer: trace.Tracer | None = None,
    **attributes: Any,
) -> SpanBuilder:
    """创建 Span 的快捷方法

    Args:
        name: span 名称
        tracer: tracer 实例
        **attributes: span 属性

    Returns:
        SpanBuilder: span 构建器
    """
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
    """追踪 AI 对话调用

    Args:
        model: 模型名称
        messages: 消息列表
        user_id: 用户 ID
        session_id: 会话 ID

    Returns:
        SpanBuilder: span 构建器
    """
    tracer = get_tracer()
    return (
        create_span(tracer, "ai.chat")
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
    """追踪工具调用

    Args:
        tool_name: 工具名称
        risk_level: 风险等级
        user_id: 用户 ID

    Returns:
        SpanBuilder: span 构建器
    """
    tracer = get_tracer()
    return (
        create_span(tracer, f"tool.{tool_name}")
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
    """追踪数据库调用

    Args:
        operation: 操作类型
        table: 表名
        latency_ms: 延迟(毫秒)
        status: 状态

    Returns:
        SpanBuilder: span 构建器
    """
    tracer = get_tracer()
    return (
        create_span(tracer, f"db.{operation}")
        .with_attribute("db.system", "postgresql")
        .with_attribute("db.operation", operation)
        .with_attribute("db.table", table)
        .with_attribute("db.latency_ms", latency_ms)
        .with_attribute("db.status", status)
    )


def init_telemetry() -> None:
    """初始化遥测模块"""
    get_tracer()
    logger.info("Telemetry module initialized")


__all__ = [
    "get_tracer",
    "SpanBuilder",
    "create_span",
    "trace_ai_call",
    "trace_tool_call",
    "trace_db_call",
    "init_telemetry",
]
