#!/usr/bin/env python
# 文件名: organization.py
# 作者: wuhao
# 日期: 2026_04_15
# 描述: 组织架构管理接口

from __future__ import annotations

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import require_admin
from application.usecases.organization_sync import SyncOrganizationUseCase
from core.logger import get_logger
from infrastructure.database.database import get_db_session
from infrastructure.repositories.department_repository import DepartmentRepository
from infrastructure.repositories.user_repository import UserRepository

logger = get_logger()
router = APIRouter()


class SyncResult(BaseModel):
    """同步结果响应"""

    departments: int = Field(description="同步部门数量")
    users: int = Field(description="同步用户数量")
    status: str = Field(description="同步状态")


class DepartmentTreeNode(BaseModel):
    """部门树节点"""

    dept_id: int = Field(description="部门 ID")
    name: str = Field(description="部门名称")
    parent_id: int = Field(description="父部门 ID")
    order: int = Field(description="排序号")
    user_count: int = Field(default=0, description="部门人数")
    children: list[DepartmentTreeNode] = Field(default_factory=list, description="子部门")


@router.get("/tree", response_model=list[DepartmentTreeNode], summary="获取部门树")
async def get_department_tree(
    current_user: Annotated[dict, Depends(require_admin)],
    session: Session = Depends(get_db_session),
) -> list[DepartmentTreeNode]:
    """获取组织架构部门树

    Args:
        current_user: 当前登录管理员
        session: 数据库会话

    Returns:
        list[DepartmentTreeNode]: 树形结构的部门列表
    """
    dept_repo = DepartmentRepository(session)
    all_depts = dept_repo.list_all()
    stats = dept_repo.get_department_stats()

    # 构建树形结构
    nodes: dict[int, DepartmentTreeNode] = {}
    for d in all_depts:
        nodes[d.dept_id] = DepartmentTreeNode(
            dept_id=d.dept_id,
            name=d.name,
            parent_id=d.parent_id,
            order=d.order,
            user_count=stats.get(d.dept_id, 0),
            children=[],
        )

    root_nodes: list[DepartmentTreeNode] = []
    for node in nodes.values():
        if node.parent_id == 0 or node.parent_id not in nodes:
            root_nodes.append(node)
        else:
            nodes[node.parent_id].children.append(node)

    # 排序
    def sort_nodes(nodes_list: list[DepartmentTreeNode]):
        nodes_list.sort(key=lambda x: x.order)
        for n in nodes_list:
            if n.children:
                sort_nodes(n.children)

    sort_nodes(root_nodes)
    return root_nodes


@router.post("/sync", response_model=SyncResult, summary="同步组织架构")
async def sync_organization(
    current_user: Annotated[dict, Depends(require_admin)],
    session: Session = Depends(get_db_session)
) -> SyncResult:
    """从企业微信同步组织架构

    Args:
        current_user: 当前登录管理员
        session: 数据库会话

    Returns:
        SyncResult: 同步结果摘要
    """
    try:
        user_repo = UserRepository(session)
        dept_repo = DepartmentRepository(session)
        usecase = SyncOrganizationUseCase(session, user_repo, dept_repo)

        result = await usecase.execute()

        return SyncResult(
            departments=result["departments"],
            users=result["users"],
            status=result["status"],
        )
    except Exception as e:
        logger.error(f"组织架构同步失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": f"同步失败: {str(e)}"},
        )


__all__ = ["router"]
