#!/usr/bin/env python
# 文件名: exceptions.py
# 作者: wuhao
# 日期: 2026_04_09_13:50:00
# 描述: 统一异常定义,包含业务异常和系统异常

from __future__ import annotations


class TraiException(Exception):
    """TRAI 项目基础异常类"""

    def __init__(
        self,
        message: str,
        code: int = 500,
        status_code: int = 500,
        details: dict | None = None,
    ) -> None:
        super().__init__(message)
        self.message: str = message
        self.code: int = code
        self.status_code: int = status_code
        self.details: dict = details or {}

    def __str__(self) -> str:
        return f"[{self.code}] {self.message}"

    def to_dict(self) -> dict:
        """转换为字典格式

        Returns:
            dict: 异常信息字典
        """
        return {
            "code": self.code,
            "message": self.message,
            "details": self.details,
        }


class ValidationError(TraiException):
    """数据验证异常"""

    def __init__(
        self,
        message: str = "数据验证失败",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=400, details=details)


class AuthenticationError(TraiException):
    """认证异常"""

    def __init__(
        self,
        message: str = "认证失败",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=401, details=details)


class AuthorizationError(TraiException):
    """授权异常"""

    def __init__(
        self,
        message: str = "权限不足",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=403, details=details)


class ResourceNotFoundError(TraiException):
    """资源不存在异常"""

    def __init__(
        self,
        message: str = "资源不存在",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=404, details=details)


class DuplicateResourceError(TraiException):
    """资源重复异常"""

    def __init__(
        self,
        message: str = "资源已存在",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=409, details=details)


class RateLimitError(TraiException):
    """限流异常"""

    def __init__(
        self,
        message: str = "请求过于频繁",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=429, details=details)


class ExternalServiceError(TraiException):
    """外部服务调用异常"""

    def __init__(
        self,
        message: str = "外部服务调用失败",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=502, details=details)


class ThirdPartyServiceError(TraiException):
    """第三方服务异常"""

    def __init__(
        self,
        service: str,
        message: str = "第三方服务错误",
        details: dict | None = None,
    ) -> None:
        details = details or {}
        details["service"] = service
        super().__init__(message, code=502, details=details)


class ConfigurationError(TraiException):
    """配置异常"""

    def __init__(
        self,
        message: str = "配置错误",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=500, details=details)


class DatabaseError(TraiException):
    """数据库异常"""

    def __init__(
        self,
        message: str = "数据库操作失败",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=500, details=details)


class CacheError(TraiException):
    """缓存异常"""

    def __init__(
        self,
        message: str = "缓存操作失败",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=500, details=details)


class FileOperationError(TraiException):
    """文件操作异常"""

    def __init__(
        self,
        message: str = "文件操作失败",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=500, details=details)


class AIQuotaExceededError(TraiException):
    """AI 配额超限异常"""

    def __init__(
        self,
        message: str = "AI 配额已用尽",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=429, details=details)


class AIContentViolationError(TraiException):
    """AI 内容违规异常"""

    def __init__(
        self,
        message: str = "AI 生成内容包含违规信息",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, code=400, details=details)


class AIServiceUnavailableError(TraiException):
    """AI 服务不可用异常"""

    def __init__(
        self,
        service: str,
        message: str = "AI 服务暂时不可用",
        details: dict | None = None,
    ) -> None:
        details = details or {}
        details["service"] = service
        super().__init__(message, code=503, details=details)


class NotFoundError(ResourceNotFoundError):
    """资源不存在异常(别名)"""

    def __init__(
        self,
        message: str = "资源不存在",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, details=details)


class ConflictError(DuplicateResourceError):
    """资源重复异常(别名)"""

    def __init__(
        self,
        message: str = "资源已存在",
        details: dict | None = None,
    ) -> None:
        super().__init__(message, details=details)


__all__ = [
    "TraiException",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "ResourceNotFoundError",
    "NotFoundError",
    "DuplicateResourceError",
    "ConflictError",
    "RateLimitError",
    "ExternalServiceError",
    "ThirdPartyServiceError",
    "ConfigurationError",
    "DatabaseError",
    "CacheError",
    "FileOperationError",
    "AIQuotaExceededError",
    "AIContentViolationError",
    "AIServiceUnavailableError",
]
