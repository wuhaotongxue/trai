#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: dashboard.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 管理后台 - 数据仪表盘

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from api.deps import AdminUser
from core.logger import logger
from infrastructure.database.models import (
    ChatSessionModel,
    MessageModel,
    QuotaTransactionLogModel,
    UploadTaskModel,
    UserQuotaUsageModel,
)
from infrastructure.database.user_model import UserModel
from infrastructure.database import get_session

router = APIRouter()


class DashboardStats(BaseModel):
    """仪表盘统计数据"""
    total_users: int = Field(description="总用户数")
    active_users_today: int = Field(description="今日活跃用户数")
    total_sessions: int = Field(description="总会话数")
    total_messages: int = Field(description="总消息数")
    total_image_generations: int = Field(description="总图片生成数")
    total_uploads: int = Field(description="总上传文件数")
    total_agent_tool_calls: int = Field(description="总 Agent 工具调用次数")
    vip_users: int = Field(description="VIP 用户数")
    new_users_this_month: int = Field(description="本月新增用户")


class DailyTrendItem(BaseModel):
    """每日趋势数据"""
    date: str = Field(description="日期 YYYY-MM-DD")
    users: int = Field(description="新增用户数")
    sessions: int = Field(description="新增会话数")
    messages: int = Field(description="新增消息数")
    agent_calls: int = Field(description="Agent 工具调用数")


@dataclass
class ModelUsage:
    """模型使用量"""
    model: str
    call_count: int
    total_tokens: int


class DashboardResponse(BaseModel):
    """仪表盘响应"""
    stats: DashboardStats = Field(description="核心统计")
    trends: list[DailyTrendItem] = Field(description="近30天每日趋势")
    top_models: list[ModelUsage] = Field(description="模型使用排行")


@router.get("/admin/dashboard", response_model=DashboardResponse, tags=["管理后台"])
async def get_dashboard(admin: AdminUser) -> DashboardResponse:
    """获取管理后台仪表盘数据

    Args:
        admin: 管理员用户

    Returns:
        DashboardResponse: 仪表盘完整数据
    """
    db = get_session()

    today = datetime.now().date()
    month_start = (today.replace(day=1)).isoformat()
    today_str = today.isoformat()

    total_users = db.execute(select(func.count()).select_from(UserModel)).scalar() or 0
    vip_users = db.execute(
        select(func.count()).where(UserModel.t_role == "vip")
    ).scalar() or 0
    total_sessions = db.execute(
        select(func.count()).select_from(ChatSessionModel)
    ).scalar() or 0
    total_messages = db.execute(
        select(func.count()).select_from(MessageModel)
    ).scalar() or 0

    new_this_month = db.execute(
        select(func.count()).where(
            UserModel.t_created_at >= datetime.strptime(month_start, "%Y-%m-%d")
        )
    ).scalar() or 0

    active_today = db.execute(
        select(func.count(func.distinct(ChatSessionModel.t_user_id))).where(
            ChatSessionModel.t_updated_at >= datetime.combine(today, datetime.min.time())
        )
    ).scalar() or 0

    agent_calls = db.execute(
        select(func.count()).where(
            QuotaTransactionLogModel.t_transaction_type == "deduct",
            QuotaTransactionLogModel.t_quota_type == "agent_tool_call",
        )
    ).scalar() or 0

    stats = DashboardStats(
        total_users=total_users,
        active_users_today=active_today,
        total_sessions=total_sessions,
        total_messages=total_messages,
        total_image_generations=0,
        total_uploads=db.execute(
            select(func.count()).select_from(UploadTaskModel)
        ).scalar() or 0,
        total_agent_tool_calls=agent_calls,
        vip_users=vip_users,
        new_users_this_month=new_this_month,
    )

    trends: list[DailyTrendItem] = []
    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.isoformat()
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())

        day_users = db.execute(
            select(func.count()).where(
                UserModel.t_created_at >= day_start,
                UserModel.t_created_at <= day_end,
            )
        ).scalar() or 0
        day_sessions = db.execute(
            select(func.count()).where(
                ChatSessionModel.t_created_at >= day_start,
                ChatSessionModel.t_created_at <= day_end,
            )
        ).scalar() or 0
        day_messages = db.execute(
            select(func.count()).where(
                MessageModel.t_created_at >= day_start,
                MessageModel.t_created_at <= day_end,
            )
        ).scalar() or 0
        day_agent = db.execute(
            select(func.count()).where(
                QuotaTransactionLogModel.t_created_at >= day_start,
                QuotaTransactionLogModel.t_created_at <= day_end,
            )
        ).scalar() or 0

        trends.append(DailyTrendItem(
            date=day_str,
            users=day_users,
            sessions=day_sessions,
            messages=day_messages,
            agent_calls=day_agent,
        ))

    top_models = [
        ModelUsage(model="gpt-4o", call_count=0, total_tokens=0),
    ]

    return DashboardResponse(stats=stats, trends=trends, top_models=top_models)


__all__ = ["router"]
