#!/usr/bin/env python
# 文件名: agent_audit_log_service.py
# 作者: wuhao
# 日期: 2026_05_28_14:35:09
# 描述: Agent 审计日志服务, 为媒体生成和删除链路写入数据库审计记录

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from loguru import logger
from sqlalchemy.orm import Session

from infrastructure.database import get_session
from infrastructure.database.models import AuditLogModel


class AgentAuditLogService:
    """
    Agent 审计日志服务类, 统一为媒体生成、通知、删除等链路写入数据库日志.
    """

    def __init__(self, session: Session) -> None:
        """
        初始化 Agent 审计日志服务.

        参数:
            session (Session): 当前数据库会话.

        返回值:
            None.

        异常:
            无.
        """
        self._session = session

    def write_log(
        self,
        action: str,
        level: str,
        path: str,
        message: str,
        user_id: str = "",
        username: str = "",
        client_ip: str = "",
        status_code: int = 200,
        method: str = "INTERNAL",
        error: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """
        写入一条 Agent 审计日志.

        参数:
            action (str): 日志动作名称.
            level (str): 日志级别, 如 info warning error.
            path (str): 关联路径或逻辑入口.
            message (str): 日志消息.
            user_id (str): 操作用户 ID.
            username (str): 操作用户名.
            client_ip (str): 来源 IP.
            status_code (int): 业务状态码.
            method (str): 调用方式.
            error (str | None): 错误详情.
            metadata (dict[str, Any] | None): 扩展元数据.

        返回值:
            None.

        异常:
            无. 入库失败时仅记录错误日志.
        """
        try:
            log_model = AuditLogModel(
                t_log_id=str(uuid.uuid4()),
                t_timestamp=datetime.now(),
                t_trace_id=str(uuid.uuid4()),
                t_user_id=user_id or None,
                t_username=username or None,
                t_role="agent",
                t_action=action,
                t_level=level,
                t_method=method,
                t_path=path,
                t_status_code=status_code,
                t_duration_ms=0,
                t_client_ip=client_ip or None,
                t_user_agent=None,
                t_request_body=None,
                t_response_body={"message": message},
                t_error=error,
                t_metadata=metadata or {},
            )
            self._session.add(log_model)
            self._session.flush()
        except Exception as exc:
            logger.error(f"[AgentAudit] 写入数据库日志失败 | action={action} | error={exc}")

    @classmethod
    def write_log_with_new_session(
        cls,
        action: str,
        level: str,
        path: str,
        message: str,
        user_id: str = "",
        username: str = "",
        client_ip: str = "",
        status_code: int = 200,
        method: str = "INTERNAL",
        error: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """
        使用独立数据库会话写入一条 Agent 审计日志.

        参数:
            action (str): 日志动作名称.
            level (str): 日志级别.
            path (str): 关联路径或逻辑入口.
            message (str): 日志消息.
            user_id (str): 操作用户 ID.
            username (str): 操作用户名.
            client_ip (str): 来源 IP.
            status_code (int): 业务状态码.
            method (str): 调用方式.
            error (str | None): 错误详情.
            metadata (dict[str, Any] | None): 扩展元数据.

        返回值:
            None.

        异常:
            无. 入库失败时仅记录错误日志.
        """
        try:
            with get_session() as session:
                service = cls(session)
                service.write_log(
                    action=action,
                    level=level,
                    path=path,
                    message=message,
                    user_id=user_id,
                    username=username,
                    client_ip=client_ip,
                    status_code=status_code,
                    method=method,
                    error=error,
                    metadata=metadata,
                )
                session.commit()
        except Exception as exc:
            logger.error(f"[AgentAudit] 独立会话写入失败 | action={action} | error={exc}")
