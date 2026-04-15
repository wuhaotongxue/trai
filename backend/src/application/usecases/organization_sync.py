#!/usr/bin/env python
# 文件名: organization_sync.py
# 作者: wuhao
# 日期: 2026_04_15
# 描述: 组织架构同步用例

from __future__ import annotations

import uuid
from typing import Any

from loguru import logger
from sqlalchemy.orm import Session

from domain.entities.department import Department, UserDepartmentMapping
from domain.entities.user import User, UserRole, UserStatus
from domain.interfaces.department_interfaces import IDepartmentRepository
from domain.interfaces.user_interfaces import IUserRepository
from infrastructure.agent.tools.wecom_contact import WeComContactClient


class SyncOrganizationUseCase:
    """组织架构同步用例

    负责从企业微信同步部门和用户信息到本地数据库
    """

    def __init__(
        self,
        session: Session,
        user_repo: IUserRepository,
        dept_repo: IDepartmentRepository,
    ) -> None:
        self._session = session
        self._user_repo = user_repo
        self._dept_repo = dept_repo
        self._wecom_client = WeComContactClient()

    async def execute(self) -> dict[str, Any]:
        """执行同步操作

        Returns:
            dict: 同步结果摘要
        """
        if not self._wecom_client.is_configured():
            raise RuntimeError("企业微信未配置,无法同步")

        logger.info("开始同步组织架构...")

        # 1. 同步部门
        wecom_depts = await self._wecom_client.list_departments()
        for d in wecom_depts:
            dept = Department(
                dept_id=d.id,
                name=d.name,
                parent_id=d.parent_id,
                order=d.order,
            )
            self._dept_repo.create_or_update(dept)

        logger.info(f"部门同步完成,共 {len(wecom_depts)} 个部门")

        # 2. 同步用户 (从根部门递归获取所有用户详细信息)
        # 假设根部门 ID 为 1
        wecom_users = await self._wecom_client.list_detailed_users_by_department(1, fetch_child=True)

        # 去重,因为一个用户可能在多个部门,虽然 list_detailed_users_by_department(1, True) 通常返回去重后的结果
        unique_users = {u.user_id: u for u in wecom_users}

        sync_count = 0
        for user_id, u in unique_users.items():
            # 查找或创建用户
            user = self._user_repo.get_by_wecom_user_id(u.user_id)

            if user:
                # 更新已有用户
                user.display_name = u.name
                user.mobile = u.mobile
                user.position = u.position
                user.avatar_url = u.avatar
                # user.email = u.email # 谨慎更新 email, 除非确定 WeCom 是唯一源
                # 可以在这里更新其他字段

                # 使用 repository 的 update 方法(如果有)或直接修改属性并 commit
                # 这里假设 user 是从 session 中获取的, 直接修改即可
                # 但根据 Repository 模式, 最好有 update 方法
                # 为了简单起见, 我们在 UserRepository 中添加一个 create_or_update_by_wecom
                pass
            else:
                # 创建新用户
                # 注意: 密码随机生成或留空(如果仅支持扫码登录)
                user = User(
                    username=f"wecom_{u.user_id}",
                    display_name=u.name,
                    email=u.email or f"{u.user_id}@wecom.local",
                    user_id=str(uuid.uuid4()),
                    role=UserRole.NORMAL,
                    status=UserStatus.ACTIVE,
                    wecom_user_id=u.user_id,
                    mobile=u.mobile,
                    position=u.position,
                )
                # self._user_repo.create(...)

            # 这里我们直接操作 model 可能会更方便, 但为了遵循 DDD, 我们在 repo 中处理
            # 我们调用一个统一的同步方法
            updated_user = self._sync_user_entity(u)

            # 3. 同步用户部门关联
            self._dept_repo.clear_user_mappings(updated_user.user_id)
            for dept_id in u.department:
                is_leader = False
                if hasattr(u, "is_leader_in_dept") and u.is_leader_in_dept:
                    try:
                        dept_index = list(u.department).index(dept_id)
                        is_leader = bool(u.is_leader_in_dept[dept_index])
                    except (ValueError, IndexError, TypeError):
                        is_leader = False

                mapping = UserDepartmentMapping(
                    user_id=updated_user.user_id,
                    dept_id=dept_id,
                    is_leader=is_leader,
                )
                self._dept_repo.add_user_mapping(mapping)

            sync_count += 1

        logger.info(f"用户同步完成,共 {sync_count} 个用户")

        return {"departments": len(wecom_depts), "users": sync_count, "status": "success"}

    def _sync_user_entity(self, wecom_user: Any) -> User:
        """同步单个用户信息到数据库并返回实体"""
        from sqlalchemy import select

        from infrastructure.database.user_model import UserModel

        stmt = select(UserModel).where(UserModel.t_wecom_user_id == wecom_user.user_id)
        model = self._session.scalar(stmt)

        if not model:
            # 创建
            model = UserModel(
                t_user_id=str(uuid.uuid4()),
                t_username=f"wecom_{wecom_user.user_id}",
                t_display_name=wecom_user.name,
                t_email=wecom_user.email or f"{wecom_user.user_id}@wecom.local",
                t_password_hash="WECOM_SSO_ONLY",
                t_role=UserRole.NORMAL.value,
                t_status=UserStatus.ACTIVE.value,
                t_wecom_user_id=wecom_user.user_id,
                t_mobile=wecom_user.mobile,
                t_position=wecom_user.position,
                t_avatar_url=wecom_user.avatar,
            )
            self._session.add(model)
        else:
            # 更新
            model.t_display_name = wecom_user.name
            model.t_mobile = wecom_user.mobile
            model.t_position = wecom_user.position
            model.t_avatar_url = wecom_user.avatar
            if wecom_user.email:
                model.t_email = wecom_user.email
            model.t_deleted_at = None

        self._session.commit()
        self._session.refresh(model)

        # 转换为实体返回
        from infrastructure.repositories.user_repository import UserRepository

        repo = UserRepository(self._session)
        return repo._to_entity(model)
