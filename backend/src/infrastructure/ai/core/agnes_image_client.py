#!/usr/bin/env python
# 文件名: agnes_image_client.py
# 作者: wuhao
# 日期: 2026_06_01_16:05:56
# 描述: Agnes AI 图片生成客户端，包含自动回退到 ModelScopeClient 的逻辑

from __future__ import annotations

import os
from typing import Any

from loguru import logger
from openai import OpenAI

from infrastructure.ai.core.modelscope_client import ModelScopeClient


class AgnesImageClient:
    """Agnes AI 图片生成客户端，带有本地回退机制"""

    def __init__(self) -> None:
        self._api_key = os.getenv("AGNES_API_KEY", "")
        self._base_url = os.getenv("AGNES_BASE_URL", "https://apihub.agnes-ai.com/v1")
        self._fallback_client = ModelScopeClient()
        self._is_healthy = False
        self._tested = False

    def _test_connection(self) -> bool:
        """测试 Agnes API 连通性"""
        if self._tested:
            return self._is_healthy

        self._tested = True
        if not self._api_key:
            logger.warning("未配置 AGNES_API_KEY，将使用本地/默认回退方案")
            self._is_healthy = False
            return False

        try:
            client = OpenAI(api_key=self._api_key, base_url=self._base_url)
            # 发送一个极轻量的请求测试连通性，比如列出模型
            client.models.list()
            self._is_healthy = True
            logger.info("Agnes AI 图片生成服务连通性测试通过 ✅")
            return True
        except Exception as e:
            logger.warning(f"Agnes AI 连通性测试失败，将回退到本地模型: {e}")
            self._is_healthy = False
            return False

    async def generate(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
        user_id: str | None = None,
        tenant_id: str | None = None,
    ) -> dict[str, Any]:
        """
        生成图片，支持回退
        """
        if self._test_connection():
            try:
                logger.info("使用 Agnes AI (agnes-image-2.0-flash) 生成图片...")
                client = OpenAI(api_key=self._api_key, base_url=self._base_url)

                # 同步调用转异步，避免阻塞
                import asyncio

                loop = asyncio.get_running_loop()

                def _call_api():
                    return client.images.generate(
                        model="agnes-image-2.0-flash",
                        prompt=prompt,
                        n=1,
                        size=f"{width}x{height}" if width and height else "1024x1024",
                    )

                response = await loop.run_in_executor(None, _call_api)

                if response.data and len(response.data) > 0:
                    image_url = response.data[0].url
                    logger.info(f"Agnes AI 图片生成成功: {image_url}")
                    return {"image_url": image_url, "image_base64": None, "error": None}
                else:
                    raise Exception("Agnes API 返回数据为空")
            except Exception as e:
                logger.error(f"Agnes AI 生成失败，执行回退: {e}")
                # 继续往下执行回退逻辑

        # 回退逻辑
        logger.info("使用本地/ModelScope回退方案生成图片...")
        return await self._fallback_client.generate(
            prompt=prompt, width=width, height=height, steps=steps, seed=seed, user_id=user_id, tenant_id=tenant_id
        )

    async def image_edit(self, *args, **kwargs) -> dict[str, Any]:
        """图片编辑直接交给 fallback 客户端"""
        return await self._fallback_client.image_edit(*args, **kwargs)
