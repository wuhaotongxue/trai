#!/usr/bin/env python
# 文件名: migrate_rename_fields.py
# 作者: wuhao
# 日期: 2026_04_13
# 描述: 数据库字段重命名迁移脚本(将表名和字段名改为 t_ 前缀)
# 危险!执行前请先备份数据库!

from __future__ import annotations

import os


def get_db_config():
    """获取数据库配置"""
    server = os.getenv("POSTGRES_SERVER", "127.0.0.1")
    port = os.getenv("POSTGRES_PORT", "5432")
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "")
    if not password:
        raise ValueError("POSTGRES_PASSWORD 环境变量未设置")
    database = os.getenv("POSTGRES_DB", "trai")
    return {
        "host": server,
        "port": int(port),
        "user": user,
        "password": password,
        "database": database,
        "connect_timeout": 30,
    }


def get_db_connection():
    """获取数据库连接"""
    import psycopg2

    return psycopg2.connect(**get_db_config())


# 表名映射(旧名 -> 新名)
TABLE_RENAMES = {
    "users": "t_users",
    "chat_sessions": "t_chat_sessions",
    "messages": "t_messages",
    "quota_plans": "t_quota_plans",
    "user_quota_usage": "t_user_quota_usage",
    "quota_transaction_log": "t_quota_transaction_log",
    "image_generations": "t_image_generations",
    "upload_tasks": "t_upload_tasks",
}

# 每个表需要重命名的字段映射(旧名 -> 新名)
FIELD_RENAMES = {
    "t_users": {
        "id": "t_id",
        "user_id": "t_user_id",
        "username": "t_username",
        "display_name": "t_display_name",
        "email": "t_email",
        "password_hash": "t_password_hash",
        "avatar_url": "t_avatar_url",
        "role": "t_role",
        "status": "t_status",
        "tenant_id": "t_tenant_id",
        "wecom_user_id": "t_wecom_user_id",
        "created_at": "t_created_at",
        "created_by": "t_created_by",
        "updated_at": "t_updated_at",
        "updated_by": "t_updated_by",
        "deleted_at": "t_deleted_at",
        "deleted_by": "t_deleted_by",
    },
    "t_chat_sessions": {
        "id": "t_id",
        "session_id": "t_session_id",
        "user_id": "t_user_id",
        "title": "t_title",
        "model": "t_model",
        "messages": "t_messages",
        "extra_data": "t_extra_data",
        "created_at": "t_created_at",
        "created_by": "t_created_by",
        "updated_at": "t_updated_at",
        "updated_by": "t_updated_by",
        "deleted_at": "t_deleted_at",
        "deleted_by": "t_deleted_by",
    },
    "t_messages": {
        "id": "t_id",
        "session_id": "t_session_id",
        "role": "t_role",
        "content": "t_content",
        "msg_metadata": "t_msg_metadata",
        "created_at": "t_created_at",
        "created_by": "t_created_by",
    },
    "t_quota_plans": {
        "id": "t_id",
        "plan_name": "t_plan_name",
        "user_role": "t_user_role",
        "image_generation_limit": "t_image_generation_limit",
        "audio_synthesis_limit": "t_audio_synthesis_limit",
        "transcription_minutes_limit": "t_transcription_minutes_limit",
        "meeting_summary_limit": "t_meeting_summary_limit",
        "ai_translation_limit": "t_ai_translation_limit",
        "ai_summarization_limit": "t_ai_summarization_limit",
        "agent_tool_call_limit": "t_agent_tool_call_limit",
        "created_at": "t_created_at",
        "created_by": "t_created_by",
        "updated_at": "t_updated_at",
        "updated_by": "t_updated_by",
    },
    "t_user_quota_usage": {
        "id": "t_id",
        "user_id": "t_user_id",
        "billing_month": "t_billing_month",
        "image_generation_used": "t_image_generation_used",
        "audio_synthesis_used": "t_audio_synthesis_used",
        "transcription_minutes_used": "t_transcription_minutes_used",
        "meeting_summary_used": "t_meeting_summary_used",
        "ai_translation_used": "t_ai_translation_used",
        "ai_summarization_used": "t_ai_summarization_used",
        "agent_tool_call_used": "t_agent_tool_call_used",
        "created_at": "t_created_at",
        "created_by": "t_created_by",
        "updated_at": "t_updated_at",
        "updated_by": "t_updated_by",
    },
    "t_quota_transaction_log": {
        "id": "t_id",
        "user_id": "t_user_id",
        "billing_month": "t_billing_month",
        "transaction_type": "t_transaction_type",
        "quota_type": "t_quota_type",
        "delta": "t_delta",
        "balance_before": "t_balance_before",
        "balance_after": "t_balance_after",
        "tool_id": "t_tool_id",
        "session_id": "t_session_id",
        "trace_id": "t_trace_id",
        "created_at": "t_created_at",
        "created_by": "t_created_by",
    },
    "t_image_generations": {
        "id": "t_id",
        "task_id": "t_task_id",
        "user_id": "t_user_id",
        "prompt": "t_prompt",
        "negative_prompt": "t_negative_prompt",
        "style": "t_style",
        "size": "t_size",
        "status": "t_status",
        "result_url": "t_result_url",
        "error_message": "t_error_message",
        "model": "t_model",
        "width": "t_width",
        "height": "t_height",
        "steps": "t_steps",
        "seed": "t_seed",
        "session_id": "t_session_id",
        "trace_id": "t_trace_id",
        "created_at": "t_created_at",
        "created_by": "t_created_by",
        "updated_at": "t_updated_at",
        "updated_by": "t_updated_by",
    },
    "t_upload_tasks": {
        "id": "t_id",
        "task_id": "t_task_id",
        "user_id": "t_user_id",
        "file_name": "t_file_name",
        "file_type": "t_file_type",
        "file_size": "t_file_size",
        "content_type": "t_content_type",
        "status": "t_status",
        "file_url": "t_file_url",
        "error_message": "t_error_message",
        "session_id": "t_session_id",
        "trace_id": "t_trace_id",
        "created_at": "t_created_at",
        "created_by": "t_created_by",
        "updated_at": "t_updated_at",
        "updated_by": "t_updated_by",
    },
}


