#!/usr/bin/env python
# 文件名: analytics.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 管理后台 - 数据分析

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from api.deps import AdminUser
from infrastructure.database import get_session
from infrastructure.database.models import (
    QuotaTransactionLogModel,
)
from infrastructure.database.user_model import UserModel

router = APIRouter()


class QuotaPlanItem(BaseModel):
    """配额套餐项"""

    plan_name: str
    user_role: str
    image_generation_limit: int
    audio_synthesis_limit: int
    transcription_minutes_limit: int
    meeting_summary_limit: int
    ai_translation_limit: int
    ai_summarization_limit: int
    agent_tool_call_limit: int


class UsageByTypeItem(BaseModel):
    """各类型使用量"""

    quota_type: str = Field(description="配额类型")
    total_used: int = Field(description="总使用量")
    user_count: int = Field(description="使用用户数")


class TopUserItem(BaseModel):
    """用户使用排行"""

    user_id: str
    username: str
    role: str
    total_calls: int = Field(description="总调用次数")
    total_tokens: int = Field(description="总 Token 消耗")


class AnalyticsResponse(BaseModel):
    """数据分析响应"""

    quota_plans: list[QuotaPlanItem] = Field(description="所有配额套餐")
    usage_by_type: list[UsageByTypeItem] = Field(description="各类型总使用量")
    top_users: list[TopUserItem] = Field(description="使用量 Top 10 用户")


@router.get("/admin/analytics", response_model=AnalyticsResponse, tags=["管理后台"])
async def get_analytics(admin: AdminUser) -> AnalyticsResponse:
    """获取平台数据分析

    Args:
        admin: 管理员用户

    Returns:
        AnalyticsResponse: 分析数据
    """
    db = get_session()

    quota_types = [
        "image_generation",
        "audio_synthesis",
        "transcription_minutes",
        "meeting_summary",
        "ai_translation",
        "ai_summarization",
        "agent_tool_call",
    ]

    usage_by_type: list[UsageByTypeItem] = []
    for qt in quota_types:
        if hasattr(QuotaTransactionLogModel, "t_quota_type"):
            total = (
                db.execute(
                    select(func.sum(QuotaTransactionLogModel.t_delta)).where(
                        QuotaTransactionLogModel.t_quota_type == qt,
                        QuotaTransactionLogModel.t_transaction_type == "deduct",
                    )
                ).scalar()
                or 0
            )
            user_count = (
                db.execute(
                    select(func.count(func.distinct(QuotaTransactionLogModel.t_user_id))).where(
                        QuotaTransactionLogModel.t_quota_type == qt,
                    )
                ).scalar()
                or 0
            )
            usage_by_type.append(
                UsageByTypeItem(
                    quota_type=qt,
                    total_used=abs(total),
                    user_count=user_count,
                )
            )

    top_users: list[TopUserItem] = []
    user_totals = db.execute(
        select(
            QuotaTransactionLogModel.t_user_id,
            func.count().label("total_calls"),
        )
        .where(
            QuotaTransactionLogModel.t_transaction_type == "deduct",
        )
        .group_by(QuotaTransactionLogModel.t_user_id)
        .order_by(func.count().desc())
        .limit(10)
    ).all()

    for row in user_totals:
        user = db.execute(select(UserModel).where(UserModel.t_user_id == row.t_user_id)).scalar_one_or_none()
        top_users.append(
            TopUserItem(
                user_id=row.t_user_id,
                username=user.t_username if user else row.t_user_id,
                role=user.t_role if user else "unknown",
                total_calls=row.total_calls,
                total_tokens=0,
            )
        )

    return AnalyticsResponse(
        quota_plans=[],
        usage_by_type=usage_by_type,
        top_users=top_users,
    )


__all__ = ["router"]
