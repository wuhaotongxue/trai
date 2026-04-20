#!/usr/bin/env python
# 文件名: upload.py
# 作者: wuhao
# 日期: 2026_04_17_08:28:46
# 描述: 媒体上传接口

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field

from api.deps import CurrentUser
from application.usecases.upload import FileUploadUseCase, UploadInput
from infrastructure.repositories.upload_task_repository import UploadTaskRepository
from infrastructure.storage.s3_storage import S3StorageService

router = APIRouter()


class UploadResponse(BaseModel):
    """上传响应"""

    task_id: str = Field(description="任务 ID")
    filename: str = Field(description="文件名")
    file_url: str = Field(description="文件 URL")
    file_type: str = Field(description="文件类型")
    file_size: int = Field(description="文件大小(字节)")
    content_type: str = Field(description="MIME 类型")


class FileInfo(BaseModel):
    """文件信息"""

    filename: str = Field(description="文件名")
    file_url: str = Field(description="文件 URL")
    file_type: str = Field(description="文件类型")
    file_size: int = Field(description="文件大小(字节)")
    content_type: str = Field(description="MIME 类型")
    created_at: str = Field(description="上传时间")


@router.post(
    "/upload",
    response_model=UploadResponse,
    tags=["媒体"],
    summary="上传文件",
    description="上传单个文件到存储, 返回文件 URL 与任务信息.",
)
async def upload_file(
    file: UploadFile = File(..., description="上传文件"),
    folder: Annotated[str, Form(description="存储文件夹")] = "general",
    current_user: CurrentUser = None,
) -> UploadResponse:
    """文件上传接口

    Args:
        file: 上传的文件
        folder: 存储文件夹(默认 general)
        current_user: 当前登录用户

    Returns:
        UploadResponse: 上传结果

    Raises:
        HTTPException: 上传失败(500)
    """
    from infrastructure.database import get_session

    user_id = current_user.get("user_id", "anonymous") if current_user else "anonymous"

    try:
        with get_session() as db:
            repo = UploadTaskRepository(db)
            storage = S3StorageService()
            use_case = FileUploadUseCase(storage_service=storage)

            input_data = UploadInput(file=file, folder=folder)
            result = await use_case.execute(input_data)

            if repo:
                from domain.entities.upload_task import UploadStatus, UploadTask

                task = UploadTask(
                    filename=result.filename,
                    file_size=result.file_size,
                    content_type=result.content_type,
                    file_type=result.file_type,
                    user_id=user_id,
                    status=UploadStatus.COMPLETED,
                    file_url=result.file_url,
                )
                repo.create(task)

            return UploadResponse(
                task_id=result.task_id,
                filename=result.filename,
                file_url=result.file_url,
                file_type=result.file_type,
                file_size=result.file_size,
                content_type=result.content_type,
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": f"文件上传失败: {str(e)}"},
        )


@router.post(
    "/upload/batch",
    tags=["媒体"],
    summary="批量上传文件",
    description="批量上传多个文件, 默认最多 10 个.",
)
async def upload_batch(
    files: list[UploadFile] = File(..., description="上传的文件列表(最多 10 个)"),
    folder: Annotated[str, Form(description="存储文件夹")] = "general",
    current_user: CurrentUser = None,
) -> dict[str, Any]:
    """批量文件上传接口

    Args:
        files: 文件列表
        folder: 存储文件夹
        current_user: 当前登录用户

    Returns:
        dict: 上传结果列表

    Raises:
        HTTPException: 文件数量超限(400)
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": "单次上传文件数量不能超过 10 个"},
        )

    results = []
    errors = []

    for idx, file in enumerate(files):
        try:
            storage = S3StorageService()
            use_case = FileUploadUseCase(storage_service=storage)

            input_data = UploadInput(file=file, folder=folder)
            result = await use_case.execute(input_data)

            results.append(
                UploadResponse(
                    task_id=result.task_id,
                    filename=result.filename,
                    file_url=result.file_url,
                    file_type=result.file_type,
                    file_size=result.file_size,
                    content_type=result.status,
                )
            )

        except Exception as e:
            errors.append(
                {
                    "index": idx,
                    "filename": file.filename,
                    "error": str(e),
                }
            )

    return {
        "success": len(results),
        "failed": len(errors),
        "results": [r.model_dump() for r in results],
        "errors": errors,
    }


@router.get(
    "/upload/presign",
    tags=["媒体"],
    summary="获取预签名 URL",
    description="获取对象的预签名 URL, 用于直传或下载.",
)
async def get_presigned_url(
    object_key: Annotated[str, Query(description="S3 对象键")],
    expires_in: Annotated[int, Query(ge=60, le=3600, description="过期时间(秒)")] = 300,
    current_user: CurrentUser = None,
) -> dict[str, Any]:
    """获取预签名 URL(用于直接上传或下载)

    Args:
        object_key: S3 对象键
        expires_in: 过期时间(秒)
        current_user: 当前登录用户

    Returns:
        dict: 预签名 URL
    """
    try:
        storage = S3StorageService()
        url = storage.get_presigned_url(object_key, expires_in=expires_in)

        return {
            "object_key": object_key,
            "presigned_url": url,
            "expires_in": expires_in,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": f"获取预签名 URL 失败: {str(e)}"},
        )


@router.delete(
    "/upload/{object_key:path}",
    tags=["媒体"],
    summary="删除文件",
    description="删除指定对象, 仅管理员允许.",
)
async def delete_file(
    object_key: str,
    current_user: CurrentUser = None,
) -> dict[str, Any]:
    """删除文件

    Args:
        object_key: S3 对象键
        current_user: 当前登录用户

    Returns:
        dict: 删除结果
    """
    role = current_user.get("role", "normal") if current_user else "normal"

    # 只有管理员可以删除文件
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "权限不足,仅管理员可删除文件"},
        )

    try:
        storage = S3StorageService()
        success = storage.delete_file(object_key)

        if success:
            return {"message": "文件已删除", "object_key": object_key}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": 404, "message": "文件不存在或删除失败"},
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": f"删除文件失败: {str(e)}"},
        )


__all__ = ["router"]
