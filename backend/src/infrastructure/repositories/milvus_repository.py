#!/usr/bin/env python
# 文件名: milvus_repository.py
# 作者: wuhao
# 日期: 2026_05_24_13:50:00
# 描述: 基于 Milvus 的向量存储仓储实现

import os

from loguru import logger
from pymilvus import MilvusClient

from core.exceptions import ExternalServiceError
from domain.knowledge_base.interfaces import DocumentChunk, IVectorStore, SearchResult


class MilvusRepository(IVectorStore):
    """
    Milvus 向量数据库仓储实现.

    参数:
        无

    返回:
        None

    异常:
        ExternalServiceError: 数据库连接失败时抛出
    """

    def __init__(self) -> None:
        """
        初始化 Milvus 客户端.

        参数:
            无

        返回:
            None

        异常:
            ExternalServiceError: 环境变量缺失或连接失败时抛出
        """
        host = os.getenv("MILVUS_HOST", "127.0.0.1")
        port = os.getenv("MILVUS_PORT", "19530")
        uri = f"http://{host}:{port}"

        try:
            logger.info(f"正在初始化 Milvus 客户端, URI: {uri}")
            self.client = MilvusClient(uri=uri)
        except Exception as e:
            logger.error(f"Milvus 客户端初始化失败: {e}")
            raise ExternalServiceError(message=f"Milvus 客户端初始化失败: {e}")

    async def create_collection(self, collection_name: str, dimension: int) -> None:
        """
        创建向量集合.

        参数:
            collection_name (str): 集合名称
            dimension (int): 向量维度

        返回:
            None

        异常:
            ExternalServiceError: 创建失败时抛出
        """
        try:
            if not self.client.has_collection(collection_name=collection_name):
                logger.info(f"正在创建 Milvus 集合: {collection_name}, 维度: {dimension}")
                self.client.create_collection(
                    collection_name=collection_name, dimension=dimension, metric_type="COSINE"
                )
        except Exception as e:
            logger.error(f"创建 Milvus 集合失败: {e}")
            raise ExternalServiceError(message=f"创建 Milvus 集合失败: {e}")

    async def drop_collection(self, collection_name: str) -> None:
        """
        删除向量集合.

        参数:
            collection_name (str): 集合名称

        返回:
            None

        异常:
            ExternalServiceError: 删除失败时抛出
        """
        try:
            if self.client.has_collection(collection_name=collection_name):
                logger.info(f"正在删除 Milvus 集合: {collection_name}")
                self.client.drop_collection(collection_name=collection_name)
        except Exception as e:
            logger.error(f"删除 Milvus 集合失败: {e}")
            raise ExternalServiceError(message=f"删除 Milvus 集合失败: {e}")

    async def insert_chunks(
        self, collection_name: str, chunks: list[DocumentChunk], embeddings: list[list[float]]
    ) -> int:
        """
        批量插入文档切片和向量.

        参数:
            collection_name (str): 集合名称
            chunks (list[DocumentChunk]): 切片列表
            embeddings (list[list[float]]): 向量列表

        返回:
            int: 成功插入的条数

        异常:
            ExternalServiceError: 插入失败时抛出
        """
        if not chunks or not embeddings:
            return 0

        if len(chunks) != len(embeddings):
            raise ExternalServiceError(message="切片数量与向量数量不一致")

        data = []
        for i, (chunk, vec) in enumerate(zip(chunks, embeddings)):
            doc = {
                "id": i,  # 简化处理，实际可以使用 chunk.chunk_id 作为主键或字符串主键
                "vector": vec,
                "chunk_id": chunk.chunk_id,
                "text": chunk.text,
                "metadata": chunk.metadata,
            }
            data.append(doc)

        try:
            res = self.client.insert(collection_name=collection_name, data=data)
            count = int(res.get("insert_count", 0))
            logger.info(f"向集合 {collection_name} 成功插入 {count} 条数据")
            return count
        except Exception as e:
            logger.error(f"插入 Milvus 数据失败: {e}")
            raise ExternalServiceError(message=f"插入 Milvus 数据失败: {e}")

    async def search(self, collection_name: str, query_vector: list[float], limit: int) -> list[SearchResult]:
        """
        向量检索.

        参数:
            collection_name (str): 集合名称
            query_vector (list[float]): 查询向量
            limit (int): 返回最大数量

        返回:
            list[SearchResult]: 检索结果列表

        异常:
            ExternalServiceError: 检索失败时抛出
        """
        try:
            search_res = self.client.search(
                collection_name=collection_name,
                data=[query_vector],
                limit=limit,
                output_fields=["chunk_id", "text", "metadata"],
            )

            results = []
            for hits in search_res:
                for hit in hits:
                    entity = hit.get("entity", {})
                    results.append(
                        SearchResult(
                            chunk_id=entity.get("chunk_id", ""),
                            text=entity.get("text", ""),
                            score=hit.get("distance", 0.0),
                            metadata=entity.get("metadata", {}),
                        )
                    )
            return results
        except Exception as e:
            logger.error(f"Milvus 检索失败: {e}")
            raise ExternalServiceError(message=f"Milvus 检索失败: {e}")
