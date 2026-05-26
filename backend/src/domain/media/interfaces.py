#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: interfaces.py
# 作者: wuhao
# 日期: 2026_05_26_20:45:12
# 描述: 媒体领域仓储接口定义

from __future__ import annotations

from typing import Protocol
from domain.media.entities import ImageRecord, ImageRecordStatus, UploadTask


class IImageRecordRepository(Protocol):
    """
    图片处理记录仓储接口
    """

    def create(self, entity: ImageRecord) -> ImageRecord:
        """创建记录"""
        ...

    def get_by_id(self, task_id: str) -> ImageRecord | None:
        """按 ID 查询记录"""
        ...

    def get_by_user(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        record_type: str | None = None,
    ) -> list[ImageRecord]:
        """按用户查询记录列表"""
        ...

    def update_status(
        self,
        task_id: str,
        status: ImageRecordStatus,
        result_url: str = "",
        result_base64: str = "",
        error_message: str = "",
    ) -> ImageRecord | None:
        """更新状态和结果"""
        ...

    def update_notify_status(self, task_id: str, notified: bool, notify_status: str) -> None:
        """更新推送状态"""
        ...

    def count_by_user(self, user_id: str, record_type: str | None = None) -> int:
        """统计用户生成数量"""
        ...

    def delete(self, task_id: str) -> bool:
        """软删除记录"""
        ...

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
        """管理后台多条件查询"""
        ...

    def admin_delete(self, task_id: str, operator_id: str, operator_name: str, operator_ip: str) -> bool:
        """管理员删除"""
        ...

    def admin_batch_delete(self, task_ids: list[str], operator_id: str, operator_name: str, operator_ip: str) -> int:
        """管理员批量删除"""
        ...


class IUploadTaskRepository(Protocol):
    """
    上传任务仓储接口
    """

    def create(self, entity: UploadTask) -> UploadTask:
        """创建上传任务"""
        ...

    def get_by_id(self, task_id: str) -> UploadTask | None:
        """按 ID 获取记录"""
        ...

    def get_by_user(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> list[UploadTask]:
        """获取用户上传列表"""
        ...

    def update_status(
        self,
        task_id: str,
        status: str,
        file_url: str | None = None,
        error_message: str | None = None,
    ) -> UploadTask | None:
        """更新任务状态"""
        ...

    def count_by_user(self, user_id: str) -> int:
        """统计用户上传次数"""
        ...


__all__ = ["IImageRecordRepository", "IUploadTaskRepository"]
