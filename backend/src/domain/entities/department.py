#!/usr/bin/env python
# 文件名: department.py
# 作者: wuhao
# 日期: 2026_04_15
# 描述: 部门领域实体

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass
class Department:
    """部门领域实体"""

    dept_id: int
    """企业微信部门 ID"""

    name: str
    """部门名称"""

    parent_id: int
    """上级部门 ID"""

    order: int = 0
    """排序号"""

    created_at: datetime | None = None
    """创建时间"""

    updated_at: datetime | None = None
    """更新时间"""


@dataclass
class UserDepartmentMapping:
    """用户-部门关联实体"""

    user_id: str
    """系统用户 ID"""

    dept_id: int
    """企业微信部门 ID"""

    is_leader: bool = False
    """是否为部门负责人"""

    created_at: datetime | None = None
    """关联创建时间"""
