#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: upload.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 媒体上传接口

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, File, Form, UploadFile

from trai.application.usecases.upload import FileUploadUseCase, UploadInput
from trai.infrastructure.storage.s3_storage import S3StorageService

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(..., description="上传文件"),
    folder: str = Form("general", description="存储文件夹"),
) -> dict[str, Any]:
    """文件上传接口

    Args:
        file: 上传的文件
        folder: 存储文件夹

    Returns:
        dict: 上传结果
    """
    storage = S3StorageService()
    use_case = FileUploadUseCase(storage_service=storage)

    input_data = UploadInput(file=file, folder=folder)
    result = await use_case.execute(input_data)

    return {
        "code": 0,
        "message": "上传成功",
        "data": {
            "task_id": result.task_id,
            "filename": result.filename,
            "file_url": result.file_url,
            "file_type": result.file_type,
            "file_size": result.file_size,
            "status": result.status,
        },
    }


__all__ = ["router"]
