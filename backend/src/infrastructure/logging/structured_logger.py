#!/usr/bin/env python
# 文件名: structured_logger.py
# 作者: wuhao
# 日期: 2026_05_04_16:15:00
# 描述: 结构化日志服务 (Skills合规: 类封装 + ELK集成)

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from enum import Enum
from typing import Any

from loguru import logger


class LogLevel(str, Enum):
    """日志级别"""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogCategory(str, Enum):
    """日志分类"""

    API_REQUEST = "api.request"  # API请求
    API_RESPONSE = "api.response"  # API响应
    DATABASE = "database"  # 数据库操作
    CACHE = "cache"  # 缓存操作
    AUTH = "auth"  # 认证授权
    AI_SERVICE = "ai.service"  # AI服务调用
    BUSINESS_LOGIC = "business.logic"  # 业务逻辑
    PERFORMANCE = "performance"  # 性能监控
    SECURITY = "security"  # 安全事件


class StructuredLogger:
    """
    结构化日志服务类 (Skills 规范: 强制类封装)

    功能:
    - JSON 格式化输出(便于ELK分析)
    - 多维度分类(API/DB/Cache/AI等)
    - 性能计时器
    - 敏感信息脱敏
    - 日志采样率控制

    使用示例:
        log = StructuredLogger()

        log.api_request(
            method="POST",
            path="/sessions",
            user_id="user123",
            duration_ms=45.2,
        )
    """

    # 配置常量
    DEFAULT_CONFIG = {
        "json_format": True,  # JSON格式输出
        "include_traceback": True,  # 包含堆栈跟踪
        "sensitive_fields": [  # 需要脱敏的字段
            "password",
            "token",
            "api_key",
            "secret",
            "authorization",
        ],
        "sample_rate": 1.0,  # 采样率(1.0=100%)
        "console_output": True,  # 控制台输出
        "file_output": False,  # 文件输出
        "log_file_path": "logs/app.log",  # 日志文件路径
    }

    def __init__(self, config: dict[str, Any] | None = None):
        """
        初始化结构化日志

        Args:
            config: 自定义配置(可选)
        """
        self.config = self.DEFAULT_CONFIG.copy()
        if config:
            self.config.update(config)

        # 移除默认logger配置
        logger.remove()

        # 控制台输出
        if self.config["console_output"]:
            logger.add(
                sys.stdout,
                format=self._format_log,
                level="DEBUG",
                colorize=True,
            )

        # 文件输出(JSON格式, 便于ELK)
        if self.config.get("file_output"):
            log_dir = os.path.dirname(self.config["log_file_path"])
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir, exist_ok=True)

            logger.add(
                self.config["log_file_path"],
                format="{message}",
                level="DEBUG",
                rotation="100 MB",  # 每个文件最大100MB
                retention="30 days",  # 保留30天
                compression="gz",  # gzip压缩
                serialize=True,  # JSON序列化
            )

        # 注册 DB Sink (异步入库)
        from infrastructure.logging.db_sink import db_sink
        logger.add(db_sink, level="WARNING", enqueue=True)

        self._request_context: dict[str, Any] = {}

        logger.info("StructuredLogger initialized")

    def _format_log(self, record: dict) -> str:
        """格式化日志记录"""
        if self.config["json_format"]:
            return self._to_json(record)
        else:
            return (
                "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{extra[category]}</cyan> | "
                "{message}"
            )

    def _to_json(self, record: dict) -> str:
        """转换为JSON格式"""
        log_data = {
            "@timestamp": datetime.now().isoformat(),
            "level": record["level"].name,
            "category": record["extra"].get("category", "general"),
            "message": record["message"],
            "module": record["name"],
            "function": record["function"],
            "line": record["line"],
        }

        # 添加额外字段
        if record["extra"].get("data"):
            log_data["data"] = record["extra"]["data"]

        return json.dumps(log_data, ensure_ascii=False)

    def _sanitize(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        脱敏敏感信息

        Args:
            data: 原始数据

        Returns:
            脱敏后的数据
        """
        sanitized = data.copy()

        for field in self.config["sensitive_fields"]:
            if field in sanitized:
                value = str(sanitized[field])
                if len(value) > 4:
                    sanitized[field] = value[:2] + "***" + value[-2:]
                else:
                    sanitized[field] = "***"

        return sanitized

    def set_request_context(self, **kwargs) -> None:
        """
        设置请求上下文(在API入口处调用)

        Args:
            **kwargs: 上下文字段(request_id, user_id, ip等)
        """
        self._request_context.update(kwargs)

    def clear_request_context(self) -> None:
        """清除请求上下文"""
        self._request_context.clear()

    def _log(
        self,
        level: LogLevel,
        category: LogCategory,
        message: str,
        data: dict[str, Any] | None = None,
        **kwargs,
    ) -> None:
        """
        内部日志方法

        Args:
            level: 日志级别
            category: 日志分类
            message: 日志消息
            data: 附加数据
            **kwargs: 额外字段
        """
        # 采样率检查
        import random

        if random.random() > self.config["sample_rate"]:
            return

        # 合并数据
        extra_data = {
            "category": category.value,
        }

        if data:
            extra_data["data"] = {
                **self._request_context,
                **self._sanitize(data),
                **kwargs,
            }

        # 根据级别选择logger方法
        log_method = getattr(logger, level.value.lower())
        log_method(message, **extra_data)

    def debug(self, category: LogCategory, message: str, **kwargs) -> None:
        """DEBUG 级别日志"""
        self._log(LogLevel.DEBUG, category, message, **kwargs)

    def info(self, category: LogCategory, message: str, **kwargs) -> None:
        """INFO 级别日志"""
        self._log(LogLevel.INFO, category, message, **kwargs)

    def warning(self, category: LogCategory, message: str, **kwargs) -> None:
        """WARNING 级别日志"""
        self._log(LogLevel.WARNING, category, message, **kwargs)

    def error(self, category: LogCategory, message: str, **kwargs) -> None:
        """ERROR 级别日志"""
        self._log(LogLevel.ERROR, category, message, **kwargs)

    def critical(self, category: LogCategory, message: str, **kwargs) -> None:
        """CRITICAL 级别日志"""
        self._log(LogLevel.CRITICAL, category, message, **kwargs)

    # ========== 便捷方法 ==========

    def api_request(
        self,
        method: str,
        path: str,
        user_id: str | None = None,
        ip: str | None = None,
        **kwargs,
    ) -> None:
        """
        记录API请求

        Args:
            method: HTTP方法(GET/POST等)
            path: 请求路径
            user_id: 用户ID
            ip: 客户端IP
        """
        self.info(
            LogCategory.API_REQUEST,
            f"{method} {path}",
            data={
                "method": method,
                "path": path,
                "user_id": user_id,
                "client_ip": ip,
                **kwargs,
            },
        )

    def api_response(
        self,
        status_code: int,
        duration_ms: float,
        path: str,
        **kwargs,
    ) -> None:
        """
        记录API响应

        Args:
            status_code: HTTP状态码
            duration_ms: 响应时间(毫秒)
            path: 请求路径
        """
        level = LogLevel.INFO if status_code < 400 else LogLevel.WARNING

        self._log(
            level,
            LogCategory.API_RESPONSE,
            f"Response {status_code} ({duration_ms:.1f}ms)",
            data={
                "status_code": status_code,
                "duration_ms": round(duration_ms, 2),
                "path": path,
                **kwargs,
            },
        )

    def database_query(
        self,
        operation: str,
        table: str,
        duration_ms: float,
        affected_rows: int = 0,
        **kwargs,
    ) -> None:
        """
        记录数据库操作

        Args:
            operation: 操作类型(SELECT/INSERT/UPDATE/DELETE)
            table: 表名
            duration_ms: 执行时间
            affected_rows: 影响行数
        """
        # 慢查询警告
        if duration_ms > 1000:
            self.warning(
                LogCategory.DATABASE,
                f"Slow query: {operation} on {table} ({duration_ms:.1f}ms)",
                data=locals(),
            )
        else:
            self.debug(
                LogCategory.DATABASE,
                f"DB {operation} on {table}",
                data=locals(),
            )

    def cache_operation(
        self,
        operation: str,  # hit/miss/set/delete
        key: str,
        duration_ms: float = 0,
        **kwargs,
    ) -> None:
        """
        记录缓存操作

        Args:
            operation: 操作类型(hit/miss/set/delete)
            key: 缓存键
            duration_ms: 耗时
        """
        self.debug(
            LogCategory.CACHE,
            f"Cache {operation}: {key[:20]}...",
            data={"operation": operation, "key_hash": hash(key) % 10000},
        )

    def ai_service_call(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        duration_ms: float,
        success: bool = True,
        **kwargs,
    ) -> None:
        """
        记录AI服务调用

        Args:
            model: 模型名称
            prompt_tokens: 输入token数
            completion_tokens: 输出token数
            duration_ms: 耗时
            success: 是否成功
        """
        level = LogLevel.INFO if success else LogLevel.ERROR

        total_tokens = prompt_tokens + completion_tokens

        self._log(
            level,
            LogCategory.AI_SERVICE,
            f"AI call: {model} ({total_tokens} tokens, {duration_ms:.1f}ms)",
            data={
                "model": model,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "duration_ms": round(duration_ms, 2),
                "success": success,
                **kwargs,
            },
        )

    def security_event(
        self,
        event_type: str,  # login_failed/rate_limited/banned/unauthorized
        user_id: str | None = None,
        ip: str | None = None,
        details: str = "",
        **kwargs,
    ) -> None:
        """
        记录安全事件

        Args:
            event_type: 事件类型
            user_id: 用户ID
            ip: IP地址
            details: 详情
        """
        self.warning(
            LogCategory.SECURITY,
            f"Security: {event_type}",
            data={
                "event_type": event_type,
                "user_id": user_id,
                "ip": ip,
                "details": details,
                **kwargs,
            },
        )


# 全局单例实例
structured_log = StructuredLogger()


__all__ = ["StructuredLogger", "LogLevel", "LogCategory", "structured_log"]
