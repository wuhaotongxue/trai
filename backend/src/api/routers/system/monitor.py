#!/usr/bin/env python
# 文件名: monitor.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: 系统监控接口

from __future__ import annotations

import os
import platform
import time
from datetime import datetime
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class PlatformInfo(BaseModel):
    """平台信息"""

    system: str = Field(description="操作系统")
    release: str = Field(description="系统版本")
    machine: str = Field(description="机器架构")
    python_version: str = Field(description="Python 版本")


class MemoryInfo(BaseModel):
    """内存信息"""

    total: float = Field(description="总内存(GB)")
    available: float = Field(description="可用内存(GB)")
    used: float = Field(description="已用内存(GB)")
    percent: float = Field(description="使用率(%)")


class CpuInfo(BaseModel):
    """CPU 信息"""

    count: int = Field(description="CPU 核心数")
    usage: float = Field(description="使用率(%)")


class DatabaseStats(BaseModel):
    """数据库统计"""

    status: str = Field(description="状态")
    session_count: int = Field(default=0, description="当前会话数")
    query_time_ms: float = Field(default=0, description="查询时间(毫秒)")


class ServiceStatus(BaseModel):
    """服务状态"""

    name: str = Field(description="服务名称")
    status: str = Field(description="状态")
    latency_ms: float | None = Field(default=None, description="延迟(毫秒)")
    error: str | None = Field(default=None, description="错误")


class MonitorResponse(BaseModel):
    """监控响应"""

    status: str = Field(description="整体状态")
    timestamp: str = Field(description="时间戳")
    uptime_seconds: float = Field(description="运行时长(秒)")
    platform: PlatformInfo = Field(description="平台信息")
    memory: MemoryInfo = Field(description="内存信息")
    cpu: CpuInfo = Field(description="CPU 信息")
    database: DatabaseStats | None = Field(default=None, description="数据库统计")
    services: dict[str, ServiceStatus] = Field(default_factory=dict, description="服务状态")


# 服务启动时间
_start_time = time.time()


def get_memory_info() -> MemoryInfo:
    """获取内存信息"""
    try:
        import psutil

        mem = psutil.virtual_memory()
        return MemoryInfo(
            total=round(mem.total / (1024**3), 2),
            available=round(mem.available / (1024**3), 2),
            used=round(mem.used / (1024**3), 2),
            percent=mem.percent,
        )
    except ImportError:
        return MemoryInfo(total=0, available=0, used=0, percent=0)


def get_cpu_info() -> CpuInfo:
    """获取 CPU 信息"""
    try:
        import psutil

        return CpuInfo(
            count=psutil.cpu_count(),
            usage=psutil.cpu_percent(interval=0.1),
        )
    except ImportError:
        return CpuInfo(count=0, usage=0)


def get_database_stats() -> DatabaseStats | None:
    """获取数据库统计"""
    try:
        from sqlalchemy import text

        from infrastructure.database.database import get_database

        db = get_database()
        session = db.get_session()

        start = time.perf_counter()
        session.execute(text("SELECT 1"))
        query_time_ms = (time.perf_counter() - start) * 1000
        session.close()

        return DatabaseStats(
            status="connected",
            session_count=1,
            query_time_ms=round(query_time_ms, 2),
        )

    except Exception:
        return DatabaseStats(status="disconnected", session_count=0, query_time_ms=0)


def get_service_status() -> dict[str, ServiceStatus]:
    """获取各服务状态"""
    services: dict[str, ServiceStatus] = {}

    # S3 存储
    services["s3_storage"] = _check_s3()

    # AI 服务
    services["ai_service"] = _check_ai()

    # 通知服务(检查是否配置了任何一个)
    services["notify_service"] = _check_notify()

    return services


def _check_s3() -> ServiceStatus:
    """检查 S3 服务"""
    try:
        endpoint = os.getenv("S3_ENDPOINT", "")
        access_key = os.getenv("S3_ACCESS_KEY", "")

        if not endpoint or not access_key:
            return ServiceStatus(
                name="s3_storage",
                status="not_configured",
            )

        return ServiceStatus(
            name="s3_storage",
            status="configured",
        )

    except Exception as e:
        return ServiceStatus(
            name="s3_storage",
            status="error",
            error=str(e),
        )


def _check_ai() -> ServiceStatus:
    """检查 AI 服务"""
    try:
        api_key = os.getenv("OPENAI_API_KEY", "")
        os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

        if not api_key:
            return ServiceStatus(
                name="ai_service",
                status="not_configured",
            )

        return ServiceStatus(
            name="ai_service",
            status="configured",
        )

    except Exception as e:
        return ServiceStatus(
            name="ai_service",
            status="error",
            error=str(e),
        )


def _check_notify() -> ServiceStatus:
    """检查通知服务配置"""
    try:
        feishu = os.getenv("FEISHU_WEBHOOK_URL", "")
        wecom = os.getenv("WECOM_WEBHOOK_URL", "")
        dingtalk = os.getenv("DINGTALK_WEBHOOK_URL", "")

        configured = []
        if feishu:
            configured.append("feishu")
        if wecom:
            configured.append("wecom")
        if dingtalk:
            configured.append("dingtalk")

        if configured:
            return ServiceStatus(
                name="notify_service",
                status="configured",
            )
        else:
            return ServiceStatus(
                name="notify_service",
                status="not_configured",
            )

    except Exception as e:
        return ServiceStatus(
            name="notify_service",
            status="error",
            error=str(e),
        )


@router.get("/monitor", response_model=MonitorResponse, tags=["系统"])
async def system_monitor() -> MonitorResponse:
    """系统监控接口

    Returns:
        MonitorResponse: 系统状态信息
    """
    uptime = time.time() - _start_time

    return MonitorResponse(
        status="running",
        timestamp=datetime.now().isoformat(),
        uptime_seconds=round(uptime, 2),
        platform=PlatformInfo(
            system=platform.system(),
            release=platform.release(),
            machine=platform.machine(),
            python_version=platform.python_version(),
        ),
        memory=get_memory_info(),
        cpu=get_cpu_info(),
        database=get_database_stats(),
        services=get_service_status(),
    )


@router.get("/monitor/metrics", tags=["系统"])
async def metrics() -> dict[str, Any]:
    """Prometheus 格式指标

    Returns:
        dict: Prometheus 格式指标
    """
    import psutil

    mem = psutil.virtual_memory()
    cpu_usage = psutil.cpu_percent(interval=0.1)
    uptime = time.time() - _start_time

    metrics_text = f"""# HELP trai_uptime_seconds 服务运行时长
# TYPE trai_uptime_seconds gauge
trai_uptime_seconds {uptime:.2f}

# HELP trai_cpu_usage_percent CPU 使用率
# TYPE trai_cpu_usage_percent gauge
trai_cpu_usage_percent {cpu_usage:.2f}

# HELP trai_memory_usage_percent 内存使用率
# TYPE trai_memory_usage_percent gauge
trai_memory_usage_percent {mem.percent:.2f}

# HELP trai_memory_total_bytes 总内存(字节)
# TYPE trai_memory_total_bytes gauge
trai_memory_total_bytes {mem.total}

# HELP trai_memory_available_bytes 可用内存(字节)
# TYPE trai_memory_available_bytes gauge
trai_memory_available_bytes {mem.available}
"""

    return {
        "content_type": "text/plain",
        "body": metrics_text,
    }


__all__ = ["router"]
