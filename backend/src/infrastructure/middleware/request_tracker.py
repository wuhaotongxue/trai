#!/usr/bin/env python
# 文件名: request_tracker.py
# 作者: wuhao
# 日期: 2026_05_04_17:30:00
# 描述: 请求追踪中间件 (Skills合规: 类封装)

from __future__ import annotations

import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from fastapi import Request, Response
from loguru import logger

from infrastructure.logging.structured_logger import structured_log


@dataclass
class RequestInfo:
    """请求数据类"""

    request_id: str
    method: str
    path: str
    client_ip: str
    user_agent: str | None = None
    user_id: str | None = None
    start_time: float = field(default_factory=time.time)

    def to_dict(self) -> dict[str, Any]:
        """转换为字典"""
        return {
            "request_id": self.request_id,
            "method": self.method,
            "path": self.path,
            "client_ip": self.client_ip,
            "user_agent": self.user_agent,
            "user_id": self.user_id,
            "start_time": datetime.fromtimestamp(self.start_time).isoformat(),
        }


class RequestTrackerMiddleware:
    """
    请求追踪中间件类 (Skills 规范: 强制类封装)

    功能:
    - 自动生成Request ID(用于日志关联)
    - 记录请求耗时(毫秒级精度)
    - 提取客户端信息(IP/User-Agent等)
    - 慢请求告警(超过阈值)
    - 请求统计(成功率/平均响应时间)

    使用示例:
        app.add_middleware(RequestTrackerMiddleware)

        # 在路由中获取request_id
        @app.get("/test")
        async def test(request: Request):
            req_id = request.state.request_info.request_id
    """

    # 配置常量
    DEFAULT_CONFIG = {
        "slow_request_threshold_ms": 1000,  # 慢请求阈值(1秒)
        "include_request_body": False,  # 是否记录请求体
        "include_response_body": False,  # 是否记录响应体
        "log_all_requests": True,  # 是否记录所有请求
        "header_name": "X-Request-ID",  # Request ID响应头名
    }

    def __init__(self, app, config: dict[str, Any] | None = None):
        """
        初始化中间件

        Args:
            app: FastAPI应用实例
            config: 自定义配置(可选)
        """
        self.app = app
        self.config = self.DEFAULT_CONFIG.copy()
        if config:
            self.config.update(config)

        # 统计信息
        self._stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "slow_requests": 0,
            "total_response_time_ms": 0,
            "by_method": {},
            "by_path": {},
        }

        logger.info("RequestTrackerMiddleware initialized")

    async def __call__(self, request: Request, call_next: Callable) -> Response:
        """
        中间件主处理函数

        Args:
            request: FastAPI请求对象
            call_next: 下一个处理器

        Returns:
            Response: HTTP响应
        """
        start_time = time.perf_counter()

        # 生成或获取Request ID
        request_id = request.headers.get(
            self.config["header_name"],
            str(uuid.uuid4())[:12],
        )

        # 提取客户端IP
        client_ip = self._get_client_ip(request)

        # 创建请求信息对象
        request_info = RequestInfo(
            request_id=request_id,
            method=request.method,
            path=str(request.url.path),
            client_ip=client_ip,
            user_agent=request.headers.get("user-agent"),
        )

        # 存储到request.state(供后续使用)
        request.state.request_info = request_info

        # 记录请求开始
        if self.config["log_all_requests"]:
            structured_log.api_request(
                method=request.method,
                path=request.url.path,
                ip=client_ip,
                user_id=getattr(request.state.user, "user_id", None) if hasattr(request.state, "user") else None,
            )

        # 处理请求
        response = await call_next(request)

        # 计算耗时
        process_time_ms = (time.perf_counter() - start_time) * 1000

        # 更新统计
        self._update_stats(request_info, process_time_ms, response.status_code)

        # 添加响应头
        response.headers[self.config["header_name"]] = request_id
        response.headers["X-Process-Time"] = f"{process_time_ms:.2f}ms"

        # 记录响应
        if self.config["log_all_requests"]:
            structured_log.api_response(
                status_code=response.status_code,
                duration_ms=process_time_ms,
                path=request.url.path,
            )

        # 慢请求告警
        if process_time_ms > self.config["slow_request_threshold_ms"]:
            self._stats["slow_requests"] += 1
            logger.warning(
                f"Slow request detected | {request.method} {request.url.path} | "
                f"duration={process_time_ms:.1f}ms | threshold={self.config['slow_request_threshold_ms']}ms"
            )

        return response

    def _get_client_ip(self, request: Request) -> str:
        """
        获取客户端真实IP

        Args:
            request: FastAPI请求对象

        Returns:
            IP地址字符串
        """
        # 检查代理头
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    def _update_stats(
        self,
        request_info: RequestInfo,
        duration_ms: float,
        status_code: int,
    ) -> None:
        """更新统计信息"""

        self._stats["total_requests"] += 1
        self._stats["total_response_time_ms"] += duration_ms

        if status_code < 400:
            self._stats["successful_requests"] += 1
        else:
            self._stats["failed_requests"] += 1

        # 按方法统计
        method = request_info.method
        if method not in self._stats["by_method"]:
            self._stats["by_method"][method] = {
                "count": 0,
                "avg_duration_ms": 0,
            }
        self._stats["by_method"][method]["count"] += 1

        # 按路径统计
        path = request_info.path
        if path not in self._stats["by_path"]:
            self._stats["by_path"][path] = {
                "count": 0,
                "avg_duration_ms": 0,
            }
        self._stats["by_path"][path]["count"] += 1

    def get_stats(self) -> dict[str, Any]:
        """
        获取请求统计信息

        Returns:
            统计字典
        """
        total = self._stats["total_requests"]
        avg_duration = self._stats["total_response_time_ms"] / total if total > 0 else 0

        success_rate = (self._stats["successful_requests"] / total * 100) if total > 0 else 0

        return {
            **self._stats,
            "avg_response_time_ms": round(avg_duration, 2),
            "success_rate_percent": round(success_rate, 2),
            "slow_request_count": self._stats["slow_requests"],
            "top_endpoints": sorted(
                self._stats["by_path"].items(),
                key=lambda x: x[1]["count"],
                reverse=True,
            )[:10],
        }


# 全局单例工厂函数
def create_request_tracker_middleware(app, **kwargs):
    """
    创建请求追踪中间件实例

    Args:
        app: FastAPI应用
        **kwargs: 配置参数

    Returns:
        RequestTrackerMiddleware实例
    """
    return RequestTrackerMiddleware(app, kwargs)


__all__ = [
    "RequestTrackerMiddleware",
    "RequestInfo",
    "create_request_tracker_middleware",
]
