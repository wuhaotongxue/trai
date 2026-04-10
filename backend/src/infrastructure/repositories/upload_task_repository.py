#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: upload_task_repository.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 上传任务仓储实现

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.logger import logger
from domain.entities.upload_task import FileType, UploadStatus, UploadTask
from domain.interfaces.upload_task_interfaces import IUploadTaskRepository
from infrastructure.database.models import UploadTaskModel


class UploadTaskRepository(IUploadTaskRepository):
    """上传任务仓储实现"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, entity: UploadTask) -> UploadTask:
        model = UploadTaskModel(
            task_id=entity.task_id,
            user_id=entity.user_id,
            file_name=entity.file_name,
            file_type=entity.file_type.value if hasattr(entity.file_type, "value") else entity.file_type,
            file_size=entity.file_size,
            content_type=entity.content_type,
            status=entity.status.value if hasattr(entity.status, "value") else entity.status,
            file_url=entity.file_url,
            error_message=entity.error_message,
            session_id=entity.session_id,
            trace_id=entity.trace_id,
        )
        self._session.add(model)
        self._session.flush()
        logger.info(f"上传任务已创建 | task_id={entity.task_id}")
        return entity

    def get_by_id(self, task_id: str) -> UploadTask | None:
        stmt = select(UploadTaskModel).where(UploadTaskModel.task_id == task_id)
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._model_to_entity(model)

    def get_by_user(
        self, user_id: str, limit: int = 20, offset: int = 0
    ) -> list[UploadTask]:
        stmt = (
            select(UploadTaskModel)
            .where(UploadTaskModel.user_id == user_id)
            .order_by(UploadTaskModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = self._session.execute(stmt)
        models = result.scalars().all()

        return [self._model_to_entity(m) for m in models]

    def update_status(
        self,
        task_id: str,
        status: str,
        file_url: str | None = None,
        error_message: str | None = None,
    ) -> UploadTask | None:
        stmt = select(UploadTaskModel).where(UploadTaskModel.task_id == task_id)
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        model.status = status
        if file_url is not None:
            model.file_url = file_url
        if error_message is not None:
            model.error_message = error_message

        self._session.flush()
        logger.info(f"上传任务状态已更新 | task_id={task_id} | status={status}")
        return self._model_to_entity(model)

    def count_by_user(self, user_id: str) -> int:
        stmt = select(func.count()).where(UploadTaskModel.user_id == user_id)
        result = self._session.execute(stmt)
        return result.scalar() or 0

    def _model_to_entity(self, model: UploadTaskModel) -> UploadTask:
        return UploadTask(
            task_id=model.task_id,
            user_id=model.user_id,
            file_name=model.file_name,
            file_type=FileType(model.file_type),
            file_size=model.file_size,
            content_type=model.content_type,
            status=UploadStatus(model.status),
            file_url=model.file_url,
            error_message=model.error_message,
            session_id=model.session_id,
            trace_id=model.trace_id,
        )


__all__ = ["UploadTaskRepository"]
