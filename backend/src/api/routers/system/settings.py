#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: settings.py
# 作者: wuhao
# 日期: 2026_05_26_20:42:13
# 描述: 公开的系统配置接口(无需认证)

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from infrastructure.database.database import get_db_session
from infrastructure.repositories.i18n_repository import SystemSettingRepository

router = APIRouter()


class PublicSettingsResponse(BaseModel):
    """公开配置响应模型"""

    settings: dict[str, str] = Field(description="配置字典, key 为配置键")


class SettingsRouter:
    """系统配置公开 API 路由处理器"""

    @staticmethod
    @router.get(
        "/settings/public",
        response_model=PublicSettingsResponse,
        tags=["配置"],
        summary="获取公开配置",
        description="获取所有标记为公开的系统配置项, 无需认证"
    )
    async def get_public_settings(
        session: Annotated[Session, Depends(get_db_session)],
    ) -> PublicSettingsResponse:
        """
        获取所有公开配置
        
        参数:
            session (Session): 数据库会话
        返回值:
            PublicSettingsResponse: 公开配置字典响应
        """
        repo = SystemSettingRepository(session)
        settings_list = repo.list_public()
        settings = {s.t_key: s.t_value for s in settings_list}
        return PublicSettingsResponse(settings=settings)


__all__ = ["SettingsRouter", "router"]
