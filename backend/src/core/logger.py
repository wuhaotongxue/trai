#!/usr/bin/env python
# 文件名: logger.py
# 作者: wuhao
# 日期: 2026_04_09_13:42:00
# 描述: 日志模块,封装 loguru 提供统一日志服务

from __future__ import annotations

import sys
from pathlib import Path
from typing import TYPE_CHECKING

from loguru import logger

if TYPE_CHECKING:
    from loguru import Logger


class LoggerConfig:
    """日志配置类"""

    def __init__(self) -> None:
        self._log_dir: Path = Path("logs")
        self._rotation: str = "500 MB"
        self._retention: str = "30 days"
        self._compression: str = "zip"
        self._format: str = (
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        )
        self._level: str = "INFO"
        self._colorize: bool = True
        self._backtrace: bool = True
        self._diagnose: bool = True

    @property
    def log_dir(self) -> Path:
        """日志目录路径"""
        return self._log_dir

    @log_dir.setter
    def log_dir(self, value: str | Path) -> None:
        self._log_dir = Path(value)

    @property
    def rotation(self) -> str:
        """日志轮转策略"""
        return self._rotation

    @rotation.setter
    def rotation(self, value: str) -> None:
        self._rotation = value

    @property
    def retention(self) -> str:
        """日志保留策略"""
        return self._retention

    @retention.setter
    def retention(self, value: str) -> None:
        self._retention = value

    @property
    def compression(self) -> str:
        """日志压缩格式"""
        return self._compression

    @compression.setter
    def compression(self, value: str) -> None:
        self._compression = value

    @property
    def format(self) -> str:
        """日志格式"""
        return self._format

    @format.setter
    def format(self, value: str) -> None:
        self._format = value

    @property
    def level(self) -> str:
        """日志级别"""
        return self._level

    @level.setter
    def level(self, value: str) -> None:
        self._level = value

    @property
    def colorize(self) -> bool:
        """是否彩色输出"""
        return self._colorize

    @colorize.setter
    def colorize(self, value: bool) -> None:
        self._colorize = value

    @property
    def backtrace(self) -> bool:
        """是否显示回溯"""
        return self._backtrace

    @backtrace.setter
    def backtrace(self, value: bool) -> None:
        self._backtrace = value

    @property
    def diagnose(self) -> bool:
        """是否显示诊断信息"""
        return self._diagnose

    @diagnose.setter
    def diagnose(self, value: bool) -> None:
        self._diagnose = value


class LoggerManager:
    """日志管理器,单例模式"""

    _instance: LoggerManager | None = None
    _initialized: bool = False

    def __new__(cls) -> LoggerManager:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if LoggerManager._initialized:
            return
        self._config: LoggerConfig = LoggerConfig()
        self._setup_logger()
        LoggerManager._initialized = True

    def _setup_logger(self) -> None:
        """配置 loguru 日志器"""
        logger.remove()

        log_dir = self._config.log_dir
        log_dir.mkdir(parents=True, exist_ok=True)

        logger.add(
            sys.stderr,
            format=self._config.format,
            level=self._config.level,
            colorize=self._config.colorize,
            backtrace=self._config.backtrace,
            diagnose=self._config.diagnose,
        )

        logger.add(
            log_dir / "trai_{time:YYYY-MM-DD}.log",
            rotation=self._config.rotation,
            retention=self._config.retention,
            compression=self._config.compression,
            format=self._config.format,
            level=self._config.level,
            colorize=False,
            backtrace=self._config.backtrace,
            diagnose=self._config.diagnose,
            enqueue=True,
        )

        logger.add(
            log_dir / "error_{time:YYYY-MM-DD}.log",
            rotation=self._config.rotation,
            retention=self._config.retention,
            compression=self._config.compression,
            format=self._config.format,
            level="ERROR",
            colorize=False,
            backtrace=self._config.backtrace,
            diagnose=self._config.diagnose,
            enqueue=True,
            filter=lambda record: record["level"].name == "ERROR",
        )

    @property
    def config(self) -> LoggerConfig:
        """获取日志配置"""
        return self._config

    def configure(self, **kwargs: str | bool | Path) -> None:
        """动态配置日志

        Args:
            **kwargs: 配置参数,支持 level, rotation, retention, format 等
        """
        if "level" in kwargs:
            self._config.level = str(kwargs["level"])
        if "rotation" in kwargs:
            self._config.rotation = str(kwargs["rotation"])
        if "retention" in kwargs:
            self._config.retention = str(kwargs["retention"])
        if "format" in kwargs:
            self._config.format = str(kwargs["format"])
        if "colorize" in kwargs:
            self._config.colorize = bool(kwargs["colorize"])
        if "log_dir" in kwargs:
            self._config.log_dir = Path(str(kwargs["log_dir"]))

        self._setup_logger()


def get_logger() -> Logger:
    """获取全局日志器实例

    Returns:
        Logger: loguru 日志器实例
    """
    return logger


def init_logger(**kwargs: str | bool | Path) -> None:
    """初始化日志器

    Args:
        **kwargs: 可选的配置参数
    """
    manager = LoggerManager()
    if kwargs:
        manager.configure(**kwargs)


__all__ = [
    "logger",
    "LoggerConfig",
    "LoggerManager",
    "get_logger",
    "init_logger",
]
