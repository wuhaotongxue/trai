#!/usr/bin/env python
# 文件名: __init__.py
# 作者: wuhao
# 日期: 2026_04_30_08:19:34
# 描述: 管理后台路由包初始化

# 管理路由

from api.routers.admin.analytics import router as analytics_router
from api.routers.admin.dashboard import router as dashboard_router
from api.routers.admin.knowledge_base import router as knowledge_base_router
from api.routers.admin.monitor import router as monitor_router
from api.routers.admin.quota_config import router as quota_config_router
from api.routers.admin.schema_doc import router as schema_doc_router
from api.routers.admin.user import router as user_router

__all__ = [
    "analytics_router",
    "dashboard_router",
    "knowledge_base_router",
    "monitor_router",
    "quota_config_router",
    "schema_doc_router",
    "user_router",
]
