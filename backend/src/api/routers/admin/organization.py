#!/usr/bin/env python
# 文件名: organization.py
# 作者: wuhao
# 日期: 2026_04_15
# 描述: 组织架构管理接口

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from application.usecases.organization_sync import SyncOrganizationUseCase
from core.logger import get_logger
from infrastructure.database.database import get_session
from infrastructure.repositories.department_repository import DepartmentRepository
from infrastructure.repositories.user_repository import UserRepository

logger = get_logger()
router = APIRouter()


class SyncResult(BaseModel):
    """同步结果响应"""

    departments: int = Field(description="同步部门数量")
    users: int = Field(description="同步用户数量")
    status: str = Field(description="同步状态")


@router.post("/sync", response_model=SyncResult, summary="同步组织架构")
async def sync_organization(session: Session = Depends(get_session)) -> SyncResult:
    """从企业微信同步组织架构

    Returns:
        SyncResult: 同步结果摘要
    """
    try:
        user_repo = UserRepository(session)
        dept_repo = DepartmentRepository(session)
        usecase = SyncOrganizationUseCase(session, user_repo, dept_repo)

        result = await usecase.execute()

        return SyncResult(
            departments=result["departments"],
            users=result["users"],
            status=result["status"],
        )
    except Exception as e:
        logger.error(f"组织架构同步失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": f"同步失败: {str(e)}"},
        )


__all__ = ["router"]
