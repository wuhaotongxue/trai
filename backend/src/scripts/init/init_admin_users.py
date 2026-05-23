#!/usr/bin/env python
# 文件名: init_admin_users.py
# 作者: wuhao
# 日期: 2026_05_13
# 描述: 初始化管理员用户脚本

from __future__ import annotations

import os
import sys
import uuid

# 添加 src 目录到 sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from infrastructure.database.database import get_session
from infrastructure.database.user_model import UserModel
from infrastructure.security.password import PasswordService


def create_admin_user(username: str, password: str, display_name: str):
    """创建管理员用户"""
    session = get_session()
    try:
        # 检查用户是否已存在
        query = session.query(UserModel).filter(UserModel.t_username == username)
        existing = session.scalar(query)

        if existing:
            print(f"用户 {username} 已存在，跳过创建")
            return

        # 创建密码哈希
        password_service = PasswordService()
        password_hash = password_service.hash(password)

        # 创建用户
        user = UserModel(
            t_user_id=str(uuid.uuid4()),
            t_username=username,
            t_display_name=display_name,
            t_email=f"{username}@example.com",
            t_password_hash=password_hash,
            t_role="admin",
            t_status="active",
            t_created_by="system",
        )

        session.add(user)
        session.commit()
        print(f"已创建管理员用户: {username}")
    finally:
        session.close()


def main():
    """主函数"""
    print("开始初始化管理员用户...")

    # 创建 admin 用户
    create_admin_user("admin", "Tuoren@@2026", "系统管理员")

    # 创建 wuhao 用户
    create_admin_user("wuhao", "Tuoren@@2026", "吴浩")

    print("管理员用户初始化完成!")


if __name__ == "__main__":
    main()
