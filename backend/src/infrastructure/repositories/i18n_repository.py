#!/usr/bin/env python
# 文件名: i18n_repository.py
# 作者: wuhao
# 日期: 2026_04_24
# 描述: 国际化翻译仓储实现

from __future__ import annotations

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from domain.interfaces.i18n_interfaces import I18nRepository
from infrastructure.database.i18n_model import I18nModel


class I18nRepositoryImpl(I18nRepository):
    """国际化翻译仓储实现"""

    def __init__(self, db: Session):
        self._db = db

    async def get_translations_by_locale(self, locale: str) -> dict[str, str]:
        """获取指定语言的所有翻译"""
        try:
            stmt = select(I18nModel.t_namespace, I18nModel.t_key, I18nModel.t_value).where(
                and_(I18nModel.t_locale == locale, I18nModel.t_is_deleted == "N")
            )

            result = self._db.execute(stmt).all()
            translations = {}
            for namespace, key, value in result:
                translations[key] = value

            return translations
        except Exception:
            return {}

    async def get_translation(self, locale: str, namespace: str, key: str) -> str | None:
        """获取单个翻译"""
        try:
            stmt = select(I18nModel.t_value).where(
                and_(
                    I18nModel.t_locale == locale,
                    I18nModel.t_namespace == namespace,
                    I18nModel.t_key == key,
                    I18nModel.t_is_deleted == "N",
                )
            )
            result = self._db.execute(stmt).scalar()
            return result
        except Exception:
            return None

    async def upsert_translation(self, locale: str, namespace: str, key: str, value: str) -> bool:
        """新增或更新翻译"""
        try:
            # 尝试查找现有记录
            stmt = select(I18nModel).where(
                and_(I18nModel.t_locale == locale, I18nModel.t_namespace == namespace, I18nModel.t_key == key)
            )
            existing = self._db.execute(stmt).scalar_one_or_none()

            if existing:
                # 更新现有记录
                existing.t_value = value
                existing.t_is_deleted = "N"
            else:
                # 创建新记录
                new_translation = I18nModel(
                    t_id=I18nModel.generate_id(locale, namespace, key),
                    t_locale=locale,
                    t_namespace=namespace,
                    t_key=key,
                    t_value=value,
                    t_is_deleted="N",
                )
                self._db.add(new_translation)

            self._db.commit()
            return True
        except Exception:
            self._db.rollback()
            return False

    async def delete_translation(self, locale: str, namespace: str, key: str) -> bool:
        """删除翻译"""
        try:
            stmt = select(I18nModel).where(
                and_(I18nModel.t_locale == locale, I18nModel.t_namespace == namespace, I18nModel.t_key == key)
            )
            existing = self._db.execute(stmt).scalar_one_or_none()

            if existing:
                existing.t_is_deleted = "Y"
                self._db.commit()
                return True
            return False
        except Exception:
            self._db.rollback()
            return False

    async def list_translations(
        self, locale: str | None = None, namespace: str | None = None, limit: int = 100, offset: int = 0
    ) -> list[dict[str, str]]:
        """列出翻译"""
        try:
            conditions = [I18nModel.t_is_deleted == "N"]

            if locale:
                conditions.append(I18nModel.t_locale == locale)
            if namespace:
                conditions.append(I18nModel.t_namespace == namespace)

            stmt = (
                select(
                    I18nModel.t_locale,
                    I18nModel.t_namespace,
                    I18nModel.t_key,
                    I18nModel.t_value,
                    I18nModel.t_updated_at,
                )
                .where(and_(*conditions))
                .limit(limit)
                .offset(offset)
            )

            result = self._db.execute(stmt).all()
            translations = []
            for loc, ns, key, value, updated_at in result:
                translations.append(
                    {
                        "locale": loc,
                        "namespace": ns,
                        "key": key,
                        "value": value,
                        "updated_at": updated_at.isoformat() if updated_at else None,
                    }
                )

            return translations
        except Exception:
            return []

    async def get_namespaces(self) -> list[str]:
        """获取所有命名空间"""
        try:
            stmt = select(I18nModel.t_namespace).where(I18nModel.t_is_deleted == "N").distinct()

            result = self._db.execute(stmt).scalars().all()
            return list(result)
        except Exception:
            return []
