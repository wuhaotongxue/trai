#!/usr/bin/env python
# 文件名: image_generation_repository.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 图片生成仓储实现

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.logger import logger
from domain.entities.image_generation import ImageGeneration
from domain.interfaces.image_generation_interfaces import (
    IImageGenerationRepository,
)
from infrastructure.database.models import ImageGenerationModel


class ImageGenerationRepository(IImageGenerationRepository):
    """图片生成仓储实现"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, entity: ImageGeneration) -> ImageGeneration:
        model = ImageGenerationModel(
            t_task_id=entity.task_id,
            t_user_id=entity.user_id,
            t_prompt=entity.prompt,
            t_negative_prompt=entity.negative_prompt,
            t_style=entity.style.value if hasattr(entity.style, "value") else entity.style,
            t_size=entity.size.value if hasattr(entity.size, "value") else entity.size,
            t_status=entity.status.value,
            t_result_url=entity.result_url,
            t_error_message=entity.error_message,
            t_model=entity.model,
            t_width=entity.width,
            t_height=entity.height,
            t_steps=entity.steps,
            t_seed=entity.seed,
            t_session_id=entity.session_id,
            t_trace_id=entity.trace_id,
        )
        self._session.add(model)
        self._session.flush()
        logger.info(f"图片生成任务已创建 | task_id={entity.task_id}")
        return entity

    def get_by_id(self, task_id: str) -> ImageGeneration | None:
        stmt = select(ImageGenerationModel).where(ImageGenerationModel.t_task_id == task_id)
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._model_to_entity(model)

    def get_by_user(self, user_id: str, limit: int = 20, offset: int = 0) -> list[ImageGeneration]:
        stmt = (
            select(ImageGenerationModel)
            .where(ImageGenerationModel.t_user_id == user_id)
            .order_by(ImageGenerationModel.t_created_at.desc())
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
        result_url: str | None = None,
        error_message: str | None = None,
    ) -> ImageGeneration | None:
        stmt = select(ImageGenerationModel).where(ImageGenerationModel.t_task_id == task_id)
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        model.t_status = status
        if result_url is not None:
            model.t_result_url = result_url
        if error_message is not None:
            model.t_error_message = error_message

        self._session.flush()
        logger.info(f"图片生成任务状态已更新 | task_id={task_id} | status={status}")
        return self._model_to_entity(model)

    def count_by_user(self, user_id: str) -> int:
        stmt = select(func.count()).where(ImageGenerationModel.t_user_id == user_id)
        result = self._session.execute(stmt)
        return result.scalar() or 0

    def _model_to_entity(self, model: ImageGenerationModel) -> ImageGeneration:
        from domain.entities.image_generation import (
            ImageGeneration,
            ImageSize,
            ImageStatus,
            ImageStyle,
        )

        return ImageGeneration(
            task_id=model.t_task_id,
            user_id=model.t_user_id,
            prompt=model.t_prompt,
            negative_prompt=model.t_negative_prompt,
            style=ImageStyle(model.t_style),
            size=ImageSize(model.t_size),
            status=ImageStatus(model.t_status),
            result_url=model.t_result_url,
            error_message=model.t_error_message,
            model=model.t_model,
            width=model.t_width,
            height=model.t_height,
            steps=model.t_steps,
            seed=model.t_seed,
            session_id=model.t_session_id,
            trace_id=model.t_trace_id,
        )


__all__ = ["ImageGenerationRepository"]
