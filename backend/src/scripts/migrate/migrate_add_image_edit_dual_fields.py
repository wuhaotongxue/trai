#!/usr/bin/env python
# 文件名: migrate_add_image_edit_dual_fields.py
# 作者: wuhao
# 日期: 2026_05_20
# 描述: 数据库字段增加迁移脚本（为 t_image_records 表添加双图编辑相关字段）
# 用法:
#   python -m scripts.migrate.migrate_add_image_edit_dual_fields
#   python -m scripts.migrate_add_image_edit_dual_fields


from __future__ import annotations

import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent.parent
sys.path.insert(0, str(backend_dir / "src"))

import psycopg2
from loguru import logger


class ImageEditDualMigration:
    """双图编辑字段迁移脚本"""

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
        logger.info("数据库迁移: 为 t_image_records 增加双图编辑字段")
        logger.info("=" * 60)

        # 新增字段列表
        fields = [
            ('"t_source_image_url_2"', "TEXT"),
            ('"t_source_image_object_key"', "VARCHAR(500)"),
            ('"t_source_image_object_key_2"', "VARCHAR(500)"),
        ]

        try:
            conn = cls.get_db_connection()
            logger.info("数据库连接成功")
            cur = conn.cursor()

            for field_def, field_type in fields:
                try:
                    cur.execute(f'ALTER TABLE "t_image_records" ADD COLUMN {field_def} {field_type};')
                    conn.commit()
                    logger.info(f"    [OK] Added {field_def} ({field_type})")
                except psycopg2.errors.DuplicateColumn:
                    conn.rollback()
                    logger.info(f"    [SKIP] {field_def} already exists")
                except Exception as e:
                    conn.rollback()
                    logger.error(f"    [FAIL] {field_def}: {e}")

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

        env_path = backend_dir / ".env"
        print("Loading env from:", env_path)
        load_dotenv(env_path)
    except ImportError:
        pass

    ImageEditDualMigration.migrate()
