#!/usr/bin/env python
# 文件名: ai_mgmt.py
# 作者: wuhao
# 日期: 2026_04_22_16:00:00
# 描述: AI 模型与内容管理路由

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from api.deps import AdminUser

router = APIRouter(prefix="/admin/ai", tags=["管理后台"])


class ModelConfig(BaseModel):
    id: str
    name: str
    provider: str
    api_base: str | None
    is_active: bool


class AIStats(BaseModel):
    chat_count: int
    image_count: int
    video_count: int
    audio_count: int


@router.get("/stats", response_model=AIStats)
async def get_ai_stats(admin: AdminUser):
    """获取 AI 各项能力的使用统计"""
    # 实际应从数据库查询
    return AIStats(chat_count=1240, image_count=85, video_count=12, audio_count=45)


@router.get("/models", response_model=list[ModelConfig])
async def list_models(admin: AdminUser):
    """获取 AI 模型配置列表"""
    return [
        ModelConfig(
            id="ds-1", name="DeepSeek Chat", provider="DeepSeek", is_active=True, api_base="https://api.deepseek.com"
        ),
        ModelConfig(id="mj-1", name="Midjourney V6", provider="ModelScope", is_active=True, api_base=None),
        ModelConfig(id="v-1", name="Stable Video", provider="Stability", is_active=False, api_base=None),
    ]


@router.post("/models/{model_id}/toggle")
async def toggle_model(model_id: str, admin: AdminUser):
    """开启或禁用模型"""
    return {"status": "success", "model_id": model_id, "active": True}
