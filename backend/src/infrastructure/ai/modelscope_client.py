#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: modelscope_client.py
# 作者: wuhao
# 日期: 2026_05_14_2022
# 描述: ModelScope 图片生成客户端，支持远程 API 和本地模型两种模式


from __future__ import annotations

import base64
import os
from typing import Any

import httpx
from loguru import logger

from core.exceptions import ExternalServiceError
from infrastructure.storage.s3_storage import S3StorageService


class ModelScopeClient:
    """ModelScope 图片生成客户端"""

    def __init__(self) -> None:
        self._base_url: str = os.getenv(
            "MODELSCOPE_API_BASE",
            "https://api.modelscope.cn/v1"
        )
        self._model: str = os.getenv("MODELSCOPE_IMAGE_MODEL", "AI-ModelScope/FLUX.1-dev")
        self._steps: int = int(os.getenv("MODELSCOPE_IMAGE_STEPS", "25"))
        self._default_width: int = int(os.getenv("MODELSCOPE_IMAGE_WIDTH", "1024"))
        self._default_height: int = int(os.getenv("MODELSCOPE_IMAGE_HEIGHT", "1024"))
        self._default_seed: int = int(os.getenv("MODELSCOPE_IMAGE_SEED", "-1"))
        self._local_model_path: str = os.getenv(
            "MODELSCOPE_IMAGE_MODEL_PATH",
            "/home/qyjgylc_whf/.cache/modelscope/hub/models/Tongyi-MAI/Z-Image-Turbo"
        )
        self._use_local: bool = self._should_use_local()

    def _should_use_local(self) -> bool:
        """检查是否应该使用本地模型"""
        local_path = self._local_model_path

        # 检查本地模型是否存在
        if not os.path.exists(local_path):
            logger.warning(f"本地模型不存在: {local_path}，将使用远程 API")
            return False

        # 检查是否强制使用本地模型
        use_local = os.getenv("MODELSCOPE_USE_LOCAL_IMAGE", "true").lower()
        if use_local == "true":
            logger.info("使用本地图片生成模型")
            return True

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
        """生成图片

        Args:
            prompt: 图片描述
            width: 宽度
            height: 高度
            steps: 采样步数
            seed: 随机种子
            user_id: 用户 ID(用于构建存储路径)
            tenant_id: 租户 ID(用于构建存储路径)

        Returns:
            dict: 生成结果
        """
        if self._use_local:
            return await self._generate_local(prompt, width, height, steps, seed, user_id=user_id, tenant_id=tenant_id)
        else:
            return await self._generate_remote(prompt, width, height, steps, seed)

    async def _generate_local(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
        user_id: str | None = None,
        tenant_id: str | None = None,
    ) -> dict[str, Any]:
        """使用本地模型生成图片

        Args:
            prompt: 图片描述
            width: 宽度
            height: 高度
            steps: 采样步数
            seed: 随机种子

        Returns:
            dict: 生成结果（包含 base64 图片）
        """
        from infrastructure.ai.local_image_client import LocalImageClient

        client = LocalImageClient()
        result = await client.generate(
            prompt=prompt,
            width=width,
            height=height,
            steps=steps,
            seed=seed,
        )

        image_base64 = result.get("image_base64", "")
        if not image_base64:
            raise ExternalServiceError(
                message="本地图片生成失败: 未返回 image_base64",
                details={},
            )

        image_bytes = base64.b64decode(image_base64)
        task_id = f"local_{seed or -1}_{hash(prompt) % 100000}"
        safe_tenant_id = tenant_id or "default"
        safe_user_id = user_id or "anonymous"
        object_key = f"private/tenants/{safe_tenant_id}/ai_generated/images/{safe_user_id}/{task_id}.png"

        storage = S3StorageService()
        storage.upload_bytes(
            data=image_bytes,
            object_key=object_key,
            content_type="image/png",
        )
        expires_in = int(os.getenv("S3_PRESIGNED_URL_EXPIRE_SECONDS", "300"))
        presigned_url = storage.get_presigned_url(object_key, expires_in=expires_in)

        return {
            "image_url": presigned_url,
            "image_base64": image_base64,
            "task_id": task_id,
            "status": "completed",
        }

    async def _generate_remote(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
    ) -> dict[str, Any]:
        """使用远程 API 生成图片

        Args:
            prompt: 图片描述
            width: 宽度
            height: 高度
            steps: 采样步数
            seed: 随机种子

        Returns:
            dict: 生成结果
        """
        logger.info(f"ModelScope 远程 API 图片生成 | 提示词: {prompt[:50]}...")

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

    async def image_edit(
        self,
        image_input: str,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
        user_id: str | None = None,
        tenant_id: str | None = None,
    ) -> dict[str, Any]:
        """编辑图片（使用 Qwen-Image-Edit-2511 本地模型）

        Args:
            image_input: 图片（URL / base64 / 字节）
            prompt: 编辑描述
            width: 宽度
            height: 高度
            steps: 采样步数
            seed: 随机种子
            user_id: 用户 ID
            tenant_id: 租户 ID

        Returns:
            dict: 编辑结果
        """
        from infrastructure.ai.local_image_edit_client import LocalImageEditClient

        client = LocalImageEditClient()
        result = await client.edit(
            image_input=image_input,
            prompt=prompt,
            width=width,
            height=height,
            steps=steps,
            seed=seed,
        )

        image_base64 = result.get("image_base64", "")
        if not image_base64:
            raise ExternalServiceError(
                message="图片编辑失败: 未返回 image_base64",
                details={},
            )

        image_bytes = base64.b64decode(image_base64)
        task_id = f"edit_{seed or -1}_{hash(prompt) % 100000}"
        safe_tenant_id = tenant_id or "default"
        safe_user_id = user_id or "anonymous"
        object_key = (
            f"private/tenants/{safe_tenant_id}/ai_edited/images/"
            f"{safe_user_id}/{task_id}.png"
        )

        storage = S3StorageService()
        storage.upload_bytes(
            data=image_bytes,
            object_key=object_key,
            content_type="image/png",
        )
        expires_in = int(os.getenv("S3_PRESIGNED_URL_EXPIRE_SECONDS", "300"))
        presigned_url = storage.get_presigned_url(object_key, expires_in=expires_in)

        return {
            "image_url": presigned_url,
            "image_base64": image_base64,
            "task_id": task_id,
            "status": "completed",
        }


__all__ = ["ModelScopeClient"]
