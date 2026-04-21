#!/usr/bin/env python
# 文件名: sync_wecom_users.py
# 作者: wuhao
# 日期: 2026_04_21_17:21:57
# 描述: 企业微信用户同步脚本, 用于从企业微信同步用户到本地数据库

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from typing import Any

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from application.usecases.organization_sync import SyncOrganizationUseCase
from core.logger import get_logger
from infrastructure.database import get_database
from infrastructure.repositories.department_repository import DepartmentRepository
from infrastructure.repositories.user_repository import UserRepository


class WeComUserSyncScript:
    """企业微信用户同步脚本

    提供命令行入口, 支持手动触发组织架构同步
    """

    def __init__(self, department_id: int, fetch_child: bool) -> None:
        """初始化脚本

        Args:
            department_id: 同步起始部门 ID
            fetch_child: 是否递归同步子部门

        Returns:
            None

        Raises:
            ValueError: 参数不合法
        """
        if department_id <= 0:
            raise ValueError("department_id 必须大于 0")
        self._department_id = department_id
        self._fetch_child = fetch_child
        self._logger = get_logger()

    def _prepare_env(self) -> None:
        """准备同步所需环境变量

        Args:
            None

        Returns:
            None

        Raises:
            RuntimeError: 关键配置缺失
        """
        if not os.getenv("WECOM_APP_SECRET") and os.getenv("WECOM_SECRET"):
            os.environ["WECOM_APP_SECRET"] = os.getenv("WECOM_SECRET", "")
        os.environ["WECOM_USER_SYNC_ROOT_DEPT_ID"] = str(self._department_id)
        os.environ["WECOM_USER_SYNC_FETCH_CHILD"] = "true" if self._fetch_child else "false"

    async def run(self) -> dict[str, Any]:
        """执行同步流程

        Args:
            None

        Returns:
            dict[str, Any]: 同步结果摘要

        Raises:
            RuntimeError: 企业微信配置缺失
        """
        self._prepare_env()
        session = get_database().get_session()
        try:
            user_repo = UserRepository(session)
            dept_repo = DepartmentRepository(session)
            usecase = SyncOrganizationUseCase(session, user_repo, dept_repo)
            result = await usecase.execute()
            self._logger.info(f"同步完成, 部门 {result.get('departments')} 个, 用户 {result.get('users')} 个")
            return result
        finally:
            session.close()

    @classmethod
    def from_cli(cls) -> WeComUserSyncScript:
        """从命令行参数构建脚本实例

        Args:
            None

        Returns:
            WeComUserSyncScript: 脚本实例

        Raises:
            SystemExit: 参数解析失败
        """
        parser = argparse.ArgumentParser(description="企业微信用户同步脚本")
        parser.add_argument("--department-id", type=int, default=1, help="同步起始部门 ID")
        parser.add_argument(
            "--fetch-child",
            action="store_true",
            default=True,
            help="是否递归同步子部门",
        )
        args = parser.parse_args()
        return cls(department_id=args.department_id, fetch_child=args.fetch_child)


if __name__ == "__main__":
    script = WeComUserSyncScript.from_cli()
    asyncio.run(script.run())
