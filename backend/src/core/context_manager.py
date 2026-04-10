#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: context_manager.py
# 作者: wuhao
# 日期: 2026_04_10_09:12:17
# 描述: 上下文管理器 - 消息超 Token 阈值时自动摘要压缩

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

from core.logger import logger
from core.token_counter import TokenCounter, get_token_counter


@dataclass
class ContextStats:
    """上下文统计信息"""

    total_tokens: int
    message_count: int
    was_truncated: bool
    was_compressed: bool


class ContextManager:
    """上下文管理器 - Token 阈值检测与 AI 压缩摘要"""

    def __init__(self) -> None:
        """初始化上下文管理器"""
        self._max_context_tokens: int = int(
            os.getenv("CONTEXT_MAX_TOKENS", "128000")
        )
        self._compression_threshold: int = int(
            os.getenv("CONTEXT_COMPRESSION_THRESHOLD", "80000")
        )
        self._summary_prompt_tokens: int = int(
            os.getenv("CONTEXT_SUMMARY_PROMPT_TOKENS", "2000")
        )
        self._keep_recent_messages: int = int(
            os.getenv("CONTEXT_KEEP_RECENT_MESSAGES", "10")
        )
        self._token_counter: TokenCounter = get_token_counter()

    def check_and_manage(
        self, messages: list[dict[str, str]], session_id: str
    ) -> tuple[list[dict[str, str]], ContextStats]:
        """检查并管理上下文

        流程:
        1. 统计当前 Token 数
        2. 未超阈值 → 直接返回
        3. 超阈值但低于压缩阈值 → 截断最旧消息
        4. 超出压缩阈值 → AI 压缩摘要

        Args:
            messages: 消息列表
            session_id: 会话 ID

        Returns:
            tuple: (处理后的消息列表, 上下文统计信息)
        """
        total_tokens = self._token_counter.count_messages(messages)
        original_count = len(messages)

        if total_tokens <= self._max_context_tokens:
            return messages, ContextStats(
                total_tokens=total_tokens,
                message_count=original_count,
                was_truncated=False,
                was_compressed=False,
            )

        logger.info(
            f"上下文超限 | session_id={session_id} | tokens={total_tokens} | threshold={self._max_context_tokens}"
        )

        if total_tokens <= self._compression_threshold:
            truncated = self._truncate_messages(messages)
            return truncated, ContextStats(
                total_tokens=self._token_counter.count_messages(truncated),
                message_count=len(truncated),
                was_truncated=True,
                was_compressed=False,
            )

        compressed = self._compress_with_ai(messages, session_id)
        return compressed, ContextStats(
            total_tokens=self._token_counter.count_messages(compressed),
            message_count=len(compressed),
            was_truncated=False,
            was_compressed=True,
        )

    def _truncate_messages(
        self, messages: list[dict[str, str]]
    ) -> list[dict[str, str]]:
        """截断消息到阈值以内

        Args:
            messages: 消息列表

        Returns:
            list[dict[str, str]]: 截断后的消息列表
        """
        target_tokens = self._max_context_tokens - self._summary_prompt_tokens

        truncated = self._token_counter.truncate_to_limit(messages, target_tokens)

        logger.info(
            f"上下文截断 | 原始消息数={len(messages)} | 截断后消息数={len(truncated)}"
        )

        return truncated

    async def _compress_with_ai(
        self, messages: list[dict[str, str]], session_id: str
    ) -> list[dict[str, str]]:
        """使用 AI 压缩历史消息

        Args:
            messages: 消息列表
            session_id: 会话 ID

        Returns:
            list[dict[str, str]]: 压缩后的消息列表
        """
        logger.info(f"启动 AI 压缩 | session_id={session_id} | 消息数={len(messages)}")

        summary = await self._generate_summary(messages)

        summary_message: dict[str, str] = {
            "role": "system",
            "content": (
                f"[历史消息摘要] 之前的对话摘要如下:\n{summary}\n\n"
                "基于以上摘要继续对话，如需了解详情可参考原始记录。"
            ),
        }

        recent_messages = messages[-self._keep_recent_messages :]
        compressed = [summary_message] + recent_messages

        compressed_tokens = self._token_counter.count_messages(compressed)
        logger.info(
            f"AI 压缩完成 | session_id={session_id} | "
            f"原始tokens={self._token_counter.count_messages(messages)} | "
            f"压缩后tokens={compressed_tokens} | "
            f"消息数={len(messages)}→{len(compressed)}"
        )

        return compressed

    async def _generate_summary(
        self, messages: list[dict[str, str]]
    ) -> str:
        """调用 AI 生成摘要

        Args:
            messages: 消息列表

        Returns:
            str: 摘要内容
        """
        summary_instruction = (
            "你是一个对话摘要助手。请将以下对话历史压缩为一段简洁的摘要，"
            "保留关键信息、用户意图、重要结论和任何未解决的问题。"
            "摘要应包含:\n"
            "1. 对话主题\n"
            "2. 主要讨论内容\n"
            "3. 已达成的结论\n"
            "4. 待处理的事项\n\n"
            "对话历史:\n"
        )

        history_text = "\n".join(
            f"[{msg.get('role', 'unknown')}]: {msg.get('content', '')}"
            for msg in messages
            if msg.get("content")
        )

        prompt = summary_instruction + history_text

        try:
            from infrastructure.ai.openai_client import OpenAIClient

            client = OpenAIClient()
            response = await client.chat(
                messages=[{"role": "user", "content": prompt}],
                model=os.getenv("OPENAI_MODEL", "gpt-4o"),
                temperature=0.3,
                max_tokens=1500,
            )
            return response.get("content", "摘要生成失败")
        except Exception as e:
            logger.error(f"AI 摘要生成失败: {e}")
            return self._fallback_summary(messages)

    def _fallback_summary(
        self, messages: list[dict[str, str]]
    ) -> str:
        """降级摘要策略

        Args:
            messages: 消息列表

        Returns:
            str: 降级摘要
        """
        first_msg = messages[0] if messages else {}
        last_msg = messages[-1] if messages else {}

        topics = []
        for msg in messages[1:-1]:
            content = msg.get("content", "")
            if len(content) > 20:
                topics.append(content[:100])

        summary = f"对话共 {len(messages)} 条消息。"
        if topics:
            summary += f"涉及话题: {'; '.join(topics[:3])}"
        if first_msg:
            summary += f"\n起始话题: {first_msg.get('content', '')[:50]}"
        if last_msg:
            summary += f"\n最新消息: {last_msg.get('content', '')[:50]}"

        return summary

    def get_context_stats(
        self, messages: list[dict[str, str]]
    ) -> ContextStats:
        """获取上下文统计信息

        Args:
            messages: 消息列表

        Returns:
            ContextStats: 统计信息
        """
        total_tokens = self._token_counter.count_messages(messages)
        return ContextStats(
            total_tokens=total_tokens,
            message_count=len(messages),
            was_truncated=False,
            was_compressed=False,
        )


_context_manager_instance: ContextManager | None = None


def get_context_manager() -> ContextManager:
    """获取上下文管理器单例

    Returns:
        ContextManager: 上下文管理器实例
    """
    global _context_manager_instance
    if _context_manager_instance is None:
        _context_manager_instance = ContextManager()
    return _context_manager_instance


__all__ = ["ContextManager", "ContextStats", "get_context_manager"]
