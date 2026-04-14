#!/usr/bin/env python
# 文件名: add_comments.py
# 作者: wuhao
# 日期: 2026_04_13
# 描述: 为数据库表和字段添加 COMMENT 注释
# 用法: python add_comments.py

from __future__ import annotations

import sys

import psycopg2

# 表注释
TABLE_COMMENTS = {
    "t_users": "用户表,存储用户账户信息",
    "t_chat_sessions": "对话会话表,存储会话元数据和消息历史",
    "t_messages": "消息表,存储 AI 对话单条消息内容",
    "t_quota_plans": "配额套餐表,定义各角色的月度配额上限",
    "t_user_quota_usage": "用户配额使用表,按自然月记录各类型配额消耗",
    "t_quota_transaction_log": "配额变动流水表,记录每次配额增减的完整流水",
    "t_image_generations": "图片生成表,存储 AI 图片生成任务的完整参数和结果",
    "t_upload_tasks": "上传任务表,存储文件上传请求和结果",
}

# 字段注释
FIELD_COMMENTS = {
    "t_users": {
        "t_id": "自增主键 ID",
        "t_user_id": "用户唯一标识 UUID",
        "t_username": "用户名,唯一索引",
        "t_display_name": "显示名称",
        "t_email": "邮箱地址,唯一索引",
        "t_password_hash": "密码哈希(argon2)",
        "t_avatar_url": "头像 URL",
        "t_role": "用户角色:admin/vip/normal",
        "t_status": "状态:active/disabled/pending",
        "t_tenant_id": "租户 ID(多租户场景)",
        "t_wecom_user_id": "企业微信用户 ID(SSO)",
        "t_created_at": "创建时间",
        "t_created_by": "创建人 user_id",
        "t_updated_at": "更新时间",
        "t_updated_by": "最后修改人 user_id",
        "t_deleted_at": "软删除时间(空=未删)",
        "t_deleted_by": "删除操作人 user_id",
    },
    "t_chat_sessions": {
        "t_id": "自增主键 ID",
        "t_session_id": "会话唯一标识 UUID",
        "t_user_id": "用户 ID",
        "t_title": "会话标题",
        "t_model": "使用的 AI 模型名称",
        "t_messages": "消息历史 JSON 数组",
        "t_extra_data": "扩展数据字段",
        "t_created_at": "创建时间",
        "t_created_by": "创建人 user_id",
        "t_updated_at": "更新时间",
        "t_updated_by": "最后修改人 user_id",
        "t_deleted_at": "软删除时间(空=未删)",
        "t_deleted_by": "删除操作人 user_id",
    },
    "t_messages": {
        "t_id": "自增主键 ID",
        "t_session_id": "关联的会话 session_id",
        "t_role": "消息角色:system/user/assistant",
        "t_content": "消息内容",
        "t_msg_metadata": "消息扩展元数据",
        "t_created_at": "创建时间",
        "t_created_by": "创建人 user_id",
    },
    "t_quota_plans": {
        "t_id": "自增主键 ID",
        "t_plan_name": "套餐名称,唯一",
        "t_user_role": "用户角色:admin/vip/normal/guest",
        "t_image_generation_limit": "图片生成配额(0=无限制)",
        "t_audio_synthesis_limit": "语音合成配额(0=无限制)",
        "t_transcription_minutes_limit": "语音转录配额(分钟)",
        "t_meeting_summary_limit": "会议摘要配额",
        "t_ai_translation_limit": "AI 翻译配额",
        "t_ai_summarization_limit": "AI 摘要配额",
        "t_agent_tool_call_limit": "Agent 工具调用配额(0=无限制)",
        "t_created_at": "创建时间",
        "t_created_by": "创建人 user_id",
        "t_updated_at": "更新时间",
        "t_updated_by": "最后修改人 user_id",
    },
    "t_user_quota_usage": {
        "t_id": "自增主键 ID",
        "t_user_id": "用户 ID",
        "t_billing_month": "账单月份 YYYY-MM",
        "t_image_generation_used": "图片生成已用次数",
        "t_audio_synthesis_used": "语音合成已用次数",
        "t_transcription_minutes_used": "语音转录已用分钟数",
        "t_meeting_summary_used": "会议摘要已用次数",
        "t_ai_translation_used": "AI 翻译已用次数",
        "t_ai_summarization_used": "AI 摘要已用次数",
        "t_agent_tool_call_used": "Agent 工具调用已用次数",
        "t_created_at": "创建时间",
        "t_created_by": "创建人 user_id",
        "t_updated_at": "更新时间",
        "t_updated_by": "最后修改人 user_id",
    },
    "t_quota_transaction_log": {
        "t_id": "自增主键 ID",
        "t_user_id": "用户 ID",
        "t_billing_month": "账单月份 YYYY-MM",
        "t_transaction_type": "交易类型:deduct/reset/grant/purchase",
        "t_quota_type": "配额类型",
        "t_delta": "变动数量(正=增,负=减)",
        "t_balance_before": "变动前余额",
        "t_balance_after": "变动后余额",
        "t_tool_id": "关联工具 ID",
        "t_session_id": "关联会话 session_id",
        "t_trace_id": "链路追踪 ID",
        "t_created_at": "创建时间",
        "t_created_by": "创建人 user_id",
    },
    "t_image_generations": {
        "t_id": "自增主键 ID",
        "t_task_id": "任务唯一标识 UUID",
        "t_user_id": "用户 ID",
        "t_prompt": "图片生成提示词",
        "t_negative_prompt": "反向提示词",
        "t_style": "图片风格",
        "t_size": "图片尺寸",
        "t_status": "任务状态:pending/processing/completed/failed",
        "t_result_url": "生成结果 URL",
        "t_error_message": "错误信息",
        "t_model": "使用的模型",
        "t_width": "图片宽度",
        "t_height": "图片高度",
        "t_steps": "采样步数",
        "t_seed": "随机种子(-1=随机)",
        "t_session_id": "关联会话 session_id",
        "t_trace_id": "链路追踪 ID",
        "t_created_at": "创建时间",
        "t_created_by": "创建人 user_id",
        "t_updated_at": "更新时间",
        "t_updated_by": "最后修改人 user_id",
    },
    "t_upload_tasks": {
        "t_id": "自增主键 ID",
        "t_task_id": "任务唯一标识 UUID",
        "t_user_id": "用户 ID",
        "t_file_name": "文件名",
        "t_file_type": "文件类型:image/video/audio/document",
        "t_file_size": "文件大小(字节)",
        "t_content_type": "MIME 类型",
        "t_status": "任务状态:pending/uploading/completed/failed",
        "t_file_url": "文件访问 URL",
        "t_error_message": "错误信息",
        "t_session_id": "关联会话 session_id",
        "t_trace_id": "链路追踪 ID",
        "t_created_at": "创建时间",
        "t_created_by": "创建人 user_id",
        "t_updated_at": "更新时间",
        "t_updated_by": "最后修改人 user_id",
    },
}


