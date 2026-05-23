#!/usr/bin/env python
# 文件名: login_log_repository.py
# 作者: wuhao
# 日期: 2026_05_15_14:50:00
# 描述: 登录日志仓储

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from infrastructure.database.models import LoginLogModel


class LoginLogRepository:
    """登录日志仓储"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create_log(
        self,
        user_id: str,
        username: str,
        display_name: str | None,
        role: str,
        tenant_id: str | None,
        login_status: str,
        client_ip: str,
        user_agent: str | None = None,
        device_type: str | None = None,
        browser: str | None = None,
        os: str | None = None,
        failure_reason: str | None = None,
        location: str | None = None,
        extra_data: dict[str, Any] | None = None,
    ) -> LoginLogModel:
        """创建登录日志

        Args:
            user_id: 用户 ID
            username: 用户名
            display_name: 显示名称
            role: 用户角色
            tenant_id: 租户 ID
            login_status: 登录状态(success/failure)
            client_ip: 客户端 IP 地址
            user_agent: 浏览器 User-Agent
            device_type: 设备类型
            browser: 浏览器名称
            os: 操作系统
            failure_reason: 失败原因
            location: 地理位置
            extra_data: 扩展数据

        Returns:
            LoginLogModel: 创建的登录日志模型
        """
        log = LoginLogModel(
            t_log_id=str(uuid.uuid4()),
            t_user_id=user_id,
            t_username=username,
            t_display_name=display_name,
            t_role=role,
            t_tenant_id=tenant_id,
            t_login_status=login_status,
            t_failure_reason=failure_reason,
            t_client_ip=client_ip,
            t_user_agent=user_agent,
            t_device_type=device_type,
            t_browser=browser,
            t_os=os,
            t_location=location,
            t_extra_data=extra_data or {},
        )
        self._session.add(log)
        self._session.commit()
        self._session.refresh(log)
        return log

    def get_logs(
        self,
        user_id: str | None = None,
        login_status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[LoginLogModel]:
        """获取登录日志列表

        Args:
            user_id: 用户 ID(可选)
            login_status: 登录状态(可选)
            limit: 每页数量
            offset: 偏移量

        Returns:
            list[LoginLogModel]: 登录日志列表
        """
        from sqlalchemy import select

        stmt = select(LoginLogModel)

        if user_id:
            stmt = stmt.where(LoginLogModel.t_user_id == user_id)
        if login_status:
            stmt = stmt.where(LoginLogModel.t_login_status == login_status)

        stmt = stmt.order_by(LoginLogModel.t_created_at.desc()).limit(limit).offset(offset)
        return list(self._session.scalars(stmt))

    def get_log_by_id(self, log_id: str) -> LoginLogModel | None:
        """根据日志ID获取日志

        Args:
            log_id: 日志 ID

        Returns:
            LoginLogModel | None: 登录日志模型
        """
        from sqlalchemy import select

        stmt = select(LoginLogModel).where(LoginLogModel.t_log_id == log_id)
        return self._session.scalar(stmt)

    def get_user_login_stats(
        self, user_id: str, days: int = 30
    ) -> dict[str, Any]:
        """获取用户登录统计

        Args:
            user_id: 用户 ID
            days: 统计天数

        Returns:
            dict[str, Any]: 统计信息
        """
        from datetime import timedelta

        from sqlalchemy import func, select

        since = datetime.now() - timedelta(days=days)

        stmt = (
            select(
                func.count(LoginLogModel.t_id).label("total"),
                func.sum(func.case((LoginLogModel.t_login_status == "success", 1), else_=0)).label("success"),
                func.sum(func.case((LoginLogModel.t_login_status == "failure", 1), else_=0)).label("failure"),
            )
            .where(LoginLogModel.t_user_id == user_id)
            .where(LoginLogModel.t_created_at >= since)
        )

        result = self._session.execute(stmt).first()

        if result:
            return {
                "total": result.total or 0,
                "success": result.success or 0,
                "failure": result.failure or 0,
                "success_rate": round((result.success or 0) / (result.total or 1) * 100, 2),
            }

        return {"total": 0, "success": 0, "failure": 0, "success_rate": 0.0}


__all__ = ["LoginLogRepository"]
