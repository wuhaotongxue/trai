#!/usr/bin/env python
# 文件名: backup.py
# 作者: wuhao
# 日期: 2026_04_22_11:10:00
# 描述: 数据库备份管理路由

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from api.deps import require_admin
from infrastructure.database.backup_service import BackupService
from infrastructure.storage.s3_storage import S3StorageService

router = APIRouter(prefix="/system/database", tags=["系统管理"])


class BackupResponse(BaseModel):
    """备份响应"""

    status: str = Field(description="状态")
    filename: str | None = Field(default=None, description="文件名")
    url: str | None = Field(default=None, description="下载链接")
    error: str | None = Field(default=None, description="错误信息")


@router.post("/backup", response_model=BackupResponse, summary="立即备份数据库")
async def trigger_backup(
    current_user: Annotated[dict, Depends(require_admin)],
) -> BackupResponse:
    """手动触发数据库备份"""
    try:
        service = BackupService()
        result = service.run_backup()
        return BackupResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/backups", summary="获取备份历史")
async def list_backups(
    current_user: Annotated[dict, Depends(require_admin)],
) -> list[dict]:
    """获取备份文件列表(从 S3)"""
    try:
        service = S3StorageService()
        return service.list_objects(prefix="backups/db/")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
