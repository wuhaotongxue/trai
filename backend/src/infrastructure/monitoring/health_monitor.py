#!/usr/bin/env python
# 文件名: health_monitor.py
# 作者: wuhao
# 日期: 2026_05_04_17:45:00
# 描述: 健康检查和系统监控服务 (Skills合规: 类封装)

from __future__ import annotations

import os
import platform
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any

import psutil
from fastapi import APIRouter
from loguru import logger


class HealthStatus(StrEnum):
    """健康状态"""

    HEALTHY = "healthy"
    DEGRADED = "degraded"  # 部分功能降级
    UNHEALTHY = "unhealthy"


@dataclass
class HealthCheckResult:
    """健康检查结果"""

    status: HealthStatus
    checks: dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status.value,
            "timestamp": self.timestamp,
            "checks": self.checks,
        }


@dataclass
class SystemMetrics:
    """系统指标"""

    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float
    load_average: list[float]
    process_count: int
    uptime_seconds: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "cpu_percent": round(self.cpu_percent, 2),
            "memory_percent": round(self.memory_percent, 2),
            "memory_used_mb": round(self.memory_used_mb, 2),
            "memory_total_mb": round(self.memory_total_mb, 2),
            "disk_percent": round(self.disk_percent, 2),
            "disk_used_gb": round(self.disk_used_gb, 2),
            "disk_total_gb": round(self.disk_total_gb, 2),
            "load_average": self.load_average,
            "process_count": self.process_count,
            "uptime_seconds": round(self.uptime_seconds, 2),
        }


