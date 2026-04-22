#!/usr/bin/env python
# 文件名: wecom_contact.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: 企业微信通讯录客户端 - 用户与部门信息查询

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any

import httpx
from loguru import logger


@dataclass
class WeComUser:
    """企业微信用户信息"""

    user_id: str
    name: str
    department: list[int]
    position: str | None
    mobile: str | None
    email: str | None
    avatar: str | None
    status: int
    is_leader_in_dept: list[int]
    direct_leader: list[str]

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> WeComUser:
        return cls(
            user_id=data.get("userid", ""),
            name=data.get("name", ""),
            department=data.get("department", []),
            position=data.get("position"),
            mobile=data.get("mobile"),
            email=data.get("email"),
            avatar=data.get("avatar"),
            status=data.get("status", 0),
            is_leader_in_dept=data.get("is_leader_in_dept", []),
            direct_leader=data.get("direct_leader", []),
        )


@dataclass
class WeComDepartment:
    """企业微信部门信息"""

    id: int
    name: str
    parent_id: int
    order: int
    department_leader_userids: list[str]

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> WeComDepartment:
        return cls(
            id=data.get("id", 0),
            name=data.get("name", ""),
            parent_id=data.get("parentid", 0),
            order=data.get("order", 0),
            department_leader_userids=data.get("department_leader_userids", []),
        )


