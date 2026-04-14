#!/usr/bin/env python
# 文件名: upload_task_interfaces.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 上传任务仓储接口定义

from __future__ import annotations

from abc import ABC, abstractmethod

from domain.entities.upload_task import UploadTask


class IUploadTaskRepository(ABC):
    """上传任务仓储接口"""

    @abstractmethod
    def create(self, entity: UploadTask) -> UploadTask:
        """创建上传任务

        Args:
            entity: 上传任务实体

        Returns:
            UploadTask: 创建后的实体(含 ID)
        """
        pass

    @abstractmethod
    def get_by_id(self, task_id: str) -> UploadTask | None:
        """根据任务 ID 获取记录

        Args:
            task_id: 任务 ID

        Returns:
            UploadTask | None: 实体或 None
        """
        pass

    @abstractmethod
    def get_by_user(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> list[UploadTask]:
        """获取用户的所有上传记录

        Args:
            user_id: 用户 ID
            limit: 每页数量
            offset: 偏移量

        Returns:
            list[UploadTask]: 实体列表
        """
        pass

    @abstractmethod
    def update_status(
        self,
        task_id: str,
        status: str,
        file_url: str | None = None,
        error_message: str | None = None,
    ) -> UploadTask | None:
        """更新任务状态

        Args:
            task_id: 任务 ID
            status: 新状态
            file_url: 文件 URL
            error_message: 错误信息

        Returns:
            UploadTask | None: 更新后的实体
        """
        pass

    @abstractmethod
    def count_by_user(self, user_id: str) -> int:
        """统计用户上传次数

        Args:
            user_id: 用户 ID

        Returns:
            int: 次数
        """
        pass


__all__ = ["IUploadTaskRepository"]
