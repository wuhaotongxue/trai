# 管理路由

from api.routers.admin.dashboard import router as dashboard_router
from api.routers.admin.analytics import router as analytics_router
from api.routers.admin.quota_config import router as quota_config_router
from api.routers.admin.user import router as user_router

__all__ = ["dashboard_router", "analytics_router", "quota_config_router", "user_router"]
