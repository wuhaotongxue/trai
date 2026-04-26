#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: migrate_add_contact_and_email.py
# 作者: wuhao
# 日期: 2026_04_26_18:40:00
# 描述: 迁移脚本 - 添加联系我们消息表和邮件配置表

from __future__ import annotations

import os
import sys

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from infrastructure.database.database import get_database


def run_migration() -> None:
    """执行迁移"""
    print("开始数据库迁移: 添加联系我们消息表和邮件配置表")
    print("=" * 60)

    db = get_database()
    session = db.get_session()

    try:
        # 创建联系我们消息表
        print("\n[1/2] 创建联系我们消息表...")
        create_contact_table = text("""
        CREATE TABLE IF NOT EXISTS t_contact_messages (
            t_id BIGSERIAL PRIMARY KEY,
            t_name VARCHAR(100) NOT NULL,
            t_email VARCHAR(255),
            t_phone VARCHAR(50),
            t_company VARCHAR(200),
            t_type VARCHAR(50) NOT NULL DEFAULT 'other',
            t_content VARCHAR(500) NOT NULL,
            t_attachment_urls JSONB DEFAULT '[]'::jsonb,
            t_status VARCHAR(20) NOT NULL DEFAULT 'pending',
            t_reply_note TEXT,
            t_ip_address VARCHAR(50),
            t_user_agent VARCHAR(500),
            t_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            t_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        session.execute(create_contact_table)
        session.commit()
        print("  - t_contact_messages 表创建成功")

        # 创建邮件配置表
        print("\n[2/2] 创建邮件配置表...")
        create_email_table = text("""
        CREATE TABLE IF NOT EXISTS t_email_configs (
            t_id BIGSERIAL PRIMARY KEY,
            t_config_name VARCHAR(100) UNIQUE NOT NULL,
            t_host VARCHAR(255) NOT NULL,
            t_port INTEGER NOT NULL,
            t_use_ssl BOOLEAN DEFAULT TRUE NOT NULL,
            t_username VARCHAR(255) NOT NULL,
            t_password VARCHAR(255) NOT NULL,
            t_from_name VARCHAR(100) NOT NULL,
            t_to_emails JSONB DEFAULT '[]'::jsonb,
            t_is_active BOOLEAN DEFAULT TRUE NOT NULL,
            t_remark TEXT,
            t_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            t_created_by VARCHAR(64),
            t_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            t_updated_by VARCHAR(64)
        );
        """)
        session.execute(create_email_table)
        session.commit()
        print("  - t_email_configs 表创建成功")

        # 插入默认邮件配置
        print("\n[3/3] 插入默认邮件配置...")
        check_config = text("""
        SELECT COUNT(*) FROM t_email_configs WHERE t_config_name = 'contact_notify'
        """)
        result = session.execute(check_config)
        count = result.scalar()

        if count == 0:
            insert_default_config = text("""
            INSERT INTO t_email_configs (
                t_config_name, t_host, t_port, t_use_ssl,
                t_username, t_password, t_from_name,
                t_to_emails, t_is_active, t_remark
            ) VALUES (
                'contact_notify',
                'smtp.qq.com',
                465,
                TRUE,
                '1069461929@qq.com',
                'fkcljcbtwpyhbddi',
                'TRAI 团队',
                '["1069461929@qq.com"]'::jsonb,
                TRUE,
                '默认联系我们通知配置'
            )
            """)
            session.execute(insert_default_config)
            session.commit()
            print("  - 默认邮件配置插入成功")
        else:
            print("  - 默认邮件配置已存在,跳过插入")

        print("\n" + "=" * 60)
        print("迁移完成!")

    except Exception as error:
        session.rollback()
        print(f"\n迁移失败: {error}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    run_migration()
