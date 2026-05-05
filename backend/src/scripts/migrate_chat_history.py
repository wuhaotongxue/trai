#!/usr/bin/env python
# 文件名: migrate_chat_history.py
# 作者: wuhao
# 日期: 2026_05_04
# 描述: 对话历史数据库迁移脚本 - 确保表结构完整和索引优化

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from loguru import logger
from sqlalchemy import text, inspect
from infrastructure.database.database import get_database


def check_and_create_chat_tables() -> None:
    """检查并创建对话历史相关表"""
    db = get_database()
    engine = db._engine
    inspector = inspect(engine)

    existing_tables = inspector.get_table_names()

    # 检查并创建 t_chat_sessions 表
    if "t_chat_sessions" not in existing_tables:
        logger.info("创建 t_chat_sessions 表...")
        engine.execute(text("""
            CREATE TABLE t_chat_sessions (
                t_id BIGSERIAL PRIMARY KEY,
                t_session_id VARCHAR(64) UNIQUE NOT NULL,
                t_user_id VARCHAR(64),
                t_title VARCHAR(255),
                t_model VARCHAR(64) NOT NULL,
                t_messages JSONB DEFAULT '[]',
                t_extra_data JSONB DEFAULT '{}',
                t_created_at TIMESTAMP DEFAULT NOW(),
                t_created_by VARCHAR(64),
                t_updated_at TIMESTAMP DEFAULT NOW(),
                t_updated_by VARCHAR(64),
                t_deleted_at TIMESTAMP,
                t_deleted_by VARCHAR(64)
            )
        """))
        
        # 创建索引
        engine.execute(text("CREATE INDEX idx_chat_sessions_session_id ON t_chat_sessions(t_session_id)"))
        engine.execute(text("CREATE INDEX idx_chat_sessions_user_id ON t_chat_sessions(t_user_id)"))
        engine.execute(text("CREATE INDEX idx_chat_sessions_updated_at ON t_chat_sessions(t_updated_at)"))
        engine.execute(text("CREATE INDEX idx_chat_sessions_deleted_at ON t_chat_sessions(t_deleted_at)"))
        
        logger.info("✅ t_chat_sessions 表创建成功")
    else:
        logger.info("✅ t_chat_sessions 表已存在")

    # 检查并创建 t_messages 表
    if "t_messages" not in existing_tables:
        logger.info("创建 t_messages 表...")
        engine.execute(text("""
            CREATE TABLE t_messages (
                t_id BIGSERIAL PRIMARY KEY,
                t_session_id VARCHAR(64) NOT NULL,
                t_role VARCHAR(32) NOT NULL,
                t_content TEXT NOT NULL,
                t_msg_metadata JSONB DEFAULT '{}',
                t_created_at TIMESTAMP DEFAULT NOW(),
                t_created_by VARCHAR(64)
            )
        """))
        
        # 创建索引
        engine.execute(text("CREATE INDEX idx_messages_session_id ON t_messages(t_session_id)"))
        engine.execute(text("CREATE INDEX idx_messages_created_at ON t_messages(t_created_at)"))
        engine.execute(text("CREATE INDEX idx_messages_role ON t_messages(t_role)"))
        
        logger.info("✅ t_messages 表创建成功")
    else:
        logger.info("✅ t_messages 表已存在")

    # 检查并添加缺失的列(增量升级)
    _upgrade_table_columns(engine, "t_chat_sessions", {
        "t_created_by": "VARCHAR(64)",
        "t_updated_by": "VARCHAR(64)",
        "t_deleted_at": "TIMESTAMP",
        "t_deleted_by": "VARCHAR(64)",
    })
    
    _upgrade_table_columns(engine, "t_messages", {
        "t_created_by": "VARCHAR(64)",
    })


def _upgrade_table_columns(engine, table_name: str, columns: dict[str, str]) -> None:
    """增量添加表列(如果不存在)"""
    inspector = inspect(engine)
    existing_columns = [col["name"] for col in inspector.get_columns(table_name)]
    
    for col_name, col_type in columns.items():
        if col_name not in existing_columns:
            try:
                engine.execute(text(f'ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {col_name} {col_type}'))
                logger.info(f"  ➕ 添加列 {table_name}.{col_name}")
            except Exception as e:
                logger.warning(f"  ⚠️ 添加列 {table_name}.{col_name} 失败: {e}")


def verify_indexes() -> None:
    """验证关键索引是否存在"""
    db = get_database()
    engine = db._engine
    inspector = inspect(engine)

    required_indexes = {
        "t_chat_sessions": [
            "idx_chat_sessions_session_id",
            "idx_chat_sessions_user_id",
            "idx_chat_sessions_updated_at",
        ],
        "t_messages": [
            "idx_messages_session_id",
            "idx_messages_created_at",
        ],
    }

    all_indexes = inspector.get_index_names()

    for table_name, indexes in required_indexes.items():
        for index_name in indexes:
            if index_name not in all_indexes:
                logger.warning(f"⚠️ 缺少索引: {index_name} (表: {table_name})")
            else:
                logger.debug(f"✅ 索引存在: {index_name}")


def show_table_stats() -> None:
    """显示表统计信息"""
    db = get_database()
    session = db.get_session()

    try:
        # 会话统计
        result = session.execute(text("""
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN t_deleted_at IS NULL THEN 1 END) as active_sessions
            FROM t_chat_sessions
        """))
        row = result.fetchone()
        logger.info(f"📊 会话统计 | 总数={row[0]} | 活跃={row[1]}")

        # 消息统计
        result = session.execute(text("""
            SELECT 
                COUNT(*) as total_messages,
                COUNT(CASE WHEN t_role='user' THEN 1 END) as user_messages,
                COUNT(CASE WHEN t_role='assistant' THEN 1 END) as assistant_messages
            FROM t_messages
        """))
        row = result.fetchone()
        logger.info(f"📊 消息统计 | 总数={row[0]} | 用户消息={row[1]} | AI回复={row[2]}")

    except Exception as e:
        logger.warning(f"获取统计信息失败(可能是新数据库): {e}")
    finally:
        session.close()


def main():
    """主函数"""
    print("=" * 60)
    print("🔄 对话历史数据库迁移工具")
    print("=" * 60)
    print()

    try:
        # 1. 检查并创建表
        print("📋 步骤 1/3: 检查表结构...")
        check_and_create_chat_tables()
        print()

        # 2. 验证索引
        print("📋 步骤 2/3: 验证索引...")
        verify_indexes()
        print()

        # 3. 显示统计信息
        print("📋 步骤 3/3: 显示统计信息...")
        show_table_stats()
        print()

        print("=" * 60)
        print("✅ 数据库迁移完成!")
        print("=" * 60)

    except Exception as e:
        logger.error(f"❌ 迁移失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
