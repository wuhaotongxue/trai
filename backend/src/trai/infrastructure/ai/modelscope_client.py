#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: modelscope_client.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: ModelScope 图片生成客户端

from __future__ import annotations

import os
from typing import Any

import httpx
from loguru import logger

from trai.core.exceptions import ExternalServiceError


class ModelScopeClient:
    """ModelScope 图片生成客户端"""

    def __init__(self) -> None:
        self._base_url: str = "https://api.modelscope.cn/v1"
        self._model: str = os.getenv("MODELSCOPE_IMAGE_MODEL", "AI-ModelScope/FLUX.1-dev")
        self._steps: int = int(os.getenv("MODELSCOPE_IMAGE_STEPS", "30"))
        self._default_width: int = int(os.getenv("MODELSCOPE_IMAGE_WIDTH", "1024"))
        self._default_height: int = int(os.getenv("MODELSCOPE_IMAGE_HEIGHT", "1024"))
        self._default_seed: int = int(os.getenv("MODELSCOPE_IMAGE_SEED", "-1"))

    async def generate(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
    ) -> dict[str, Any]:
        """生成图片

        Args:
            prompt: 图片描述
            width: 宽度
            height: 高度
            steps: 采样步数
            seed: 随机种子

        Returns:
            dict: 生成结果
        """
        logger.info(f"ModelScope 图片生成 | 提示词: {prompt[:50]}...")

        url = f"{self._base_url}/image/generation"
        headers = {
            "Authorization": f"Bearer {os.getenv('MODELSCOPE_API_KEY', '')}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._model,
            "prompt": prompt,
            "width": width or self._default_width,
            "height": height or self._default_height,
            "steps": steps or self._steps,
            "seed": seed if seed is not None else self._default_seed,
        }

        try:
            async with httpx.AsyncClient(timeout=300) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                return {
                    "image_url": data.get("image_url", ""),
                    "task_id": data.get("task_id", ""),
                    "status": "completed",
                }

        except httpx.HTTPStatusError as e:
            logger.error(f"ModelScope HTTP 错误 | 状态码: {e.response.status_code}")
            raise ExternalServiceError(
                message=f"ModelScope API 请求失败: {e.response.status_code}",
                details={"status_code": e.response.status_code},
            )
        except Exception as e:
            logger.error(f"ModelScope 请求异常 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"ModelScope API 请求异常: {str(e)}",
                details={"error": str(e)},
            )


__all__ = ["ModelScopeClient"]