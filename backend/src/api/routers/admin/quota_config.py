#!/usr/bin/env python
# 文件名: quota_config.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 管理后台 - 配额配置

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from api.deps import AdminUser
from core.logger import logger
from infrastructure.database import get_session
from infrastructure.database.models import QuotaPlanModel
from infrastructure.repositories.quota_repository import QuotaRepository

router = APIRouter()


class QuotaPlanResponse(BaseModel):
    """配额套餐响应"""

    id: int
    plan_name: str
    user_role: str
    image_generation_limit: int
    audio_synthesis_limit: int
    transcription_minutes_limit: int
    meeting_summary_limit: int
    ai_translation_limit: int
    ai_summarization_limit: int
    agent_tool_call_limit: int


class QuotaPlanUpdateRequest(BaseModel):
    """配额套餐更新请求"""

    image_generation_limit: int = Field(ge=0, description="图片生成配额（0=无限制）")
    audio_synthesis_limit: int = Field(ge=0, description="语音合成配额（0=无限制）")
    transcription_minutes_limit: int = Field(ge=0, description="转录配额（0=无限制）")
    meeting_summary_limit: int = Field(ge=0, description="会议摘要配额（0=无限制）")
    ai_translation_limit: int = Field(ge=0, description="AI 翻译配额（0=无限制）")
    ai_summarization_limit: int = Field(ge=0, description="AI 摘要配额（0=无限制）")
    agent_tool_call_limit: int = Field(ge=0, description="Agent 工具调用配额（0=无限制）")


class CreateQuotaPlanRequest(BaseModel):
    """创建配额套餐请求"""

    plan_name: str = Field(min_length=1, max_length=50)
    user_role: str = Field(min_length=1, max_length=20)
    image_generation_limit: int = Field(ge=0)
    audio_synthesis_limit: int = Field(ge=0)
    transcription_minutes_limit: int = Field(ge=0)
    meeting_summary_limit: int = Field(ge=0)
    ai_translation_limit: int = Field(ge=0)
    ai_summarization_limit: int = Field(ge=0)
    agent_tool_call_limit: int = Field(ge=0)


@router.get("/admin/quota_plans", response_model=list[QuotaPlanResponse], tags=["管理后台"])
async def list_quota_plans(admin: AdminUser) -> list[QuotaPlanResponse]:
    """获取所有配额套餐

    Args:
        admin: 管理员用户

    Returns:
        list[QuotaPlanResponse]: 套餐列表
    """
    db = get_session()
    QuotaRepository(db)
    plans = db.execute(select(QuotaPlanModel)).scalars().all()

    return [
        QuotaPlanResponse(
            id=p.t_id,
            plan_name=p.t_plan_name,
            user_role=p.t_user_role,
            image_generation_limit=p.t_image_generation_limit,
            audio_synthesis_limit=p.t_audio_synthesis_limit,
            transcription_minutes_limit=p.t_transcription_minutes_limit,
            meeting_summary_limit=p.t_meeting_summary_limit,
            ai_translation_limit=p.t_ai_translation_limit,
            ai_summarization_limit=p.t_ai_summarization_limit,
            agent_tool_call_limit=p.t_agent_tool_call_limit,
        )
        for p in plans
    ]


@router.put("/admin/quota_plans/{role}", response_model=QuotaPlanResponse, tags=["管理后台"])
async def update_quota_plan(
    role: str,
    request: QuotaPlanUpdateRequest,
    admin: AdminUser,
) -> QuotaPlanResponse:
    """更新指定角色的配额套餐

    Args:
        role: 用户角色
        request: 更新参数
        admin: 管理员用户

    Returns:
        QuotaPlanResponse: 更新后的套餐
    """
    db = get_session()
    repo = QuotaRepository(db)
    plan = repo.get_plan_by_role(role)

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": f"角色 {role} 的配额套餐不存在"},
        )

    plan.t_image_generation_limit = request.image_generation_limit
    plan.t_audio_synthesis_limit = request.audio_synthesis_limit
    plan.t_transcription_minutes_limit = request.transcription_minutes_limit
    plan.t_meeting_summary_limit = request.meeting_summary_limit
    plan.t_ai_translation_limit = request.ai_translation_limit
    plan.t_ai_summarization_limit = request.ai_summarization_limit
    plan.t_agent_tool_call_limit = request.agent_tool_call_limit
    db.flush()

    logger.info(f"管理员 {admin.get('user_id')} 更新配额套餐 | role={role}")

    return QuotaPlanResponse(
        id=plan.t_id,
        plan_name=plan.t_plan_name,
        user_role=plan.t_user_role,
        image_generation_limit=plan.t_image_generation_limit,
        audio_synthesis_limit=plan.t_audio_synthesis_limit,
        transcription_minutes_limit=plan.t_transcription_minutes_limit,
        meeting_summary_limit=plan.t_meeting_summary_limit,
        ai_translation_limit=plan.t_ai_translation_limit,
        ai_summarization_limit=plan.t_ai_summarization_limit,
        agent_tool_call_limit=plan.t_agent_tool_call_limit,
    )


@router.post("/admin/quota_plans", response_model=QuotaPlanResponse, tags=["管理后台"])
async def create_quota_plan(
    request: CreateQuotaPlanRequest,
    admin: AdminUser,
) -> QuotaPlanResponse:
    """创建新的配额套餐

    Args:
        request: 套餐参数
        admin: 管理员用户

    Returns:
        QuotaPlanResponse: 创建的套餐
    """
    db = get_session()

    existing = db.execute(
        select(QuotaPlanModel).where(QuotaPlanModel.user_role == request.user_role)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": 409, "message": f"角色 {request.user_role} 的套餐已存在"},
        )

    plan = QuotaPlanModel(
        t_plan_name=request.plan_name,
        t_user_role=request.user_role,
        t_image_generation_limit=request.image_generation_limit,
        t_audio_synthesis_limit=request.audio_synthesis_limit,
        t_transcription_minutes_limit=request.transcription_minutes_limit,
        t_meeting_summary_limit=request.meeting_summary_limit,
        t_ai_translation_limit=request.ai_translation_limit,
        t_ai_summarization_limit=request.ai_summarization_limit,
        t_agent_tool_call_limit=request.agent_tool_call_limit,
    )
    db.add(plan)
    db.flush()

    logger.info(f"管理员 {admin.get('user_id')} 创建配额套餐 | role={request.user_role}")

    return QuotaPlanResponse(
        id=plan.t_id,
        plan_name=plan.t_plan_name,
        user_role=plan.t_user_role,
        image_generation_limit=plan.t_image_generation_limit,
        audio_synthesis_limit=plan.t_audio_synthesis_limit,
        transcription_minutes_limit=plan.t_transcription_minutes_limit,
        meeting_summary_limit=plan.t_meeting_summary_limit,
        ai_translation_limit=plan.t_ai_translation_limit,
        ai_summarization_limit=plan.t_ai_summarization_limit,
        agent_tool_call_limit=plan.t_agent_tool_call_limit,
    )


__all__ = ["router"]
