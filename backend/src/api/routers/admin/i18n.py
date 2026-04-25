#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: i18n.py
# 作者: wuhao
# 日期: 2026_04_24_15:00:00
# 描述: 国际化字符串管理接口(管理员用)

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import require_admin
from infrastructure.database import get_db_session
from infrastructure.repositories.i18n_repository import I18nRepository

router = APIRouter()


class I18nStringItem(BaseModel):
    """翻译字符串项"""

    locale: str = Field(description="语言代码")
    namespace: str = Field(description="命名空间")
    key: str = Field(description="翻译键")
    value: str = Field(description="翻译值")
    updated_at: str | None = Field(default=None, description="最后更新时间")


class I18nStringListResponse(BaseModel):
    """翻译字符串列表响应"""

    total: int = Field(description="总数")
    items: list[I18nStringItem] = Field(description="翻译字符串列表")
    namespaces: list[str] = Field(description="所有命名空间")


class UpsertI18nRequest(BaseModel):
    """Upsert 翻译请求"""

    locale: str = Field(min_length=2, max_length=16, description="语言代码, 如 zh/en")
    namespace: str = Field(min_length=1, max_length=64, description="命名空间, 如 nav/hero/admin")
    key: str = Field(min_length=1, max_length=255, description="翻译键, 如 hero.title")
    value: str = Field(min_length=0, max_length=4096, description="翻译文本值")


class BulkImportRequest(BaseModel):
    """批量导入翻译请求"""

    translations: dict[str, dict[str, str]] = Field(
        description="翻译字典, 格式为 {locale: {namespace.key: value}}"
    )
    overwrite: bool = Field(default=True, description="是否覆盖已有翻译")


class ImportResponse(BaseModel):
    """导入响应"""

    message: str = Field(description="结果信息")
    count: int = Field(description="导入条数")


@router.get("/i18n", response_model=I18nStringListResponse, tags=["管理"])
async def list_i18n_strings(
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db_session)],
    locale: Annotated[str | None, Query(description="语言代码过滤")] = None,
    namespace: Annotated[str | None, Query(description="命名空间过滤")] = None,
    limit: Annotated[int, Query(ge=1, le=2000)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> I18nStringListResponse:
    """获取翻译字符串列表(仅管理员)

    Args:
        current_user: 当前登录管理员
        session: 数据库会话
        locale: 语言过滤
        namespace: 命名空间过滤
        limit: 每页数量
        offset: 偏移量

    Returns:
        I18nStringListResponse: 翻译字符串列表
    """
    _ = current_user
    repo = I18nRepository(session)

    if locale:
        all_namespaces = repo.list_namespaces(locale)
    else:
        all_namespaces = list(
            set(repo.list_namespaces("zh")) | set(repo.list_namespaces("en"))
        )
        all_namespaces.sort()

    if locale and namespace:
        raw_dict = repo.get_by_locale_and_namespace(locale, namespace)
        items = [
            I18nStringItem(locale=locale, namespace=namespace, key=k, value=v)
            for k, v in raw_dict.items()
        ]
        total = len(items)
        items = items[offset : offset + limit]
    elif locale:
        raw_dict = repo.get_by_locale(locale)
        items = []
        for full_key, value in raw_dict.items():
            if "." in full_key:
                ns, k = full_key.rsplit(".", 1)
                items.append(I18nStringItem(locale=locale, namespace=ns, key=k, value=value))
        total = len(items)
        items = items[offset : offset + limit]
    else:
        total = 0
        items = []

    return I18nStringListResponse(total=total, items=items, namespaces=all_namespaces)


@router.post("/i18n", response_model=I18nStringItem, tags=["管理"])
async def upsert_i18n_string(
    request: UpsertI18nRequest,
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db_session)],
) -> I18nStringItem:
    """创建或更新翻译字符串(仅管理员)

    Args:
        request: Upsert 请求
        current_user: 当前登录管理员
        session: 数据库会话

    Returns:
        I18nStringItem: 更新后的翻译项
    """
    user_id = current_user.get("user_id")
    repo = I18nRepository(session)

    model = repo.upsert(
        locale=request.locale,
        namespace=request.namespace,
        key=request.key,
        value=request.value,
        updated_by=user_id,
    )
    session.commit()

    return I18nStringItem(
        locale=model.t_locale,
        namespace=model.t_namespace,
        key=model.t_key,
        value=model.t_value,
        updated_at=model.t_updated_at.isoformat() if model.t_updated_at else None,
    )


@router.post("/i18n/import", response_model=ImportResponse, tags=["管理"])
async def bulk_import_i18n(
    request: BulkImportRequest,
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db_session)],
) -> ImportResponse:
    """批量导入翻译字符串(仅管理员)

    支持批量导入多个语言、多个命名空间的翻译
    格式: { "zh": { "nav.home": "首页", "hero.title": "你好" }, "en": { "nav.home": "Home" } }

    Args:
        request: 批量导入请求
        current_user: 当前登录管理员
        session: 数据库会话

    Returns:
        ImportResponse: 导入结果
    """
    user_id = current_user.get("user_id")
    repo = I18nRepository(session)

    translations: dict[str, dict[str, str]] = {}
    for loc, ns_dict in request.translations.items():
        translations[loc] = {}
        for ns_key, value in ns_dict.items():
            translations[loc][ns_key] = value

    count = repo.bulk_upsert(translations, updated_by=user_id)
    session.commit()

    return ImportResponse(message="导入成功", count=count)


@router.delete("/i18n", response_model=ImportResponse, tags=["管理"])
async def delete_i18n_string(
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db_session)],
    locale: Annotated[str, Query(description="语言代码")],
    namespace: Annotated[str, Query(description="命名空间")],
    key: Annotated[str, Query(description="翻译键")],
) -> ImportResponse:
    """删除指定翻译字符串(仅管理员)

    Args:
        current_user: 当前登录管理员
        session: 数据库会话
        locale: 语言代码
        namespace: 命名空间
        key: 翻译键

    Returns:
        ImportResponse: 删除结果
    """
    _ = current_user
    repo = I18nRepository(session)
    deleted = repo.delete_by_key(locale, namespace, key)
    session.commit()

    if deleted:
        return ImportResponse(message="删除成功", count=1)
    return ImportResponse(message="未找到该翻译", count=0)


__all__ = ["router"]
