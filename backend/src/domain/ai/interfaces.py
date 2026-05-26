#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: interfaces.py
# 作者: wuhao
# 日期: 2026_05_26_20:45:12
# 描述: AI 领域仓储接口定义

from __future__ import annotations

from typing import Protocol
from domain.ai.entities import ImageGeneration, SubtitleRecord


class IImageGenerationRepository(Protocol):
    """
    图片生成任务仓储接口
    """

    def create(self, entity: ImageGeneration) -> ImageGeneration:
        """
        创建新的生成任务
        """
        ...

    def get_by_id(self, task_id: str) -> ImageGeneration | None:
        """
        按 ID 获取任务
        """
        ...

    def get_by_user(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> list[ImageGeneration]:
        """
        按用户获取任务列表
        """
        ...

    def update_status(
        self,
        task_id: str,
        status: str,
        result_url: str | None = None,
        error_message: str | None = None,
    ) -> ImageGeneration | None:
        """
        更新任务执行状态
        """
        ...

    def count_by_user(self, user_id: str) -> int:
        """
        统计用户生成任务数
        """
        ...


class ISubtitleRecordRepository(Protocol):
    """
    字幕处理任务仓储接口
    """

    def save(self, record: SubtitleRecord) -> SubtitleRecord:
        """
        保存处理记录
        """
        ...

    def find_by_task_id(self, task_id: str) -> SubtitleRecord | None:
        """
        按任务 ID 查找记录
        """
        ...


__all__ = ["IImageGenerationRepository", "ISubtitleRecordRepository"]
