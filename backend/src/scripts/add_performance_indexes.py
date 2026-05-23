#!/usr/bin/env python
# 文件名: add_performance_indexes.py
# 作者: wuhao
# 日期: 2026_05_04_15:00:00
# 描述: 数据库性能优化 - 添加缺失的索引

from __future__ import annotations

import sys
from pathlib import Path

from loguru import logger

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "src"))

from sqlalchemy import text

from infrastructure.database.database import get_db_engine


def add_performance_indexes():
    """添加性能优化索引"""

    engine = get_db_engine()

    indexes = [
        # ChatSession 表索引
        {
            "name": "idx_sessions_model",
            "table": "t_chat_sessions",
            "columns": ["t_model"],
            "description": "加速按模型筛选会话",
        },
        {
            "name": "idx_sessions_created_at",
            "table": "t_chat_sessions",
            "columns": ["t_created_at"],
            "description": "加速按时间范围查询",
        },
        {
            "name": "idx_sessions_user_created",
            "table": "t_chat_sessions",
            "columns": ["t_user_id", "t_created_at"],
            "description": "复合索引: 用户+时间(用于列表查询)",
        },
        {
            "name": "idx_sessions_deleted_at",
            "table": "t_chat_sessions",
            "columns": ["t_deleted_at"],
            "description": "加速软删除过滤",
        },
        # Message 表索引
        {
            "name": "idx_messages_session_created",
            "table": "t_messages",
            "columns": ["t_session_id", "t_created_at"],
            "description": "复合索引: 会话+时间(用于消息列表)",
        },
        {
            "name": "idx_messages_role",
            "table": "t_messages",
            "columns": ["t_role"],
            "description": "加速按角色筛选消息",
        },
    ]

    with engine.connect() as conn:
        for idx in indexes:
            columns_str = ", ".join(idx["columns"])
            sql = f"""
                CREATE INDEX IF NOT EXISTS {idx["name"]}
                ON {idx["table"]} ({columns_str})
            """

            try:
                conn.execute(text(sql))
                logger.info(f"✅ Created index: {idx['name']} | {idx['description']}")
            except Exception as e:
                logger.error(f"❌ Failed to create index {idx['name']}: {e}")

        conn.commit()

    logger.info("\n🎉 Performance indexes created successfully!")


if __name__ == "__main__":
    add_performance_indexes()