def add_comments():
    """为数据库表和字段添加 COMMENT 注释"""
    print("=" * 60, flush=True)
    print("开始添加数据库 COMMENT 注释", flush=True)
    print("=" * 60, flush=True)

    try:
        conn = psycopg2.connect(
            host="192.168.100.119",
            port=35433,
            user="itzx",
            password="Tuoren@2026...",
            database="trai",
            connect_timeout=10,
        )
        print("数据库连接成功", flush=True)
        cur = conn.cursor()

        # 终止阻塞会话
        cur.execute("""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = 'trai'
            AND pid != pg_backend_pid()
            AND state IN ('active', 'idle in transaction')
        """)
        conn.commit()
        print("已终止阻塞会话", flush=True)

        # 添加表注释
        print("\n=== 添加表注释 ===", flush=True)
        for table, comment in TABLE_COMMENTS.items():
            cur.execute(f'COMMENT ON TABLE "{table}" IS %s', (comment,))
            conn.commit()
            print(f"  [OK] {table}: {comment}", flush=True)

        # 添加字段注释
        print("\n=== 添加字段注释 ===", flush=True)
        for table, fields in FIELD_COMMENTS.items():
            for field, comment in fields.items():
                try:
                    cur.execute(f'COMMENT ON COLUMN "{table}"."{field}" IS %s', (comment,))
                    conn.commit()
                    print(f"  [OK] {table}.{field}: {comment}", flush=True)
                except Exception as e:
                    conn.rollback()
                    print(f"  [WARN] {table}.{field}: {e}", flush=True)

        cur.close()
        conn.close()

        print("\n" + "=" * 60, flush=True)
        print("COMMENT 注释添加完成!", flush=True)
        print("=" * 60, flush=True)

    except Exception as e:
        print(f"添加 COMMENT 失败: {e}", flush=True)
        import traceback

        traceback.print_exc()
        sys.exit(1)


def main():
    """主函数"""
    add_comments()


if __name__ == "__main__":
    main()
