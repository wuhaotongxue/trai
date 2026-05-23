#!/usr/bin/env python
# 文件名: subtitle_record_repository.py
# 作者: wuhao
# 日期: 2026_05_23
# 描述: 字幕生成记录仓储实现

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from domain.entities.subtitle_record import SubtitleRecord
from domain.interfaces.subtitle_record_interfaces import ISubtitleRecordRepository
from infrastructure.database.subtitle_record_model import SubtitleRecordModel


class SubtitleRecordRepository(ISubtitleRecordRepository):
    """字幕生成记录数据库仓储实现"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def _to_entity(self, model: SubtitleRecordModel) -> SubtitleRecord:
        """模型转实体"""
        return SubtitleRecord(
            id=str(model.id),
            task_id=model.task_id,
            task_type=model.task_type,
            user_id=model.user_id,
            file_name=model.file_name,
            target_lang=model.target_lang,
            burn_mode=model.burn_mode,
            status=model.status,
            zh_srt_url=model.zh_srt_url,
            target_srt_url=model.target_srt_url,
            output_video_url=model.output_video_url,
            vocal_url=model.vocal_url,
            bgm_url=model.bgm_url,
            error_message=model.error_message,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: SubtitleRecord) -> SubtitleRecordModel:
        """实体转模型"""
        return SubtitleRecordModel(
            id=uuid.UUID(entity.id) if isinstance(entity.id, str) and "-" in entity.id else uuid.uuid4(),
            task_id=entity.task_id,
            task_type=entity.task_type,
            user_id=entity.user_id,
            file_name=entity.file_name,
            target_lang=entity.target_lang,
            burn_mode=entity.burn_mode,
            status=entity.status,
            zh_srt_url=entity.zh_srt_url,
            target_srt_url=entity.target_srt_url,
            output_video_url=entity.output_video_url,
            vocal_url=entity.vocal_url,
            bgm_url=entity.bgm_url,
            error_message=entity.error_message,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def save(self, record: SubtitleRecord) -> SubtitleRecord:
        """保存记录 (由于我们用的是同步 session，这里实际是同步操作)"""
        # 检查是否已存在
        existing = self._session.execute(
            select(SubtitleRecordModel).where(SubtitleRecordModel.task_id == record.task_id)
        ).scalar_one_or_none()

        if existing:
            existing.status = record.status
            existing.zh_srt_url = record.zh_srt_url
            existing.target_srt_url = record.target_srt_url
            existing.output_video_url = record.output_video_url
            existing.vocal_url = record.vocal_url
            existing.bgm_url = record.bgm_url
            existing.error_message = record.error_message
            existing.updated_at = record.updated_at
            self._session.commit()
            self._session.refresh(existing)
            return self._to_entity(existing)
        else:
            model = self._to_model(record)
            self._session.add(model)
            self._session.commit()
            self._session.refresh(model)
            return self._to_entity(model)

    def find_by_task_id(self, task_id: str) -> SubtitleRecord | None:
        """查找记录"""
        model = self._session.execute(
            select(SubtitleRecordModel).where(SubtitleRecordModel.task_id == task_id)
        ).scalar_one_or_none()
        if not model:
            return None
        return self._to_entity(model)
