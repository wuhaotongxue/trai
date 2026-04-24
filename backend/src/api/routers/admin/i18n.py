#!/usr/bin/env python
# 文件名: i18n.py
# 作者: wuhao
# 日期: 2026_04_24
# 描述: 管理后台 - 国际化翻译管理

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.deps import AdminUser
from application.usecases.i18n_usecases import I18nUseCase
from infrastructure.database import get_session
from infrastructure.repositories.i18n_repository import I18nRepositoryImpl

router = APIRouter()


def get_i18n_use_case(db: Session = Depends(get_session)) -> I18nUseCase:
    """获取国际化用例"""
    repo = I18nRepositoryImpl(db)
    return I18nUseCase(repo)


class UpsertI18nRequest(BaseModel):
    """新增/更新翻译请求"""

    locale: str
    namespace: str
    key: str
    value: str


class ImportI18nRequest(BaseModel):
    """批量导入翻译请求"""

    translations: dict[str, dict[str, str]]
    overwrite: bool = True


@router.get("/admin/i18n")
async def list_i18n(
    locale: str | None = Query(None, description="语言代码"),
    namespace: str | None = Query(None, description="命名空间"),
    limit: int = Query(100, ge=1, le=1000, description="限制数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    i18n_use_case: I18nUseCase = Depends(get_i18n_use_case),
    admin_user: dict = Depends(AdminUser),
):
    """获取翻译列表"""
    try:
        result = await i18n_use_case.list_translations(locale, namespace, limit, offset)
        return result
    except Exception:
        raise HTTPException(status_code=500, detail="获取翻译列表失败")


@router.post("/admin/i18n")
async def upsert_i18n(
    request: UpsertI18nRequest,
    i18n_use_case: I18nUseCase = Depends(get_i18n_use_case),
    admin_user: dict = Depends(AdminUser),
):
    """新增或更新翻译"""
    try:
        success = await i18n_use_case.upsert_translation(request.locale, request.namespace, request.key, request.value)
        if not success:
            raise HTTPException(status_code=500, detail="操作失败")
        return {"locale": request.locale, "namespace": request.namespace, "key": request.key, "value": request.value}
    except Exception:
        raise HTTPException(status_code=500, detail="操作失败")


@router.post("/admin/i18n/import")
async def import_i18n(
    request: ImportI18nRequest,
    i18n_use_case: I18nUseCase = Depends(get_i18n_use_case),
    admin_user: dict = Depends(AdminUser),
):
    """批量导入翻译"""
    try:
        result = await i18n_use_case.import_translations(request.translations, request.overwrite)
        return result
    except Exception:
        raise HTTPException(status_code=500, detail="导入失败")


@router.delete("/admin/i18n")
async def delete_i18n(
    locale: str = Query(..., description="语言代码"),
    namespace: str = Query(..., description="命名空间"),
    key: str = Query(..., description="翻译键"),
    i18n_use_case: I18nUseCase = Depends(get_i18n_use_case),
    admin_user: dict = Depends(AdminUser),
):
    """删除翻译"""
    try:
        success = await i18n_use_case.delete_translation(locale, namespace, key)
        if not success:
            raise HTTPException(status_code=404, detail="翻译不存在")
        return {"message": "删除成功", "count": 1}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="删除失败")
