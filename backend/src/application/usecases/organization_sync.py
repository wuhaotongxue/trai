#!/usr/bin/env python
# 文件名: organization_sync.py
# 作者: wuhao
# 日期: 2026_04_15
# 描述: 组织架构同步用例

from __future__ import annotations

import os
import uuid
from typing import Any

import requests
from loguru import logger
from sqlalchemy.orm import Session

FEISHU_SYNC_WEBHOOK = "https://open.feishu.cn/open-apis/bot/v2/hook/1210fc93-997c-475d-bb80-189330d8be8e"

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
        root_dept_id = int(os.getenv("WECOM_USER_SYNC_ROOT_DEPT_ID", "1"))
        fetch_child = os.getenv("WECOM_USER_SYNC_FETCH_CHILD", "true").strip().lower() in {"1", "true", "yes"}

        wecom_users = []
        try:
            wecom_users = await self._wecom_client.list_detailed_users_by_department(
                root_dept_id, fetch_child=fetch_child
            )
        except RuntimeError as e:
            if "60011" in str(e):
                logger.warning(f"获取根部门(id={root_dept_id})用户失败(权限不足), 将尝试逐个部门获取(可能耗时较长)...")
                # 降级策略: 逐个获取已同步的部门
                total_depts = len(wecom_depts)
                for i, d in enumerate(wecom_depts, 1):
                    try:
                        dept_users = await self._wecom_client.list_detailed_users_by_department(d.id, fetch_child=False)
                        wecom_users.extend(dept_users)
                        if dept_users:
                            user_names = [f"{u.name}({u.user_id})" for u in dept_users]
                            logger.info(
                                f"[{i}/{total_depts}] 拉取部门 '{d.name}' (ID:{d.id}) 成功: 发现 {len(dept_users)} 名用户 -> {', '.join(user_names)}"
                            )
                        else:
                            logger.info(f"[{i}/{total_depts}] 拉取部门 '{d.name}' (ID:{d.id}) 成功: 部门为空")
                    except RuntimeError as e2:
                        if "60020" in str(e2):
                            logger.error(f"[{i}/{total_depts}] IP 不在白名单(60020), 停止重试: {e2}")
                            break
                        # 忽略个别部门的 60011 错误
                        if "60011" not in str(e2):
                            logger.error(f"[{i}/{total_depts}] 获取部门 '{d.name}' (ID:{d.id}) 用户异常: {e2}")
                        else:
                            logger.debug(f"[{i}/{total_depts}] 跳过部门 '{d.name}' (ID:{d.id}): 无权限(60011)")
                        continue
            else:
                raise

        # 去重,因为一个用户可能在多个部门,虽然 list_detailed_users_by_department(1, True) 通常返回去重后的结果
        unique_users = {u.user_id: u for u in wecom_users}

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

        logger.info(f"用户同步完成,共 {sync_count} 个用户")

        result = {"departments": len(wecom_depts), "users": sync_count, "status": "success"}
        self._send_feishu_notification(result)
        return result

    def _send_feishu_notification(self, result: dict[str, Any]) -> None:
        """发送飞书机器人通知"""
        try:
            content = f"🏢 **组织架构同步完成**\n"
            content += f"━━━━━━━━━━━━━━━━\n"
            content += f"✅ 同步状态: {result['status']}\n"
            content += f"📂 部门总数: {result['departments']}\n"
            content += f"👥 用户总数: {result['users']}\n"

            if result.get("new_hires"):
                content += f"\n🆕 **今日入职 ({len(result['new_hires'])}人):**\n"
                content += "\n".join([f"- {u['name']} ({u['id']})" for u in result['new_hires'][:10]])
                if len(result['new_hires']) > 10:
                    content += "\n- ..."

            if result.get("resignations"):
                content += f"\n🚪 **今日离职 ({len(result['resignations'])}人):**\n"
                content += "\n".join([f"- {u['name']} ({u['id']})" for u in result['resignations'][:10]])
                if len(result['resignations']) > 10:
                    content += "\n- ..."

            payload = {
                "msg_type": "post",
                "content": {
                    "post": {
                        "zh_cn": {
                            "title": "组织架构同步报告",
                            "content": [
                                [{"tag": "text", "text": content}]
                            ]
                        }
                    }
                }
            }
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
            "avatar_url": wecom_user.avatar,
            "wecom_data": getattr(wecom_user, "raw", None),
        }
        return self._user_repo.create_or_update_by_wecom(**payload)
