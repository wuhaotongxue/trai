#!/usr/bin/env python
# 文件名: embedding_client.py
# 作者: wuhao
# 日期: 2026_05_24_13:35:00
# 描述: 向量生成客户端, 支持 OpenAI 兼容接口(如 DashScope)

import os

import httpx
from loguru import logger

from core.exceptions import ExternalServiceError
from domain.knowledge_base.interfaces import IEmbeddingService


class EmbeddingClient(IEmbeddingService):
    """向量生成客户端"""

    def __init__(self, provider: str | None = None) -> None:
        self._provider = provider or os.getenv("LLM_PROVIDER", "openai")

        if self._provider == "modelscope" or self._provider == "dashscope":
            self._api_key = os.getenv("DASHSCOPE_API_KEY", "") or os.getenv("MODELSCOPE_API_KEY", "")
            self._base_url = os.getenv("DASHSCOPE_API_BASE", "") or "https://dashscope.aliyuncs.com/compatible-mode/v1"
            self._model = os.getenv("EMBEDDING_MODEL", "text-embedding-v3")
            self._dimension = 1536
        else:
            self._api_key = os.getenv("OPENAI_API_KEY", "")
            self._base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
            self._model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
            self._dimension = 1536

        self._timeout = 60

    def get_dimension(self) -> int:
        """
        获取向量维度.

        参数:
            无

        返回:
            int: 向量维度大小

        异常:
            无
        """
        return self._dimension

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        """
        批量生成文本向量.

        参数:
            texts: 文本列表.

        返回:
            list[list[float]]: 对应的向量列表.

        异常:
            ExternalServiceError: 请求失败时抛出.
        """
        if not self._api_key:
            raise ExternalServiceError(message="未配置 Embedding API Key")

        url = f"{self._base_url.rstrip('/')}/embeddings"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        payload = {"model": self._model, "input": texts}

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                # OpenAI 格式返回: {"data": [{"embedding": [...]}]}
                embeddings = []
                for item in data.get("data", []):
                    embeddings.append(item.get("embedding", []))

                return embeddings
        except Exception as e:
            logger.error(f"生成 Embedding 失败: {e}")
            raise ExternalServiceError(message=f"生成 Embedding 失败: {e}")
