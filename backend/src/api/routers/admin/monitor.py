#!/usr/bin/env python
# 文件名: monitor.py
# 作者: wuhao
# 日期: 2026_04_22_15:30:00
# 描述: 系统监控与日志审计路由

from __future__ import annotations

import os
import psutil
from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from api.deps import AdminUser
from infrastructure.database import get_session
from sqlalchemy import select, desc
from infrastructure.database.models import AuditLogModel

router = APIRouter(prefix="/admin/monitor", tags=["管理后台"])

class LogItem(BaseModel):
    id: int
    user_id: str
    username: str
    action: str
    module: str
    ip_address: str | None
    created_at: str

class SystemStats(BaseModel):
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    network_sent: int
    network_recv: int

@router.get("/logs", response_model=list[LogItem])
async def get_audit_logs(admin: AdminUser, limit: int = 50):
    """获取系统操作日志"""
    db = get_session()
    stmt = select(AuditLogModel).order_by(desc(AuditLogModel.t_created_at)).limit(limit)
    logs = db.execute(stmt).scalars().all()
    
    return [
        LogItem(
            id=log.t_id,
            user_id=log.t_user_id,
            username=log.t_username or "unknown",
            action=log.t_action,
            module=log.t_module,
            ip_address=log.t_ip_address,
            created_at=log.t_created_at.isoformat()
        )
        for log in logs
    ]

@router.get("/system", response_model=SystemStats)
async def get_system_stats(admin: AdminUser):
    """获取服务器硬件状态"""
    net = psutil.net_io_counters()
    return SystemStats(
        cpu_percent=psutil.cpu_percent(),
        memory_percent=psutil.virtual_memory().percent,
        disk_percent=psutil.disk_usage("/").percent,
        network_sent=net.bytes_sent,
        network_recv=net.bytes_recv
    )
