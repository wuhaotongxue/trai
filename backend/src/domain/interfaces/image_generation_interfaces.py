#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: image_generation_interfaces.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 图片生成仓储接口定义

from __future__ import annotations

from abc import ABC, abstractmethod

from domain.entities.image_generation import ImageGeneration


class IImageGenerationRepository(ABC):
    """图片生成仓储接口"""

    @abstractmethod
    def create(self, entity: ImageGeneration) -> ImageGeneration:
        """创建图片生成任务

        Args:
            entity: 图片生成实体

        Returns:
            ImageGeneration: 创建后的实体（含 ID）
        """
        pass

    @abstractmethod
    def get_by_id(self, task_id: str) -> ImageGeneration | None:
        """根据任务 ID 获取记录

        Args:
            task_id: 任务 ID

        Returns:
            ImageGeneration | None: 实体或 None
        """
        pass

    @abstractmethod
    def get_by_user(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> list[ImageGeneration]:
        """获取用户的所有图片生成记录

        Args:
            user_id: 用户 ID
            limit: 每页数量
            offset: 偏移量

        Returns:
            list[ImageGeneration]: 实体列表
        """
        pass

    @abstractmethod
    def update_status(
        self,
        task_id: str,
        status: str,
        result_url: str | None = None,
        error_message: str | None = None,
    ) -> ImageGeneration | None:
        """更新任务状态

        Args:
            task_id: 任务 ID
            status: 新状态
            result_url: 生成结果 URL
            error_message: 错误信息

        Returns:
            ImageGeneration | None: 更新后的实体
        """
        pass

    @abstractmethod
    def count_by_user(self, user_id: str) -> int:
        """统计用户图片生成次数

        Args:
            user_id: 用户 ID

        Returns:
            int: 次数
        """
        pass


__all__ = ["IImageGenerationRepository"]
