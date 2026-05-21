#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: image_record_interfaces.py
# 作者: wuhao
# 日期: 2026_05_20_0830
# 描述: 图片记录仓储接口定义


from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from domain.entities.image_record import ImageRecord, ImageRecordStatus


class IImageRecordRepository(ABC):
    """图片记录仓储接口"""

    @abstractmethod
    def create(self, entity: ImageRecord) -> ImageRecord:
        """创建图片记录"""
        ...

    @abstractmethod
    def get_by_id(self, task_id: str) -> ImageRecord | None:
        """根据 task_id 查询记录"""
        ...

    @abstractmethod
    def get_by_user(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        record_type: str | None = None,
    ) -> list[ImageRecord]:
        """根据用户 ID 查询记录列表"""
        ...

    @abstractmethod
    def update_status(
        self,
        task_id: str,
        status: ImageRecordStatus,
        result_url: str = "",
        result_base64: str = "",
        error_message: str = "",
    ) -> ImageRecord | None:
        """更新任务状态和结果"""
        ...

    @abstractmethod
    def update_notify_status(self, task_id: str, notified: bool, notify_status: str) -> None:
        """更新通知状态"""
        ...

    @abstractmethod
    def count_by_user(self, user_id: str, record_type: str | None = None) -> int:
        """统计用户生成图片数量"""
        ...

    @abstractmethod
    def delete(self, task_id: str) -> bool:
        """软删除记录"""
        ...

    @abstractmethod
    def admin_list(
        self,
        keyword: str = "",
        record_type: str | None = None,
        status: str | None = None,
        user_id: str = "",
        start_date: str = "",
        end_date: str = "",
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[ImageRecord], int]:
        """管理后台列表查询（支持多条件筛选）"""
        ...

    @abstractmethod
    def admin_delete(self, task_id: str, operator_id: str, operator_name: str, operator_ip: str) -> bool:
        """管理后台删除"""
        ...

    @abstractmethod
    def admin_batch_delete(self, task_ids: list[str], operator_id: str, operator_name: str, operator_ip: str) -> int:
        """管理后台批量删除"""
        ...