def get_table_columns(conn, table_name):
    """获取表的所有列名"""
    cur = conn.cursor()
    cur.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = %s AND table_name = %s ORDER BY ordinal_position",
        ("public", table_name),
    )
    return [row[0] for row in cur.fetchall()]


def get_table_names(conn):
    """获取数据库中所有表名"""
    cur = conn.cursor()
    cur.execute(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = %s ORDER BY table_name",
        ("public",),
    )
    return [row[0] for row in cur.fetchall()]


def rename_table(conn, old_name, new_name):
    """重命名表"""
    cur = conn.cursor()
    cur.execute(f'ALTER TABLE "{old_name}" RENAME TO "{new_name}"')
    conn.commit()
    print(f"  [OK] {old_name} -> {new_name}")


def rename_column(conn, table_name, old_name, new_name):
    """重命名字段"""
    cur = conn.cursor()
    cur.execute(f'ALTER TABLE "{table_name}" RENAME COLUMN "{old_name}" TO "{new_name}"')
    conn.commit()
    print(f"    [OK] {old_name} -> {new_name}")


def migrate_rename_all():
    """执行表名和字段名重命名迁移"""
    print("=" * 60)
    print("数据库重命名迁移")
    print("将表名和字段名改为 t_ 前缀")
    print("=" * 60)

    try:
        conn = get_db_connection()
        print("数据库连接成功")

        # 第一步:重命名表名
        print("\n=== 第一步:重命名表名 ===")
        existing_tables = get_table_names(conn)
        for old_name, new_name in TABLE_RENAMES.items():
            if old_name not in existing_tables:
                print(f"  [跳过] 表 {old_name} 不存在")
                continue
            if new_name in existing_tables:
                print(f"  [跳过] 表 {new_name} 已存在")
                continue
            rename_table(conn, old_name, new_name)

        # 第二步:重命名字段名
        print("\n=== 第二步:重命名字段名 ===")
        for table_name, renames in FIELD_RENAMES.items():
            print(f"\n处理表: {table_name}")
            columns = get_table_columns(conn, table_name)
            print(f"  当前列: {columns}")

            for old_name, new_name in renames.items():
                if old_name == new_name:
                    continue
                if old_name not in columns:
                    print(f"  [跳过] 列 {old_name} 不存在")
                    continue
                if new_name in columns:
                    print(f"  [跳过] 列 {new_name} 已存在")
                    continue
                rename_column(conn, table_name, old_name, new_name)

            print(f"  完成: {table_name}")

        conn.close()

        print("\n" + "=" * 60)
        print("迁移完成!")
        print("请重启应用以使更改生效")
        print("=" * 60)

    except Exception as e:
        print(f"迁移失败: {str(e)}")
        raise


def rollback_rename_all():
    """回滚重命名(将 t_ 前缀改回原名)"""
    print("=" * 60)
    print("数据库重命名回滚")
    print("将 t_ 前缀改回原名")
    print("=" * 60)

    try:
        conn = get_db_connection()
        print("数据库连接成功")

        # 第一步:先回滚字段名
        print("\n=== 第一步:回滚字段名 ===")
        for table_name, renames in FIELD_RENAMES.items():
            print(f"\n处理表: {table_name}")
            columns = get_table_columns(conn, table_name)

            for old_name, new_name in renames.items():
                if old_name == new_name:
                    continue
                if new_name not in columns:
                    print(f"  [跳过] 列 {new_name} 不存在")
                    continue
                if old_name in columns:
                    print(f"  [跳过] 列 {old_name} 已存在")
                    continue
                rename_column(conn, table_name, new_name, old_name)

            print(f"  完成: {table_name}")

        # 第二步:回滚表名
        print("\n=== 第二步:回滚表名 ===")
        existing_tables = get_table_names(conn)
        for old_name, new_name in TABLE_RENAMES.items():
            if new_name not in existing_tables:
                print(f"  [跳过] 表 {new_name} 不存在")
                continue
            if old_name in existing_tables:
                print(f"  [跳过] 表 {old_name} 已存在")
                continue
            rename_table(conn, new_name, old_name)

        conn.close()

        print("\n" + "=" * 60)
        print("回滚完成!")
        print("=" * 60)

    except Exception as e:
        print(f"回滚失败: {str(e)}")
        raise


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="数据库重命名迁移脚本")
    parser.add_argument(
        "--rollback",
        action="store_true",
        help="回滚迁移(将 t_ 前缀改回原名)",
    )
    args = parser.parse_args()

    if args.rollback:
        rollback_rename_all()
    else:
        migrate_rename_all()


if __name__ == "__main__":
    main()
