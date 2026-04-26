#!/usr/bin/env python
# 文件名: sync_sys_users_to_t_users.py
# 作者: wuhao
# 日期: 2026_04_21_19:25:00
# 描述: 将 public.sys_users(企业微信导入表) 同步到后端使用的 public.t_users, 用于企业微信登录绑定

from __future__ import annotations

import os
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy import select, text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.logger import get_logger
from domain.entities.user import UserRole, UserStatus
from infrastructure.database import get_database
from infrastructure.database.user_model import UserModel


@dataclass(frozen=True)
class SysUserRow:
    """sys_users 行数据"""

    id: str
    username: str
    full_name: str | None
    email: str | None
    phone: str | None
    wecom_userid: str | None
    avatar: str | None
    is_active: bool
    is_superuser: bool
    created_at: datetime | None
    updated_at: datetime | None
    source: str | None


class SyncSysUsersToTUsersScript:
    """把 sys_users 同步到 t_users, 解决企业微信登录 not_bound"""

    def __init__(self) -> None:
        self._logger = get_logger()

    @staticmethod
    def _normalize_email(username: str, email: str | None) -> str:
        val = (email or "").strip()
        if val:
            return val
        return f"{username}@wecom.local"

    @staticmethod
    def _normalize_display_name(username: str, full_name: str | None) -> str:
        val = (full_name or "").strip()
        return val or username

    @staticmethod
    def _normalize_status(is_active: bool) -> UserStatus:
        return UserStatus.ACTIVE if is_active else UserStatus.DISABLED

    @staticmethod
    def _normalize_role(is_superuser: bool) -> UserRole:
        return UserRole.ADMIN if is_superuser else UserRole.NORMAL

    @staticmethod
    def _ensure_unique_email(session: Any, base_email: str, prefer_suffix: str) -> str:
        email = base_email
        for i in range(0, 50):
            stmt = select(UserModel).where(UserModel.t_email == email)
            exists = session.scalar(stmt)
            if not exists:
                return email
            if "@" in base_email:
                local, domain = base_email.split("@", 1)
                email = f"{local}+{prefer_suffix[:8]}{'' if i == 0 else f'-{i}'}@{domain}"
            else:
                email = f"{base_email}+{prefer_suffix[:8]}{'' if i == 0 else f'-{i}'}"
        return f"{uuid.uuid4().hex}@wecom.local"

    @staticmethod
    def _ensure_unique_username(session: Any, base_username: str, prefer_suffix: str) -> str:
        username = base_username
        for i in range(0, 50):
            stmt = select(UserModel).where(UserModel.t_username == username)
            exists = session.scalar(stmt)
            if not exists:
                return username
            username = f"{base_username}_{prefer_suffix[:8]}{'' if i == 0 else f'_{i}'}"
        return f"{base_username}_{uuid.uuid4().hex[:8]}"

    def _fetch_sys_users(self, session: Any, source: str | None) -> list[SysUserRow]:
        where = "WHERE source = :source" if source else ""
        sql = text(
            f"""
            SELECT
                id::text,
                username,
                full_name,
                email,
                phone,
                wecom_userid,
                avatar,
                COALESCE(is_active, true) as is_active,
                COALESCE(is_superuser, false) as is_superuser,
                created_at,
                updated_at,
                source
            FROM public.sys_users
            {where}
            """
        )
        rows = session.execute(sql, {"source": source} if source else {}).fetchall()
        result: list[SysUserRow] = []
        for r in rows:
            result.append(
                SysUserRow(
                    id=r[0],
                    username=r[1],
                    full_name=r[2],
                    email=r[3],
                    phone=r[4],
                    wecom_userid=r[5],
                    avatar=r[6],
                    is_active=bool(r[7]),
                    is_superuser=bool(r[8]),
                    created_at=r[9],
                    updated_at=r[10],
                    source=r[11],
                )
            )
        return result

    def run(self, *, source: str = "wecom") -> dict[str, Any]:
        db = get_database()
        session = db.get_session()
        try:
            sys_users = self._fetch_sys_users(session, source)
            created = 0
            updated = 0
            skipped = 0

            for su in sys_users:
                wecom_userid = (su.wecom_userid or "").strip()
                if not wecom_userid:
                    skipped += 1
                    continue

                model = session.scalar(select(UserModel).where(UserModel.t_wecom_user_id == wecom_userid))

                display_name = self._normalize_display_name(su.username, su.full_name)
                role = self._normalize_role(su.is_superuser)
                status = self._normalize_status(su.is_active)

                base_email = self._normalize_email(su.username, su.email)
                email = self._ensure_unique_email(session, base_email, prefer_suffix=wecom_userid)

                base_username = (su.username or "").strip() or f"wecom_{wecom_userid}"
                username = self._ensure_unique_username(session, base_username, prefer_suffix=wecom_userid)

                now = datetime.now()
                created_at = su.created_at or now
                updated_at = su.updated_at or now

                if not model:
                    model = UserModel(
                        t_user_id=su.id or str(uuid.uuid4()),
                        t_username=username,
                        t_display_name=display_name,
                        t_email=email,
                        t_password_hash="WECOM_SSO_ONLY",
                        t_avatar_url=su.avatar,
                        t_mobile=su.phone,
                        t_position=None,
                        t_role=role.value,
                        t_status=status.value,
                        t_tenant_id=None,
                        t_wecom_user_id=wecom_userid,
                        t_wecom_data={"source": "sys_users", "sys_user_id": su.id, "raw_source": su.source},
                        t_created_at=created_at,
                        t_updated_at=updated_at,
                    )
                    session.add(model)
                    created += 1
                else:
                    model.t_display_name = display_name
                    model.t_email = email
                    model.t_avatar_url = su.avatar
                    model.t_mobile = su.phone
                    model.t_role = role.value
                    model.t_status = status.value
                    model.t_wecom_data = {"source": "sys_users", "sys_user_id": su.id, "raw_source": su.source}
                    model.t_deleted_at = None
                    updated += 1

            session.commit()
            self._logger.info(
                f"sync_sys_users_to_t_users done, source={source}, created={created}, updated={updated}, skipped={skipped}"
            )
            return {"created": created, "updated": updated, "skipped": skipped, "source": source}
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()


if __name__ == "__main__":
    result = SyncSysUsersToTUsersScript().run(source="wecom")
    print(result)
