#!/usr/bin/env python
# 文件名: agent_role.py
# 作者: wuhao
# 日期: 2026_04_30_11:15:00
# 描述: AI 角色管理 API

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.routers.admin.admin_deps import get_current_admin_user
from infrastructure.database.database import get_db_session
from infrastructure.database.models import AgentRoleModel

router = APIRouter(prefix="/agent_roles", tags=["AI 角色管理"])


class AgentRoleBase(BaseModel):
    """AI 角色基础字段"""

    t_role_name: str
    t_role_comment: str
    t_role_keyword: str | None = None
    t_style_type: str = "default"
    t_priority: int = 100
    t_is_active: bool = True
    t_remark: str | None = None


class AgentRoleCreate(AgentRoleBase):
    """创建 AI 角色"""

    pass


class AgentRoleUpdate(BaseModel):
    """更新 AI 角色"""

    t_role_name: str | None = None
    t_role_comment: str | None = None
    t_role_keyword: str | None = None
    t_style_type: str | None = None
    t_priority: int | None = None
    t_is_active: bool | None = None
    t_remark: str | None = None


class AgentRoleResponse(AgentRoleBase):
    """AI 角色响应"""

    t_id: int
    t_created_at: datetime
    t_updated_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=list[AgentRoleResponse], summary="获取角色列表")
def list_agent_roles(
    is_active: bool | None = None,
    _=Depends(get_current_admin_user),
    db: Session = Depends(get_db_session),
) -> list[AgentRoleModel]:
    """获取所有 AI 角色列表"""
    stmt = select(AgentRoleModel)
    if is_active is not None:
        stmt = stmt.where(AgentRoleModel.t_is_active == is_active)
    stmt = stmt.order_by(AgentRoleModel.t_priority, AgentRoleModel.t_id)
    return db.execute(stmt).scalars().all()


@router.get("/{role_id}", response_model=AgentRoleResponse, summary="获取单个角色")
def get_agent_role(
    role_id: int,
    _=Depends(get_current_admin_user),
    db: Session = Depends(get_db_session),
) -> AgentRoleModel:
    """根据 ID 获取 AI 角色"""
    stmt = select(AgentRoleModel).where(AgentRoleModel.t_id == role_id)
    role = db.execute(stmt).scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")
    return role


@router.post("", response_model=AgentRoleResponse, status_code=201, summary="创建角色")
def create_agent_role(
    role_data: AgentRoleCreate,
    admin_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db_session),
) -> AgentRoleModel:
    """创建新的 AI 角色"""
    # 检查角色名是否已存在
    stmt = select(AgentRoleModel).where(AgentRoleModel.t_role_name == role_data.t_role_name)
    if db.execute(stmt).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="角色名已存在")

    role = AgentRoleModel(
        t_role_name=role_data.t_role_name,
        t_role_comment=role_data.t_role_comment,
        t_role_keyword=role_data.t_role_keyword,
        t_style_type=role_data.t_style_type,
        t_priority=role_data.t_priority,
        t_is_active=role_data.t_is_active,
        t_remark=role_data.t_remark,
        t_created_by=admin_user.get("user_id"),
        t_updated_by=admin_user.get("user_id"),
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.put("/{role_id}", response_model=AgentRoleResponse, summary="更新角色")
def update_agent_role(
    role_id: int,
    role_data: AgentRoleUpdate,
    admin_user=Depends(get_current_admin_user),
    db: Session = Depends(get_db_session),
) -> AgentRoleModel:
    """更新 AI 角色信息"""
    stmt = select(AgentRoleModel).where(AgentRoleModel.t_id == role_id)
    role = db.execute(stmt).scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    # 更新字段
    update_data = role_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(role, key, value)
    role.t_updated_by = admin_user.get("user_id")

    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}", status_code=204, summary="删除角色")
def delete_agent_role(
    role_id: int,
    _=Depends(get_current_admin_user),
    db: Session = Depends(get_db_session),
) -> None:
    """删除 AI 角色"""
    stmt = select(AgentRoleModel).where(AgentRoleModel.t_id == role_id)
    role = db.execute(stmt).scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")

    db.delete(role)
    db.commit()
