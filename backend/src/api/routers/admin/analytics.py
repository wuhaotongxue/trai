#!/usr/bin/env python
# 文件名: analytics.py
# 作者: wuhao
# 日期: 2026_04_10_09:22:00
# 描述: 管理后台 - 数据分析

from typing import Annotated, Any
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


class WeComDeptStats(BaseModel):
    """部门统计"""

    dept_name: str
    user_count: int
    new_hires: int
    resignations: int


class WeComAnalyticsResponse(BaseModel):
    """企微分析响应"""

    total_users: int
    total_depts: int
    dept_stats: list[WeComDeptStats]
    weekly_trend: list[dict[str, Any]]


class ReportResponse(BaseModel):
    """报告响应"""

    report_id: str
    title: str
    content: str
    created_at: str
    pdf_url: str | None = None


@router.post("/admin/analytics/report/generate", response_model=ReportResponse, tags=["管理后台"])
async def generate_ai_report(admin: AdminUser) -> ReportResponse:
    """生成 AI 业务洞察报告"""
    import uuid
    from datetime import datetime
    from infrastructure.ai.openai_client import OpenAIClient
    
    # 1. 获取最新企微分析数据
    analytics_data = await get_wecom_analytics(admin)
    
    # 2. 构造提示词
    prompt = f"""
    你是 TRAI 系统的首席数据分析师. 请根据以下企业微信通讯录分析数据, 生成一份专业的业务洞察报告.
    
    数据摘要:
    - 总人数: {analytics_data.total_users}
    - 部门总数: {analytics_data.total_depts}
    - 部门详细统计: {analytics_data.dept_stats}
    - 近4周入职趋势: {analytics_data.weekly_trend}
    
    要求:
    1. 使用 Markdown 格式.
    2. 包含「核心趋势」,「潜在风险分析」,「管理优化建议」三个章节.
    3. 语气专业,客观.
    4. 报告语言为简体中文.
    """
    
    # 3. 调用 LLM 生成
    try:
        ai_client = OpenAIClient()
        ai_response = await ai_client.chat(
            messages=[{"role": "user", "content": prompt}],
            model="gpt-4o"
        )
        content = ai_response["content"]
    except Exception as e:
        content = f"生成报告失败: {str(e)}"
    
    # 4. 模拟 PDF 生成并上传 (实际项目中可使用 reportlab 或 wkhtmltopdf)
    # 这里暂时返回 content 并带上一个模拟 URL
    report_id = str(uuid.uuid4())
    return ReportResponse(
        report_id=report_id,
        title=f"企业数字化洞察报告_{datetime.now().strftime('%Y%m%d')}",
        content=content,
        created_at=datetime.now().isoformat(),
        pdf_url=None # 实际应生成 PDF 并上传 S3
    )


@router.get("/admin/analytics/wecom", response_model=WeComAnalyticsResponse, tags=["管理后台"])
async def get_wecom_analytics(admin: AdminUser) -> WeComAnalyticsResponse:
    """获取企业微信通讯录分析数据"""
    from datetime import datetime, timedelta
    from infrastructure.database.models import DepartmentModel, UserDepartmentMappingModel
    
    db = get_session()
    
    # 获取总数
    total_users = db.scalar(select(func.count(UserModel.t_user_id)).where(UserModel.t_deleted_at.is_(None))) or 0
    total_depts = db.scalar(select(func.count(DepartmentModel.t_dept_id))) or 0
    
    # 部门分布
    dept_stats = []
    depts = db.execute(select(DepartmentModel)).scalars().all()
    for d in depts:
        count = db.scalar(
            select(func.count(UserDepartmentMappingModel.t_user_id))
            .where(UserDepartmentMappingModel.t_dept_id == d.t_dept_id)
        ) or 0
        
        # 本周入职 (近似)
        week_ago = datetime.now() - timedelta(days=7)
        new_hires = db.scalar(
            select(func.count(UserModel.t_user_id))
            .join(UserDepartmentMappingModel, UserModel.t_user_id == UserDepartmentMappingModel.t_user_id)
            .where(
                UserDepartmentMappingModel.t_dept_id == d.t_dept_id,
                UserModel.t_created_at >= week_ago
            )
        ) or 0
        
        # 本周离职
        resignations = db.scalar(
            select(func.count(UserModel.t_user_id))
            .join(UserDepartmentMappingModel, UserModel.t_user_id == UserDepartmentMappingModel.t_user_id)
            .where(
                UserDepartmentMappingModel.t_dept_id == d.t_dept_id,
                UserModel.t_deleted_at >= week_ago
            )
        ) or 0
        
        dept_stats.append(WeComDeptStats(
            dept_name=d.t_name,
            user_count=count,
            new_hires=new_hires,
            resignations=resignations
        ))
        
    # 周趋势 (最近 4 周)
    weekly_trend = []
    for i in range(4):
        start = datetime.now() - timedelta(days=(i+1)*7)
        end = datetime.now() - timedelta(days=i*7)
        hires = db.scalar(select(func.count(UserModel.t_user_id)).where(UserModel.t_created_at.between(start, end))) or 0
        resigns = db.scalar(select(func.count(UserModel.t_user_id)).where(UserModel.t_deleted_at.between(start, end))) or 0
        weekly_trend.append({"week": f"W-{i}", "hires": hires, "resignations": resigns})
        
    return WeComAnalyticsResponse(
        total_users=total_users,
        total_depts=total_depts,
        dept_stats=dept_stats,
        weekly_trend=weekly_trend[::-1]
    )


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