class HealthMonitor:
    """
    健康检查和系统监控类 (Skills 规范: 强制类封装)

    功能:
    - 应用健康状态检查
    - 系统资源监控(CPU/内存/磁盘)
    - 数据库连接检查
    - 缓存服务检查
    - AI服务可用性检查
    - 性能指标收集

    使用示例:
        monitor = HealthMonitor()

        @app.get("/health")
        async def health_check():
            return monitor.check_health()
    """

    # 阈值配置
    THRESHOLDS = {
        "cpu_warning": 80.0,  # CPU使用率警告阈值(%)
        "cpu_critical": 95.0,  # CPU使用率严重阈值(%)
        "memory_warning": 85.0,  # 内存使用率警告阈值(%)
        "memory_critical": 95.0,  # 内存使用率严重阈值(%)
        "disk_warning": 85.0,  # 磁盘使用率警告阈值(%)
        "disk_critical": 95.0,  # 磁盘使用率严重阈值(%)
        "response_time_warning_ms": 500,  # 响应时间警告(ms)
        "response_time_critical_ms": 2000,  # 响应时间严重(ms)
    }

    def __init__(self):
        """初始化健康监控器"""
        self._start_time = time.time()
        self._last_check_result: HealthCheckResult | None = None

        logger.info("HealthMonitor initialized")

    def check_health(self) -> HealthCheckResult:
        """
        执行全面健康检查

        Returns:
            HealthCheckResult: 检查结果
        """
        checks = {}
        all_healthy = True
        any_degraded = False

        # 1. 系统资源检查
        system_status = self._check_system_resources()
        checks["system"] = system_status

        if system_status["status"] != "pass":
            all_healthy = False
            if system_status["status"] == "warn":
                any_degraded = True

        # 2. 数据库连接检查
        db_status = self._check_database()
        checks["database"] = db_status

        if db_status["status"] != "pass":
            all_healthy = False
            if db_status["status"] == "warn":
                any_degraded = True

        # 3. 内存缓存检查(可选)
        cache_status = self._check_cache()
        checks["cache"] = cache_status

        if cache_status["status"] == "fail":
            any_degraded = True  # 缓存失败不算不健康,只是降级

        # 确定整体状态
        if all_healthy:
            overall_status = HealthStatus.HEALTHY
        elif any_degraded:
            overall_status = HealthStatus.DEGRADED
        else:
            overall_status = HealthStatus.UNHEALTHY

        result = HealthCheckResult(
            status=overall_status,
            checks=checks,
        )

        self._last_check_result = result

        return result

    def _check_system_resources(self) -> dict[str, Any]:
        """检查系统资源"""
        try:
            metrics = self.get_system_metrics()

            issues = []
            status = "pass"

            if metrics.cpu_percent > self.THRESHOLDS["cpu_critical"]:
                status = "fail"
                issues.append(f"CPU critical: {metrics.cpu_percent}%")
            elif metrics.cpu_percent > self.THRESHOLDS["cpu_warning"]:
                status = "warn"
                issues.append(f"CPU warning: {metrics.cpu_percent}%")

            if metrics.memory_percent > self.THRESHOLDS["memory_critical"]:
                status = "fail"
                issues.append(f"Memory critical: {metrics.memory_percent}%")
            elif metrics.memory_percent > self.THRESHOLDS["memory_warning"]:
                if status != "fail":
                    status = "warn"
                issues.append(f"Memory warning: {metrics.memory_percent}%")

            if metrics.disk_percent > self.THRESHOLDS["disk_critical"]:
                status = "fail"
                issues.append(f"Disk critical: {metrics.disk_percent}%")
            elif metrics.disk_percent > self.THRESHOLDS["disk_warning"]:
                if status != "fail":
                    status = "warn"
                issues.append(f"Disk warning: {metrics.disk_percent}%")

            return {
                "status": status,
                "metrics": metrics.to_dict(),
                "issues": issues,
            }

        except Exception as e:
            logger.error(f"System resource check failed: {e}")
            return {"status": "fail", "error": str(e)}

    def _check_database(self) -> dict[str, Any]:
        """检查数据库连接"""
        try:
            from infrastructure.database.database import get_db_engine

            engine = get_db_engine()

            start_time = time.perf_counter()
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            duration_ms = (time.perf_counter() - start_time) * 1000

            status = "pass"
            issues = []

            if duration_ms > self.THRESHOLDS["response_time_critical_ms"]:
                status = "fail"
                issues.append(f"Slow response: {duration_ms:.1f}ms")
            elif duration_ms > self.THRESHOLDS["response_time_warning_ms"]:
                status = "warn"
                issues.append(f"Slow response: {duration_ms:.1f}ms")

            return {
                "status": status,
                "response_time_ms": round(duration_ms, 2),
                "issues": issues,
            }

        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {"status": "fail", "error": str(e)}

    def _check_cache(self) -> dict[str, Any]:
        """检查缓存服务"""
        try:
            from infrastructure.services.query_cache_service import query_cache

            stats = query_cache.get_stats()

            hit_rate = (
                stats["hits"] / (stats["hits"] + stats["misses"]) * 100 if (stats["hits"] + stats["misses"]) > 0 else 0
            )

            return {
                "status": "pass",
                "hit_rate_percent": round(hit_rate, 2),
                "cache_size": len(query_cache._cache_store),
            }

        except Exception as e:
            logger.warning(f"Cache check failed (non-critical): {e}")
            return {"status": "fail", "error": str(e), "note": "Non-critical"}

    def get_system_metrics(self) -> SystemMetrics:
        """
        获取当前系统指标

        Returns:
            SystemMetrics: 系统指标对象
        """
        cpu_percent = psutil.cpu_percent(interval=0.1)

        memory = psutil.virtual_memory()
        memory_used_mb = memory.used / (1024 * 1024)
        memory_total_mb = memory.total / (1024 * 1024)

        disk = psutil.disk_usage("/")
        disk_used_gb = disk.used / (1024**3)
        disk_total_gb = disk.total / (1024**3)

        # 负载平均值(Unix-like系统)
        try:
            load_avg = list(psutil.getloadavg()) if hasattr(psutil, "getloadavg") else [0, 0, 0]
        except (OSError, AttributeError):
            load_avg = [0, 0, 0]

        process_count = len(psutil.pids())
        uptime_seconds = time.time() - self._start_time

        return SystemMetrics(
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            memory_used_mb=memory_used_mb,
            memory_total_mb=memory_total_mb,
            disk_percent=disk.percent,
            disk_used_gb=disk_used_gb,
            disk_total_gb=disk_total_gb,
            load_average=load_avg,
            process_count=process_count,
            uptime_seconds=uptime_seconds,
        )

    def get_app_info(self) -> dict[str, Any]:
        """
        获取应用信息

        Returns:
            应用信息字典
        """
        return {
            "name": "Trai Backend",
            "version": "1.0.0",
            "environment": os.getenv("APP_ENV", "development"),
            "python_version": platform.python_version(),
            "platform": f"{platform.system()} {platform.release()}",
            "hostname": platform.node(),
            "pid": os.getpid(),
            "started_at": datetime.fromtimestamp(self._start_time).isoformat(),
            "uptime_seconds": round(time.time() - self._start_time, 2),
        }


# 创建路由
def create_health_router(monitor: HealthMonitor) -> APIRouter:
    """
    创建健康检查路由

    Args:
        monitor: HealthMonitor实例

    Returns:
        APIRouter: 路由实例
    """
    router = APIRouter(prefix="/health", tags=["Health"])

    @router.get("")
    async def health_check():
        """基本健康检查(用于负载均衡器)"""
        result = monitor.check_health()

        if result.status == HealthStatus.HEALTHY:
            return {"status": "ok"}
        else:
            from infrastructure.middleware.exception_handler import AppError, ErrorCode

            raise AppError(
                code=ErrorCode.INTERNAL_ERROR,
                message="Service unhealthy",
                details=result.to_dict(),
                status_code=503,
            )

    @router.get("/detailed")
    async def detailed_health_check():
        """详细健康检查(包含所有组件状态)"""
        result = monitor.check_health()
        return result.to_dict()

    @router.get("/metrics")
    async def system_metrics():
        """获取系统性能指标"""
        metrics = monitor.get_system_metrics()
        return metrics.to_dict()

    @router.get("/info")
    async def app_info():
        """获取应用信息"""
        return monitor.get_app_info()

    return router


# 全局单例实例
health_monitor = HealthMonitor()


__all__ = [
    "HealthMonitor",
    "HealthCheckResult",
    "SystemMetrics",
    "HealthStatus",
    "health_monitor",
    "create_health_router",
]
