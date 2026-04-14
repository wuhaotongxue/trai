#!/usr/bin/env python
# 文件名: token_counter.py
# 作者: wuhao
# 日期: 2026_04_10_09:12:17
# 描述: Token 计数器 - 基于 tiktoken 精确计数消息 Token 数

from __future__ import annotations

import os
from typing import Any

from core.logger import logger

try:
    import tiktoken
except ImportError:
    tiktoken = None


class TokenCounter:
    """Token 计数器 - 精确统计文本 Token 数量"""

    def __init__(self, model: str | None = None) -> None:
        """初始化 Token 计数器

        Args:
            model: 模型名称,默认从环境变量读取
        """
        self._model = model or os.getenv("OPENAI_MODEL", "gpt-4o")
        self._encoder: Any = None
        self._init_encoder()

    def _init_encoder(self) -> None:
        """初始化 tiktoken 编码器"""
        if tiktoken is None:
            logger.warning("tiktoken 未安装,降级为粗略估算")
            self._encoder = None
            return

        model_to_encoding = {
            "gpt-4o": "cl100k_base",
            "gpt-4-turbo": "cl100k_base",
            "gpt-4": "cl100k_base",
            "gpt-3.5-turbo": "cl100k_base",
            "o1": "o200k_base",
            "o1-mini": "o200k_base",
        }

        encoding_name = model_to_encoding.get(self._model, "cl100k_base")

        try:
            self._encoder = tiktoken.get_encoding(encoding_name)
            logger.info(f"TokenCounter 初始化完成 | 模型={self._model} | 编码={encoding_name}")
        except Exception as e:
            logger.warning(f"编码器初始化失败,降级为粗略估算: {e}")
            self._encoder = None

    def count(self, text: str) -> int:
        """统计单个文本的 Token 数

        Args:
            text: 待统计文本

        Returns:
            int: Token 数量
        """
        if not text:
            return 0

        if self._encoder is None:
            return self._rough_estimate(text)

        try:
            return len(self._encoder.encode(text))
        except Exception as e:
            logger.warning(f"Token 计数异常,降级为估算: {e}")
            return self._rough_estimate(text)

    def count_messages(self, messages: list[dict[str, str]]) -> int:
        """统计消息列表的总 Token 数

        消息格式: [{"role": "user", "content": "xxx"}, ...]
        包含每条消息的开销(role + content 结构)

        Args:
            messages: 消息列表

        Returns:
            int: 总 Token 数
        """
        if not messages:
            return 0

        total = 0
        overhead = 4

        for msg in messages:
            content = msg.get("content", "")
            total += self.count(content)
            total += overhead

        total += 3
        return total

    def truncate_to_limit(self, messages: list[dict[str, str]], max_tokens: int) -> list[dict[str, str]]:
        """将消息列表截断到指定 Token 上限

        从最旧的消息开始丢弃,保留最新的消息

        Args:
            messages: 消息列表
            max_tokens: 最大 Token 数

        Returns:
            list[dict[str, str]]: 截断后的消息列表
        """
        if not messages:
            return []

        if self.count_messages(messages) <= max_tokens:
            return messages

        truncated = []
        for msg in reversed(messages):
            test_list = [msg] + truncated
            if self.count_messages(test_list) <= max_tokens:
                truncated = test_list
            else:
                break

        return list(reversed(truncated))

    def _rough_estimate(self, text: str) -> int:
        """粗略估算 Token 数(中文按字符计,英文按单词计)

        Args:
            text: 待估算文本

        Returns:
            int: 估算 Token 数
        """
        chinese_chars = sum(1 for c in text if "\u4e00" <= c <= "\u9fff")
        english_words = len(text) - chinese_chars
        return int(chinese_chars * 2.0 + english_words / 4.0)


_token_counter_instance: TokenCounter | None = None


def get_token_counter(model: str | None = None) -> TokenCounter:
    """获取 Token 计数器单例

    Args:
        model: 模型名称

    Returns:
        TokenCounter: 计数器实例
    """
    global _token_counter_instance
    if _token_counter_instance is None:
        _token_counter_instance = TokenCounter(model)
    return _token_counter_instance


__all__ = ["TokenCounter", "get_token_counter"]
