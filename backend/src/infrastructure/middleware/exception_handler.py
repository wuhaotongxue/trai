#!/usr/bin/env python
# 文件名: exception_handler.py
# 作者: wuhao
# 日期: 2026_05_04_16:30:00
# 描述: 全局异常处理器 (Skills合规: 类封装 + 统一错误格式)

from __future__ import annotations

import traceback
from datetime import datetime
from enum import Enum
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from loguru import logger
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from infrastructure.logging.structured_logger import LogLevel, structured_log


class ErrorCode(str, Enum):
    """业务错误码"""

    # 成功
    SUCCESS = "0000"

    # 客户端错误 (1xxx)
    BAD_REQUEST = "1000"
    UNAUTHORIZED = "1001"
    FORBIDDEN = "1003"
    NOT_FOUND = "1004"
    METHOD_NOT_ALLOWED = "1005"
    VALIDATION_ERROR = "1010"
    RATE_LIMITED = "1020"

    # 服务端错误 (2xxx)
    INTERNAL_ERROR = "2000"
    DATABASE_ERROR = "2010"
    CACHE_ERROR = "2020"
    AI_SERVICE_ERROR = "2030"
    EXTERNAL_SERVICE_ERROR = "2040"

    # 业务错误 (3xxx)
    SESSION_NOT_FOUND = "3001"
    MESSAGE_TOO_LONG = "3010"
    INVALID_SESSION_ID = "3020"
    QUOTA_EXCEEDED = "3030"


class AppError(Exception):
    """
    应用自定义异常基类 (Skills 规范: 统一异常格式)

    属性:
        code: 错误码(ErrorCode枚举)
        message: 用户友好的错误消息
        details: 详细信息(可选)
        status_code: HTTP状态码
        log_level: 日志级别

    使用示例:
        raise AppError(
            code=ErrorCode.SESSION_NOT_FOUND,
            message="Session not found",
            details={"session_id": "123"},
            log_level=LogLevel.WARNING,
        )
    """

    def __init__(
        self,
        code: ErrorCode = ErrorCode.INTERNAL_ERROR,
        message: str = "Internal server error",
        details: dict[str, Any] | None = None,
        status_code: int = 500,
        log_level: LogLevel = LogLevel.ERROR,
        original_error: Exception | None = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = status_code
        self.log_level = log_level
        self.original_error = original_error
        self.timestamp = datetime.now().isoformat()


class GlobalExceptionHandler:
    """
    全局异常处理器类 (Skills 规范: 强制类封装)

    功能:
    - 捕获所有未处理异常
    - 统一错误响应格式(code/msg/data/req_id/ts)
    - 异常分类和日志记录
    - 敏感信息过滤
    - 错误统计和监控

    使用示例:
        app = FastAPI()
        handler = GlobalExceptionHandler()
        handler.register_handlers(app)
    """

    def __init__(self):
        """初始化异常处理器"""
        self._error_stats = {
            "total_errors": 0,
            "by_code": {},
            "by_type": {},
        }

        logger.info("GlobalExceptionHandler initialized")

    def register_handlers(self, app: FastAPI) -> None:
        """
        注册所有异常处理器到FastAPI应用

        Args:
            app: FastAPI实例
        """

        # 自定义AppError
        @app.exception_handler(AppError)
        async def handle_app_error(request: Request, exc: AppError):
            return await self._handle_app_error(request, exc)

        # 请求验证错误(Pydantic)
        @app.exception_handler(RequestValidationError)
        async def handle_validation_error(request: Request, exc: RequestValidationError):
            return await self._handle_validation_error(request, exc)

        # 数据库错误
        @app.exception_handler(SQLAlchemyError)
        async def handle_db_error(request: Request, exc: SQLAlchemyError):
            return await self._handle_database_error(request, exc)

        # 通用HTTPException
        @app.exception_handler(Exception)
        async def handle_generic_error(request: Request, exc: Exception):
            return await self._handle_generic_error(request, exc)

        logger.info("Exception handlers registered")

    def _build_error_response(
        self,
        request: Request,
        error: AppError,
    ) -> dict[str, Any]:
        """
        构建统一错误响应 (Skills规范: code/msg/data/req_id/ts)

        Args:
            request: FastAPI请求对象
            error: 应用异常

        Returns:
            标准化错误响应字典
        """
        req_id = getattr(request.state, "request_id", None) or self._generate_request_id()

        response = {
            "code": error.code.value,
            "msg": error.message,
            "data": {
                "request_id": req_id,
                "timestamp": error.timestamp,
                **error.details,
            },
            "req_id": req_id,
            "ts": error.timestamp,
        }

        return response

    def _generate_request_id(self) -> str:
        """生成请求ID"""
        import uuid

        return str(uuid.uuid4())[:12]

    async def _handle_app_error(self, request: Request, error: AppError) -> JSONResponse:
        """处理自定义AppError"""

        # 记录日志
        structured_log.error(
            category_name="api.error",
            message=f"AppError: {error.code.value} - {error.message}",
            data={
                "code": error.code.value,
                "path": request.url.path,
                "method": request.method,
                "details": error.details,
            },
        )

        # 更新统计
        self._update_stats(error.code.value)

        response_data = self._build_error_response(request, error)

        return JSONResponse(
            status_code=error.status_code,
            content=response_data,
        )

    async def _handle_validation_error(self, request: Request, error: RequestValidationError) -> JSONResponse:
        """处理请求验证错误(Pydantic)"""

        # 提取字段级错误
        validation_errors = []
        for err in error.errors():
            field = ".".join(str(loc) for loc in err["loc"])
            validation_errors.append(
                {
                    "field": field,
                    "message": err["msg"],
                    "type": err["type"],
                }
            )

        app_error = AppError(
            code=ErrorCode.VALIDATION_ERROR,
            message="Request validation failed",
            details={"errors": validation_errors},
            status_code=422,
            log_level=LogLevel.WARNING,
        )

        structured_log.warning(
            category_name="api.validation",
            message=f"Validation failed | errors={len(validation_errors)}",
            data={
                "path": request.url.path,
                "errors": validation_errors[:3],  # 只记录前3个错误
            },
        )

        response_data = self._build_error_response(request, app_error)
        self._update_stats(app_error.code.value)

        return JSONResponse(
            status_code=422,
            content=response_data,
        )

    async def _handle_database_error(self, request: Request, error: SQLAlchemyError) -> JSONResponse:
        """处理数据库错误"""

        # 避免泄露敏感的SQL错误信息
        safe_message = "Database operation failed"

        if "unique" in str(error).lower():
            safe_message = "Duplicate entry detected"
            status_code = 409
        elif "foreign" in str(error).lower():
            safe_message = "Referenced resource not found"
            status_code = 404
        else:
            status_code = 500

        app_error = AppError(
            code=ErrorCode.DATABASE_ERROR,
            message=safe_message,
            details={"operation": "database_query"},
            status_code=status_code,
            original_error=error,
        )

        structured_log.error(
            category_name="database.error",
            message=f"DB Error: {str(error)[:200]}",
            data={
                "path": request.url.path,
                "error_type": type(error).__name__,
            },
        )

        response_data = self._build_error_response(request, app_error)
        self._update_stats(app_error.code.value)

        return JSONResponse(
            status_code=status_code,
            content=response_data,
        )

    async def _handle_generic_error(self, request: Request, error: Exception) -> JSONResponse:
        """处理未预期的异常"""

        # 获取完整堆栈跟踪
        tb_str = traceback.format_exc()

        # 记录详细日志(包含堆栈)
        structured_log.critical(
            category_name="system.error",
            message=f"Unhandled exception: {type(error).__name__} - {str(error)}",
            data={
                "path": request.url.path,
                "method": request.method,
                "exception_type": type(error).__name__,
                "traceback": tb_str[:1000] if tb_str else "",  # 截断过长的堆栈
            },
        )

        app_error = AppError(
            code=ErrorCode.INTERNAL_ERROR,
            message="An unexpected error occurred. Please try again later.",
            details={
                "error_ref": self._generate_request_id(),  # 用于排查问题
            },
            status_code=500,
            original_error=error,
        )

        response_data = self._build_error_response(request, app_error)
        self._update_stats(app_error.code.value)

        return JSONResponse(
            status_code=500,
            content=response_data,
        )

    def _update_stats(self, code: str) -> None:
        """更新错误统计"""
        self._error_stats["total_errors"] += 1

        if code not in self._error_stats["by_code"]:
            self._error_stats["by_code"][code] = 0
        self._error_stats["by_code"][code] += 1

    def get_stats(self) -> dict[str, Any]:
        """
        获取错误统计信息

        Returns:
            统计字典
        """
        return {
            **self._error_stats,
            "top_errors": sorted(
                self._error_stats["by_code"].items(),
                key=lambda x: x[1],
                reverse=True,
            )[:10],
        }


# 全局单例实例
global_exception_handler = GlobalExceptionHandler()


# ========== 便捷异常类 ==========


class NotFoundError(AppError):
    """资源不存在异常"""

    def __init__(self, resource: str, identifier: str):
        super().__init__(
            code=ErrorCode.NOT_FOUND,
            message=f"{resource} not found: {identifier}",
            details={"resource": resource, "identifier": identifier},
            status_code=404,
            log_level=LogLevel.WARNING,
        )


class UnauthorizedError(AppError):
    """未授权异常"""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            code=ErrorCode.UNAUTHORIZED,
            message=message,
            status_code=401,
            log_level=LogLevel.WARNING,
        )


