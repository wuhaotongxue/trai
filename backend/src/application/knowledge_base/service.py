#!/usr/bin/env python
# 文件名: service.py
# 作者: wuhao
# 日期: 2026_05_24_14:10:00
# 描述: 知识库应用服务，编排切片、向量化、入库与重排检索的完整 RAG 流程

import uuid
from typing import Any

from loguru import logger

from core.exceptions import BusinessError
from domain.knowledge_base.interfaces import (
    DocumentChunk,
    IEmbeddingService,
    IRerankService,
    IVectorStore,
    SearchResult,
)


class KnowledgeBaseService:
    """
    知识库应用层服务.

    参数:
        无

    返回:
        None

    异常:
        无
    """

    def __init__(
        self,
        vector_store: IVectorStore,
        embedding_service: IEmbeddingService,
        rerank_service: IRerankService,
    ) -> None:
        """
        初始化知识库服务, 注入所需的仓储与 AI 能力接口.

        参数:
            vector_store (IVectorStore): 向量存储仓储
            embedding_service (IEmbeddingService): 向量生成服务
            rerank_service (IRerankService): 重排服务

        返回:
            None

        异常:
            无
        """
        self._vector_store = vector_store
        self._embedding_service = embedding_service
        self._rerank_service = rerank_service

    def _chunk_text(self, text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> list[str]:
        """
        简易文本切片器.

        参数:
            text (str): 原始长文本
            chunk_size (int): 每个切片的最大字符数
            chunk_overlap (int): 切片之间的重叠字符数

        返回:
            list[str]: 切片后的文本列表

        异常:
            无
        """
        if not text:
            return []

        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + chunk_size, text_len)
            chunks.append(text[start:end])
            if end == text_len:
                break
            start = end - chunk_overlap

        return chunks

    async def add_document(self, collection_name: str, document_text: str, metadata: dict[str, Any] | None = None) -> int:
        """
        处理文档并添加到知识库集合中.
        流程: 切片 -> 生成向量 -> 入库.

        参数:
            collection_name (str): 知识库集合名称
            document_text (str): 文档内容
            metadata (dict[str, Any] | None): 文档元数据

        返回:
            int: 成功入库的切片数量

        异常:
            BusinessError: 处理失败时抛出
        """
        if not document_text:
            raise BusinessError(message="文档内容不能为空")

        try:
            logger.info(f"开始处理文档, 目标集合: {collection_name}")

            # 1. 确保集合存在
            dimension = self._embedding_service.get_dimension()
            await self._vector_store.create_collection(collection_name, dimension)

            # 2. 文本切片
            text_chunks = self._chunk_text(document_text)
            logger.info(f"文档切片完成, 共 {len(text_chunks)} 个片段")

            # 3. 构造领域实体
            doc_metadata = metadata or {}
            chunk_entities = [
                DocumentChunk(
                    chunk_id=str(uuid.uuid4()),
                    text=text,
                    metadata=doc_metadata
                )
                for text in text_chunks
            ]

            # 4. 生成向量
            embeddings = await self._embedding_service.generate_embeddings(text_chunks)

            # 5. 入库
            inserted_count = await self._vector_store.insert_chunks(collection_name, chunk_entities, embeddings)
            logger.info(f"文档处理完成, 成功入库 {inserted_count} 个切片")

            return inserted_count

        except Exception as e:
            logger.error(f"添加文档到知识库失败: {e}")
            raise BusinessError(message=f"添加文档失败: {e}")

    async def search_answer(
        self, collection_name: str, query: str, top_k: int = 3, use_rerank: bool = True
    ) -> list[SearchResult]:
        """
        在指定知识库集合中检索与问题相关的文档片段.
        流程: 问题向量化 -> 向量初排召回 -> 本地模型重排.

        参数:
            collection_name (str): 集合名称
            query (str): 用户问题
            top_k (int): 最终返回的数量
            use_rerank (bool): 是否使用二次重排

        返回:
            list[SearchResult]: 排序后的检索结果列表

        异常:
            BusinessError: 检索失败时抛出
        """
        if not query:
            raise BusinessError(message="查询内容不能为空")

        try:
            logger.info(f"知识库检索开始, 问题: '{query}'")

            # 1. 问题向量化
            query_vectors = await self._embedding_service.generate_embeddings([query])
            query_vector = query_vectors[0]

            # 2. 向量初排召回 (如果使用重排，初排可以适当放大召回数量)
            recall_limit = top_k * 3 if use_rerank else top_k
            recall_results = await self._vector_store.search(collection_name, query_vector, recall_limit)

            if not recall_results:
                logger.info("未检索到相关内容")
                return []

            if not use_rerank:
                return recall_results[:top_k]

            # 3. 本地模型交叉重排
            texts = [res.text for res in recall_results]
            rerank_scores = await self._rerank_service.rerank(query, texts)

            # 4. 更新得分并重新排序
            for res, score in zip(recall_results, rerank_scores):
                res.score = score

            recall_results.sort(key=lambda x: x.score, reverse=True)

            final_results = recall_results[:top_k]
            logger.info(f"知识库检索完成, 返回 {len(final_results)} 条结果")
            return final_results

        except Exception as e:
            logger.error(f"知识库检索失败: {e}")
            raise BusinessError(message=f"检索失败: {e}")
