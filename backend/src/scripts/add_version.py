#!/usr/bin/env python
# 文件名: add_version.py
# 作者: wuhao
# 日期: 2026_05_23_17:28:12
# 描述: 自动补充的文件头说明.

"""
文件名: add_version.py
作者: wuhao
日期: 2026_04_25_04:40:00
描述: 添加客户端发布版本记录到数据库
"""

import sys
from pathlib import Path

from loguru import logger

_backend_path = Path(__file__).parent.parent / "backend"
if _backend_path.exists():
    sys.path.insert(0, str(_backend_path.resolve()))


from infrastructure.database import get_session
from infrastructure.database.models import ClientReleaseModel


def main():
    version = sys.argv[1] if len(sys.argv) > 1 else "0.1.0"

    session = get_session()
    try:
        # 检查是否已存在
        existing = session.query(ClientReleaseModel).filter_by(t_version=version).first()
        if existing:
            logger.info(f"[INFO] Version {version} already exists, activating...")
            existing.t_is_active = True
            session.commit()
            logger.info(f"[OK] Version {version} activated!")
            return

        # 创建新记录
        release = ClientReleaseModel(
            t_version=version,
            t_release_notes="Release via S3 upload script",
            t_latest_yml_key=f"releases/{version}/latest.yml",
            t_installer_exe_key=f"releases/{version}/TRAI Setup {version}.exe",
            t_created_by="system",
            t_is_active=True,
        )
        session.add(release)
        session.commit()
        logger.info(f"[OK] Version {version} added and activated!")

    except Exception as e:
        session.rollback()
        logger.error(f"[ERROR] {e}")
    finally:
        session.close()


if __name__ == "__main__":
    main()
