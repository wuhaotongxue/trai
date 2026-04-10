#!/usr/bin/env python
# -*- coding: utf-8 -*-
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
            task_id=entity.task_id,
            user_id=entity.user_id,
            prompt=entity.prompt,
            negative_prompt=entity.negative_prompt,
            style=entity.style.value if hasattr(entity.style, "value") else entity.style,
            size=entity.size.value if hasattr(entity.size, "value") else entity.size,
            status=entity.status.value,
            result_url=entity.result_url,
            error_message=entity.error_message,
            model=entity.model,
            width=entity.width,
            height=entity.height,
            steps=entity.steps,
            seed=entity.seed,
            session_id=entity.session_id,
            trace_id=entity.trace_id,
        )
        self._session.add(model)
        self._session.flush()
        logger.info(f"图片生成任务已创建 | task_id={entity.task_id}")
        return entity

    def get_by_id(self, task_id: str) -> ImageGeneration | None:
        stmt = select(ImageGenerationModel).where(
            ImageGenerationModel.task_id == task_id
        )
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return self._model_to_entity(model)

    def get_by_user(
        self, user_id: str, limit: int = 20, offset: int = 0
    ) -> list[ImageGeneration]:
        stmt = (
            select(ImageGenerationModel)
            .where(ImageGenerationModel.user_id == user_id)
            .order_by(ImageGenerationModel.created_at.desc())
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
        stmt = select(ImageGenerationModel).where(
            ImageGenerationModel.task_id == task_id
        )
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        model.status = status
        if result_url is not None:
            model.result_url = result_url
        if error_message is not None:
            model.error_message = error_message

        self._session.flush()
        logger.info(
            f"图片生成任务状态已更新 | task_id={task_id} | status={status}"
        )
        return self._model_to_entity(model)

    def count_by_user(self, user_id: str) -> int:
        stmt = select(func.count()).where(
            ImageGenerationModel.user_id == user_id
        )
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
            task_id=model.task_id,
            user_id=model.user_id,
            prompt=model.prompt,
            negative_prompt=model.negative_prompt,
            style=ImageStyle(model.style),
            size=ImageSize(model.size),
            status=ImageStatus(model.status),
            result_url=model.result_url,
            error_message=model.error_message,
            model=model.model,
            width=model.width,
            height=model.height,
            steps=model.steps,
            seed=model.seed,
            session_id=model.session_id,
            trace_id=model.trace_id,
        )


__all__ = ["ImageGenerationRepository"]
