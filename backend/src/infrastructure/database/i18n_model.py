#!/usr/bin/env python
# 文件名: i18n_model.py
# 作者: wuhao
# 日期: 2026_04_24
# 描述: 国际化翻译数据模型

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class I18nModel(Base):
    """国际化翻译模型"""

    __tablename__ = "t_i18n_translations"
    __comment__ = "国际化翻译表，存储多语言翻译数据"

    t_id: Mapped[str] = mapped_column(String(64), primary_key=True, comment="主键 ID")
    """主键 ID，格式：{locale}:{namespace}:{key}"""

    t_locale: Mapped[str] = mapped_column(String(10), nullable=False, index=True, comment="语言代码")
    """语言代码，如：zh, en"""

    t_namespace: Mapped[str] = mapped_column(String(100), nullable=False, index=True, comment="命名空间")
    """命名空间，如：login, nav, hero"""

    t_key: Mapped[str] = mapped_column(String(200), nullable=False, index=True, comment="翻译键")
    """翻译键，如：form.title, button.submit"""

    t_value: Mapped[str] = mapped_column(Text, nullable=False, comment="翻译值")
    """翻译值"""

    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    """创建时间"""

    t_updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间"
    )
    """更新时间"""

    t_is_deleted: Mapped[str] = mapped_column(String(1), default="N", nullable=False, comment="软删除标记")
    """软删除标记：Y/N"""

    @classmethod
    def generate_id(cls, locale: str, namespace: str, key: str) -> str:
        """生成主键 ID"""
        return f"{locale}:{namespace}:{key}"
