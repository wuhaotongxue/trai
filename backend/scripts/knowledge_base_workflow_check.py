#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: knowledge_base_workflow_check.py
# 作者: wuhao
# 日期: 2026_04_16_13:51:12
# 描述: 知识库全流程自测脚本, 覆盖列表, 新建, 上传, 重命名, 删除等操作

from __future__ import annotations

import argparse
import os
import sys
import time
import uuid
from typing import Any

import httpx


class KnowledgeBaseWorkflowCheck:
    def __init__(
        self,
        base_url: str,
        username: str,
        password: str,
        timeout: float,
        keep_resources: bool,
        print_raw: bool,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._username = username
        self._password = password
        self._timeout = timeout
        self._keep_resources = keep_resources
        self._print_raw = print_raw
        self._client = httpx.Client(timeout=self._timeout)

    def _url(self, path: str) -> str:
        p = path if path.startswith("/") else f"/{path}"
        return f"{self._base_url}{p}"

    def _post(self, path: str, json: dict[str, Any], headers: dict[str, str] | None = None) -> httpx.Response:
        return self._client.post(self._url(path), json=json, headers=headers)

    def _get(self, path: str, headers: dict[str, str] | None = None, params: dict[str, Any] | None = None) -> httpx.Response:
        return self._client.get(self._url(path), headers=headers, params=params)

    def _put(self, path: str, json: dict[str, Any], headers: dict[str, str] | None = None) -> httpx.Response:
        return self._client.put(self._url(path), json=json, headers=headers)

    def _delete(self, path: str, headers: dict[str, str] | None = None) -> httpx.Response:
        return self._client.delete(self._url(path), headers=headers)

    def _assert_ok(self, resp: httpx.Response, hint: str) -> dict[str, Any]:
        if resp.status_code < 200 or resp.status_code >= 300:
            raise RuntimeError(f"{hint} failed, status={resp.status_code}, body={resp.text}")
        data = resp.json() if resp.text else {}
        if isinstance(data, dict) and data.get("code") and data.get("code") != 200:
            raise RuntimeError(f"{hint} failed, body={data}")
        return data if isinstance(data, dict) else {"data": data}

    def login(self) -> str:
        resp = self._post(
            "/api/auth/login",
            json={"username": self._username, "password": self._password},
        )
        data = self._assert_ok(resp, "login")
        token = data.get("access_token") or data.get("data", {}).get("access_token")
        if not token:
            raise RuntimeError(f"login missing token, body={data}")
        return str(token)

    def _preview_items(self, items: list[Any], key_candidates: list[str], limit: int = 6) -> None:
        def pick(item: Any) -> str:
            if not isinstance(item, dict):
                return str(item)
            for k in key_candidates:
                if k in item and item.get(k) is not None:
                    return str(item.get(k))
            return str(item)[:120]

        for i, item in enumerate(items[:limit], start=1):
            print(f"  - {i}. {pick(item)}")

    def run(self) -> None:
        print(f"API_BASE={self._base_url}")
        token = self.login()
        headers = {"Authorization": f"Bearer {token}"}

        print("1) list categories")
        categories = self._assert_ok(self._get("/api/admin/knowledge_base/categories", headers=headers), "list categories")
        cat_items = categories.get("items", [])
        print(f"categories items={len(cat_items)}")
        self._preview_items(cat_items, ["category_name", "categoryName", "name", "category_id", "categoryId", "id"])
        if self._print_raw:
            print("categories raw:")
            print(categories.get("raw"))

        print("2) list indices")
        indices = self._assert_ok(self._get("/api/admin/knowledge_base/indices", headers=headers), "list indices")
        idx_items = indices.get("items", [])
        print(f"indices items={len(idx_items)}")
        self._preview_items(idx_items, ["index_name", "indexName", "name", "index_id", "indexId", "id"])
        if self._print_raw:
            print("indices raw:")
            print(indices.get("raw"))

        suffix = uuid.uuid4().hex[:8]
        index_name = f"kb_{suffix}"[:20]
        file_name = f"init_{suffix}.md"
        content = f"# KB {suffix}\n\n- created_at: {time.time()}\n"

        print("3) create knowledge base via demo_create")
        created = self._assert_ok(
            self._post(
                "/api/admin/knowledge_base/demo_create",
                json={"index_name": index_name, "file_name": file_name, "content": content},
                headers=headers,
            ),
            "demo_create",
        )
        index_id = str(created["index_id"])
        first_file_id = str(created["file_id"])
        print(f"created index_id={index_id}, file_id={first_file_id}, job_status={created.get('job_status')}")

        print("4) list index files")
        files_resp = self._assert_ok(
            self._get(f"/api/admin/knowledge_base/indices/{index_id}/files", headers=headers),
            "list index files",
        )
        file_items = files_resp.get("items", [])
        print(f"files items={len(file_items)}")
        self._preview_items(file_items, ["file_name", "fileName", "document_name", "documentName", "name", "file_id", "fileId", "id"])

        print("5) upload text to index")
        upload = self._assert_ok(
            self._post(
                f"/api/admin/knowledge_base/indices/{index_id}/files/upload_text",
                json={"file_name": f"more_{suffix}.md", "content": "# More\n\n- hello\n"},
                headers=headers,
            ),
            "upload_text_to_index",
        )
        second_file_id = str(upload["file_id"])
        print(f"uploaded file_id={second_file_id}, job_status={upload.get('job_status')}")

        print("6) rename index")
        new_index_name = f"kb_{suffix}_renamed"[:20]
        renamed = self._assert_ok(
            self._put(
                f"/api/admin/knowledge_base/indices/{index_id}",
                json={"index_name": new_index_name},
                headers=headers,
            ),
            "rename index",
        )
        print(f"renamed index_name={renamed.get('index_name')}")

        print("7) delete uploaded file")
        deleted_file = self._assert_ok(
            self._delete(f"/api/admin/knowledge_base/indices/{index_id}/files/{second_file_id}", headers=headers),
            "delete index file",
        )
        print(f"delete file success={deleted_file.get('success')}")

        if self._keep_resources:
            print("8) delete index skipped (KEEP_RESOURCES=1)")
        else:
            print("8) delete index")
            deleted_index = self._assert_ok(
                self._delete(f"/api/admin/knowledge_base/indices/{index_id}", headers=headers),
                "delete index",
            )
            print(f"delete index success={deleted_index.get('success')}")

        print("OK")


def main() -> int:
    try:
        parser = argparse.ArgumentParser(description="知识库全流程自测脚本")
        parser.add_argument("--base", default="http://127.0.0.1:5666", help="后端地址, 例如 http://127.0.0.1:5666")
        parser.add_argument("--username", default="admin", help="管理员用户名")
        parser.add_argument("--password", default="admin123", help="管理员密码")
        parser.add_argument("--timeout", type=float, default=30.0, help="请求超时(秒)")
        parser.add_argument("--keep_resources", action="store_true", help="不删除创建的知识库与文件")
        parser.add_argument("--print_raw", action="store_true", help="打印原始响应, 用于排查字段变化")
        args = parser.parse_args()

        KnowledgeBaseWorkflowCheck(
            base_url=args.base,
            username=args.username,
            password=args.password,
            timeout=args.timeout,
            keep_resources=args.keep_resources,
            print_raw=args.print_raw,
        ).run()
        return 0
    except Exception as e:
        print(str(e))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
