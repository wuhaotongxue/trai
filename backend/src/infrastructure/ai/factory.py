#!/usr/bin/env python
# 文件名: factory.py
# 作者: wuhao
# 日期: 2026_05_24_14:00:00
# 描述: AI 能力工厂, 用于根据配置返回 API 客户端或本地客户端

import os

from loguru import logger

from domain.knowledge_base.interfaces import IEmbeddingService, IRerankService
from infrastructure.ai.embedding_client import EmbeddingClient
from infrastructure.ai.local_embedding_client import LocalEmbeddingClient
from infrastructure.ai.local_rerank_client import LocalRerankClient


class AIFactory:
    """
    AI 能力工厂类.

    参数:
        无

    返回:
        None

    异常:
        无
    """

    @staticmethod
    def get_embedding_service() -> IEmbeddingService:
        """
        获取向量生成服务实例.
        优先检查是否启用了本地模型配置, 否则使用 API 客户端.

        参数:
            无

        返回:
            IEmbeddingService: 向量生成服务接口实现

        异常:
            Exception: 初始化失败时抛出
        """
        use_local = os.getenv("USE_LOCAL_EMBEDDING", "false").lower() == "true"

        if use_local:
            model_name = os.getenv("LOCAL_EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")
            logger.info(f"工厂创建本地 Embedding 服务, 模型: {model_name}")
            return LocalEmbeddingClient(model_name=model_name)

        logger.info("工厂创建 API Embedding 服务")
        return EmbeddingClient()

    @staticmethod
    def get_rerank_service() -> IRerankService:
        """
        获取重排服务实例.
        默认使用本地跨语言排序模型.

        参数:
            无

        返回:
            IRerankService: 重排服务接口实现

        异常:
            Exception: 初始化失败时抛出
        """
        model_name = os.getenv("LOCAL_RERANK_MODEL", "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1")
        logger.info(f"工厂创建本地 Rerank 服务, 模型: {model_name}")
        return LocalRerankClient(model_name=model_name)
