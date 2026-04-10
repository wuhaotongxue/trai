#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: audit.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: 审计日志中间件

from __future__ import annotations

import json
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from core.logger import get_logger

logger = get_logger()


class AuditAction(str, Enum):
    """审计动作类型"""
    LOGIN = "login"
    LOGOUT = "logout"
    REGISTER = "register"
    CHAT = "chat"
    IMAGE_GENERATE = "image_generate"
    FILE_UPLOAD = "file_upload"
    FILE_DELETE = "file_delete"
    SESSION_CREATE = "session_create"
    SESSION_DELETE = "session_delete"
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    ADMIN_ACTION = "admin_action"
    NOTIFY_SEND = "notify_send"
    CONFIG_UPDATE = "config_update"


class AuditLevel(str, Enum):
    """审计级别"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class AuditLog:
    """审计日志"""
    log_id: str
    timestamp: str
    trace_id: str
    user_id: str | None
    username: str | None
    role: str | None
    action: str
    level: str
    method: str
    path: str
    status_code: int
    duration_ms: int
    client_ip: str | None
    user_agent: str | None
    request_body: dict[str, Any] | None
    response_body: dict[str, Any] | None
    error: str | None
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)


class AuditLogger:
    """审计日志记录器"""

    def __init__(self) -> None:
        self._enabled: bool = True
        self._sensitive_fields: set[str] = {
            "password",
            "password_hash",
            "old_password",
            "new_password",
            "api_key",
            "secret",
            "token",
            "access_token",
            "refresh_token",
            "authorization",
            "cookie",
        }

    def _mask_sensitive(self, data: dict[str, Any] | None) -> dict[str, Any] | None:
        """脱敏敏感字段"""
        if data is None:
            return None

        masked = {}
        for key, value in data.items():
            if key.lower() in self._sensitive_fields:
                masked[key] = "***MASKED***"
            elif isinstance(value, dict):
                masked[key] = self._mask_sensitive(value)
            elif isinstance(value, str) and len(value) > 500:
                masked[key] = value[:500] + "...[truncated]"
            else:
                masked[key] = value
        return masked

    def _get_client_ip(self, request: Request) -> str | None:
        """获取客户端 IP"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else None

    def log(
        self,
        action: AuditAction,
        level: AuditLevel,
        request: Request,
        response: Response,
        duration_ms: int,
        user_id: str | None = None,
        username: str | None = None,
        role: str | None = None,
        request_body: dict[str, Any] | None = None,
        response_body: dict[str, Any] | None = None,
        error: str | None = None,
        **metadata: Any,
    ) -> None:
        """记录审计日志"""
        if not self._enabled:
            return

        log_entry = AuditLog(
            log_id=str(uuid.uuid4()),
            timestamp=datetime.now().isoformat(),
            trace_id=request.state.trace_id if hasattr(request.state, "trace_id") else str(uuid.uuid4()),
            user_id=user_id,
            username=username,
            role=role,
            action=action.value,
            level=level.value,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            client_ip=self._get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
            request_body=self._mask_sensitive(request_body),
            response_body=self._mask_sensitive(response_body),
            error=error,
            metadata=metadata,
        )

        log_dict = log_entry.to_dict()

        if level == AuditLevel.CRITICAL or level == AuditLevel.ERROR:
            logger.error(f"AUDIT: {json.dumps(log_dict, ensure_ascii=False)}")
        elif level == AuditLevel.WARNING:
            logger.warning(f"AUDIT: {json.dumps(log_dict, ensure_ascii=False)}")
        else:
            logger.info(f"AUDIT: {json.dumps(log_dict, ensure_ascii=False)}")


_audit_logger = AuditLogger()


def get_audit_logger() -> AuditLogger:
    """获取审计日志记录器"""
    return _audit_logger


