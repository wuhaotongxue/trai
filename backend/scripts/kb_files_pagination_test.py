#!/usr/bin/env python
# 文件名: kb_files_pagination_test.py
# 作者: wuhao
# 日期: 2026_04_17_11:46:59
# 描述: Test knowledge base file listing pagination by admin API.

from __future__ import annotations

import asyncio
import json
import os
from typing import Any

import httpx
from loguru import logger


class KnowledgeBaseFilesPaginationTester:
    """
    知识库文件列表分页测试器.

    Args:
        无.

    Returns:
        无.

    Raises:
        无.
    """

    def __init__(self) -> None:
        """
        从环境变量初始化测试参数.

        Args:
            无.

        Returns:
            无.

        Raises:
            无.
        """
        self.api_base = os.getenv("API_BASE", "http://127.0.0.1:5666")
        self.username = os.getenv("TRAI_TEST_USERNAME", "admin")
        self.password = os.getenv("TRAI_TEST_PASSWORD", "admin123")
        self.index_id = os.getenv("TRAI_TEST_KB_ID", "")
        self.page_size = int(os.getenv("TRAI_TEST_PAGE_SIZE", "10"))
        self.expect_total = int(os.getenv("TRAI_TEST_EXPECT_TOTAL", "0"))
        self.timeout_seconds = float(os.getenv("TRAI_TEST_TIMEOUT", "20"))
        self.health_timeout_seconds = float(os.getenv("TRAI_TEST_HEALTH_TIMEOUT", "5"))

    async def _check_health(self, client: httpx.AsyncClient) -> None:
        """
        登录前检查后端健康状态.

        Args:
            client: HTTP 异步客户端.

        Returns:
            无.

        Raises:
            RuntimeError: 后端健康检查失败时抛出.
        """
        health_url = f"{self.api_base}/api/system/health"
        try:
            response = await client.get(health_url, timeout=self.health_timeout_seconds)
            response.raise_for_status()
        except Exception as exc:
            raise RuntimeError("Backend health check failed") from exc

    async def _login_and_get_token(self, client: httpx.AsyncClient) -> str:
        """
        登录并返回访问令牌.

        Args:
            client: HTTP 异步客户端.

        Returns:
            str: Access token.

        Raises:
            RuntimeError: 登录响应不符合预期时抛出.
        """
        login_url = f"{self.api_base}/api/auth/login"
        payload = {"username": self.username, "password": self.password}
        response = await client.post(login_url, json=payload)
        response.raise_for_status()
        data = response.json()
        token = data.get("access_token")
        if not token:
            raise RuntimeError("Login success but access_token missing")
        return token

    async def _list_index_files(
        self,
        client: httpx.AsyncClient,
        token: str,
        index_id: str,
        page_number: int | None,
        page_size: int | None,
    ) -> dict[str, Any]:
        """
        调用知识库文件列表接口.

        Args:
            client: HTTP 异步客户端.
            token: 访问令牌.
            index_id: 知识库 ID.
            page_number: 页码.
            page_size: 每页数量.

        Returns:
            dict[str, Any]: JSON 响应对象.

        Raises:
            RuntimeError: 响应不是对象时抛出.
        """
        url = f"{self.api_base}/api/admin/knowledge_base/indices/{index_id}/files"
        params: dict[str, Any] = {}
        if page_number is not None:
            params["page_number"] = page_number
        if page_size is not None:
            params["page_size"] = page_size
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict):
            raise RuntimeError("Unexpected response type")
        return data

    @staticmethod
    def _extract_items_count(payload: dict[str, Any]) -> int:
        """
        提取 items 数量.

        Args:
            payload: 响应对象.

        Returns:
            int: items 数量.

        Raises:
            无.
        """
        items = payload.get("items")
        return len(items) if isinstance(items, list) else 0

    async def run(self) -> int:
        """
        执行分页测试.

        Args:
            无.

        Returns:
            int: 退出码.

        Raises:
            无.
        """
        if not self.index_id:
            logger.error("Missing env TRAI_TEST_KB_ID")
            return 1

        timeout = httpx.Timeout(connect=5.0, read=self.timeout_seconds, write=10.0, pool=5.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            await self._check_health(client)
            token = await self._login_and_get_token(client)

            logger.info("Test index files pagination, index_id={}, page_size={}", self.index_id, self.page_size)

            all_payload = await self._list_index_files(client, token, self.index_id, None, self.page_size)
            all_count = self._extract_items_count(all_payload)
            total = all_payload.get("total")
            logger.info("All items count={}, total={}", all_count, total)

            page1 = await self._list_index_files(client, token, self.index_id, 1, self.page_size)
            page1_count = self._extract_items_count(page1)
            page1_total = page1.get("total")
            logger.info("Page1 count={}", page1_count)

            page2 = await self._list_index_files(client, token, self.index_id, 2, self.page_size)
            page2_count = self._extract_items_count(page2)
            page2_total = page2.get("total")
            logger.info("Page2 count={}", page2_count)

            if all_count <= self.page_size:
                logger.error("Expected more than one page, got all_count={}", all_count)
                logger.info("payload={}", json.dumps(all_payload, ensure_ascii=False)[:5000])
                return 1

            if page2_count == 0:
                logger.error("Expected non-empty page2, got 0")
                logger.info("payload={}", json.dumps(page2, ensure_ascii=False)[:5000])
                return 1

            if isinstance(total, int) and total != all_count:
                logger.warning("total not equal items length, total={}, items={}", total, all_count)

            if self.expect_total > 0 and all_count != self.expect_total:
                logger.error("Total mismatch, expect_total={}, got={}", self.expect_total, all_count)
                return 1

            if self.expect_total > 0:
                if page1_total != self.expect_total:
                    logger.error("Page1 total mismatch, expect_total={}, got={}", self.expect_total, page1_total)
                    logger.info("payload={}", json.dumps(page1, ensure_ascii=False)[:5000])
                    return 1
                if page2_total != self.expect_total:
                    logger.error("Page2 total mismatch, expect_total={}, got={}", self.expect_total, page2_total)
                    logger.info("payload={}", json.dumps(page2, ensure_ascii=False)[:5000])
                    return 1

        logger.info("OK")
        return 0

    @staticmethod
    def main() -> None:
        """
        脚本入口.

        Args:
            无.

        Returns:
            无.

        Raises:
            SystemExit: 抛出退出码.
        """
        code = asyncio.run(KnowledgeBaseFilesPaginationTester().run())
        raise SystemExit(code)


if __name__ == "__main__":
    KnowledgeBaseFilesPaginationTester.main()
