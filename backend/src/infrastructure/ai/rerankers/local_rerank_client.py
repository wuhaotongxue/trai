#!/usr/bin/env python
# 文件名: local_rerank_client.py
# 作者: wuhao
# 日期: 2026_05_24_13:40:00
# 描述: 纯本地的重排客户端实现

from loguru import logger

from core.exceptions import ExternalServiceError
from domain.knowledge_base.interfaces import IRerankService

try:
    from sentence_transformers import CrossEncoder
except ImportError:
    CrossEncoder = None


class LocalRerankClient(IRerankService):
    """
    基于 CrossEncoder 的本地重排服务.

    参数:
        无

    返回:
        None

    异常:
        ExternalServiceError: 初始化失败或推理失败时抛出
    """

    def __init__(self, model_name: str = "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1") -> None:
        """
        初始化本地排序模型.

        参数:
            model_name (str): 模型名称或本地路径

        返回:
            None

        异常:
            ExternalServiceError: 模型加载失败时抛出
        """
        if not CrossEncoder:
            raise ExternalServiceError(message="缺少 sentence-transformers 依赖, 请检查环境")

        try:
            logger.info(f"正在加载本地 Rerank 模型: {model_name}")
            self._model = CrossEncoder(model_name)
            logger.info("本地 Rerank 模型加载完成")
        except Exception as e:
            logger.error(f"本地 Rerank 模型加载失败: {e}")
            raise ExternalServiceError(message=f"本地 Rerank 模型加载失败: {e}")

    async def rerank(self, query: str, texts: list[str]) -> list[float]:
        """
        对文本进行本地交叉编码重排打分.

        参数:
            query (str): 用户查询问题
            texts (list[str]): 待打分的文本片段列表

        返回:
            list[float]: 与文本片段对应的得分列表

        异常:
            ExternalServiceError: 推理失败时抛出
        """
        if not texts:
            return []

        try:
            # 构建 (query, text) 对
            cross_inp = [[query, text] for text in texts]
            # 执行推理
            scores = self._model.predict(cross_inp)

            # 返回标准的浮点数列表
            if isinstance(scores, float):
                return [scores]
            return scores.tolist()
        except Exception as e:
            logger.error(f"本地 Rerank 生成失败: {e}")
            raise ExternalServiceError(message=f"本地 Rerank 生成失败: {e}")
