#!/usr/bin/env python
# 文件名: rate_limiter.py
# 作者: wuhao
# 日期: 2026_05_04_15:30:00
# 描述: API限流和防刷中间件 (Skills合规: 类封装)

from __future__ import annotations

import time
from collections import defaultdict
from collections.abc import Callable
from typing import Any

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from loguru import logger


class RateLimiter:
    """
    API 限流器类 (Skills 规范: 强制类封装)

    功能:
    - 基于IP的请求频率限制
    - 基于用户的请求频率限制
    - 滑动窗口算法(更精确的限流)
    - 防刷机制(检测异常流量模式)
    - 自动封禁恶意IP

    使用示例:
        limiter = RateLimiter()

        @app.middleware("http")
        async def rate_limit_middleware(request, call_next):
            return await limiter.check_rate_limit(request, call_next)
    """

    # 默认限制配置
    DEFAULT_LIMITS = {
        "global": {
            "requests_per_minute": 60,
            "requests_per_hour": 1000,
            "burst": 10,  # 突发请求数
        },
        "per_user": {
            "requests_per_minute": 30,
            "requests_per_hour": 500,
        },
        "per_ip": {
            "requests_per_minute": 20,
            "requests_per_hour": 200,
        },
        "endpoints": {
            "/sessions/{session_id}/messages": {"rpm": 10},  # 发消息接口更严格
            "/sessions": {"rpm": 5},  # 创建会话接口
            "/sessions/search": {"rpm": 10},  # 搜索接口
        },
    }

    # 封禁配置
    BAN_CONFIG = {
        "threshold_requests_per_second": 50,  # 每秒超过此值触发警报
        "ban_duration_seconds": 3600,  # 封禁时长(1小时)
        "max_violations_before_ban": 5,  # 违规次数达到此值后自动封禁
    }

    def __init__(self):
        """初始化限流器"""
        # 存储每个 IP/用户的请求时间戳
        self._request_history: dict[str, list[float]] = defaultdict(list)

        # 存储被封禁的 IP 和解封时间
        self._banned_ips: dict[str, float] = {}

        # 违规计数
        self._violation_counts: dict[str, int] = defaultdict(int)

        # 统计信息
        self._stats = {
            "total_requests": 0,
            "blocked_requests": 0,
            "banned_ips_count": 0,
        }

        logger.info("RateLimiter initialized")

    def _get_client_ip(self, request: Request) -> str:
        """
        获取客户端真实IP

        Args:
            request: FastAPI 请求对象

        Returns:
            客户端 IP 地址
        """
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    def _is_ip_banned(self, ip: str) -> bool:
        """
        检查IP是否被封禁

        Args:
            ip: IP地址

        Returns:
            是否被封禁
        """
        if ip not in self._banned_ips:
            return False

        ban_expiry = self._banned_ips[ip]
        if time.time() > ban_expiry:
            # 封禁已过期, 解除封禁
            del self._banned_ips[ip]
            self._violation_counts[ip] = 0
            logger.info(f"IP unbanned | ip={ip}")
            return False

        return True

    def _check_sliding_window(
        self,
        key: str,
        limit: int,
        window_seconds: int,
    ) -> tuple[bool, int]:
        """
        滑动窗口检查 (更精确的限流算法)

        Args:
            key: 标识符(IP或用户ID)
            limit: 请求数限制
            window_seconds: 时间窗口(秒)

        Returns:
            (是否允许, 当前窗口内请求数)
        """
        now = time.time()
        window_start = now - window_seconds

        # 清理过期的请求记录
        self._request_history[key] = [t for t in self._request_history[key] if t > window_start]

        current_count = len(self._request_history[key])

        if current_count >= limit:
            return False, current_count

        # 记录本次请求
        self._request_history[key].append(now)

        return True, current_count + 1

    def _detect_abnormal_traffic(self, ip: str) -> bool:
        """
        检测异常流量模式 (防刷机制)

        Args:
            ip: IP地址

        Returns:
            是否检测到异常
        """
        now = time.time()
        recent_requests = [
            t
            for t in self._request_history[ip]
            if t > now - 1.0  # 最近1秒内的请求
        ]

        # 如果1秒内请求数超过阈值, 认为是异常流量
        if len(recent_requests) > self.BAN_CONFIG["threshold_requests_per_second"]:
            logger.warning(f"Abnormal traffic detected | ip={ip} | requests_in_1s={len(recent_requests)}")

            # 增加违规计数
            self._violation_counts[ip] += 1

            # 检查是否需要封禁
            if self._violation_counts[ip] >= self.BAN_CONFIG["max_violations_before_ban"]:
                self._ban_ip(ip)
                return True

            return True

        return False

    def _ban_ip(self, ip: str) -> None:
        """
        封禁IP

        Args:
            ip: 要封禁的IP地址
        """
        ban_until = time.time() + self.BAN_CONFIG["ban_duration_seconds"]
        self._banned_ips[ip] = ban_until
        self._stats["banned_ips_count"] += 1

        logger.warning(f"IP banned | ip={ip} | duration={self.BAN_CONFIG['ban_duration_seconds']}s")

    async def check_rate_limit(
        self,
        request: Request,
        call_next: Callable,
    ) -> Response:
        """
        FastAPI 中间件主函数 - 检查请求频率限制

        Args:
            request: FastAPI 请求对象
            call_next: 下一个中间件/路由处理器

        Returns:
            Response: 正常响应或 429 Too Many Requests
        """
        self._stats["total_requests"] += 1

        client_ip = self._get_client_ip(request)

        # 检查IP是否被封禁
        if self._is_ip_banned(client_ip):
            self._stats["blocked_requests"] += 1
            logger.warning(f"Request from banned IP | ip={client_ip}")

            return JSONResponse(
                status_code=403,
                content={
                    "code": 403,
                    "message": "Your IP has been temporarily banned due to suspicious activity",
                    "retry_after": int(self._banned_ips[client_ip] - time.time()),
                },
            )

        # 路径匹配(排除静态资源和健康检查)
        path = request.url.path
        if path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # 获取用户ID(如果有)
        user_id = request.state.user.get("user_id") if hasattr(request.state, "user") else None

        # 检查全局限制
        allowed, count = self._check_sliding_window(
            f"global:{client_ip}",
            limit=self.DEFAULT_LIMITS["global"]["requests_per_minute"],
            window_seconds=60,
        )

        if not allowed:
            self._stats["blocked_requests"] += 1
            logger.warning(f"Rate limit exceeded | ip={client_ip} | path={path}")

            return JSONResponse(
                status_code=429,
                content={
                    "code": 429,
                    "message": "Too many requests. Please slow down.",
                    "retry_after": 60,
                    "details": {
                        "limit": self.DEFAULT_LIMITS["global"]["requests_per_minute"],
                        "current": count,
                    },
                },
                headers={"Retry-After": "60"},
            )

        # 检测异常流量
        if self._detect_abnormal_traffic(client_ip):
            self._stats["blocked_requests"] += 1
            return JSONResponse(
                status_code=429,
                content={
                    "code": 429,
                    "message": "Suspicious activity detected. Please slow down.",
                    "retry_after": 1,
                },
            )

        # 处理请求
        response = await call_next(request)

        # 添加速率限制响应头
        response.headers["X-RateLimit-Limit"] = str(self.DEFAULT_LIMITS["global"]["requests_per_minute"])
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, self.DEFAULT_LIMITS["global"]["requests_per_minute"] - count)
        )
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 60)

        return response

    def get_stats(self) -> dict[str, Any]:
        """
        获取限流统计信息

        Returns:
            统计字典
        """
        return {
            "total_requests": self._stats["total_requests"],
            "blocked_requests": self._stats["blocked_requests"],
            "banned_ips_count": self._stats["banned_ips_count"],
            "active_tracking_ips": len(self._request_history),
            "currently_banned_ips": len(self._banned_ips),
        }

    def unban_ip(self, ip: str) -> bool:
        """
        手动解除IP封禁

        Args:
            ip: IP地址

        Returns:
            是否成功解除
        """
        if ip in self._banned_ips:
            del self._banned_ips[ip]
            self._violation_counts[ip] = 0
            logger.info(f"IP manually unbanned | ip={ip}")
            return True
        return False

    def clear_history(self, ip: str | None = None) -> None:
        """
        清除请求历史记录

        Args:
            ip: 指定IP, 如果为None则清除所有
        """
        if ip:
            if ip in self._request_history:
                del self._request_history[ip]
                logger.debug(f"Cleared request history for ip={ip}")
        else:
            self._request_history.clear()
            logger.info("Cleared all request history")


# 全局单例实例
rate_limiter = RateLimiter()


__all__ = ["RateLimiter", "rate_limiter"]