class WeComContactClient:
    """企业微信通讯录客户端

    提供用户与部门的增删改查封装,内部自动管理 access_token 缓存.
    需在环境变量或配置中设置以下字段:

        WECOM_CORP_ID       - 企业 ID
        WECOM_AGENT_ID     - 应用 AgentID
        WECOM_APP_SECRET   - 应用 Secret
        WECOM_CONTACT_SECRET - 通讯录 Secret(可选,若需通讯录权限)

    注意:使用通讯录 API 需要「通讯录」应用权限,
    若仅有「自建应用」权限请在 Agent 管理后台为应用开启通讯录权限.
    """

    _TOKEN_CACHE_KEY = "_wecom_access_token"
    _TOKEN_EXPIRES_BUFFER = 120  # 提前 120 秒刷新

    def __init__(
        self,
        corp_id: str | None = None,
        agent_id: str | None = None,
        app_secret: str | None = None,
        contact_secret: str | None = None,
        timeout: int = 15,
    ) -> None:
        self._corp_id = corp_id or os.getenv("WECOM_CORP_ID", "")
        self._agent_id = agent_id or os.getenv("WECOM_AGENT_ID", "")
        self._app_secret = app_secret or os.getenv("WECOM_APP_SECRET") or os.getenv("WECOM_SECRET", "")
        self._contact_secret = (
            contact_secret
            or os.getenv("WECOM_CONTACT_SECRET")
            or os.getenv("WECOM_CORP_SECRET")
            or self._app_secret
        )
        self._timeout = timeout

        self._token: str | None = None
        self._token_expires_at: float = 0.0

    # --------------------------------------------------------------
    # Token 管理
    # --------------------------------------------------------------

    async def _ensure_token(self) -> str:
        """确保拥有有效 access_token"""

        now = time.time()
        if self._token and now < self._token_expires_at - self._TOKEN_EXPIRES_BUFFER:
            return self._token

        secret = self._contact_secret
        if not secret:
            raise RuntimeError("WECOM_APP_SECRET 或 WECOM_CONTACT_SECRET 未配置,无法获取 access_token")

        params = {
            "corpid": self._corp_id,
            "corpsecret": secret,
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.get("https://qyapi.weixin.qq.com/cgi-bin/gettoken", params=params)
            data = resp.json()
            errcode = data.get("errcode", 0)

            if errcode != 0:
                raise RuntimeError(f"获取 access_token 失败 | errcode={errcode} | errmsg={data.get('errmsg', '')}")

            self._token = data["access_token"]
            self._token_expires_at = now + int(data.get("expires_in", 7200))
            logger.debug(f"access_token 已刷新 | expires_in={data.get('expires_in')}s")

        return self._token  # type: ignore[return-value]

    # --------------------------------------------------------------
    # 部门 API
    # --------------------------------------------------------------

    async def list_departments(self, dept_id: int | None = None) -> list[WeComDepartment]:
        """获取部门列表

        Args:
            dept_id: 部门 ID,不传则获取全量部门树

        Returns:
            list[WeComDepartment]: 部门信息列表
        """

        token = await self._ensure_token()
        params: dict[str, Any] = {"access_token": token}
        if dept_id is not None:
            params["id"] = dept_id

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.get(
                "https://qyapi.weixin.qq.com/cgi-bin/department/list",
                params=params,
            )

        data = resp.json()
        errcode = data.get("errcode", 0)
        if errcode != 0:
            raise RuntimeError(f"获取部门列表失败 | errcode={errcode} | errmsg={data.get('errmsg', '')}")

        return [WeComDepartment.from_dict(d) for d in data.get("department", [])]

    async def get_department_tree(self) -> list[dict[str, Any]]:
        """获取完整部门树(递归构建)

        Returns:
            list[dict]: 部门树形结构 [{id, name, parent_id, children: []}]
        """

        await self.list_departments()
        all_depts = await self.list_departments()

        dept_map: dict[int, dict[str, Any]] = {}
        for d in all_depts:
            dept_map[d.id] = {
                "id": d.id,
                "name": d.name,
                "parent_id": d.parent_id,
                "children": [],
            }

        roots: list[dict[str, Any]] = []
        for d in all_depts:
            node = dept_map[d.id]
            if d.parent_id == 0 or d.parent_id not in dept_map:
                roots.append(node)
            else:
                dept_map[d.parent_id]["children"].append(node)

        return roots

    # --------------------------------------------------------------
    # 授权 API
    # --------------------------------------------------------------

    async def get_user_info_by_code(self, code: str) -> dict[str, Any]:
        """通过 OAuth code 获取用户信息

        Args:
            code: 授权 code

        Returns:
            dict: 包含 UserId 等信息
        """
        token = await self._ensure_token()
        params = {"access_token": token, "code": code}

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.get("https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo", params=params)

        data = resp.json()
        errcode = data.get("errcode", 0)
        if errcode != 0:
            raise RuntimeError(f"获取授权用户信息失败 | errcode={errcode} | errmsg={data.get('errmsg', '')}")

        return data

    # --------------------------------------------------------------
    # 用户 API
    # --------------------------------------------------------------

    async def list_users_by_department(
        self,
        department_id: int,
        fetch_child: bool = True,
    ) -> list[WeComUser]:
        """获取部门下用户列表(简易信息)

        Args:
            department_id: 部门 ID
            fetch_child: 是否递归获取子部门用户

        Returns:
            list[WeComUser]: 用户信息列表
        """

        token = await self._ensure_token()
        params = {
            "access_token": token,
            "department_id": department_id,
            "fetch_child": 1 if fetch_child else 0,
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.get(
                "https://qyapi.weixin.qq.com/cgi-bin/user/simplelist",
                params=params,
            )

        data = resp.json()
        errcode = data.get("errcode", 0)
        if errcode != 0:
            raise RuntimeError(f"获取部门用户列表失败 | errcode={errcode} | errmsg={data.get('errmsg', '')}")

        return [WeComUser.from_dict(u) for u in data.get("userlist", [])]

    async def list_detailed_users_by_department(
        self,
        department_id: int,
        fetch_child: bool = True,
    ) -> list[WeComUser]:
        """获取部门下用户列表(详细信息)

        Args:
            department_id: 部门 ID
            fetch_child: 是否递归获取子部门用户

        Returns:
            list[WeComUser]: 详细用户信息列表
        """

        token = await self._ensure_token()
        params = {
            "access_token": token,
            "department_id": department_id,
            "fetch_child": 1 if fetch_child else 0,
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.get(
                "https://qyapi.weixin.qq.com/cgi-bin/user/list",
                params=params,
            )

        data = resp.json()
        errcode = data.get("errcode", 0)
        if errcode != 0:
            raise RuntimeError(f"获取部门用户详细列表失败 | errcode={errcode} | errmsg={data.get('errmsg', '')}")

        return [WeComUser.from_dict(u) for u in data.get("userlist", [])]

    async def get_user(self, user_id: str) -> WeComUser:
        """获取单个用户详情

        Args:
            user_id: 用户 ID(工号)

        Returns:
            WeComUser: 用户详情
        """

        token = await self._ensure_token()
        params = {"access_token": token, "userid": user_id}

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.get(
                "https://qyapi.weixin.qq.com/cgi-bin/user/get",
                params=params,
            )

        data = resp.json()
        errcode = data.get("errcode", 0)
        if errcode != 0:
            raise RuntimeError(f"获取用户详情失败 | errcode={errcode} | errmsg={data.get('errmsg', '')}")

        return WeComUser.from_dict(data)

    async def search_users_by_name(self, name: str, department_id: int | None = None) -> list[WeComUser]:
        """根据姓名模糊搜索用户(先获取全量再过滤,适用于小规模组织)

        Args:
            name: 姓名关键字
            department_id: 可选限定部门

        Returns:
            list[WeComUser]: 匹配的用户列表
        """

        if department_id is not None:
            all_users = await self.list_users_by_department(department_id)
        else:
            depts = await self.list_departments()
            all_users: list[WeComUser] = []
            for dept in depts:
                users = await self.list_users_by_department(dept.id)
                all_users.extend(users)

        return [u for u in all_users if name in u.name]

    # --------------------------------------------------------------
    # 辅助方法
    # --------------------------------------------------------------

    def is_configured(self) -> bool:
        """检查是否已配置企业微信凭证"""

        return bool(self._corp_id and (self._contact_secret or self._app_secret))

    def format_user_summary(self, user: WeComUser) -> str:
        """格式化用户信息为可读摘要"""

        dept_str = ",".join(str(d) for d in user.department)
        status_map = {1: "已激活", 4: "已禁用", 5: "未激活", 0: "未知"}
        status_str = status_map.get(user.status, f"未知({user.status})")

        parts = [
            f"工号:{user.user_id}",
            f"姓名:{user.name}",
            f"部门:{dept_str}",
            f"职位:{user.position or '未设置'}",
            f"手机:{user.mobile or '未设置'}",
            f"邮箱:{user.email or '未设置'}",
            f"状态:{status_str}",
        ]
        return "\n".join(parts)

    def format_department_summary(self, dept: WeComDepartment) -> str:
        """格式化部门信息为可读摘要"""

        return f"部门ID:{dept.id}\n部门名称:{dept.name}\n上级部门ID:{dept.parent_id}\n排序:{dept.order}"


__all__ = [
    "WeComContactClient",
    "WeComUser",
    "WeComDepartment",
]
