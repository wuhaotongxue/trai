#!/usr/bin/env python
# 文件名: local_embedding_client.py
# 作者: wuhao
# 日期: 2026_05_24_13:40:00
# 描述: 纯本地的向量生成客户端实现

from loguru import logger

from core.exceptions import ExternalServiceError
from domain.knowledge_base.interfaces import IEmbeddingService

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None


class LocalEmbeddingClient(IEmbeddingService):
    """
    基于 sentence-transformers 的本地向量生成服务.

    参数:
        无

    返回:
        None

    异常:
        ExternalServiceError: 初始化失败或推理失败时抛出
    """

    def __init__(self, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2") -> None:
        """
        初始化本地向量模型.

        参数:
            model_name (str): 模型名称或本地路径

        返回:
            None

        异常:
            ExternalServiceError: 模型加载失败时抛出
        """
        if not SentenceTransformer:
            raise ExternalServiceError(message="缺少 sentence-transformers 依赖, 请检查环境")

        try:
            logger.info(f"正在加载本地 Embedding 模型: {model_name}")
            self._model = SentenceTransformer(model_name)
            self._dimension = self._model.get_sentence_embedding_dimension()
            logger.info(f"本地 Embedding 模型加载完成, 维度: {self._dimension}")
        except Exception as e:
            logger.error(f"本地 Embedding 模型加载失败: {e}")
            raise ExternalServiceError(message=f"本地 Embedding 模型加载失败: {e}")

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        """
        批量生成文本向量.

        参数:
            texts (list[str]): 文本列表

        返回:
            list[list[float]]: 对应的向量列表

        异常:
            ExternalServiceError: 推理失败时抛出
        """
        if not texts:
            return []

        try:
            # 内部调用为同步计算，如遇性能瓶颈可放入线程池中执行
            embeddings = self._model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"本地 Embedding 生成失败: {e}")
            raise ExternalServiceError(message=f"本地 Embedding 生成失败: {e}")

    def get_dimension(self) -> int:
        """
        获取当前模型的向量维度.

        参数:
            无

        返回:
            int: 向量维度

        异常:
            无
        """
        return self._dimension
