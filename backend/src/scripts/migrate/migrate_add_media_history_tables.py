#!/usr/bin/env python
# 文件名: migrate_add_media_history_tables.py
# 作者: wuhao
# 日期: 2026_05_28_14:15:09
# 描述: 为 Agent 媒体历史能力创建音乐和视频记录表, 支持历史查询与批量删除

from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg2
from loguru import logger


class MediaHistoryTableMigration:
    """
    媒体历史表迁移脚本类, 负责创建音乐和视频记录表及索引.
    """

    _SCRIPT_DIR = Path(__file__).resolve().parent
    _BACKEND_DIR = _SCRIPT_DIR.parent.parent

    @classmethod
    def append_python_path(cls) -> None:
        """
        追加项目源码目录到 Python 路径.

        参数:
            无.

        返回值:
            None.

        异常:
            无.
        """
        src_path = cls._BACKEND_DIR / "src"
        if str(src_path) not in sys.path:
            sys.path.insert(0, str(src_path))

    @staticmethod
    def get_db_config() -> dict[str, str | int]:
        """
        读取数据库连接配置.

        参数:
            无.

        返回值:
            dict[str, str | int]: 数据库连接参数.

        异常:
            ValueError: 当数据库密码未配置时抛出.
        """
        password = os.getenv("DB_PASSWORD", "")
        if not password:
            raise ValueError("DB_PASSWORD 环境变量未设置")
        return {
            "host": os.getenv("DB_HOST", "127.0.0.1"),
            "port": int(os.getenv("DB_PORT", "5432")),
            "user": os.getenv("DB_USER", "postgres"),
            "password": password,
            "database": os.getenv("DB_NAME", "trai"),
            "connect_timeout": 30,
        }

    @classmethod
    def get_connection(cls) -> psycopg2.extensions.connection:
        """
        创建数据库连接.

        参数:
            无.

        返回值:
            psycopg2.extensions.connection: 数据库连接对象.

        异常:
            psycopg2.Error: 当数据库连接失败时抛出.
        """
        return psycopg2.connect(**cls.get_db_config())

    @classmethod
    def get_table_sql_map(cls) -> dict[str, str]:
        """
        生成待执行的建表 SQL 映射.

        参数:
            无.

        返回值:
            dict[str, str]: 表名到 SQL 的映射.

        异常:
            无.
        """
        return {
            "t_music_records": """
                CREATE TABLE IF NOT EXISTS t_music_records (
                    t_id SERIAL PRIMARY KEY,
                    t_task_id VARCHAR(64) NOT NULL UNIQUE,
                    t_user_id VARCHAR(64) NOT NULL,
                    t_username VARCHAR(100) NULL,
                    t_client_ip VARCHAR(50) NULL,
                    t_user_agent VARCHAR(500) NULL,
                    t_tenant_id VARCHAR(64) NULL,
                    t_prompt TEXT NOT NULL,
                    t_status VARCHAR(32) NOT NULL DEFAULT 'queued',
                    t_progress_message VARCHAR(255) NULL,
                    t_result_url TEXT NULL,
                    t_public_url TEXT NULL,
                    t_object_key VARCHAR(500) NULL,
                    t_file_path VARCHAR(500) NULL,
                    t_error_message TEXT NULL,
                    t_model VARCHAR(64) NULL,
                    t_duration_seconds DOUBLE PRECISION NOT NULL DEFAULT 30.0,
                    t_steps INTEGER NOT NULL DEFAULT 27,
                    t_guidance_scale DOUBLE PRECISION NOT NULL DEFAULT 7.0,
                    t_notify_status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    t_extra_data JSON NOT NULL DEFAULT '{}'::json,
                    t_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    t_created_by VARCHAR(64) NULL,
                    t_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    t_updated_by VARCHAR(64) NULL,
                    t_completed_at TIMESTAMP NULL,
                    t_deleted_at TIMESTAMP NULL,
                    t_deleted_by VARCHAR(64) NULL,
                    t_deleted_ip VARCHAR(50) NULL
                );
            """,
            "t_video_records": """
                CREATE TABLE IF NOT EXISTS t_video_records (
                    t_id SERIAL PRIMARY KEY,
                    t_task_id VARCHAR(64) NOT NULL UNIQUE,
                    t_user_id VARCHAR(64) NOT NULL,
                    t_username VARCHAR(100) NULL,
                    t_client_ip VARCHAR(50) NULL,
                    t_user_agent VARCHAR(500) NULL,
                    t_tenant_id VARCHAR(64) NULL,
                    t_prompt TEXT NOT NULL,
                    t_status VARCHAR(32) NOT NULL DEFAULT 'queued',
                    t_stage VARCHAR(64) NULL,
                    t_progress_message VARCHAR(255) NULL,
                    t_current_step INTEGER NOT NULL DEFAULT 0,
                    t_total_steps INTEGER NOT NULL DEFAULT 9,
                    t_result_url TEXT NULL,
                    t_public_url TEXT NULL,
                    t_object_key VARCHAR(500) NULL,
                    t_error_message TEXT NULL,
                    t_model VARCHAR(64) NULL,
                    t_frames INTEGER NOT NULL DEFAULT 81,
                    t_resolution VARCHAR(32) NOT NULL DEFAULT '1280x720',
                    t_inference_time_seconds INTEGER NULL,
                    t_total_time_seconds INTEGER NULL,
                    t_notify_status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    t_extra_data JSON NOT NULL DEFAULT '{}'::json,
                    t_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    t_created_by VARCHAR(64) NULL,
                    t_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    t_updated_by VARCHAR(64) NULL,
                    t_completed_at TIMESTAMP NULL,
                    t_deleted_at TIMESTAMP NULL,
                    t_deleted_by VARCHAR(64) NULL,
                    t_deleted_ip VARCHAR(50) NULL
                );
            """,
        }

    @classmethod
    def get_index_sql_list(cls) -> list[str]:
        """
        生成待执行的索引 SQL 列表.

        参数:
            无.

        返回值:
            list[str]: 索引 SQL 列表.

        异常:
            无.
        """
        return [
            "CREATE INDEX IF NOT EXISTS idx_t_music_records_user_id ON t_music_records (t_user_id);",
            "CREATE INDEX IF NOT EXISTS idx_t_music_records_status ON t_music_records (t_status);",
            "CREATE INDEX IF NOT EXISTS idx_t_music_records_tenant_id ON t_music_records (t_tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_t_music_records_deleted_at ON t_music_records (t_deleted_at);",
            "CREATE INDEX IF NOT EXISTS idx_t_video_records_user_id ON t_video_records (t_user_id);",
            "CREATE INDEX IF NOT EXISTS idx_t_video_records_status ON t_video_records (t_status);",
            "CREATE INDEX IF NOT EXISTS idx_t_video_records_tenant_id ON t_video_records (t_tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_t_video_records_deleted_at ON t_video_records (t_deleted_at);",
        ]

    @classmethod
    def migrate(cls) -> None:
        """
        执行音乐与视频历史表迁移.

        参数:
            无.

        返回值:
            None.

        异常:
            Exception: 当任意 SQL 执行失败时抛出.
        """
        logger.info("=" * 72)
        logger.info("数据库迁移: 创建 Agent 音乐/视频历史记录表")
        logger.info("=" * 72)
        connection = cls.get_connection()
        try:
            with connection.cursor() as cursor:
                for table_name, sql in cls.get_table_sql_map().items():
                    logger.info(f"创建数据表: {table_name}")
                    cursor.execute(sql)
                for sql in cls.get_index_sql_list():
                    logger.info(f"创建索引: {sql.strip()}")
                    cursor.execute(sql)
            connection.commit()
            logger.info("媒体历史表迁移完成")
        except Exception as error:
            connection.rollback()
            logger.error(f"媒体历史表迁移失败: {error}")
            raise
        finally:
            connection.close()

    @classmethod
    def load_env(cls) -> None:
        """
        加载后端环境变量文件.

        参数:
            无.

        返回值:
            None.

        异常:
            无.
        """
        try:
            from dotenv import load_dotenv

            env_path = cls._BACKEND_DIR / ".env"
            logger.info(f"加载环境文件: {env_path}")
            load_dotenv(env_path)
        except ImportError:
            logger.warning("python-dotenv 未安装, 跳过 .env 自动加载")

    @classmethod
    def main(cls) -> None:
        """
        作为脚本入口执行迁移流程.

        参数:
            无.

        返回值:
            None.

        异常:
            Exception: 当迁移执行失败时继续向上抛出.
        """
        cls.append_python_path()
        cls.load_env()
        cls.migrate()


if __name__ == "__main__":
    MediaHistoryTableMigration.main()
