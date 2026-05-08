#!/usr/bin/env python
"""
文件名: activate_version.py
作者: wuhao
日期: 2026_04_25_04:40:00
描述: 激活客户端发布版本
"""

import sys
from pathlib import Path

# 确保 backend 路径
_backend_path = Path(__file__).parent.parent / "backend"
if _backend_path.exists():
    sys.path.insert(0, str(_backend_path.resolve()))

from sqlalchemy import update

from infrastructure.database import get_session
from infrastructure.database.models import ClientReleaseModel


def main():
    version = sys.argv[1] if len(sys.argv) > 1 else input("Enter version to activate: ")

    session = get_session()
    try:
        # 先取消所有版本的激活状态
        session.execute(
            update(ClientReleaseModel).where(ClientReleaseModel.t_is_active == True).values(t_is_active=False)
        )

        # 激活指定版本
        result = session.execute(
            update(ClientReleaseModel).where(ClientReleaseModel.t_version == version).values(t_is_active=True)
        )

        if result.rowcount > 0:
            session.commit()
            print(f"[OK] Version {version} activated!")
        else:
            print(f"[ERROR] Version {version} not found")

    except Exception as e:
        session.rollback()
        print(f"[ERROR] {e}")
    finally:
        session.close()


if __name__ == "__main__":
    main()
