#!/usr/bin/env python
# 文件名: i18n_interfaces.py
# 作者: wuhao
# 日期: 2026_04_24
# 描述: 国际化翻译领域接口

from __future__ import annotations

from typing import Protocol


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

        Returns:
            Optional[str]: 翻译值,如果不存在返回 None
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
