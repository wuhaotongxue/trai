#!/usr/bin/env python
# 文件名: rate_limiter.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: 速率限制中间件

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from core.logger import get_logger

logger = get_logger()


@dataclass
class RateLimitRule:
    """速率限制规则"""

    max_requests: int = 60
    window_seconds: int = 60
    key_prefix: str = "rate_limit"


@dataclass
class RateLimitCounter:
    """计数器"""

    count: int = 0
    reset_at: float = 0
    blocked: bool = False


class InMemoryRateLimiter:
    """内存版速率限制器(单机使用)"""

    def __init__(self) -> None:
        self._counters: dict[str, RateLimitCounter] = {}
        self._cleanup_interval: float = 300
        self._last_cleanup: float = time.time()

    def _cleanup(self) -> None:
        """清理过期记录"""
        now = time.time()
        if now - self._last_cleanup < self._cleanup_interval:
            return

        expired_keys = [key for key, counter in self._counters.items() if counter.reset_at < now]
        for key in expired_keys:
            del self._counters[key]

        self._last_cleanup = now

    def check(self, key: str, rule: RateLimitRule) -> tuple[bool, dict[str, Any]]:
        """检查速率限制

        Args:
            key: 限流键
            rule: 限流规则

        Returns:
            (是否通过, 限流信息)
        """
        self._cleanup()

        now = time.time()

        if key not in self._counters:
            self._counters[key] = RateLimitCounter(
                count=0,
                reset_at=now + rule.window_seconds,
            )

        counter = self._counters[key]

        if counter.reset_at < now:
            counter.count = 0
            counter.reset_at = now + rule.window_seconds
            counter.blocked = False

        counter.count += 1

        remaining = max(0, rule.max_requests - counter.count)
        reset_at = int(counter.reset_at)
        retry_after = int(counter.reset_at - now) if counter.count > rule.max_requests else 0

        if counter.count > rule.max_requests and not counter.blocked:
            counter.blocked = True
            logger.warning(f"Rate limit exceeded: {key}")

        return (
            counter.count <= rule.max_requests,
            {
                "limit": rule.max_requests,
                "remaining": remaining,
                "reset": reset_at,
                "retry_after": retry_after,
            },
        )


_rate_limiter = InMemoryRateLimiter()


# 默认限流规则
DEFAULT_RULES: dict[str, RateLimitRule] = {
    "global": RateLimitRule(max_requests=1000, window_seconds=60),
    "auth": RateLimitRule(max_requests=10, window_seconds=60),
    "ai_chat": RateLimitRule(max_requests=60, window_seconds=60),
    "ai_image": RateLimitRule(max_requests=20, window_seconds=60),
    "upload": RateLimitRule(max_requests=30, window_seconds=60),
    "session": RateLimitRule(max_requests=100, window_seconds=60),
}


def get_client_key(request: Request, user_id: str | None = None) -> str:
    """获取客户端限流键

    Args:
        request: HTTP 请求
        user_id: 用户 ID(已登录时使用)

    Returns:
        str: 限流键
    """
    if user_id:
        return f"user:{user_id}"

    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"

    return f"ip:{client_ip}"


def rate_limit(
    scope: str = "global",
    rules: dict[str, RateLimitRule] | None = None,
) -> callable:
    """速率限制装饰器

    Args:
        scope: 限流范围
        rules: 限流规则表

    Returns:
        装饰器函数
    """
    if rules is None:
        rules = DEFAULT_RULES

    def decorator(func: callable) -> callable:
        async def wrapper(request: Request, *args: Any, **kwargs: Any) -> Response:
            rule = rules.get(scope, DEFAULT_RULES["global"])

            # 尝试从请求上下文中获取用户 ID
            user_id = None
            if hasattr(request.state, "user"):
                user_id = request.state.user.get("user_id")

            client_key = get_client_key(request, user_id)
            rate_key = f"{rule.key_prefix}:{scope}:{client_key}"

            allowed, info = _rate_limiter.check(rate_key, rule)

            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "code": 429,
                        "message": "请求过于频繁,请稍后再试",
                        "error": "rate_limit_exceeded",
                        "retry_after": info["retry_after"],
                    },
                    headers={
                        "X-RateLimit-Limit": str(info["limit"]),
                        "X-RateLimit-Remaining": str(info["remaining"]),
                        "X-RateLimit-Reset": str(info["reset"]),
                        "Retry-After": str(info["retry_after"]),
                    },
                )

            response = await func(request, *args, **kwargs)

            if isinstance(response, Response):
                response.headers["X-RateLimit-Limit"] = str(info["limit"])
                response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
                response.headers["X-RateLimit-Reset"] = str(info["reset"])

            return response

        return wrapper

    return decorator


class RateLimitMiddleware(BaseHTTPMiddleware):
    """速率限制中间件"""

    def __init__(
        self,
        app: Any,
        rules: dict[str, RateLimitRule] | None = None,
        scopes: dict[str, str] | None = None,
    ) -> None:
        super().__init__(app)
        self._rules = rules or DEFAULT_RULES
        self._scopes = scopes or {}

    def _get_scope(self, path: str) -> str:
        """根据路径获取限流范围"""
        if path.startswith("/api/auth/"):
            return "auth"
        elif path.startswith("/api/ai/chat"):
            return "ai_chat"
        elif path.startswith("/api/ai/image"):
            return "ai_image"
        elif path.startswith("/api/media/upload"):
            return "upload"
        elif path.startswith("/api/sessions"):
            return "session"
        return "global"

    async def dispatch(self, request: Request, call_next: callable) -> Response:
        path = request.url.path
        scope = self._scopes.get(path, self._get_scope(path))
        rule = self._rules.get(scope, DEFAULT_RULES["global"])

        user_id = None
        if hasattr(request.state, "user"):
            user_id = request.state.user.get("user_id")

        client_key = get_client_key(request, user_id)
        rate_key = f"{rule.key_prefix}:{scope}:{client_key}"

        allowed, info = _rate_limiter.check(rate_key, rule)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "code": 429,
                    "message": "请求过于频繁,请稍后再试",
                    "error": "rate_limit_exceeded",
                    "retry_after": info["retry_after"],
                },
                headers={
                    "X-RateLimit-Limit": str(info["limit"]),
                    "X-RateLimit-Remaining": str(info["remaining"]),
                    "X-RateLimit-Reset": str(info["reset"]),
                    "Retry-After": str(info["retry_after"]),
                },
            )

        response = await call_next(request)

        response.headers["X-RateLimit-Limit"] = str(info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(info["reset"])

        return response


def reset_rate_limiter() -> None:
    """重置速率限制器(用于测试)"""
    global _rate_limiter
    _rate_limiter = InMemoryRateLimiter()


__all__ = [
    "RateLimitRule",
    "RateLimitMiddleware",
    "rate_limit",
    "DEFAULT_RULES",
    "reset_rate_limiter",
]
