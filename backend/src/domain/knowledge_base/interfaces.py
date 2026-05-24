#!/usr/bin/env python
# 文件名: interfaces.py
# 作者: wuhao
# 日期: 2026_05_24_13:40:00
# 描述: 知识库领域接口定义

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass
class DocumentChunk:
    """
    文档切片实体.

    参数:
        chunk_id (str): 切片唯一标识
        text (str): 切片文本内容
        metadata (dict[str, Any]): 元数据

    返回:
        None

    异常:
        无
    """
    chunk_id: str
    text: str
    metadata: dict[str, Any]


@dataclass
class SearchResult:
    """
    检索结果实体.

    参数:
        chunk_id (str): 切片唯一标识
        text (str): 切片文本内容
        score (float): 相似度或重排得分
        metadata (dict[str, Any]): 元数据

    返回:
        None

    异常:
        无
    """
    chunk_id: str
    text: str
    score: float
    metadata: dict[str, Any]


class IEmbeddingService(Protocol):
    """
    向量生成服务接口.

    参数:
        无

    返回:
        None

    异常:
        无
    """

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        """
        批量生成文本向量.

        参数:
            texts (list[str]): 文本列表

        返回:
            list[list[float]]: 对应的向量列表

        异常:
            Exception: 生成失败时抛出
        """
        ...

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
        ...


class IRerankService(Protocol):
    """
    重排服务接口.

    参数:
        无

    返回:
        None

    异常:
        无
    """

    async def rerank(self, query: str, texts: list[str]) -> list[float]:
        """
        对给定的文本列表进行相关度重排打分.

        参数:
            query (str): 查询语句
            texts (list[str]): 待打分的文本列表

        返回:
            list[float]: 与 texts 一一对应的得分列表

        异常:
            Exception: 打分失败时抛出
        """
        ...


class IVectorStore(Protocol):
    """
    向量存储仓储接口.

    参数:
        无

    返回:
        None

    异常:
        无
    """

    async def create_collection(self, collection_name: str, dimension: int) -> None:
        """
        创建向量集合.

        参数:
            collection_name (str): 集合名称
            dimension (int): 向量维度

        返回:
            None

        异常:
            Exception: 创建失败时抛出
        """
        ...

    async def drop_collection(self, collection_name: str) -> None:
        """
        删除向量集合.

        参数:
            collection_name (str): 集合名称

        返回:
            None

        异常:
            Exception: 删除失败时抛出
        """
        ...

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
            Exception: 插入失败时抛出
        """
        ...

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
            Exception: 检索失败时抛出
        """
        ...
