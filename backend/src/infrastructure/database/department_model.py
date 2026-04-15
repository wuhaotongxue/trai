#!/usr/bin/env python
# 文件名: department_model.py
# 作者: wuhao
# 日期: 2026_04_15
# 描述: 部门与用户-部门关联模型

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class DepartmentModel(Base):
    """部门模型"""

    __tablename__ = "t_departments"
    __comment__ = "部门表,存储企业组织架构"

    t_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement="auto")
    """自增主键 ID"""

    t_dept_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False, index=True)
    """部门 ID (对应企业微信 ID)"""

    t_name: Mapped[str] = mapped_column(String(128), nullable=False)
    """部门名称"""

    t_parent_id: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    """上级部门 ID"""

    t_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    """排序号"""

    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
    """创建时间"""

    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""

    t_deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    """软删除时间"""


class UserDepartmentMappingModel(Base):
    """用户-部门关联模型"""

    __tablename__ = "t_user_department_mapping"
    __comment__ = "用户-部门多对多映射表"

    t_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement="auto")
    """自增主键 ID"""

    t_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("t_users.t_user_id"), nullable=False, index=True)
    """用户 UUID (关联 t_users.t_user_id)"""

    t_dept_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_departments.t_dept_id"), nullable=False, index=True
    )
    """部门 ID (关联 t_departments.t_dept_id)"""

    t_is_leader: Mapped[bool] = mapped_column(default=False, nullable=False)
    """是否为部门负责人"""

    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
    """关联创建时间"""


__all__ = ["DepartmentModel", "UserDepartmentMappingModel"]
