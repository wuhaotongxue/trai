#!/usr/bin/env python
# 文件名: elevate_user_role.py
# 作者: wuhao
# 日期: 2026_04_22
# 描述: 将指定用户（按企业微信工号）设置为管理员

import asyncio
import os
import sys

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select

from infrastructure.database import get_database
from infrastructure.database.user_model import UserModel


async def main():
    if len(sys.argv) < 2:
        print("请提供企业微信工号。例如: python elevate_user_role.py A28441")
        return

    wecom_userid = sys.argv[1]

    # 获取数据库 session
    db = get_database()
    session = db.get_session()

    try:
        # 查询用户
        stmt = select(UserModel).where(UserModel.t_wecom_user_id == wecom_userid)
        user = session.scalar(stmt)

        if not user:
            print(f"❌ 未找到企业微信工号为 '{wecom_userid}' 的用户。请确认该用户是否已经登录或同步过。")
            return

        print(f"找到用户: {user.t_display_name} (工号: {user.t_wecom_user_id}, 当前角色: {user.t_role})")

        if user.t_role == "admin":
            print("✅ 该用户已经是管理员，无需修改。")
            return

        # 更新角色
        user.t_role = "admin"
        session.commit()
        print(f"🎉 成功将用户 '{user.t_display_name}' 的角色更新为: admin")
        print("请重新登录以获取最新的管理员 Token！")

    except Exception as e:
        print(f"更新失败: {e}")
        session.rollback()
    finally:
        session.close()


if __name__ == "__main__":
    asyncio.run(main())
