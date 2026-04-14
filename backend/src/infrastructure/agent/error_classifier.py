#!/usr/bin/env python
# 文件名: error_classifier.py
# 作者: wuhao
# 日期: 2026_04_10_09:21:00
# 描述: 错误分类器 - 将异常映射为结构化错误类型

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Any


class ErrorCategory(StrEnum):
    """错误分类枚举(对应 correction.md 规范)"""

    VALIDATION = "validation"
    PERMISSION = "permission"
    QUOTA = "quota"
    RATE_LIMIT = "rate_limit"
    TOOL_EXECUTION = "tool_execution"
    BUSINESS_LOGIC = "business_logic"
    EXTERNAL = "external"
    SYSTEM = "system"


class ErrorAction(StrEnum):
    """错误处理动作"""

    ESCALATE = "escalate"
    RETRY_WITH_BACKOFF = "retry_with_backoff"
    RETRY = "retry"
    ALTERNATIVE = "alternative"
    ROLLBACK = "rollback"
    REJECT = "reject"


@dataclass
class ClassifiedError:
    """分类后的错误"""

    category: ErrorCategory
    action: ErrorAction
    retryable: bool
    message: str
    details: dict[str, Any]
    correctable: bool


class ErrorClassifier:
    """错误分类器 - 将异常映射为规范中的错误分类"""

    def classify(self, error: Exception, context: dict[str, Any] | None = None) -> ClassifiedError:
        """将异常分类

        Args:
            error: 待分类的异常
            context: 附加上下文信息

        Returns:
            ClassifiedError: 分类结果
        """
        error_type = type(error).__name__
        error_msg = str(error)
        details = context or {}

        if error_type in ("AIQuotaExceededError", "QuotaExceededError"):
            return ClassifiedError(
                category=ErrorCategory.QUOTA,
                action=ErrorAction.REJECT,
                retryable=False,
                correctable=False,
                message=error_msg,
                details=details,
            )

        if error_type in (
            "AuthenticationError",
            "AuthorizationError",
            "PermissionDeniedError",
        ):
            return ClassifiedError(
                category=ErrorCategory.PERMISSION,
                action=ErrorAction.REJECT,
                retryable=False,
                correctable=False,
                message=error_msg,
                details=details,
            )

        if "rate limit" in error_msg.lower() or error_type in (
            "RateLimitError",
            "TooManyRequestsError",
        ):
            return ClassifiedError(
                category=ErrorCategory.RATE_LIMIT,
                action=ErrorAction.RETRY_WITH_BACKOFF,
                retryable=True,
                correctable=True,
                message=error_msg,
                details=details,
            )

        if "timeout" in error_msg.lower() or "timeout" in error_type.lower():
            return ClassifiedError(
                category=ErrorCategory.EXTERNAL,
                action=ErrorAction.RETRY,
                retryable=True,
                correctable=True,
                message="外部服务超时",
                details=details,
            )

        if "connection" in error_msg.lower() or "network" in error_msg.lower():
            return ClassifiedError(
                category=ErrorCategory.EXTERNAL,
                action=ErrorAction.RETRY,
                retryable=True,
                correctable=True,
                message="网络连接异常",
                details=details,
            )

        if "validation" in error_msg.lower() or error_type.endswith("ValidationError"):
            return ClassifiedError(
                category=ErrorCategory.VALIDATION,
                action=ErrorAction.REJECT,
                retryable=False,
                correctable=False,
                message=error_msg,
                details=details,
            )

        if error_type in (
            "ExternalServiceError",
            "ThirdPartyServiceError",
        ):
            return ClassifiedError(
                category=ErrorCategory.EXTERNAL,
                action=ErrorAction.RETRY,
                retryable=True,
                correctable=True,
                message=error_msg,
                details=details,
            )

        return ClassifiedError(
            category=ErrorCategory.SYSTEM,
            action=ErrorAction.ESCALATE,
            retryable=False,
            correctable=False,
            message=error_msg,
            details=details,
        )


__all__ = [
    "ErrorClassifier",
    "ClassifiedError",
    "ErrorCategory",
    "ErrorAction",
]
