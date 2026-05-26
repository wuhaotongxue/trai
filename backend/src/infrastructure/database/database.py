#!/usr/bin/env python
# 文件名: database.py
# 作者: wuhao
# 日期: 2026_05_26_20:45:12
# 描述: 数据库基础设施配置, 封装 SQLAlchemy 引擎创建、会话管理及模型自动注册

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class ConfigurationError(Exception):
    """
    配置错误异常类, 用于处理环境变量或数据库配置缺失的情况
    """

    def __init__(self, message: str = "配置错误") -> None:
        """
        初始化异常

        参数:
            message (str): 错误描述
        返回值:
            None
        """
        super().__init__(message)
        self.message = message


class EnvLoader:
    """
    环境配置加载类, 负责从 backend/env 目录自动读取 .env 文件并注入环境变量
    """

    @staticmethod
    def load_all() -> None:
        """
        扫描并加载所有配置文件

        参数:
            None
        返回值:
            None
        """
        _env_dir = Path(__file__).resolve().parent.parent.parent.parent / "env"
        if not _env_dir.exists():
            logger.warning(f"环境配置目录不存在: {_env_dir}")
            return

        for _env_file in _env_dir.glob("*.env"):
            if _env_file.is_file():
                with open(_env_file, encoding="utf-8") as _f:
                    for _line in _f:
                        _line = _line.strip()
                        if _line and not _line.startswith("#") and "=" in _line:
                            _key, _val = _line.split("=", 1)
                            os.environ[_key.strip()] = _val.strip()
        logger.info("环境配置加载完成")


# 启动即加载配置
EnvLoader.load_all()


class Base(DeclarativeBase):
    """
    SQLAlchemy 声明式基类, 所有 ORM 模型均需继承此类
    """

    pass


class DatabaseConfig:
    """
    数据库连接配置类, 处理 PostgreSQL 连接参数
    """

    def __init__(self) -> None:
        """
        初始化配置项, 优先读取 POSTGRES 环境变量

        参数:
            None
        返回值:
            None
        """
        self._server: str = os.getenv("POSTGRES_SERVER") or os.getenv("DB_HOST", "localhost")
        self._port: str = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT", "5432")
        self._user: str = os.getenv("POSTGRES_USER") or os.getenv("DB_USER", "postgres")
        self._password: str = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD", "")
        self._database: str = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME", "trai")

    @property
    def url(self) -> URL:
        """
        获取编码后的数据库连接 URL

        参数:
            None
        返回值:
            URL: SQLAlchemy URL 对象
        """
        return URL.create(
            drivername="postgresql",
            username=self._user,
            password=self._password,
            host=self._server,
            port=int(self._port),
            database=self._database,
        )

    def create_engine(self, **kwargs: Any) -> Any:
        """
        创建数据库引擎

        参数:
            **kwargs: 透传给 create_engine 的参数
        返回值:
            Any: SQLAlchemy 引擎实例
        """
        return create_engine(self.url, **kwargs)

    def create_session_factory(self, engine: Any) -> sessionmaker[Session]:
        """
        创建会话工厂

        参数:
            engine (Any): 数据库引擎
        返回值:
            sessionmaker[Session]: 会话工厂
        """
        return sessionmaker(bind=engine, expire_on_commit=False)


class Database:
    """
    数据库管理器类, 维护引擎、会话工厂及单例状态
    """

    def __init__(self) -> None:
        """
        初始化管理器并预注册所有模型

        参数:
            None
        返回值:
            None
        """
        self._config = DatabaseConfig()
        # 预加载模型以注册元数据
        self._import_models()
        self._engine = self._config.create_engine(pool_pre_ping=True, pool_size=10, max_overflow=20)
        self._session_factory = self._config.create_session_factory(self._engine)

    def _import_models(self) -> None:
        """
        内部方法: 导入所有业务模型

        参数:
            None
        返回值:
            None
        """
        try:
            from infrastructure.database.extension_models import AgentModel, AITraceLogModel  # noqa: F401
            from infrastructure.database.models import ChatSessionModel, DepartmentModel  # noqa: F401

            logger.debug("数据库模型注册完成")
        except ImportError as e:
            logger.error(f"模型导入失败: {e}")

    def get_session(self) -> Session:
        """
        获取一个新的数据库会话

        参数:
            None
        返回值:
            Session: 数据库会话实例
        """
        return self._session_factory()


def get_db_session() -> Session:
    """
    FastAPI 依赖注入使用的获取会话函数

    参数:
        None
    返回值:
        Session: 数据库会话实例
    """
    db = Database()
    session = db.get_session()
    try:
        yield session
    finally:
        session.close()
