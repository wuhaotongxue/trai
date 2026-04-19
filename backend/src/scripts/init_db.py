#!/usr/bin/env python
# 文件名: init_db.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: 数据库初始化脚本
# 用法:
#   python -m scripts.init_db                    # 初始化数据库和表结构
#   python -m scripts.init_db --create-admin    # 创建管理员账户
#   python -m scripts.init_db --reset          # 重置数据库(危险!)
#   python -m scripts.init_db --help           # 查看帮助

from __future__ import annotations

import argparse
import os
import sys
import uuid
from datetime import datetime

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from loguru import logger
from sqlalchemy import text

from infrastructure.database.database import get_database
from infrastructure.database.models import UserModel
from infrastructure.security.password import PasswordService


def upgrade_database_schema() -> None:
    """升级数据库表结构(仅做幂等的增量补齐,避免因字段缺失导致接口 500)"""
    db = get_database()
    session = db.get_session()

    try:
        session.execute(text('ALTER TABLE "t_users" ADD COLUMN IF NOT EXISTS t_mobile VARCHAR(32)'))
        session.execute(text('ALTER TABLE "t_users" ADD COLUMN IF NOT EXISTS t_position VARCHAR(128)'))
        session.commit()
        logger.info("数据库表结构增量升级完成")
    except Exception as e:
        session.rollback()
        logger.error(f"数据库表结构增量升级失败: {str(e)}")
        raise
    finally:
        session.close()


def init_database() -> None:
    """初始化数据库(创建表结构)"""
    logger.info("开始初始化数据库...")

    db = get_database()
    db.create_tables()
    upgrade_database_schema()

    logger.info("数据库表结构创建完成")


def create_admin_user(
    username: str = None,
    password: str = None,
    email: str = None,
    display_name: str = "管理员",
) -> None:
    """创建管理员账户

    Args:
        username: 用户名 (从环境变量 ADMIN_USERNAME 读取，默认 admin)
        password: 密码 (从环境变量 ADMIN_PASSWORD 读取)
        email: 邮箱 (从环境变量 ADMIN_EMAIL 读取)
        display_name: 显示名称
    """
    import os

    username = username or os.getenv("ADMIN_USERNAME", "admin")
    password = password or os.getenv("ADMIN_PASSWORD")
    email = email or os.getenv("ADMIN_EMAIL", "admin@example.com")

    if not password:
        logger.error("未设置 ADMIN_PASSWORD 环境变量，请先设置管理员密码")
        logger.info("示例: ADMIN_PASSWORD=YourSecurePassword python -m scripts.init_db --create-admin")
        return

    logger.info(f"开始创建管理员账户: {username}")

    db = get_database()
    session = db.get_session()

    try:
        # 检查是否已存在管理员
        result = session.execute(
            text("SELECT t_id FROM t_users WHERE t_username = :username AND t_deleted_at IS NULL"),
            {"username": username},
        )
        existing = result.fetchone()

        if existing:
            logger.warning(f"管理员账户 {username} 已存在,跳过创建")
            return

        # 生成密码哈希
        password_service = PasswordService()
        password_hash = password_service.hash(password)

        # 创建管理员
        user_id = str(uuid.uuid4())
        now = datetime.now()

        admin = UserModel(
            t_user_id=user_id,
            t_username=username,
            t_display_name=display_name,
            t_email=email,
            t_password_hash=password_hash,
            t_role="admin",
            t_status="active",
            t_created_at=now,
            t_updated_at=now,
        )

        session.add(admin)
        session.commit()

        logger.info("管理员账户创建成功!")
        logger.info(f"  用户名: {username}")
        logger.info(f"  邮箱: {email}")
        logger.info("  请尽快修改默认密码!")

    except Exception as e:
        session.rollback()
        logger.error(f"创建管理员账户失败: {str(e)}")
        raise
    finally:
        session.close()


def reset_database() -> None:
    """重置数据库(删除所有表并重新创建)"""
    logger.warning("开始重置数据库...")

    db = get_database()
    db.drop_tables()
    db.create_tables()

    logger.info("数据库重置完成")


def show_tables() -> None:
    """显示数据库中的表"""
    db = get_database()
    session = db.get_session()

    try:
        result = session.execute(
            text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        )
        tables = result.fetchall()

        if not tables:
            logger.info("数据库中没有表")
            return

        logger.info("数据库中的表:")
        for table in tables:
            table_name = table[0]
            count_result = session.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
            count = count_result.fetchone()[0]
            logger.info(f"  - {table_name}: {count} 条记录")

    finally:
        session.close()


def show_users() -> None:
    """显示所有用户"""
    db = get_database()
    session = db.get_session()

    try:
        result = session.execute(
            text("""
            SELECT t_user_id, t_username, t_email, t_role, t_status, t_created_at
            FROM t_users
            WHERE t_deleted_at IS NULL
            ORDER BY t_created_at DESC
        """)
        )
        users = result.fetchall()

        if not users:
            logger.info("数据库中没有用户")
            return

        logger.info("用户列表:")
        for user in users:
            logger.info(f"  - {user[1]} ({user[2]}) - {user[3]} - {user[4]}")

    finally:
        session.close()


def main() -> None:
    """主函数"""
    parser = argparse.ArgumentParser(
        description="TRAI 数据库初始化脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python -m scripts.init_db                    # 初始化数据库
  ADMIN_PASSWORD=YourSecurePassword python -m scripts.init_db --create-admin  # 创建管理员账户(必须设置密码)
  python -m scripts.init_db --show-tables    # 显示所有表
  python -m scripts.init_db --show-users     # 显示所有用户
  python -m scripts.init_db --reset          # 重置数据库(危险!)
        """,
    )

    parser.add_argument(
        "--create-admin",
        action="store_true",
        help="创建管理员账户",
    )
    parser.add_argument(
        "--show-tables",
        action="store_true",
        help="显示数据库中的表",
    )
    parser.add_argument(
        "--show-users",
        action="store_true",
        help="显示所有用户",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="重置数据库(删除所有数据)",
    )
    parser.add_argument(
        "--admin-username",
        default=None,
        help="管理员用户名(从环境变量 ADMIN_USERNAME 读取)",
    )
    parser.add_argument(
        "--admin-password",
        default=None,
        help="管理员密码(必须从环境变量 ADMIN_PASSWORD 读取)",
    )
    parser.add_argument(
        "--admin-email",
        default=None,
        help="管理员邮箱(从环境变量 ADMIN_EMAIL 读取)",
    )

    args = parser.parse_args()

    # 配置日志
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{message}</level>",
        level="INFO",
    )

    if args.reset:
        reset_database()
        return

    if args.show_tables:
        show_tables()
        return

    if args.show_users:
        show_users()
        return

    if args.create_admin:
        create_admin_user(
            username=args.admin_username,
            password=args.admin_password,
            email=args.admin_email,
        )
        return

    # 默认行为:初始化数据库
    init_database()


if __name__ == "__main__":
    main()
