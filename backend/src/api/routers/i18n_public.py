#!/usr/bin/env python
# 文件名: i18n_public.py
# 作者: wuhao
# 日期: 2026_04_24_16:00:00
# 描述: 公开的翻译获取接口(无需认证)

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from infrastructure.database import get_db_session
from infrastructure.repositories.i18n_repository import I18nRepository

router = APIRouter()


class PublicTranslationsResponse(BaseModel):
    """公开翻译响应(供前端非管理员使用)"""

    translations: dict[str, str] = Field(description="翻译字典, key 为 namespace.key")
    locale: str = Field(description="语言代码")


@router.get("/i18n/{locale}", response_model=PublicTranslationsResponse, tags=["翻译"])
async def get_public_translations(
    locale: str,
    session: Annotated[Session, Depends(get_db_session)],
) -> PublicTranslationsResponse:
    """获取指定语言的翻译(无需认证)

    供前端页面在初始化时从数据库拉取翻译文本

    Args:
        locale: 语言代码,如 zh/en
        session: 数据库会话

    Returns:
        PublicTranslationsResponse: 翻译字典
    """
    repo = I18nRepository(session)
    translations = repo.get_by_locale(locale)
    return PublicTranslationsResponse(translations=translations, locale=locale)


__all__ = ["router"]
