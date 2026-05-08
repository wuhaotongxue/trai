#!/usr/bin/env python
# 文件名: i18n_repository.py
# 作者: wuhao
# 日期: 2026_04_24_14:30:00
# 描述: 国际化字符串和系统配置数据库仓储

from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from infrastructure.database.i18n_model import I18nStringModel, SystemSettingModel


class I18nRepository:
    """国际化字符串数据库仓储"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def upsert(
        self,
        locale: str,
        namespace: str,
        key: str,
        value: str,
        created_by: str | None = None,
        updated_by: str | None = None,
    ) -> I18nStringModel:
        """Upsert 翻译字符串(存在则更新,不存在则创建)

        Args:
            locale: 语言代码
            namespace: 命名空间
            key: 翻译键
            value: 翻译值
            created_by: 创建人
            updated_by: 修改人

        Returns:
            I18nStringModel: 国际化字符串模型
        """
        stmt = select(I18nStringModel).where(
            I18nStringModel.t_locale == locale,
            I18nStringModel.t_namespace == namespace,
            I18nStringModel.t_key == key,
        )
        existing = self._session.execute(stmt).scalar_one_or_none()

        if existing:
            existing.t_value = value
            existing.t_updated_at = datetime.now()
            if updated_by:
                existing.t_updated_by = updated_by
            self._session.flush()
            return existing

        model = I18nStringModel(
            t_locale=locale,
            t_namespace=namespace,
            t_key=key,
            t_value=value,
            t_created_by=created_by,
            t_updated_by=updated_by,
        )
        self._session.add(model)
        self._session.flush()
        return model

    def bulk_upsert(
        self,
        translations: dict[str, dict[str, str]],
        created_by: str | None = None,
        updated_by: str | None = None,
    ) -> int:
        """批量 Upsert 翻译字符串

        Args:
            translations: 翻译字典,格式为 {locale: {namespace.key: value}}
            created_by: 创建人
            updated_by: 修改人

        Returns:
            int: 影响的行数
        """
        count = 0
        for locale, ns_dict in translations.items():
            for ns_key, value in ns_dict.items():
                if "." not in ns_key:
                    continue
                idx = ns_key.rfind(".")
                namespace = ns_key[:idx]
                key = ns_key[idx + 1 :]
                self.upsert(locale, namespace, key, value, created_by, updated_by)
                count += 1
        self._session.flush()
        return count

    def get_by_locale(self, locale: str) -> dict[str, str]:
        """获取指定语言的所有翻译

        Args:
            locale: 语言代码

        Returns:
            dict[str, str]: key 为 namespace.key 格式, value 为翻译文本
        """
        stmt = select(I18nStringModel).where(I18nStringModel.t_locale == locale)
        results = self._session.execute(stmt).scalars().all()
        return {f"{r.t_namespace}.{r.t_key}": r.t_value for r in results}

    def get_by_locale_and_namespace(self, locale: str, namespace: str) -> dict[str, str]:
        """获取指定语言和命名空间的翻译

        Args:
            locale: 语言代码
            namespace: 命名空间

        Returns:
            dict[str, str]: key 为翻译键, value 为翻译文本
        """
        stmt = select(I18nStringModel).where(
            I18nStringModel.t_locale == locale,
            I18nStringModel.t_namespace == namespace,
        )
        results = self._session.execute(stmt).scalars().all()
        return {r.t_key: r.t_value for r in results}

    def list_namespaces(self, locale: str) -> list[str]:
        """获取指定语言的所有命名空间

        Args:
            locale: 语言代码

        Returns:
            list[str]: 命名空间列表
        """
        stmt = select(I18nStringModel.t_namespace).where(I18nStringModel.t_locale == locale).distinct()
        results = self._session.execute(stmt).scalars().all()
        return list(results)

    def count(self, locale: str | None = None) -> int:
        """统计翻译字符串数量

        Args:
            locale: 语言代码过滤

        Returns:
            int: 数量
        """
        stmt = select(I18nStringModel)
        if locale:
            stmt = stmt.where(I18nStringModel.t_locale == locale)
        return len(self._session.execute(stmt).scalars().all())

    def delete_by_key(self, locale: str, namespace: str, key: str) -> bool:
        """删除指定翻译字符串

        Args:
            locale: 语言代码
            namespace: 命名空间
            key: 翻译键

        Returns:
            bool: 是否删除成功
        """
        stmt = delete(I18nStringModel).where(
            I18nStringModel.t_locale == locale,
            I18nStringModel.t_namespace == namespace,
            I18nStringModel.t_key == key,
        )
        result = self._session.execute(stmt)
        self._session.flush()
        return result.rowcount > 0


class SystemSettingRepository:
    """系统配置数据库仓储"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def upsert(
        self,
        key: str,
        value: str,
        value_type: str = "string",
        label: str | None = None,
        description: str | None = None,
        category: str = "general",
        is_public: bool = True,
        sort_order: int = 0,
        created_by: str | None = None,
        updated_by: str | None = None,
    ) -> SystemSettingModel:
        """Upsert 系统配置

        Args:
            key: 配置键
            value: 配置值
            value_type: 值类型
            label: 中文标签
            description: 描述
            category: 分类
            is_public: 是否公开
            sort_order: 排序
            created_by: 创建人
            updated_by: 修改人

        Returns:
            SystemSettingModel: 系统配置模型
        """
        stmt = select(SystemSettingModel).where(SystemSettingModel.t_key == key)
        existing = self._session.execute(stmt).scalar_one_or_none()

        if existing:
            existing.t_value = value
            existing.t_type = value_type
            if label is not None:
                existing.t_label = label
            if description is not None:
                existing.t_description = description
            if category:
                existing.t_category = category
            existing.t_is_public = is_public
            existing.t_sort_order = sort_order
            existing.t_updated_at = datetime.now()
            if updated_by:
                existing.t_updated_by = updated_by
            self._session.flush()
            return existing

        model = SystemSettingModel(
            t_key=key,
            t_value=value,
            t_type=value_type,
            t_label=label,
            t_description=description,
            t_category=category,
            t_is_public=is_public,
            t_sort_order=sort_order,
            t_created_by=created_by,
            t_updated_by=updated_by,
        )
        self._session.add(model)
        self._session.flush()
        return model

    def get_by_key(self, key: str) -> SystemSettingModel | None:
        """根据 key 获取配置

        Args:
            key: 配置键

        Returns:
            SystemSettingModel | None: 配置模型或 None
        """
        stmt = select(SystemSettingModel).where(SystemSettingModel.t_key == key)
        return self._session.execute(stmt).scalar_one_or_none()

    def get_value(self, key: str, default: str = "") -> str:
        """获取配置值

        Args:
            key: 配置键
            default: 默认值

        Returns:
            str: 配置值
        """
        model = self.get_by_key(key)
        return model.t_value if model else default

    def list_by_category(self, category: str | None = None) -> list[SystemSettingModel]:
        """按分类获取配置列表

        Args:
            category: 分类,None 表示全部

        Returns:
            list[SystemSettingModel]: 配置列表
        """
        stmt = select(SystemSettingModel)
        if category:
            stmt = stmt.where(SystemSettingModel.t_category == category)
        stmt = stmt.order_by(SystemSettingModel.t_sort_order, SystemSettingModel.t_key)
        return list(self._session.execute(stmt).scalars().all())

    def list_public(self) -> list[SystemSettingModel]:
        """获取所有公开配置

        Returns:
            list[SystemSettingModel]: 公开配置列表
        """
        stmt = (
            select(SystemSettingModel)
            .where(SystemSettingModel.t_is_public == True)
            .order_by(SystemSettingModel.t_sort_order)
        )
        return list(self._session.execute(stmt).scalars().all())

    def delete_by_key(self, key: str) -> bool:
        """删除指定配置

        Args:
            key: 配置键

        Returns:
            bool: 是否删除成功
        """
        stmt = delete(SystemSettingModel).where(SystemSettingModel.t_key == key)
        result = self._session.execute(stmt)
        self._session.flush()
        return result.rowcount > 0


__all__ = ["I18nRepository", "SystemSettingRepository"]
