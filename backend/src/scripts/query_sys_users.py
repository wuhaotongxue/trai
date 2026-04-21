#!/usr/bin/env python
# 文件名: query_sys_users.py
# 作者: wuhao
# 日期: 2026_04_21_19:07:00
# 描述: 查询 sys_users 落库结果, 输出统计信息用于核对

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import psycopg2


class SysUsersQueryScript:
    """查询 sys_users 数据落库结果"""

    def __init__(self) -> None:
        self._load_env()

        self._host = os.getenv("POSTGRES_SERVER") or os.getenv("DB_HOST", "127.0.0.1")
        self._port = int(os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT", "5432"))
        self._user = os.getenv("POSTGRES_USER") or os.getenv("DB_USER", "postgres")
        self._password = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD", "")
        self._database = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME", "trai")

    @staticmethod
    def _load_env() -> None:
        env_path = Path(__file__).resolve().parent.parent.parent / ".env"
        if not env_path.exists():
            return
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()

    def run(self) -> dict[str, Any]:
        conn = psycopg2.connect(
            host=self._host,
            port=self._port,
            user=self._user,
            password=self._password,
            dbname=self._database,
        )
        try:
            cur = conn.cursor()

            cur.execute("SELECT COUNT(1) FROM public.sys_users")
            sys_total = cur.fetchone()[0]

            cur.execute("SELECT COUNT(1) FROM public.sys_users WHERE is_active = true")
            sys_active = cur.fetchone()[0]

            cur.execute("SELECT COUNT(1) FROM public.sys_users WHERE length(coalesce(wecom_userid, '')) > 0")
            sys_wecom_userid = cur.fetchone()[0]

            cur.execute("SELECT source, COUNT(1) FROM public.sys_users GROUP BY source ORDER BY COUNT(1) DESC")
            by_source = cur.fetchall()

            t_total: int | None
            t_wecom: int | None
            t_err: str | None
            try:
                cur.execute("SELECT COUNT(1) FROM public.t_users")
                t_total = cur.fetchone()[0]
                cur.execute("SELECT COUNT(1) FROM public.t_users WHERE length(coalesce(t_wecom_user_id, '')) > 0")
                t_wecom = cur.fetchone()[0]
                t_err = None
            except Exception as e:
                t_total = None
                t_wecom = None
                t_err = str(e)

            cur.execute(
                """
                SELECT
                    username,
                    full_name,
                    wecom_userid,
                    source,
                    is_active,
                    is_superuser
                FROM public.sys_users
                WHERE source = 'wecom'
                ORDER BY updated_at DESC NULLS LAST
                LIMIT 10
                """
            )
            sample10 = cur.fetchall()

            result: dict[str, Any] = {
                "db": f"{self._database}@{self._host}:{self._port}",
                "sys_users": {
                    "total": sys_total,
                    "active": sys_active,
                    "wecom_userid_not_empty": sys_wecom_userid,
                    "by_source": by_source,
                    "wecom_sample10": sample10,
                },
                "t_users": {
                    "total": t_total,
                    "t_wecom_user_id_not_empty": t_wecom,
                    "query_error": t_err,
                },
            }
            return result
        finally:
            conn.close()


if __name__ == "__main__":
    data = SysUsersQueryScript().run()
    print(data)
