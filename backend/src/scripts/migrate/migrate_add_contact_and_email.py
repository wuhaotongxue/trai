#!/usr/bin/env python
# 文件名: migrate_add_contact_and_email.py
# 作者: wuhao
# 日期: 2026_04_26_18:40:00
# 描述: 迁移脚本 - 添加联系我们消息表和邮件配置表

from __future__ import annotations

import os
import sys

from loguru import logger

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text

from infrastructure.database.database import get_database


def run_migration() -> None:
    """执行迁移"""
    logger.info("开始数据库迁移: 添加联系我们消息表和邮件配置表")
    logger.info("=" * 60)

    db = get_database()
    session = db.get_session()

    try:
        # 创建联系我们消息表
        logger.info("\n[1/2] 创建联系我们消息表...")
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
        logger.success("  - t_contact_messages 表创建成功")

        # 创建邮件配置表
        logger.info("\n[2/2] 创建邮件配置表...")
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
        logger.success("  - t_email_configs 表创建成功")

        # 插入默认邮件配置
        logger.info("\n[3/3] 检查默认邮件配置...")
        check_config = text("""
        SELECT COUNT(*) FROM t_email_configs WHERE t_config_name = 'contact_notify'
        """)
        result = session.execute(check_config)
        count = result.scalar()

        if count == 0:
            # 从环境变量读取邮件配置
            default_email_host = os.getenv("DEFAULT_EMAIL_HOST", "smtp.qq.com")
            default_email_port = int(os.getenv("DEFAULT_EMAIL_PORT", "465"))
            default_email_username = os.getenv("DEFAULT_EMAIL_USERNAME", "")
            default_email_password = os.getenv("DEFAULT_EMAIL_PASSWORD", "")
            default_email_from_name = os.getenv("DEFAULT_EMAIL_FROM_NAME", "TRAI 团队")
            default_email_to = os.getenv("DEFAULT_EMAIL_TO", "")

            if default_email_username and default_email_password:
                insert_default_config = text("""
                INSERT INTO t_email_configs (
                    t_config_name, t_host, t_port, t_use_ssl,
                    t_username, t_password, t_from_name,
                    t_to_emails, t_is_active, t_remark
                ) VALUES (
                    'contact_notify',
                    :host,
                    :port,
                    TRUE,
                    :username,
                    :password,
                    :from_name,
                    :to_emails,
                    TRUE,
                    '默认联系我们通知配置'
                )
                """)
                to_emails = f'["{default_email_to}"]' if default_email_to else "[]"
                session.execute(
                    insert_default_config,
                    {
                        "host": default_email_host,
                        "port": default_email_port,
                        "username": default_email_username,
                        "password": default_email_password,
                        "from_name": default_email_from_name,
                        "to_emails": to_emails,
                    },
                )
                session.commit()
                logger.success("  - 默认邮件配置插入成功")
            else:
                logger.warning("  - 未配置默认邮件环境变量,跳过默认配置插入")
        else:
            logger.info("  - 默认邮件配置已存在,跳过插入")

        logger.info("\n" + "=" * 60)
        logger.success("迁移完成!")

    except Exception as error:
        session.rollback()
        logger.error(f"\n迁移失败: {error}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    run_migration()
