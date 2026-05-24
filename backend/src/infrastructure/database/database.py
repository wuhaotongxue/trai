#!/usr/bin/env python
# 文件名: database.py
# 作者: wuhao
# 日期: 2026_04_16_08:54:20
# 描述: 数据库配置

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class ConfigurationError(Exception):
    """配置错误异常"""

    def __init__(self, message: str = "配置错误"):
        super().__init__(message)
        self.message = message


# 加载 backend/env/*.env 配置
# __file__ = /path/to/backend/src/infrastructure/database/database.py
# parent.parent.parent.parent = /path/to/backend
_env_dir = Path(__file__).resolve().parent.parent.parent.parent / "env"
for _env_file in _env_dir.glob("*.env"):
    if _env_file.is_file():
        with open(_env_file, encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _key, _val = _line.split("=", 1)
                    os.environ[_key.strip()] = _val.strip()


class Base(DeclarativeBase):
    """SQLAlchemy 声明式基类"""

    pass


class DatabaseConfig:
    """数据库配置"""

    def __init__(self) -> None:
        self._server: str = os.getenv("POSTGRES_SERVER") or os.getenv("DB_HOST", "localhost")
        self._port: str = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT", "5432")
        self._user: str = os.getenv("POSTGRES_USER") or os.getenv("DB_USER", "postgres")
        self._password: str = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD", "")
        self._database: str = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME", "trai")

    @property
    def url(self) -> URL:
        """获取数据库连接 URL(密码自动 URL 编码)"""
        return URL.create(
            drivername="postgresql",
            username=self._user,
            password=self._password,
            host=self._server,
            port=int(self._port),
            database=self._database,
        )

    def create_engine(self, **kwargs: Any) -> Any:
        """创建数据库引擎"""
        return create_engine(self.url, **kwargs)

    def create_session_factory(self, engine: Any) -> sessionmaker[Session]:
        """创建会话工厂"""
        return sessionmaker(bind=engine, expire_on_commit=False)


class Database:
    """数据库管理器"""

    def __init__(self) -> None:
        self._config = DatabaseConfig()
        # 先导入所有模型，确保 Base.metadata 注册了所有表
        from infrastructure.database.i18n_model import (
            I18nStringModel,
            SystemSettingModel,
        )  # noqa: F401,F403
        from infrastructure.database.models import (
            ChatSessionModel,
            DepartmentModel,
            ImageRecordModel,
            UserDepartmentMappingModel,
            UserModel,
        )  # noqa: F401,F403
        from infrastructure.database.subtitle_record_model import (
            SubtitleRecordModel,
        )
        from infrastructure.database.extension_models import (
            APIKeyModel,
            APIUsageLogModel,
            SystemLogModel,
            AgentModel,
            KnowledgeBaseModel,
            KnowledgeBaseDocumentModel,
            AITraceLogModel,
        )
        from infrastructure.database.transcribe_model import (
            AudioTranscribeRecordModel,
        )

        del (
            ChatSessionModel,
            ImageRecordModel,
            UserModel,
            DepartmentModel,
            UserDepartmentMappingModel,
            SubtitleRecordModel,
            APIKeyModel,
            APIUsageLogModel,
            SystemLogModel,
            AgentModel,
            KnowledgeBaseModel,
            KnowledgeBaseDocumentModel,
            AITraceLogModel,
            AudioTranscribeRecordModel,
        )  # 仅触发导入副作用
        del I18nStringModel, SystemSettingModel
        self._engine = self._config.create_engine(
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            echo=False,
            connect_args={"connect_timeout": 5},
        )

        with self._engine.connect():
            pass

        self._session_factory = self._config.create_session_factory(self._engine)
        self._ensure_postgres_user_schema()
        self.create_tables()
        self._ensure_default_admin()

    @property
    def engine(self) -> Any:
        """获取数据库引擎"""
        return self._engine

    def get_session(self) -> Session:
        """获取数据库会话"""
        return self._session_factory()

    def create_tables(self) -> None:
        """创建所有表"""
        Base.metadata.create_all(self._engine)

    def drop_tables(self) -> None:
        """删除所有表"""
        Base.metadata.drop_all(self._engine)

    def _ensure_default_admin(self) -> None:
        import uuid
        from datetime import datetime

        from sqlalchemy import text

        from infrastructure.security.password import PasswordService

        session = self.get_session()
        try:
            try:
                existing = session.execute(
                    text("SELECT t_id FROM t_users WHERE t_username = :username AND t_deleted_at IS NULL"),
                    {"username": "admin"},
                ).fetchone()
            except Exception as e:
                session.rollback()
                logger.warning(f"Ensure default admin skipped: {e}")
                return
            if existing:
                return

            password_service = PasswordService()
            now = datetime.now()

            # 必须从环境变量获取初始 admin 密码, 禁止硬编码默认值
            admin_pwd = os.getenv("ADMIN_INIT_PASSWORD")
            if not admin_pwd:
                raise ConfigurationError(
                    message="ADMIN_INIT_PASSWORD 环境变量未设置, 无法创建初始管理员账户",
                )
            params: dict[str, object] = {
                "user_id": str(uuid.uuid4()),
                "username": "admin",
                "display_name": "管理员",
                "email": "admin@example.com",
                "password_hash": password_service.hash(admin_pwd),
                "role": "admin",
                "status": "active",
                "created_at": now,
                "updated_at": now,
            }

            session.execute(
                text(
                    """
                    INSERT INTO t_users (
                        t_user_id,
                        t_username,
                        t_display_name,
                        t_email,
                        t_password_hash,
                        t_role,
                        t_status,
                        t_created_at,
                        t_updated_at
                    ) VALUES (
                        :user_id,
                        :username,
                        :display_name,
                        :email,
                        :password_hash,
                        :role,
                        :status,
                        :created_at,
                        :updated_at
                    )
                    """
                ),
                params,
            )
            session.commit()
        finally:
            session.close()

    def _ensure_postgres_user_schema(self) -> None:
        from sqlalchemy import text

        session = self.get_session()
        try:
            session.execute(text('ALTER TABLE "t_users" ADD COLUMN IF NOT EXISTS t_mobile VARCHAR(32)'))
            session.execute(text('ALTER TABLE "t_users" ADD COLUMN IF NOT EXISTS t_position VARCHAR(128)'))
            session.execute(text('ALTER TABLE "t_users" ADD COLUMN IF NOT EXISTS t_tenant_id VARCHAR(64)'))
            session.execute(text('ALTER TABLE "t_users" ADD COLUMN IF NOT EXISTS t_wecom_user_id VARCHAR(64)'))
            session.execute(text('ALTER TABLE "t_users" ADD COLUMN IF NOT EXISTS t_wecom_data JSONB'))
            session.commit()
        except Exception:
            session.rollback()
        finally:
            session.close()


_db: Database | None = None


def get_database() -> Database:
    """获取数据库实例(单例)"""
    global _db
    if _db is None:
        _db = Database()
    return _db


def get_session() -> Session:
    """获取数据库会话(依赖注入)"""
    return get_database().get_session()


def get_db_session():
    """获取数据库会话生成器(用于 FastAPI Depends)"""
    session = get_database().get_session()
    try:
        yield session
    finally:
        session.close()


__all__ = ["Base", "Database", "DatabaseConfig", "get_database", "get_session", "get_db_session"]