class ForbiddenError(AppError):
    """禁止访问异常"""

    def __init__(self, action: str = "access this resource"):
        super().__init__(
            code=ErrorCode.FORBIDDEN,
            message=f"You do not have permission to {action}",
            status_code=403,
            log_level=LogLevel.WARNING,
        )


class ValidationError(AppError):
    """业务验证失败异常"""

    def __init__(self, field: str, message: str):
        super().__init__(
            code=ErrorCode.VALIDATION_ERROR,
            message=message,
            details={"field": field},
            status_code=400,
            log_level=LogLevel.WARNING,
        )


class RateLimitExceededError(AppError):
    """限流异常"""

    def __init__(self, retry_after: int = 60):
        super().__init__(
            code=ErrorCode.RATE_LIMITED,
            message="Too many requests. Please slow down.",
            details={"retry_after": retry_after},
            status_code=429,
            log_level=LogLevel.INFO,
        )


class DatabaseError(AppError):
    """数据库操作异常"""

    def __init__(self, operation: str, original: Exception | None = None):
        super().__init__(
            code=ErrorCode.DATABASE_ERROR,
            message=f"Database operation failed: {operation}",
            details={"operation": operation},
            status_code=500,
            original_error=original,
        )


class AIServiceError(AppError):
    """AI服务调用异常"""

    def __init__(self, model: str, original: Exception | None = None):
        super().__init__(
            code=ErrorCode.AI_SERVICE_ERROR,
            message=f"AI service call failed for model: {model}",
            details={"model": model},
            status_code=502,
            original_error=original,
        )


__all__ = [
    "GlobalExceptionHandler",
    "global_exception_handler",
    "AppError",
    "ErrorCode",
    "NotFoundError",
    "UnauthorizedError",
    "ForbiddenError",
    "ValidationError",
    "RateLimitExceededError",
    "DatabaseError",
    "AIServiceError",
]
