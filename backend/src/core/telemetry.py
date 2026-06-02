#!/usr/bin/env python
# 文件名: telemetry.py
# 作者: wuhao
# 日期: 2026_06_02
# 描述: OpenTelemetry 链路追踪集成 (支持 OTLP 导出与 Console 输出)

from __future__ import annotations

import os
from typing import Any

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter

from core.logger import get_logger

logger = get_logger()

_is_initialized = False


def init_telemetry() -> None:
    """初始化 OpenTelemetry 遥测模块，集成请求和外部 API 追踪"""
    global _is_initialized
    if _is_initialized:
        return

    # 配置 Resource
    resource = Resource.create(
        {
            "service.name": os.getenv("OTEL_SERVICE_NAME", "trai-backend"),
            "service.version": "0.1.0",
        }
    )

    # 设置 TracerProvider
    provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(provider)

    # 配置 Exporter (OTLP 优先, 如果配置了 ENDPOINT)
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if otlp_endpoint:
        otlp_exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
        logger.info(f"OpenTelemetry OTLP Exporter 配置完成: {otlp_endpoint}")
    else:
        # 默认只在控制台输出关键信息（为了不刷屏，可以考虑去掉，但这里保留供调试）
        console_exporter = ConsoleSpanExporter()
        provider.add_span_processor(BatchSpanProcessor(console_exporter))
        logger.info("OpenTelemetry Console Exporter 配置完成 (OTLP Endpoint 未配置)")

    # 自动注入各个库
    try:
        from opentelemetry.instrumentation.requests import RequestsInstrumentor

        RequestsInstrumentor().instrument()
        logger.info("Requests 自动追踪已开启")
    except ImportError:
        logger.warning("未安装 opentelemetry-instrumentation-requests")

    try:
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

        HTTPXClientInstrumentor().instrument()
        logger.info("HTTPX 自动追踪已开启")
    except ImportError:
        logger.warning("未安装 opentelemetry-instrumentation-httpx")

    try:
        from opentelemetry.instrumentation.openai import OpenAIInstrumentor

        OpenAIInstrumentor().instrument()
        logger.info("OpenAI API 自动追踪已开启")
    except ImportError:
        logger.warning("未安装 opentelemetry-instrumentation-openai")

    _is_initialized = True
    logger.info("Telemetry 模块初始化成功")


def get_tracer(name: str = "trai") -> Any:
    """获取 Tracer 实例"""
    return trace.get_tracer(name)


__all__ = ["init_telemetry", "get_tracer"]
