#!/usr/bin/env python
# 文件名: i18n_model.py
# 作者: wuhao
# 日期: 2026_04_24_14:00:00
# 描述: 国际化字符串和系统配置数据库模型

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class I18nStringModel(Base):
    """国际化字符串模型"""

    __tablename__ = "t_i18n_strings"
    __comment__ = "国际化字符串表,存储多语言翻译文本"

    t_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    """自增主键 ID"""

    t_locale: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    """语言代码,如 zh/en/ja"""

    t_namespace: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """命名空间,如 nav/hero/admin/login"""

    t_key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    """翻译键,如 hero.title"""

    t_value: Mapped[str] = mapped_column(Text, nullable=False)
    """翻译文本值"""

    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""

    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""

    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""

    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""


class SystemSettingModel(Base):
    """系统配置模型"""

    __tablename__ = "t_system_settings"
    __comment__ = "系统配置表,存储可由管理员修改的系统参数"

    t_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    """自增主键 ID"""

    t_key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    """配置键,如 system.name/default_language"""

    t_value: Mapped[str] = mapped_column(Text, nullable=False)
    """配置值"""

    t_type: Mapped[str] = mapped_column(String(32), default="string", nullable=False)
    """配置类型:string/number/boolean/json"""

    t_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    """配置中文标签"""

    t_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    """配置描述"""

    t_category: Mapped[str] = mapped_column(String(64), default="general", nullable=False, index=True)
    """配置分类:general/security/notification/advanced"""

    t_is_public: Mapped[bool] = mapped_column(default=True, nullable=False)
    """是否公开给前端:公开的配置前端可直接读取"""

    t_sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """排序顺序"""

    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""

    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""

    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""

    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""


__all__ = ["I18nStringModel", "SystemSettingModel"]
