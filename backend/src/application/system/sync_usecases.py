#!/usr/bin/env python
# 文件名: organization_sync.py
# 作者: wuhao
# 日期: 2026_04_15
# 描述: 组织架构同步用例

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta
from typing import Any

import requests
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from domain.system.entities import Department, UserDepartmentMapping
from domain.user.entities import User, UserRole, UserStatus
from domain.interfaces.department_interfaces import IDepartmentRepository
from domain.user.interfaces import IUserRepository
from infrastructure.agent.tools.wecom_contact import WeComContactClient

FEISHU_SYNC_WEBHOOK = "https://open.feishu.cn/open-apis/bot/v2/hook/1210fc93-997c-475d-bb80-189330d8be8e"


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

        Args:
            None

        Returns:
            dict: 同步结果摘要

        Raises:
            RuntimeError: 企业微信未配置
        """
        if not self._wecom_client.is_configured():
            raise RuntimeError("企业微信未配置,无法同步")

        logger.info("开始同步组织架构...")

        # 获取同步前的所有有效用户 ID (用于计算离职)
        from infrastructure.database.user_model import UserModel

        stmt = select(UserModel.t_wecom_user_id).where(
            UserModel.t_wecom_user_id.is_not(None), UserModel.t_deleted_at.is_(None)
        )
        existing_wecom_ids = set(self._session.scalars(stmt).all())

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

        # 2. 同步用户
        root_dept_id = int(os.getenv("WECOM_USER_SYNC_ROOT_DEPT_ID", "1"))
        fetch_child = os.getenv("WECOM_USER_SYNC_FETCH_CHILD", "true").strip().lower() in {"1", "true", "yes"}

        wecom_users = []
        try:
            wecom_users = await self._wecom_client.list_detailed_users_by_department(
                root_dept_id, fetch_child=fetch_child
            )
        except RuntimeError as e:
            # ... (keep existing logic for downgrade strategy)
            if "60011" in str(e):
                # ... existing logic ...
                total_depts = len(wecom_depts)
                for i, d in enumerate(wecom_depts, 1):
                    try:
                        dept_users = await self._wecom_client.list_detailed_users_by_department(d.id, fetch_child=False)
                        wecom_users.extend(dept_users)
                    except Exception:
                        continue
            else:
                raise

        unique_users = {u.user_id: u for u in wecom_users}
        new_wecom_ids = set(unique_users.keys())

        # 计算入职和离职
        new_hires = []
        resignations = []

        # 找出新入职 (WeCom 有, DB 没)
        for uid in new_wecom_ids - existing_wecom_ids:
            u = unique_users[uid]
            new_hires.append({"id": uid, "name": u.name})

        # 找出离职 (DB 有, WeCom 没)
        resigned_ids = existing_wecom_ids - new_wecom_ids
        for uid in resigned_ids:
            # 获取用户姓名
            user_model = self._session.scalar(select(UserModel).where(UserModel.t_wecom_user_id == uid))
            if user_model:
                resignations.append({"id": uid, "name": user_model.t_display_name})
                # 软删除离职人员
                user_model.t_deleted_at = datetime.now()
                user_model.t_status = UserStatus.INACTIVE.value

        sync_count = 0
        for user_id, u in unique_users.items():
            # 查找或创建用户
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

        self._session.commit()
        logger.info(f"用户同步完成,共 {sync_count} 个用户")

        # 4. 发送通知 (飞书 & 企微)
        # 计算本周累计数据
        week_ago = datetime.now() - timedelta(days=7)
        weekly_hires = (
            self._session.scalar(
                select(func.count(UserModel.t_user_id)).where(
                    UserModel.t_created_at >= week_ago, UserModel.t_wecom_user_id.is_not(None)
                )
            )
            or 0
        )
        weekly_resigns = (
            self._session.scalar(
                select(func.count(UserModel.t_user_id)).where(
                    UserModel.t_deleted_at >= week_ago, UserModel.t_wecom_user_id.is_not(None)
                )
            )
            or 0
        )

        result = {
            "departments": len(wecom_depts),
            "users": sync_count,
            "new_hires": new_hires,
            "resignations": resignations,
            "weekly_hires": weekly_hires,
            "weekly_resigns": weekly_resigns,
            "status": "success",
        }
        self._send_feishu_notification(result)
        return result

    def _send_feishu_notification(self, result: dict[str, Any]) -> None:
        """发送飞书机器人通知 (富文本交互卡片)"""
        try:
            # 构建入离职统计文案
            hires_count = len(result.get("new_hires", []))
            resigns_count = len(result.get("resignations", []))
            weekly_hires = result.get("weekly_hires", 0)
            weekly_resigns = result.get("weekly_resigns", 0)

            card = {
                "config": {"wide_screen_mode": True},
                "header": {"title": {"tag": "plain_text", "content": "🏢 组织架构同步报告"}, "template": "blue"},
                "elements": [
                    {
                        "tag": "div",
                        "fields": [
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**同步状态:**\n✅ 成功"}},
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": f"**同步时间:**\n{datetime.now().strftime('%Y-%m-%d %H:%M')}",
                                },
                            },
                        ],
                    },
                    {
                        "tag": "div",
                        "fields": [
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": f"**部门总数:**\n{result['departments']}"},
                            },
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": f"**人员总数:**\n{result['users']}"},
                            },
                        ],
                    },
                    {"tag": "hr"},
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": f"📊 **本次同步变动:**\n- 🆕 新入职: **{hires_count}** 人\n- 🚪 已离职: **{resigns_count}** 人",
                        },
                    },
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": f"📅 **本周累计变动 (近7天):**\n- 📈 累计入职: **{weekly_hires}** 人\n- 📉 累计离职: **{weekly_resigns}** 人",
                        },
                    },
                ],
            }

            if hires_count > 0:
                hires_list = "\n".join([f"· {u['name']}" for u in result["new_hires"][:5]])
                if hires_count > 5:
                    hires_list += "\n· ..."
                card["elements"].append(
                    {"tag": "note", "elements": [{"tag": "plain_text", "content": f"本次入职名单:\n{hires_list}"}]}
                )

            payload = {"msg_type": "interactive", "card": card}

            requests.post(FEISHU_SYNC_WEBHOOK, json=payload, timeout=10)
        except Exception as e:
            logger.error(f"Failed to send Feishu notification: {e}")

    def _sync_user_entity(self, wecom_user: Any) -> User:
        """同步单个用户信息到数据库并返回实体

        Args:
            wecom_user: 企业微信用户对象

        Returns:
            User: 用户实体

        Raises:
            RuntimeError: 数据库写入失败
        """
        avatar_url = wecom_user.avatar
        if avatar_url and avatar_url.startswith("http://"):
            avatar_url = avatar_url.replace("http://", "https://", 1)

        payload = {
            "username": f"wecom_{wecom_user.user_id}",
            "display_name": wecom_user.name,
            "email": wecom_user.email or f"{wecom_user.user_id}@wecom.local",
            "user_id": str(uuid.uuid4()),
            "role": UserRole.NORMAL,
            "status": UserStatus.ACTIVE,
            "wecom_user_id": wecom_user.user_id,
            "mobile": wecom_user.mobile,
            "position": wecom_user.position,
            "avatar_url": avatar_url,
            "wecom_data": getattr(wecom_user, "raw", None),
        }
        return self._user_repo.create_or_update_by_wecom(**payload)
