#!/usr/bin/env python
# 文件名: upload_task_repository.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 上传任务仓储实现

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.logger import logger
from domain.media.entities import FileType, UploadStatus, UploadTask
from domain.media.interfaces import IUploadTaskRepository
from infrastructure.database.models import UploadTaskModel


class UploadTaskRepository(IUploadTaskRepository):
    """上传任务仓储实现"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, entity: UploadTask) -> UploadTask:
        model = UploadTaskModel(
            t_task_id=entity.task_id,
            t_user_id=entity.user_id,
            t_file_name=entity.file_name,
            t_file_type=entity.file_type.value if hasattr(entity.file_type, "value") else entity.file_type,
            t_file_size=entity.file_size,
            t_content_type=entity.content_type,
            t_status=entity.status.value if hasattr(entity.status, "value") else entity.status,
            t_file_url=entity.file_url,
            t_error_message=entity.error_message,
            t_session_id=entity.session_id,
            t_trace_id=entity.trace_id,
        )
        self._session.add(model)
        self._session.flush()
        logger.info(f"上传任务已创建 | task_id={entity.task_id}")
        return entity

    def get_by_id(self, task_id: str) -> UploadTask | None:
        stmt = select(UploadTaskModel).where(UploadTaskModel.t_task_id == task_id)
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._model_to_entity(model)

    def get_by_user(self, user_id: str, limit: int = 20, offset: int = 0) -> list[UploadTask]:
        stmt = (
            select(UploadTaskModel)
            .where(UploadTaskModel.t_user_id == user_id)
            .order_by(UploadTaskModel.t_created_at.desc())
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
        stmt = select(UploadTaskModel).where(UploadTaskModel.t_task_id == task_id)
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        model.t_status = status
        if file_url is not None:
            model.t_file_url = file_url
        if error_message is not None:
            model.t_error_message = error_message

        self._session.flush()
        logger.info(f"上传任务状态已更新 | task_id={task_id} | status={status}")
        return self._model_to_entity(model)

    def count_by_user(self, user_id: str) -> int:
        stmt = select(func.count()).where(UploadTaskModel.t_user_id == user_id)
        result = self._session.execute(stmt)
        return result.scalar() or 0

    def _model_to_entity(self, model: UploadTaskModel) -> UploadTask:
        return UploadTask(
            task_id=model.t_task_id,
            user_id=model.t_user_id,
            file_name=model.t_file_name,
            file_type=FileType(model.t_file_type),
            file_size=model.t_file_size,
            content_type=model.t_content_type,
            status=UploadStatus(model.t_status),
            file_url=model.t_file_url,
            error_message=model.t_error_message,
            session_id=model.t_session_id,
            trace_id=model.t_trace_id,
        )


__all__ = ["UploadTaskRepository"]
