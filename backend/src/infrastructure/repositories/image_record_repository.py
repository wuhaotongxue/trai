#!/usr/bin/env python
# 文件名: image_record_repository.py
# 作者: wuhao
# 日期: 2026_05_20_0830
# 描述: 图片记录仓储实现，支持完整 CRUD 和管理后台多条件查询


from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from core.logger import logger
from domain.entities.image_record import ImageRecord, ImageRecordStatus, ImageRecordType
from domain.interfaces.image_record_interfaces import IImageRecordRepository
from infrastructure.database.models import ImageRecordModel


class ImageRecordRepository(IImageRecordRepository):
    """图片记录仓储实现"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, entity: ImageRecord) -> ImageRecord:
        """创建图片记录"""
        model = self._entity_to_model(entity)
        self._session.add(model)
        self._session.flush()
        logger.info(f"图片记录已创建 | task_id={entity.task_id} | type={entity.record_type.value}")
        return entity

    def get_by_id(self, task_id: str) -> ImageRecord | None:
        """根据 task_id 查询记录"""
        stmt = select(ImageRecordModel).where(
            and_(
                ImageRecordModel.t_task_id == task_id,
                ImageRecordModel.t_deleted_at.is_(None),
            )
        )
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return self._model_to_entity(model)

    def get_by_user(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
        record_type: str | None = None,
    ) -> list[ImageRecord]:
        """根据用户 ID 查询记录列表"""
        conditions = [
            ImageRecordModel.t_user_id == user_id,
            ImageRecordModel.t_deleted_at.is_(None),
        ]
        if record_type:
            conditions.append(ImageRecordModel.t_record_type == record_type)

        stmt = (
            select(ImageRecordModel)
            .where(and_(*conditions))
            .order_by(ImageRecordModel.t_created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = self._session.execute(stmt)
        models = result.scalars().all()
        return [self._model_to_entity(m) for m in models]

    def update_status(
        self,
        task_id: str,
        status: ImageRecordStatus,
        result_url: str = "",
        result_base64: str = "",
        error_message: str = "",
    ) -> ImageRecord | None:
        """更新任务状态和结果"""
        stmt = select(ImageRecordModel).where(
            and_(
                ImageRecordModel.t_task_id == task_id,
                ImageRecordModel.t_deleted_at.is_(None),
            )
        )
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return None

        model.t_status = status.value
        if result_url:
            model.t_result_url = result_url
        if result_base64:
            model.t_result_base64 = result_base64
        if error_message:
            model.t_error_message = error_message
        model.t_updated_at = datetime.now()

        if status in (ImageRecordStatus.COMPLETED, ImageRecordStatus.FAILED):
            model.t_completed_at = datetime.now()

        self._session.flush()
        logger.info(f"图片记录状态已更新 | task_id={task_id} | status={status.value}")
        return self._model_to_entity(model)

    def update_notify_status(self, task_id: str, notified: bool, notify_status: str) -> None:
        """更新通知状态"""
        stmt = select(ImageRecordModel).where(
            and_(
                ImageRecordModel.t_task_id == task_id,
                ImageRecordModel.t_deleted_at.is_(None),
            )
        )
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is not None:
            model.t_feishu_notified = notified
            model.t_notify_status = notify_status
            model.t_updated_at = datetime.now()
            self._session.flush()

    def count_by_user(self, user_id: str, record_type: str | None = None) -> int:
        """统计用户生成图片数量"""
        conditions = [
            ImageRecordModel.t_user_id == user_id,
            ImageRecordModel.t_deleted_at.is_(None),
        ]
        if record_type:
            conditions.append(ImageRecordModel.t_record_type == record_type)

        stmt = select(func.count()).where(and_(*conditions))
        result = self._session.execute(stmt)
        return result.scalar() or 0

    def delete(self, task_id: str) -> bool:
        """软删除记录"""
        stmt = select(ImageRecordModel).where(
            and_(
                ImageRecordModel.t_task_id == task_id,
                ImageRecordModel.t_deleted_at.is_(None),
            )
        )
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return False
        model.t_deleted_at = datetime.now()
        self._session.flush()
        return True

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
        conditions: list[Any] = [ImageRecordModel.t_deleted_at.is_(None)]

        if keyword:
            conditions.append(
                or_(
                    ImageRecordModel.t_task_id.ilike(f"%{keyword}%"),
                    ImageRecordModel.t_username.ilike(f"%{keyword}%"),
                    ImageRecordModel.t_prompt.ilike(f"%{keyword}%"),
                )
            )
        if record_type:
            conditions.append(ImageRecordModel.t_record_type == record_type)
        if status:
            conditions.append(ImageRecordModel.t_status == status)
        if user_id:
            conditions.append(ImageRecordModel.t_user_id == user_id)
        if start_date:
            conditions.append(ImageRecordModel.t_created_at >= datetime.fromisoformat(start_date))
        if end_date:
            conditions.append(ImageRecordModel.t_created_at <= datetime.fromisoformat(end_date))

        count_stmt = select(func.count()).where(and_(*conditions))
        count_result = self._session.execute(count_stmt)
        total = count_result.scalar() or 0

        list_stmt = (
            select(ImageRecordModel)
            .where(and_(*conditions))
            .order_by(ImageRecordModel.t_created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        list_result = self._session.execute(list_stmt)
        models = list_result.scalars().all()

        return [self._model_to_entity(m) for m in models], total

    def admin_delete(
        self,
        task_id: str,
        operator_id: str,
        operator_name: str,
        operator_ip: str,
    ) -> bool:
        """管理后台删除"""
        stmt = select(ImageRecordModel).where(
            and_(
                ImageRecordModel.t_task_id == task_id,
                ImageRecordModel.t_deleted_at.is_(None),
            )
        )
        result = self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return False
        model.t_deleted_at = datetime.now()
        model.t_deleted_by = operator_id
        model.t_deleted_ip = operator_ip
        self._session.flush()
        logger.info(
            f"管理后台删除图片记录 | task_id={task_id} | operator={operator_name}({operator_id}) | ip={operator_ip}"
        )
        return True

    def admin_batch_delete(
        self,
        task_ids: list[str],
        operator_id: str,
        operator_name: str,
        operator_ip: str,
    ) -> int:
        """管理后台批量删除"""
        now = datetime.now()
        stmt = (
            select(ImageRecordModel)
            .where(
                and_(
                    ImageRecordModel.t_task_id.in_(task_ids),
                    ImageRecordModel.t_deleted_at.is_(None),
                )
            )
        )
        result = self._session.execute(stmt)
        models = result.scalars().all()
        for model in models:
            model.t_deleted_at = now
            model.t_deleted_by = operator_id
            model.t_deleted_ip = operator_ip
        self._session.flush()
        count = len(models)
        logger.info(
            f"管理后台批量删除图片记录 | count={count} | operator={operator_name}({operator_id}) | ip={operator_ip}"
        )
        return count

    def _model_to_entity(self, model: ImageRecordModel) -> ImageRecord:
        """Model 转 Entity"""
        return ImageRecord(
            task_id=model.t_task_id,
            record_type=ImageRecordType(model.t_record_type),
            user_id=model.t_user_id,
            username=model.t_username or "",
            client_ip=model.t_client_ip or "",
            request_ip=model.t_request_ip or "",
            user_agent=model.t_user_agent or "",
            is_guest=model.t_is_guest,
            tenant_id=model.t_tenant_id or "",
            prompt=model.t_prompt,
            source_image_url=model.t_source_image_url or "",
            source_image_url_2=model.t_source_image_url_2 or "",
            source_image_object_key=model.t_source_image_object_key or "",
            source_image_object_key_2=model.t_source_image_object_key_2 or "",
            result_url=model.t_result_url or "",
            result_base64=model.t_result_base64 or "",
            status=ImageRecordStatus(model.t_status),
            error_message=model.t_error_message or "",
            model=model.t_model or "",
            width=model.t_width,
            height=model.t_height,
            steps=model.t_steps,
            seed=model.t_seed,
            session_id=model.t_session_id or "",
            trace_id=model.t_trace_id or "",
            created_at=model.t_created_at,
            updated_at=model.t_updated_at,
            completed_at=model.t_completed_at,
            created_by=model.t_created_by or "",
            updated_by=model.t_updated_by or "",
            feishu_notified=model.t_feishu_notified,
            notify_status=model.t_notify_status,
            extra_data=model.t_extra_data or {},
        )

    def _entity_to_model(self, entity: ImageRecord) -> ImageRecordModel:
        """Entity 转 Model"""
        return ImageRecordModel(
            t_task_id=entity.task_id,
            t_record_type=entity.record_type.value,
            t_user_id=entity.user_id,
            t_username=entity.username or None,
            t_client_ip=entity.client_ip or None,
            t_request_ip=entity.request_ip or None,
            t_user_agent=entity.user_agent or None,
            t_is_guest=entity.is_guest,
            t_tenant_id=entity.tenant_id or None,
            t_prompt=entity.prompt,
            t_source_image_url=entity.source_image_url or None,
            t_source_image_url_2=entity.source_image_url_2 or None,
            t_source_image_object_key=entity.source_image_object_key or None,
            t_source_image_object_key_2=entity.source_image_object_key_2 or None,
            t_result_url=entity.result_url or None,
            t_result_base64=entity.result_base64 or None,
            t_status=entity.status.value,
            t_error_message=entity.error_message or None,
            t_model=entity.model or None,
            t_width=entity.width,
            t_height=entity.height,
            t_steps=entity.steps,
            t_seed=entity.seed,
            t_session_id=entity.session_id or None,
            t_trace_id=entity.trace_id or None,
            t_feishu_notified=entity.feishu_notified,
            t_notify_status=entity.notify_status,
            t_extra_data=entity.extra_data,
            t_created_at=entity.created_at,
            t_created_by=entity.created_by or None,
            t_updated_at=entity.updated_at,
            t_updated_by=entity.updated_by or None,
            t_completed_at=entity.completed_at,
        )


__all__ = ["ImageRecordRepository"]
