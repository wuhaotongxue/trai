#!/usr/bin/env python
# 文件名: settings_public.py
# 作者: wuhao
# 日期: 2026_04_24_16:00:00
# 描述: 公开的系统配置接口(无需认证)

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from infrastructure.database import get_db_session
from infrastructure.repositories.i18n_repository import SystemSettingRepository

router = APIRouter()


class PublicSettingsResponse(BaseModel):
    """公开配置响应(供前端使用)"""

    settings: dict[str, str] = Field(description="配置字典, key 为配置键")


@router.get("/settings/public", response_model=PublicSettingsResponse, tags=["配置"])
async def get_public_settings(
    session: Annotated[Session, Depends(get_db_session)],
) -> PublicSettingsResponse:
    """获取所有公开配置(无需认证)

    Args:
        session: 数据库会话

    Returns:
        PublicSettingsResponse: 公开配置字典
    """
    repo = SystemSettingRepository(session)
    settings_list = repo.list_public()
    settings = {s.t_key: s.t_value for s in settings_list}
    return PublicSettingsResponse(settings=settings)


__all__ = ["router"]
