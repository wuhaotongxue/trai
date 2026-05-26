#!/usr/bin/env python
# 文件名: upload.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 文件上传用例

from __future__ import annotations

import os
import uuid
from dataclasses import dataclass

from fastapi import UploadFile

from application.common.base_usecase import UseCase
from domain.media.entities import FileType, UploadTask
from infrastructure.storage.s3_storage import S3StorageService


@dataclass
class UploadInput:
    """上传输入"""

    file: UploadFile
    folder: str = "general"


@dataclass
class UploadOutput:
    """上传输出"""

    task_id: str
    filename: str
    file_url: str
    file_type: str
    file_size: int
    status: str


class FileUploadUseCase(UseCase[UploadInput, UploadOutput]):
    """文件上传用例"""

    def __init__(self, storage_service: S3StorageService | None = None) -> None:
        self._storage = storage_service or S3StorageService()

    def _get_file_type(self, content_type: str) -> FileType:
        """根据 MIME 类型判断文件类型"""
        if content_type.startswith("image/"):
            return FileType.IMAGE
        elif content_type.startswith("video/"):
            return FileType.VIDEO
        elif content_type.startswith("audio/"):
            return FileType.AUDIO
        elif content_type in [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]:
            return FileType.DOCUMENT
        elif content_type.startswith("text/"):
            return FileType.CODE
        return FileType.OTHER

    def _generate_object_key(self, filename: str, folder: str) -> str:
        """生成 S3 对象键"""
        ext = os.path.splitext(filename)[1].lower()
        unique_name = f"{uuid.uuid4().hex}{ext}"
        return f"{folder}/{unique_name}"

    def _validate_file(self, filename: str, content_type: str) -> None:
        """校验文件类型和扩展名"""
        # 禁止上传可执行文件
        forbidden_exts = [".exe", ".sh", ".py", ".js", ".jar", ".dll", ".so", ".bat", ".cmd", ".msi"]
        ext = os.path.splitext(filename)[1].lower()
        if ext in forbidden_exts:
            raise ValueError(f"禁止上传可执行文件: {ext}")

        # 简单的双重校验: 如果声称是图片, 必须有图片扩展名
        if content_type.startswith("image/"):
            if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"]:
                raise ValueError("图片扩展名与 Content-Type 不匹配")
        elif content_type.startswith("video/"):
            if ext not in [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv"]:
                raise ValueError("视频扩展名与 Content-Type 不匹配")

    async def execute(self, input_data: UploadInput) -> UploadOutput:
        """执行文件上传"""
        filename = input_data.file.filename or "unknown"
        content_type = input_data.file.content_type or "application/octet-stream"

        self._validate_file(filename, content_type)

        task = UploadTask(
            filename=filename,
            file_size=0,
            content_type=content_type,
            file_type=self._get_file_type(content_type),
        )

        try:
            contents = await input_data.file.read()
            task.file_size = len(contents)

            object_key = self._generate_object_key(task.filename, input_data.folder)
            file_url = self._storage.upload_bytes(
                data=contents,
                object_key=object_key,
                content_type=task.content_type,
            )

            task.mark_completed(object_key, file_url)

            return UploadOutput(
                task_id=task.task_id,
                filename=task.filename,
                file_url=file_url,
                file_type=task.file_type.value,
                file_size=task.file_size,
                status=task.status.value,
            )

        except Exception as e:
            task.mark_failed(str(e))
            raise


__all__ = ["FileUploadUseCase", "UploadInput", "UploadOutput"]
