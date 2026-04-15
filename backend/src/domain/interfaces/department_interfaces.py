#!/usr/bin/env python
# 文件名: department_interfaces.py
# 作者: wuhao
# 日期: 2026_04_15
# 描述: 部门仓储接口定义

from __future__ import annotations

from abc import ABC, abstractmethod

from domain.entities.department import Department, UserDepartmentMapping


class IDepartmentRepository(ABC):
    """部门仓储接口"""

    @abstractmethod
    def create_or_update(self, department: Department) -> Department:
        """创建或更新部门

        Args:
            department: 部门领域实体

        Returns:
            Department: 变更后的部门实体
        """
        pass

    @abstractmethod
    def list_all(self) -> list[Department]:
        """列出全量部门

        Returns:
            list[Department]: 部门列表
        """
        pass

    @abstractmethod
    def clear_user_mappings(self, user_id: str) -> None:
        """清除指定用户的所有部门关联

        Args:
            user_id: 用户 ID
        """
        pass

    @abstractmethod
    def add_user_mapping(self, mapping: UserDepartmentMapping) -> None:
        """添加用户-部门关联

        Args:
            mapping: 用户-部门关联实体
        """
        pass

    @abstractmethod
    def get_by_dept_id(self, dept_id: int) -> Department | None:
        """根据部门 ID 获取部门

        Args:
            dept_id: 企业微信部门 ID

        Returns:
            Department | None: 部门实体
        """
        pass
