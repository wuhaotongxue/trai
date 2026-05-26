#!/usr/bin/env python
# 文件名: interfaces.py
# 作者: wuhao
# 日期: 2026_05_26_20:53:15
# 描述: 部门及国际化仓储接口定义

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Protocol

from domain.system.entities import Department, UserDepartmentMapping


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


class I18nRepository(Protocol):
    """国际化翻译仓储接口"""

    async def get_translations_by_locale(self, locale: str) -> dict[str, str]:
        """获取指定语言的所有翻译

        Args:
            locale: 语言代码,如 zh, en

        Returns:
            Dict[str, str]: 翻译键值对,格式为 {"namespace.key": "value"}
        """
        ...

    async def get_translation(self, locale: str, namespace: str, key: str) -> str | None:
        """获取单个翻译

        Args:
            locale: 语言代码
            namespace: 命名空间
            key: 翻译键
        """
        ...

    async def upsert_translation(self, locale: str, namespace: str, key: str, value: str) -> bool:
        """新增或更新翻译

        Args:
            locale: 语言代码
            namespace: 命名空间
            key: 翻译键
            value: 翻译值

        Returns:
            bool: 是否成功
        """
        ...

    async def delete_translation(self, locale: str, namespace: str, key: str) -> bool:
        """删除翻译

        Args:
            locale: 语言代码
            namespace: 命名空间
            key: 翻译键

        Returns:
            bool: 是否成功
        """
        ...

    async def list_translations(
        self, locale: str | None = None, namespace: str | None = None, limit: int = 100, offset: int = 0
    ) -> list[dict[str, str]]:
        """列出翻译

        Args:
            locale: 语言代码,可选
            namespace: 命名空间,可选
            limit: 限制数量
            offset: 偏移量

        Returns:
            List[Dict[str, str]]: 翻译列表
        """
        ...

    async def get_namespaces(self) -> list[str]:
        """获取所有命名空间

        Returns:
            List[str]: 命名空间列表
        """
        ...
