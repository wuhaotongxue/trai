#!/usr/bin/env python
# 文件名: subtitle_record_interfaces.py
# 作者: wuhao
# 日期: 2026_05_23
# 描述: 字幕生成记录仓储接口

from __future__ import annotations

from typing import Protocol

from domain.entities.subtitle_record import SubtitleRecord


class ISubtitleRecordRepository(Protocol):
    """字幕生成记录仓储接口"""

    def save(self, record: SubtitleRecord) -> SubtitleRecord:
        """保存记录"""
        ...

    def find_by_task_id(self, task_id: str) -> SubtitleRecord | None:
        """根据任务 ID 查找记录"""
        ...
