#!/usr/bin/env python
# 文件名: i18n.py
# 作者: wuhao
# 日期: 2026_05_26_20:42:13
# 描述: 公开的翻译获取接口(无需认证)

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from infrastructure.database.database import get_db_session
from infrastructure.repositories.i18n_repository import I18nRepository

router = APIRouter()


class PublicTranslationsResponse(BaseModel):
    """公开翻译响应模型"""

    translations: dict[str, str] = Field(description="翻译字典, key 为 namespace.key")
    locale: str = Field(description="语言代码")


class I18nRouter:
    """国际化公开 API 路由处理器"""

    @staticmethod
    @router.get(
        "/i18n/{locale}",
        response_model=PublicTranslationsResponse,
        tags=["翻译"],
        summary="获取公开翻译",
        description="供前端页面在初始化时从数据库拉取翻译文本, 无需认证",
    )
    async def get_public_translations(
        locale: str,
        session: Annotated[Session, Depends(get_db_session)],
    ) -> PublicTranslationsResponse:
        """
        获取指定语言的翻译

        参数:
            locale (str): 语言代码, 如 zh/en
            session (Session): 数据库会话
        返回值:
            PublicTranslationsResponse: 翻译字典响应
        """
        repo = I18nRepository(session)
        translations = repo.get_by_locale(locale)
        return PublicTranslationsResponse(translations=translations, locale=locale)


__all__ = ["I18nRouter", "router"]
