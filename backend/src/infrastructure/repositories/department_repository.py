#!/usr/bin/env python
# 文件名: department_repository.py
# 作者: wuhao
# 日期: 2026_04_15
# 描述: 部门数据库仓储实现

from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from domain.entities.department import Department, UserDepartmentMapping
from domain.interfaces.department_interfaces import IDepartmentRepository
from infrastructure.database.department_model import DepartmentModel, UserDepartmentMappingModel


class DepartmentRepository(IDepartmentRepository):
    """部门数据库仓储

    负责部门数据的持久化操作
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    def _to_entity(self, model: DepartmentModel) -> Department:
        """将数据库模型转换为领域实体"""
        return Department(
            dept_id=model.t_dept_id,
            name=model.t_name,
            parent_id=model.t_parent_id,
            order=model.t_order,
            created_at=model.t_created_at,
            updated_at=model.t_updated_at,
        )

    def _to_model(self, department: Department) -> DepartmentModel:
        """将领域实体转换为数据库模型"""
        return DepartmentModel(
            t_dept_id=department.dept_id,
            t_name=department.name,
            t_parent_id=department.parent_id,
            t_order=department.order,
            t_created_at=department.created_at or datetime.now(),
            t_updated_at=department.updated_at or datetime.now(),
        )

    def create_or_update(self, department: Department) -> Department:
        """创建或更新部门"""
        stmt = select(DepartmentModel).where(DepartmentModel.t_dept_id == department.dept_id)
        model = self._session.scalar(stmt)

        if model:
            # 更新已有部门
            model.t_name = department.name
            model.t_parent_id = department.parent_id
            model.t_order = department.order
            model.t_updated_at = datetime.now()
            model.t_deleted_at = None  # 重新激活(如果有软删除)
        else:
            # 创建新部门
            model = self._to_model(department)
            self._session.add(model)

        self._session.commit()
        self._session.refresh(model)
        return self._to_entity(model)

    def list_all(self) -> list[Department]:
        """获取全量部门"""
        stmt = select(DepartmentModel).where(DepartmentModel.t_deleted_at.is_(None))
        models = self._session.scalars(stmt).all()
        return [self._to_entity(m) for m in models]

    def get_department_stats(self) -> dict[int, int]:
        """获取各部门人数统计

        Returns:
            dict[int, int]: {dept_id: count}
        """
        from sqlalchemy import func

        stmt = (
            select(UserDepartmentMappingModel.t_dept_id, func.count(UserDepartmentMappingModel.t_user_id))
            .group_by(UserDepartmentMappingModel.t_dept_id)
        )
        results = self._session.execute(stmt).all()
        return {dept_id: count for dept_id, count in results}

    def clear_user_mappings(self, user_id: str) -> None:
        """清除指定用户的所有部门关联"""
        stmt = delete(UserDepartmentMappingModel).where(UserDepartmentMappingModel.t_user_id == user_id)
        self._session.execute(stmt)
        self._session.commit()

    def add_user_mapping(self, mapping: UserDepartmentMapping) -> None:
        """添加用户-部门关联"""
        model = UserDepartmentMappingModel(
            t_user_id=mapping.user_id,
            t_dept_id=mapping.dept_id,
            t_is_leader=mapping.is_leader,
            t_created_at=mapping.created_at or datetime.now(),
        )
        self._session.add(model)
        self._session.commit()

    def get_by_dept_id(self, dept_id: int) -> Department | None:
        """根据部门 ID 获取部门"""
        stmt = select(DepartmentModel).where(
            DepartmentModel.t_dept_id == dept_id,
            DepartmentModel.t_deleted_at.is_(None),
        )
        model = self._session.scalar(stmt)
        return self._to_entity(model) if model else None


__all__ = ["DepartmentRepository"]
