#!/usr/bin/env python
# 文件名: system_settings.py
# 作者: wuhao
# 日期: 2026_04_24_15:30:00
# 描述: 系统配置管理接口(管理员用)

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import require_admin
from infrastructure.database import get_db_session
from infrastructure.repositories.i18n_repository import SystemSettingRepository

router = APIRouter()


class SystemSettingItem(BaseModel):
    """系统配置项"""

    key: str = Field(description="配置键")
    value: str = Field(description="配置值")
    type: str = Field(description="值类型")
    label: str | None = Field(default=None, description="中文标签")
    description: str | None = Field(default=None, description="配置描述")
    category: str = Field(description="配置分类")
    is_public: bool = Field(description="是否公开")
    sort_order: int = Field(description="排序顺序")
    updated_at: str | None = Field(default=None, description="最后更新时间")


class SettingListResponse(BaseModel):
    """配置列表响应"""

    items: list[SystemSettingItem] = Field(description="配置列表")


class UpsertSettingRequest(BaseModel):
    """Upsert 配置请求"""

    key: str = Field(min_length=1, max_length=128, description="配置键, 如 system.name")
    value: str = Field(min_length=0, max_length=4096, description="配置值")
    type: str = Field(default="string", description="值类型: string/number/boolean/json")
    label: str | None = Field(default=None, description="中文标签")
    description: str | None = Field(default=None, description="配置描述")
    category: str = Field(default="general", description="配置分类: general/security/notification/advanced")
    is_public: bool = Field(default=True, description="是否公开给前端")
    sort_order: int = Field(default=0, description="排序顺序")


class ActionResponse(BaseModel):
    """操作响应"""

    message: str = Field(description="提示信息")
    key: str = Field(description="配置键")


@router.get("/settings", response_model=SettingListResponse, tags=["管理"])
async def list_settings(
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db_session)],
    category: Annotated[str | None, Query(description="配置分类过滤")] = None,
) -> SettingListResponse:
    """获取系统配置列表(仅管理员)

    Args:
        current_user: 当前登录管理员
        session: 数据库会话
        category: 分类过滤

    Returns:
        SettingListResponse: 配置列表
    """
    _ = current_user
    repo = SystemSettingRepository(session)
    settings_list = repo.list_by_category(category)

    return SettingListResponse(
        items=[
            SystemSettingItem(
                key=s.t_key,
                value=s.t_value,
                type=s.t_type,
                label=s.t_label,
                description=s.t_description,
                category=s.t_category,
                is_public=s.t_is_public,
                sort_order=s.t_sort_order,
                updated_at=s.t_updated_at.isoformat() if s.t_updated_at else None,
            )
            for s in settings_list
        ]
    )


@router.get("/settings/{key}", response_model=SystemSettingItem, tags=["管理"])
async def get_setting(
    key: str,
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db_session)],
) -> SystemSettingItem:
    """获取指定配置(仅管理员)

    Args:
        key: 配置键
        current_user: 当前登录管理员
        session: 数据库会话

    Returns:
        SystemSettingItem: 配置项
    """
    _ = current_user
    repo = SystemSettingRepository(session)
    model = repo.get_by_key(key)

    if not model:
        return SystemSettingItem(
            key=key,
            value="",
            type="string",
            label=None,
            description=None,
            category="general",
            is_public=True,
            sort_order=0,
        )

    return SystemSettingItem(
        key=model.t_key,
        value=model.t_value,
        type=model.t_type,
        label=model.t_label,
        description=model.t_description,
        category=model.t_category,
        is_public=model.t_is_public,
        sort_order=model.t_sort_order,
        updated_at=model.t_updated_at.isoformat() if model.t_updated_at else None,
    )


@router.post("/settings", response_model=ActionResponse, tags=["管理"])
async def upsert_setting(
    request: UpsertSettingRequest,
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db_session)],
) -> ActionResponse:
    """创建或更新系统配置(仅管理员)

    Args:
        request: Upsert 请求
        current_user: 当前登录管理员
        session: 数据库会话

    Returns:
        ActionResponse: 操作结果
    """
    user_id = current_user.get("user_id")
    repo = SystemSettingRepository(session)

    repo.upsert(
        key=request.key,
        value=request.value,
        value_type=request.type,
        label=request.label,
        description=request.description,
        category=request.category,
        is_public=request.is_public,
        sort_order=request.sort_order,
        updated_by=user_id,
    )
    session.commit()

    return ActionResponse(message="配置已保存", key=request.key)


@router.delete("/settings/{key}", response_model=ActionResponse, tags=["管理"])
async def delete_setting(
    key: str,
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db_session)],
) -> ActionResponse:
    """删除系统配置(仅管理员)

    Args:
        key: 配置键
        current_user: 当前登录管理员
        session: 数据库会话

    Returns:
        ActionResponse: 操作结果
    """
    _ = current_user
    repo = SystemSettingRepository(session)
    repo.delete_by_key(key)
    session.commit()

    return ActionResponse(message="配置已删除", key=key)


__all__ = ["router"]
