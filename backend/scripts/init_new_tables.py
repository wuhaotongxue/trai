#!/usr/bin/env python
# 文件名: init_new_tables.py
# 作者: wuhao
# 日期: 2026_05_15_15:10:00
# 描述: 初始化新增的数据库表

from __future__ import annotations

import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

from loguru import logger

from infrastructure.database.database import Database
from infrastructure.database.models import (
    ChatLogModel,
    LoginLogModel,
)


def init_tables() -> None:
    """初始化新增的数据库表"""
    try:
        logger.info("开始初始化新增数据库表...")

        db = Database()

        from sqlalchemy import inspect

        inspector = inspect(db.engine)

        # 创建 ChatLogModel 表
        if not inspector.has_table("t_chat_logs"):
            ChatLogModel.__table__.create(db.engine)
            logger.info("✓ 创建 t_chat_logs 表成功")
        else:
            logger.info("✓ t_chat_logs 表已存在")

        # 创建 LoginLogModel 表
        if not inspector.has_table("t_login_logs"):
            LoginLogModel.__table__.create(db.engine)
            logger.info("✓ 创建 t_login_logs 表成功")
        else:
            logger.info("✓ t_login_logs 表已存在")

        logger.info("✓ 数据库表初始化完成")

    except Exception as e:
        logger.error(f"✗ 数据库表初始化失败: {e}")
        raise


if __name__ == "__main__":
    init_tables()
