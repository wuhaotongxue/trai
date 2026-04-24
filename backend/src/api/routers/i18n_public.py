#!/usr/bin/env python
# 文件名: i18n_public.py
# 作者: wuhao
# 日期: 2026_04_24
# 描述: 公开国际化接口

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from application.usecases.i18n_usecases import I18nUseCase
from infrastructure.database import get_session
from infrastructure.repositories.i18n_repository import I18nRepositoryImpl

router = APIRouter()


def get_i18n_use_case(db: Session = Depends(get_session)) -> I18nUseCase:
    """获取国际化用例"""
    repo = I18nRepositoryImpl(db)
    return I18nUseCase(repo)


@router.get("/i18n/{locale}")
async def get_translations(locale: str, i18n_use_case: I18nUseCase = Depends(get_i18n_use_case)):
    """获取指定语言的翻译

    Args:
        locale: 语言代码，如 zh, en

    Returns:
        Dict: 翻译数据
    """
    try:
        translations = await i18n_use_case.get_translations_by_locale(locale)
        return {"translations": translations, "locale": locale}
    except Exception:
        raise HTTPException(status_code=500, detail="获取翻译失败")
