#!/usr/bin/env python
# 文件名: migrate_add_ip_fields.py
# 作者: wuhao
# 日期: 2026_04_22
# 描述: 数据库字段增加迁移脚本(为 t_users 表添加 t_last_login_ip 和 t_last_login_location 字段)

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import psycopg2
from loguru import logger


class IPMigrationScript:
    """IP 字段迁移脚本类"""

    @staticmethod
    def get_db_config() -> dict[str, str | int]:
        """获取数据库配置"""
        server = os.getenv("DB_HOST", "127.0.0.1")
        port = os.getenv("DB_PORT", "5432")
        user = os.getenv("DB_USER", "postgres")
        password = os.getenv("DB_PASSWORD", "")
        if not password:
            raise ValueError("DB_PASSWORD 环境变量未设置")
        database = os.getenv("DB_NAME", "trai")
        return {
            "host": server,
            "port": int(port),
            "user": user,
            "password": password,
            "database": database,
            "connect_timeout": 30,
        }

    @classmethod
    def get_db_connection(cls) -> psycopg2.extensions.connection:
        """获取数据库连接"""
        config = cls.get_db_config()
        return psycopg2.connect(**config)

    @classmethod
    def migrate(cls) -> None:
        """执行表结构迁移"""
        logger.info("=" * 60)
        logger.info("数据库迁移: 为 t_users 增加 IP 和 Location 字段")
        logger.info("=" * 60)

        try:
            conn = cls.get_db_connection()
            logger.info("数据库连接成功")
            cur = conn.cursor()

            # 添加 t_last_login_ip
            try:
                cur.execute('ALTER TABLE "t_users" ADD COLUMN "t_last_login_ip" VARCHAR(64);')
                conn.commit()
                logger.info("    [OK] Added t_last_login_ip")
            except psycopg2.errors.DuplicateColumn:
                conn.rollback()
                logger.info("    [SKIP] t_last_login_ip already exists")

            # 添加 t_last_login_location
            try:
                cur.execute('ALTER TABLE "t_users" ADD COLUMN "t_last_login_location" VARCHAR(128);')
                conn.commit()
                logger.info("    [OK] Added t_last_login_location")
            except psycopg2.errors.DuplicateColumn:
                conn.rollback()
                logger.info("    [SKIP] t_last_login_location already exists")

            conn.close()

            logger.info("\n" + "=" * 60)
            logger.info("迁移完成!")
            logger.info("=" * 60)

        except Exception as e:
            logger.error(f"迁移失败: {str(e)}")
            raise


if __name__ == "__main__":
    try:
        from dotenv import load_dotenv

        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        logger.info("Loading env from:", env_path)
        load_dotenv(env_path)
    except ImportError:
        pass
    IPMigrationScript.migrate()
