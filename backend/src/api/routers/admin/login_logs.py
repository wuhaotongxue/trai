#!/usr/bin/env python
# 文件名: login_logs.py
# 作者: wuhao
# 日期: 2026_05_15_15:00:00
# 描述: 登录日志管理接口

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from infrastructure.database import get_db_session
from infrastructure.database.models import LoginLogModel
from infrastructure.repositories.login_log_repository import LoginLogRepository

router = APIRouter()


class LoginLogResponse(BaseModel):
    """登录日志响应"""

    log_id: str = Field(description="日志ID")
    user_id: str = Field(description="用户ID")
    username: str = Field(description="用户名")
    display_name: str | None = Field(description="显示名称")
    role: str = Field(description="用户角色")
    tenant_id: str | None = Field(description="租户ID")
    login_status: str = Field(description="登录状态")
    failure_reason: str | None = Field(description="失败原因")
    client_ip: str = Field(description="客户端IP")
    user_agent: str | None = Field(description="User-Agent")
    device_type: str | None = Field(description="设备类型")
    browser: str | None = Field(description="浏览器")
    os: str | None = Field(description="操作系统")
    location: str | None = Field(description="地理位置")
    created_at: str = Field(description="登录时间")


class LoginLogListResponse(BaseModel):
    """登录日志列表响应"""

    logs: list[LoginLogResponse] = Field(description="登录日志列表")
    total: int = Field(description="总数")
    page: int = Field(description="当前页")
    page_size: int = Field(description="每页数量")


class LoginStatsResponse(BaseModel):
    """登录统计响应"""

    total: int = Field(description="总登录次数")
    success: int = Field(description="成功次数")
    failure: int = Field(description="失败次数")
    success_rate: float = Field(description="成功率")


@router.get("/admin/login-logs", response_model=LoginLogListResponse, tags=["管理"])
async def get_login_logs(
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
    user_id: Annotated[str | None, Query(description="用户ID")] = None,
    login_status: Annotated[str | None, Query(description="登录状态")] = None,
    page: Annotated[int, Query(ge=1, description="页码")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="每页数量")] = 20,
) -> LoginLogListResponse:
    """获取登录日志列表(管理员)

    Args:
        current_user: 当前登录用户
        session: 数据库会话
        user_id: 用户ID(可选)
        login_status: 登录状态(可选)
        page: 页码
        page_size: 每页数量

    Returns:
        LoginLogListResponse: 登录日志列表
    """
    # 权限检查
    role = current_user.get("role", "normal")
    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail={"code": 403, "message": "无权访问"},
        )

    login_log_repo = LoginLogRepository(session)
    offset = (page - 1) * page_size

    logs = login_log_repo.get_logs(
        user_id=user_id,
        login_status=login_status,
        limit=page_size,
        offset=offset,
    )

    # 转换为响应格式
    log_responses = []
    for log in logs:
        log_responses.append(
            LoginLogResponse(
                log_id=log.t_log_id,
                user_id=log.t_user_id,
                username=log.t_username,
                display_name=log.t_display_name,
                role=log.t_role,
                tenant_id=log.t_tenant_id,
                login_status=log.t_login_status,
                failure_reason=log.t_failure_reason,
                client_ip=log.t_client_ip,
                user_agent=log.t_user_agent,
                device_type=log.t_device_type,
                browser=log.t_browser,
                os=log.t_os,
                location=log.t_location,
                created_at=log.t_created_at.isoformat() if log.t_created_at else "",
            )
        )

    return LoginLogListResponse(
        logs=log_responses,
        total=len(log_responses),
        page=page,
        page_size=page_size,
    )


@router.get("/admin/login-logs/stats", response_model=LoginStatsResponse, tags=["管理"])
async def get_login_stats(
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
    user_id: Annotated[str | None, Query(description="用户ID")] = None,
    days: Annotated[int, Query(ge=1, le=365, description="统计天数")] = 30,
) -> LoginStatsResponse:
    """获取登录统计(管理员)

    Args:
        current_user: 当前登录用户
        session: 数据库会话
        user_id: 用户ID(可选)
        days: 统计天数

    Returns:
        LoginStatsResponse: 登录统计信息
    """
    # 权限检查
    role = current_user.get("role", "normal")
    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail={"code": 403, "message": "无权访问"},
        )

    login_log_repo = LoginLogRepository(session)

    # 如果指定了用户ID，获取该用户的统计
    if user_id:
        stats = login_log_repo.get_user_login_stats(user_id, days)
    else:
        # 获取所有用户的统计(简化版)
        from datetime import timedelta

        from sqlalchemy import func, select

        since = datetime.now() - timedelta(days=days)

        stmt = select(
            func.count(LoginLogModel.t_id).label("total"),
            func.sum(func.case((LoginLogModel.t_login_status == "success", 1), else_=0)).label("success"),
            func.sum(func.case((LoginLogModel.t_login_status == "failure", 1), else_=0)).label("failure"),
        ).where(LoginLogModel.t_created_at >= since)

        result = session.execute(stmt).first()

        if result:
            stats = {
                "total": result.total or 0,
                "success": result.success or 0,
                "failure": result.failure or 0,
                "success_rate": round((result.success or 0) / (result.total or 1) * 100, 2),
            }
        else:
            stats = {"total": 0, "success": 0, "failure": 0, "success_rate": 0.0}

    return LoginStatsResponse(**stats)


__all__ = ["router"]
