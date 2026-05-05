#!/usr/bin/env python
# 文件名: health.py
# 作者: wuhao
# 日期: 2026_04_16_10:14:02
# 描述: 健康检查接口

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class HealthResponse(BaseModel):
    """健康检查响应"""

    status: str = Field(description="健康状态")
    service: str = Field(description="服务名称")
    version: str = Field(description="版本号")
    timestamp: str = Field(description="检查时间")


class DependencyStatus(BaseModel):
    """依赖服务状态"""

    name: str = Field(description="服务名称")
    status: str = Field(description="状态")
    latency_ms: float | None = Field(default=None, description="响应延迟(毫秒)")
    error: str | None = Field(default=None, description="错误信息")


class DetailedHealthResponse(BaseModel):
    """详细健康检查响应"""

    status: str = Field(description="整体健康状态")
    service: str = Field(description="服务名称")
    version: str = Field(description="版本号")
    timestamp: str = Field(description="检查时间")
    dependencies: dict[str, DependencyStatus] = Field(description="依赖服务状态")


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="健康检查",
    description="用于快速确认服务是否存活. 通常用于负载均衡或简单探活.",
    tags=["系统"],
)
async def health_check() -> HealthResponse:
    """健康检查接口

    Returns:
        HealthResponse: 健康状态信息
    """
    return HealthResponse(
        status="healthy",
        service="TRAI API",
        version="0.1.0",
        timestamp=datetime.now().isoformat(),
    )


@router.get(
    "/health/detailed",
    response_model=DetailedHealthResponse,
    summary="详细健康检查",
    description="用于检查核心依赖组件状态, 如数据库与 AI 配置. 建议仅内部使用.",
    tags=["系统"],
)
async def detailed_health_check() -> DetailedHealthResponse:
    """详细健康检查接口

    检查数据库,Redis,AI 服务等依赖状态

    Returns:
        DetailedHealthResponse: 详细健康状态
    """
    dependencies: dict[str, DependencyStatus] = {}
    overall_status = "healthy"

    # 检查数据库
    db_status = await _check_database()
    dependencies["database"] = db_status
    if db_status.status != "healthy":
        overall_status = "degraded"

    # 检查 AI 服务
    ai_status = await _check_ai_service()
    dependencies["ai_service"] = ai_status

    return DetailedHealthResponse(
        status=overall_status,
        service="TRAI API",
        version="0.1.0",
        timestamp=datetime.now().isoformat(),
        dependencies=dependencies,
    )


@router.get(
    "/health/liveness",
    summary="存活探针",
    description="用于 Kubernetes livenessProbe, 判断进程是否存活.",
    tags=["系统"],
)
async def liveness_check() -> dict[str, str]:
    """存活探针

    用于 Kubernetes livenessProbe,判断服务是否存活

    Returns:
        dict: 存活状态
    """
    return {"status": "alive"}


@router.get(
    "/health/readiness",
    summary="就绪探针",
    description="用于 Kubernetes readinessProbe, 判断服务是否可接收流量.",
    tags=["系统"],
)
async def readiness_check() -> dict[str, Any]:
    """就绪探针

    用于 Kubernetes readinessProbe,判断服务是否可以接收流量

    Returns:
        dict: 就绪状态
    """
    # 检查数据库连接
    db_ready = await _check_database()
    db_ok = db_ready.status == "healthy"

    if db_ok:
        return {"status": "ready", "database": "connected"}
    else:
        return {"status": "not_ready", "database": "disconnected"}


async def _check_database() -> DependencyStatus:
    """检查数据库连接

    Returns:
        DependencyStatus: 数据库状态
    """
    import time

    try:
        from sqlalchemy import text

        from infrastructure.database.database import get_database

        db = get_database()
        session = db.get_session()

        start = time.perf_counter()
        session.execute(text("SELECT 1"))
        latency_ms = (time.perf_counter() - start) * 1000
        session.close()

        return DependencyStatus(
            name="database",
            status="healthy",
            latency_ms=round(latency_ms, 2),
        )

    except Exception as e:
        return DependencyStatus(
            name="database",
            status="unhealthy",
            latency_ms=None,
            error=str(e),
        )


async def _check_ai_service() -> DependencyStatus:
    """检查 AI 服务状态

    Returns:
        DependencyStatus: AI 服务状态
    """
    import os

    try:
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            return DependencyStatus(
                name="ai_service",
                status="not_configured",
                latency_ms=None,
                error="OPENAI_API_KEY not set",
            )

        # 简单检查 API key 格式
        if len(api_key) < 10:
            return DependencyStatus(
                name="ai_service",
                status="not_configured",
                latency_ms=None,
                error="OPENAI_API_KEY invalid",
            )

        return DependencyStatus(
            name="ai_service",
            status="configured",
            latency_ms=None,
        )

    except Exception as e:
        return DependencyStatus(
            name="ai_service",
            status="error",
            latency_ms=None,
            error=str(e),
        )


__all__ = ["router"]
