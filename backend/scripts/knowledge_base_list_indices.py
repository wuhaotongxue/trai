#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: knowledge_base_list_indices.py
# 作者: wuhao
# 日期: 2026_04_16_14:02:01
# 描述: 知识库列表自测脚本, 登录后拉取所有知识库并打印名称与 ID

from __future__ import annotations

import os
from typing import Any

import httpx


class KnowledgeBaseListIndicesCheck:
    def __init__(self) -> None:
        self._base_url = os.getenv("API_BASE", "http://127.0.0.1:5666").rstrip("/")
        self._username = os.getenv("ADMIN_USERNAME", "admin")
        self._password = os.getenv("ADMIN_PASSWORD", "admin123")
        self._timeout = float(os.getenv("API_TIMEOUT", "30"))
        self._print_raw = os.getenv("PRINT_RAW", "0") == "1"
        self._client = httpx.Client(timeout=self._timeout)

    def _url(self, path: str) -> str:
        p = path if path.startswith("/") else f"/{path}"
        return f"{self._base_url}{p}"

    def _assert_ok(self, resp: httpx.Response, hint: str) -> dict[str, Any]:
        if resp.status_code < 200 or resp.status_code >= 300:
            raise RuntimeError(f"{hint} failed, status={resp.status_code}, body={resp.text}")
        data = resp.json() if resp.text else {}
        if isinstance(data, dict) and data.get("code") and data.get("code") != 200:
            raise RuntimeError(f"{hint} failed, body={data}")
        return data if isinstance(data, dict) else {"data": data}

    def _login(self) -> str:
        resp = self._client.post(
            self._url("/api/auth/login"),
            json={"username": self._username, "password": self._password},
        )
        data = self._assert_ok(resp, "login")
        token = data.get("access_token") or data.get("data", {}).get("access_token")
        if not token:
            raise RuntimeError(f"login missing token, body={data}")
        return str(token)

    def _collect_dicts(self, data: Any) -> list[dict[str, Any]]:
        if isinstance(data, list):
            out: list[dict[str, Any]] = []
            for x in data:
                out.extend(self._collect_dicts(x))
            return out

        if isinstance(data, dict):
            out = [data]
            for v in data.values():
                out.extend(self._collect_dicts(v))
            return out

        return []

    def run(self) -> None:
        print(f"API_BASE={self._base_url}")
        token = self._login()
        headers = {"Authorization": f"Bearer {token}"}

        resp = self._client.get(self._url("/api/admin/knowledge_base/indices"), headers=headers)
        data = self._assert_ok(resp, "list indices")

        items: list[Any] = []
        if isinstance(data.get("items"), list):
            items = data["items"]
        if not items and isinstance(data.get("data"), list):
            items = data["data"]
        if not items and isinstance(data.get("data"), dict) and isinstance(data["data"].get("items"), list):
            items = data["data"]["items"]

        if not items and self._print_raw:
            print("indices empty, raw:")
            print(data.get("raw"))

        indices: list[tuple[str, str]] = []
        dicts = self._collect_dicts(items if items else data)
        for d in dicts:
            index_id = d.get("index_id") or d.get("indexId") or d.get("id")
            index_name = d.get("index_name") or d.get("indexName") or d.get("name")
            if index_id and index_name:
                pair = (str(index_id), str(index_name))
                if pair not in indices:
                    indices.append(pair)

        print(f"total={len(indices)}")
        for i, (index_id, index_name) in enumerate(indices, start=1):
            print(f"{i}. {index_name} ({index_id})")


def main() -> int:
    try:
        KnowledgeBaseListIndicesCheck().run()
        return 0
    except Exception as e:
        print(str(e))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
