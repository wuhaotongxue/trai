#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: __init__.py
# 作者: wuhao
# 日期: 2026_04_09_14:20:00
# 描述: TRAI 核心层 - 基础设施代码

from core.context_manager import ContextManager, ContextStats, get_context_manager
from core.exceptions import (
    AIContentViolationError,
    AIQuotaExceededError,
    AIServiceUnavailableError,
    AuthenticationError,
    AuthorizationError,
    CacheError,
    ConfigurationError,
    DatabaseError,
    DuplicateResourceError,
    ExternalServiceError,
    FileOperationError,
    RateLimitError,
    ResourceNotFoundError,
    ThirdPartyServiceError,
    TraiException,
    ValidationError,
)
from core.logger import LoggerConfig, LoggerManager, get_logger, init_logger, logger
from core.policy_engine import (
    PolicyContext,
    PolicyDecision,
    PolicyEngine,
    PolicyResult,
    get_policy_engine,
    require_policy,
)
from core.token_counter import TokenCounter, get_token_counter

__all__ = [
    "logger",
    "LoggerConfig",
    "LoggerManager",
    "get_logger",
    "init_logger",
    "TraiException",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "ResourceNotFoundError",
    "DuplicateResourceError",
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
    "PolicyEngine",
    "PolicyDecision",
    "PolicyContext",
    "PolicyResult",
    "get_policy_engine",
    "require_policy",
    "TokenCounter",
    "get_token_counter",
    "ContextManager",
    "ContextStats",
    "get_context_manager",
]
