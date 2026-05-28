#!/usr/bin/env python
# 文件名: media_history_service.py
# 作者: wuhao
# 日期: 2026_05_28_13:59:23
# 描述: Agent 媒体历史服务, 统一查询和删除图片、音乐、视频生成记录

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from infrastructure.database.models import ImageRecordModel, MusicRecordModel, VideoRecordModel


class MediaHistoryService:
    """
    Agent 媒体历史服务类, 统一处理图片、音乐、视频记录查询与删除.
    """

    def __init__(self, session: Session) -> None:
        """
        初始化媒体历史服务.

        参数:
            session (Session): 数据库会话.

        返回值:
            None.

        异常:
            无.
        """
        self._session = session

    def list_user_media_records(self, user_id: str, limit: int = 100) -> dict[str, list[dict[str, Any]]]:
        """
        查询用户的全部媒体历史记录.

        参数:
            user_id (str): 用户 ID.
            limit (int): 单类媒体最大返回数量.

        返回值:
            dict[str, list[dict[str, Any]]]: 按媒体类型分组的历史记录.

        异常:
            无.
        """
        image_records = (
            self._session.execute(
                select(ImageRecordModel)
                .where(
                    and_(
                        ImageRecordModel.t_user_id == user_id,
                        ImageRecordModel.t_deleted_at.is_(None),
                    )
                )
                .order_by(ImageRecordModel.t_created_at.desc())
                .limit(limit)
            )
            .scalars()
            .all()
        )
        music_records = (
            self._session.execute(
                select(MusicRecordModel)
                .where(
                    and_(
                        MusicRecordModel.t_user_id == user_id,
                        MusicRecordModel.t_deleted_at.is_(None),
                    )
                )
                .order_by(MusicRecordModel.t_created_at.desc())
                .limit(limit)
            )
            .scalars()
            .all()
        )
        video_records = (
            self._session.execute(
                select(VideoRecordModel)
                .where(
                    and_(
                        VideoRecordModel.t_user_id == user_id,
                        VideoRecordModel.t_deleted_at.is_(None),
                    )
                )
                .order_by(VideoRecordModel.t_created_at.desc())
                .limit(limit)
            )
            .scalars()
            .all()
        )

        return {
            "images": [self._serialize_image_record(record) for record in image_records],
            "music": [self._serialize_music_record(record) for record in music_records],
            "videos": [self._serialize_video_record(record) for record in video_records],
        }

    def delete_media_record(self, media_type: str, task_id: str, user_id: str, operator_ip: str) -> bool:
        """
        软删除单条媒体记录.

        参数:
            media_type (str): 媒体类型.
            task_id (str): 任务 ID.
            user_id (str): 当前用户 ID.
            operator_ip (str): 操作来源 IP.

        返回值:
            bool: 是否删除成功.

        异常:
            无.
        """
        model = self._find_model(media_type=media_type, task_id=task_id, user_id=user_id)
        if model is None:
            return False
        model.t_deleted_at = datetime.now()
        model.t_deleted_by = user_id
        model.t_deleted_ip = operator_ip
        self._session.flush()
        return True

    def batch_delete_media_records(
        self,
        media_type: str,
        task_ids: list[str],
        user_id: str,
        operator_ip: str,
    ) -> int:
        """
        批量软删除媒体记录.

        参数:
            media_type (str): 媒体类型.
            task_ids (list[str]): 任务 ID 列表.
            user_id (str): 当前用户 ID.
            operator_ip (str): 操作来源 IP.

        返回值:
            int: 删除成功的数量.

        异常:
            无.
        """
        count = 0
        for task_id in task_ids:
            if self.delete_media_record(
                media_type=media_type, task_id=task_id, user_id=user_id, operator_ip=operator_ip
            ):
                count += 1
        return count

    def _find_model(self, media_type: str, task_id: str, user_id: str) -> Any | None:
        """
        根据媒体类型定位 ORM 模型记录.

        参数:
            media_type (str): 媒体类型.
            task_id (str): 任务 ID.
            user_id (str): 当前用户 ID.

        返回值:
            Any | None: 对应的 ORM 模型或 None.

        异常:
            无.
        """
        model_class = self._get_model_class(media_type)
        if model_class is None:
            return None
        return self._session.execute(
            select(model_class).where(
                and_(
                    model_class.t_task_id == task_id,
                    model_class.t_user_id == user_id,
                    model_class.t_deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()

    @staticmethod
    def _get_model_class(media_type: str) -> type[Any] | None:
        """
        将媒体类型映射到 ORM 模型类.

        参数:
            media_type (str): 媒体类型.

        返回值:
            type[Any] | None: ORM 模型类或 None.

        异常:
            无.
        """
        mapping: dict[str, type[Any]] = {
            "image": ImageRecordModel,
            "music": MusicRecordModel,
            "video": VideoRecordModel,
        }
        return mapping.get(media_type)

    @staticmethod
    def _serialize_image_record(record: ImageRecordModel) -> dict[str, Any]:
        """
        序列化图片记录.

        参数:
            record (ImageRecordModel): 图片记录模型.

        返回值:
            dict[str, Any]: 前端可消费的图片记录字典.

        异常:
            无.
        """
        return {
            "task_id": record.t_task_id,
            "media_type": "image",
            "prompt": record.t_prompt,
            "url": record.t_result_url,
            "public_url": record.t_result_url,
            "object_key": None,
            "status": record.t_status,
            "model": record.t_model,
            "created_at": record.t_created_at.isoformat() if record.t_created_at else "",
            "updated_at": record.t_updated_at.isoformat() if record.t_updated_at else "",
            "meta": {
                "width": record.t_width,
                "height": record.t_height,
                "steps": record.t_steps,
            },
        }

    @staticmethod
    def _serialize_music_record(record: MusicRecordModel) -> dict[str, Any]:
        """
        序列化音乐记录.

        参数:
            record (MusicRecordModel): 音乐记录模型.

        返回值:
            dict[str, Any]: 前端可消费的音乐记录字典.

        异常:
            无.
        """
        return {
            "task_id": record.t_task_id,
            "media_type": "music",
            "prompt": record.t_prompt,
            "url": record.t_result_url,
            "public_url": record.t_public_url,
            "object_key": record.t_object_key,
            "status": record.t_status,
            "model": record.t_model,
            "created_at": record.t_created_at.isoformat() if record.t_created_at else "",
            "updated_at": record.t_updated_at.isoformat() if record.t_updated_at else "",
            "meta": {
                "duration_seconds": record.t_duration_seconds,
                "steps": record.t_steps,
                "guidance_scale": record.t_guidance_scale,
                "progress_message": record.t_progress_message,
            },
        }

    @staticmethod
    def _serialize_video_record(record: VideoRecordModel) -> dict[str, Any]:
        """
        序列化视频记录.

        参数:
            record (VideoRecordModel): 视频记录模型.

        返回值:
            dict[str, Any]: 前端可消费的视频记录字典.

        异常:
            无.
        """
        return {
            "task_id": record.t_task_id,
            "media_type": "video",
            "prompt": record.t_prompt,
            "url": record.t_result_url,
            "public_url": record.t_public_url,
            "object_key": record.t_object_key,
            "status": record.t_status,
            "model": record.t_model,
            "created_at": record.t_created_at.isoformat() if record.t_created_at else "",
            "updated_at": record.t_updated_at.isoformat() if record.t_updated_at else "",
            "meta": {
                "frames": record.t_frames,
                "resolution": record.t_resolution,
                "stage": record.t_stage,
                "current_step": record.t_current_step,
                "total_steps": record.t_total_steps,
                "total_time_seconds": record.t_total_time_seconds,
            },
        }
