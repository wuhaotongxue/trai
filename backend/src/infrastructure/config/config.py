#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: config.py
# 作者: wuhao
# 日期: 2026_05_04_18:00:00
# 描述: 统一配置管理 (Skills合规: 类封装 + 多环境支持)

from __future__ import annotations

import os
import json
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional


class Environment(str, Enum):
    """运行环境"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


@dataclass
class DatabaseConfig:
    """数据库配置"""
    url: str = "sqlite:///./trai.db"
    pool_size: int = 5
    max_overflow: int = 10
    pool_timeout: int = 30
    echo_sql: bool = False


@dataclass
class RedisConfig:
    """Redis配置"""
    host: str = "localhost"
    port: int = 6379
    db: int = 0
    password: Optional[str] = None
    max_connections: int = 10


@dataclass 
class AIServiceConfig:
    """AI服务配置"""
    provider: str = "openai"  # openai/anthropic/azure
    api_key: str = ""
    base_url: str = ""
    default_model: str = "gpt-4o"
    timeout_seconds: int = 60
    max_retries: int = 3


@dataclass
class CacheConfig:
    """缓存配置"""
    enabled: bool = True
    default_ttl: int = 300  # 5分钟
    max_size: int = 1000


@dataclass
class RateLimitConfig:
    """限流配置"""
    enabled: bool = True
    global_rpm: int = 60
    per_user_rpm: int = 30
    per_ip_rpm: int = 20


@dataclass
class LoggingConfig:
    """日志配置"""
    level: str = "INFO"
    json_format: bool = True
    file_output: bool = False
    log_dir: str = "logs"
    retention_days: int = 30


@dataclass
class AppConfig:
    """
    应用总配置类 (Skills 规范: 强制类封装)
    
    功能:
    - 集中管理所有配置项
    - 支持环境变量覆盖
    - 支持多环境(development/staging/production)
    - 配置验证和默认值
    - 类型安全的配置访问
    
    使用示例:
        config = AppConfig.load()
        
        print(config.database.url)
        print(config.ai_service.api_key)
    """
    
    # 基础配置
    app_name: str = "Trai Backend"
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = False
    
    # 服务配置
    host: str = "0.0.0.0"
    port: int = 5666
    workers: int = 1
    
    # 子配置
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    redis: RedisConfig = field(default_factory=RedisConfig)
    ai_service: AIServiceConfig = field(default_factory=AIServiceConfig)
    cache: CacheConfig = field(default_factory=CacheConfig)
    rate_limit: RateLimitConfig = field(default_factory=RateLimitConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    
    @classmethod
    def load(cls, env_file: str | None = None) -> "AppConfig":
        """
        加载配置(从环境变量和可选的.env文件)
        
        Args:
            env_file: .env文件路径(可选)
            
        Returns:
            AppConfig实例
        """
        instance = cls()
        
        # 加载.env文件(如果存在)
        if env_file and Path(env_file).exists():
            instance._load_env_file(env_file)
        
        # 从环境变量加载并覆盖
        instance._load_from_environment()
        
        return instance
    
    def _load_env_file(self, file_path: str) -> None:
        """从文件加载环境变量"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip().strip('"\'')
                        
        except Exception as e:
            from loguru import logger
            logger.warning(f"Failed to load env file {file_path}: {e}")
    
    def _load_from_environment(self) -> None:
        """从环境变量加载配置"""
        
        # 运行环境
        env_str = os.getenv("APP_ENV", "development").lower()
        try:
            self.environment = Environment(env_str)
        except ValueError:
            self.environment = Environment.DEVELOPMENT
        
        self.debug = os.getenv("DEBUG", "").lower() in ("true", "1", "yes")
        
        # 服务配置
        self.host = os.getenv("APP_HOST", self.host)
        self.port = int(os.getenv("APP_PORT", str(self.port)))
        self.workers = int(os.getenv("WORKERS", str(self.workers)))
        
        # 数据库配置
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            self.database.url = db_url
        
        self.database.pool_size = int(
            os.getenv("DB_POOL_SIZE", str(self.database.pool_size))
        )
        self.database.echo_sql = os.getenv(
            "DB_ECHO_SQL", ""
        ).lower() in ("true", "1")
        
        # Redis配置
        self.redis.host = os.getenv("REDIS_HOST", self.redis.host)
        self.redis.port = int(os.getenv("REDIS_PORT", str(self.redis.port)))
        self.redis.password = os.getenv("REDIS_PASSWORD") or None
        
        # AI服务配置
        self.ai_service.provider = os.getenv(
            "AI_PROVIDER", self.ai_service.provider
        )
        self.ai_service.api_key = os.getenv(
            "OPENAI_API_KEY", ""  # 兼容旧变量名
        ) or os.getenv("AI_API_KEY", "")
        self.ai_service.base_url = os.getenv(
            "AI_BASE_URL", self.ai_service.base_url
        ) or os.getenv("OPENAI_BASE_URL", "")
        self.ai_service.default_model = os.getenv(
            "AI_DEFAULT_MODEL", self.ai_service.default_model
        )
        
        # 缓存配置
        self.cache.enabled = os.getenv(
            "CACHE_ENABLED", ""
        ).lower() in ("true", "1")
        self.cache.default_ttl = int(
            os.getenv("CACHE_TTL", str(self.cache.default_ttl))
        )
        
        # 限流配置
        self.rate_limit.enabled = os.getenv(
            "RATE_LIMIT_ENABLED", ""
        ).lower() in ("true", "1")
        self.rate_limit.global_rpm = int(
            os.getenv("RATE_LIMIT_GLOBAL_RPM", str(self.rate_limit.global_rpm))
        )
        
        # 日志配置
        self.logging.level = os.getenv("LOG_LEVEL", self.logging.level)
        self.logging.json_format = os.getenv(
            "LOG_JSON_FORMAT", ""
        ).lower() in ("true", "1")
        self.logging.file_output = os.getenv(
            "LOG_FILE_OUTPUT", ""
        ).lower() in ("true", "1")
    
    def validate(self) -> list[str]:
        """
        验证配置有效性
        
        Returns:
            错误消息列表(空列表表示通过)
        """
        errors = []
        
        if not self.ai_service.api_key and self.environment == Environment.PRODUCTION:
            errors.append("AI API key is required in production")
        
        if self.port < 1 or self.port > 65535:
            errors.append(f"Invalid port number: {self.port}")
        
        if self.database.pool_size < 1:
            errors.append("Database pool size must be at least 1")
        
        return errors
    
    def is_production(self) -> bool:
        """是否生产环境"""
        return self.environment == Environment.PRODUCTION
    
    def is_development(self) -> bool:
        """是否开发环境"""
        return self.environment == Environment.DEVELOPMENT
    
    def to_dict(self) -> dict[str, Any]:
        """转换为字典(隐藏敏感信息)"""
        return {
            "app_name": self.app_name,
            "environment": self.environment.value,
            "debug": self.debug,
            "host": self.host,
            "port": self.port,
            "workers": self.workers,
            "database": {
                "url": self._mask_sensitive(self.database.url),
                "pool_size": self.database.pool_size,
                "echo_sql": self.database.echo_sql,
            },
            "redis": {
                "host": self.redis.host,
                "port": self.redis.port,
                "password": "***" if self.redis.password else None,
            },
            "ai_service": {
                "provider": self.ai_service.provider,
                "api_key": "***" if self.ai_service.api_key else "",
                "base_url": self.ai_service.base_url,
                "default_model": self.ai_service.default_model,
            },
            "cache": {
                "enabled": self.cache.enabled,
                "default_ttl": self.cache.default_ttl,
                "max_size": self.cache.max_size,
            },
            "rate_limit": {
                "enabled": self.rate_limit.enabled,
                "global_rpm": self.rate_limit.global_rpm,
            },
            "logging": {
                "level": self.logging.level,
                "json_format": self.logging.json_format,
                "file_output": self.logging.file_output,
            },
        }
    
    @staticmethod
    def _mask_sensitive(value: str) -> str:
        """脱敏敏感信息"""
        if not value:
            return value
        if len(value) <= 8:
            return "***"
        return value[:4] + "***" + value[-4:]
    
    def __repr__(self) -> str:
        return (
            f"AppConfig(environment={self.environment.value}, "
            f"host={self.host}:{self.port})"
        )


# 全局单例(延迟初始化)
_config_instance: AppConfig | None = None


def get_config() -> AppConfig:
    """
    获取全局配置实例(单例模式)
    
    Returns:
        AppConfig: 全局配置实例
    """
    global _config_instance
    if _config_instance is None:
        _config_instance = AppConfig.load()
    
    # 每次调用时重新从环境变量刷新(支持热更新)
    _config_instance._load_from_environment()
    
    return _config_instance


def reload_config(env_file: str | None = None) -> AppConfig:
    """
    重新加载配置
    
    Args:
        env_file: 可选的新env文件路径
        
    Returns:
        新的配置实例
    """
    global _config_instance
    _config_instance = AppConfig.load(env_file)
    return _config_instance


__all__ = [
    "AppConfig", "DatabaseConfig", "RedisConfig",
    "AIServiceConfig", "CacheConfig", "RateLimitConfig",
    "LoggingConfig", "Environment",
    "get_config", "reload_config",
]