class AuditMiddleware(BaseHTTPMiddleware):
    """审计日志中间件"""

    # 需要审计的路径（支持前缀匹配）
    AUDIT_PATHS: list[str] = [
        "/api/auth/",
        "/api/ai/",
        "/api/media/",
        "/api/sessions/",
        "/api/admin/",
        "/api/system/notify/",
    ]

    # 高危操作（记录 request_body）
    HIGH_RISK_PATHS: list[str] = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/admin/",
        "/api/system/notify/send",
    ]

    def _should_audit(self, path: str) -> bool:
        """判断是否需要审计"""
        for prefix in self.AUDIT_PATHS:
            if path.startswith(prefix):
                return True
        return False

    def _should_log_body(self, path: str) -> bool:
        """判断是否应记录请求体"""
        for prefix in self.HIGH_RISK_PATHS:
            if path.startswith(prefix):
                return True
        return False

    def _extract_user(self, request: Request) -> tuple[str | None, str | None, str | None]:
        """从请求中提取用户信息"""
        user_id = None
        username = None
        role = None

        if hasattr(request.state, "user"):
            user = request.state.user
            user_id = user.get("user_id")
            username = user.get("username")
            role = user.get("role")

        return user_id, username, role

    def _classify_action(self, method: str, path: str) -> AuditAction:
        """分类审计动作"""
        if "/auth/login" in path:
            return AuditAction.LOGIN
        elif "/auth/logout" in path:
            return AuditAction.LOGOUT
        elif "/auth/register" in path:
            return AuditAction.REGISTER
        elif "/ai/chat" in path:
            return AuditAction.CHAT
        elif "/ai/image" in path:
            return AuditAction.IMAGE_GENERATE
        elif "/media/upload" in path:
            return AuditAction.FILE_UPLOAD
        elif "/media/" in path and method == "DELETE":
            return AuditAction.FILE_DELETE
        elif "/sessions" in path and method == "POST":
            return AuditAction.SESSION_CREATE
        elif "/sessions" in path and method == "DELETE":
            return AuditAction.SESSION_DELETE
        elif "/admin/user" in path and method == "POST":
            return AuditAction.USER_CREATE
        elif "/admin/user" in path and method in ("PUT", "PATCH"):
            return AuditAction.USER_UPDATE
        elif "/admin/user" in path and method == "DELETE":
            return AuditAction.USER_DELETE
        elif "/admin/" in path:
            return AuditAction.ADMIN_ACTION
        elif "/notify/send" in path:
            return AuditAction.NOTIFY_SEND
        return AuditAction.ADMIN_ACTION

    def _classify_level(self, status_code: int) -> AuditLevel:
        """分类审计级别"""
        if status_code >= 500:
            return AuditLevel.ERROR
        elif status_code >= 400:
            return AuditLevel.WARNING
        return AuditLevel.INFO

    async def dispatch(self, request: Request, call_next: callable) -> Response:
        path = request.url.path

        if not self._should_audit(path):
            return await call_next(request)

        start_time = time.perf_counter()

        request_body: dict[str, Any] | None = None
        if self._should_log_body(path) and request.method in ("POST", "PUT", "PATCH"):
            try:
                body = await request.body()
                if body:
                    content_type = request.headers.get("Content-Type", "")
                    if "application/json" in content_type:
                        import json
                        try:
                            request_body = json.loads(body)
                        except json.JSONDecodeError:
                            request_body = {"raw": "[non-json body]"}
            except Exception:
                pass

        response = await call_next(request)

        duration_ms = int((time.perf_counter() - start_time) * 1000)

        user_id, username, role = self._extract_user(request)
        action = self._classify_action(request.method, path)
        level = self._classify_level(response.status_code)

        response_body: dict[str, Any] | None = None
        if response.status_code >= 400:
            try:
                if hasattr(response, "body"):
                    import json
                    response_body = json.loads(response.body)
            except Exception:
                pass

        _audit_logger.log(
            action=action,
            level=level,
            request=request,
            response=response,
            duration_ms=duration_ms,
            user_id=user_id,
            username=username,
            role=role,
            request_body=request_body,
            response_body=response_body,
        )

        return response


__all__ = [
    "AuditAction",
    "AuditLevel",
    "AuditLog",
    "AuditLogger",
    "AuditMiddleware",
    "get_audit_logger",
]
