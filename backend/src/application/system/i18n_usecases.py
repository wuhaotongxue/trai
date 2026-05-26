#!/usr/bin/env python
# 文件名: i18n_usecases.py
# 作者: wuhao
# 日期: 2026_04_24
# 描述: 国际化翻译用例

from __future__ import annotations

from domain.system.interfaces import I18nRepository


class I18nUseCase:
    """国际化翻译用例"""

    def __init__(self, i18n_repo: I18nRepository):
        self._i18n_repo = i18n_repo

    async def get_translations_by_locale(self, locale: str) -> dict[str, str]:
        """获取指定语言的所有翻译"""
        return await self._i18n_repo.get_translations_by_locale(locale)

    async def get_translation(self, locale: str, namespace: str, key: str) -> str | None:
        """获取单个翻译"""
        return await self._i18n_repo.get_translation(locale, namespace, key)

    async def upsert_translation(self, locale: str, namespace: str, key: str, value: str) -> bool:
        """新增或更新翻译"""
        return await self._i18n_repo.upsert_translation(locale, namespace, key, value)

    async def delete_translation(self, locale: str, namespace: str, key: str) -> bool:
        """删除翻译"""
        return await self._i18n_repo.delete_translation(locale, namespace, key)

    async def list_translations(
        self, locale: str | None = None, namespace: str | None = None, limit: int = 100, offset: int = 0
    ) -> dict[str, any]:
        """列出翻译"""
        items = await self._i18n_repo.list_translations(locale, namespace, limit, offset)
        namespaces = await self._i18n_repo.get_namespaces()

        return {"total": len(items), "items": items, "namespaces": namespaces}

    async def import_translations(
        self, translations: dict[str, dict[str, str]], overwrite: bool = True
    ) -> dict[str, any]:
        """批量导入翻译

        Args:
            translations: 翻译数据,格式为 {"locale": {"namespace.key": "value"}}
            overwrite: 是否覆盖现有翻译

        Returns:
            Dict[str, any]: 导入结果
        """
        count = 0

        for locale, trans_map in translations.items():
            for full_key, value in trans_map.items():
                if "." in full_key:
                    namespace, key = full_key.split(".", 1)
                    success = await self._i18n_repo.upsert_translation(locale, namespace, key, value)
                    if success:
                        count += 1

        return {"message": f"成功导入 {count} 条翻译", "count": count}
