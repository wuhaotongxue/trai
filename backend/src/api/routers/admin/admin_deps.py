#!/usr/bin/env python
# 文件名: admin_deps.py
# 作者: wuhao
# 日期: 2026_04_30_11:20
# 描述: 管理后台专属依赖注入, 桥接 api.deps 到 admin 子路由

from api.deps import AdminUser, require_admin

get_current_admin_user = require_admin

__all__ = ["AdminUser", "get_current_admin_user"]
