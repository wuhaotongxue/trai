#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: quota_repository.py
# 作者: wuhao
# 日期: 2026_04_10_09:21:00
# 描述: 配额数据访问层

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from core.logger import logger
from infrastructure.database.models import (
    QuotaPlanModel,
    QuotaTransactionLogModel,
    UserQuotaUsageModel,
)


class QuotaRepository:
    """配额数据访问层"""

    def __init__(self, session: Session) -> None:
        self._session = session

    def get_plan_by_role(self, role: str) -> QuotaPlanModel | None:
        """获取角色配额套餐

        Args:
            role: 用户角色

        Returns:
            QuotaPlanModel | None: 配额套餐
        """
        stmt = select(QuotaPlanModel).where(QuotaPlanModel.t_user_role == role)
        result = self._session.execute(stmt)
        return result.scalar_one_or_none()

    def get_or_create_usage(
        self, user_id: str, billing_month: str
    ) -> UserQuotaUsageModel:
        """获取或创建当月配额使用记录

        Args:
            user_id: 用户 ID
            billing_month: 账单月份 YYYY-MM

        Returns:
            UserQuotaUsageModel: 配额使用记录
        """
        stmt = select(UserQuotaUsageModel).where(
            UserQuotaUsageModel.t_user_id == user_id,
            UserQuotaUsageModel.t_billing_month == billing_month,
        )
        result = self._session.execute(stmt)
        record = result.scalar_one_or_none()

        if record is None:
            record = UserQuotaUsageModel(
                t_user_id=user_id,
                t_billing_month=billing_month,
            )
            self._session.add(record)
            self._session.flush()
            logger.info(f"创建配额使用记录 | user_id={user_id} | month={billing_month}")

        return record

    def get_usage(
        self, user_id: str, billing_month: str
    ) -> UserQuotaUsageModel | None:
        """获取当月配额使用记录

        Args:
            user_id: 用户 ID
            billing_month: 账单月份 YYYY-MM

        Returns:
            UserQuotaUsageModel | None: 配额使用记录
        """
        stmt = select(UserQuotaUsageModel).where(
            UserQuotaUsageModel.t_user_id == user_id,
            UserQuotaUsageModel.t_billing_month == billing_month,
        )
        result = self._session.execute(stmt)
        return result.scalar_one_or_none()

    def get_usage_field(
        self, record: UserQuotaUsageModel, quota_type: str
    ) -> int:
        """从使用记录中读取指定配额字段

        Args:
            record: 配额使用记录
            quota_type: 配额类型

        Returns:
            int: 已用数量
        """
        field_map: dict[str, str] = {
            "image_generation": "t_image_generation_used",
            "audio_synthesis": "t_audio_synthesis_used",
            "transcription_minutes": "t_transcription_minutes_used",
            "meeting_summary": "t_meeting_summary_used",
            "ai_translation": "t_ai_translation_used",
            "ai_summarization": "t_ai_summarization_used",
            "agent_tool_call": "t_agent_tool_call_used",
        }
        field = field_map.get(quota_type)
        if field:
            return getattr(record, field, 0)
        return 0

    def get_limit_field(
        self, plan: QuotaPlanModel, quota_type: str
    ) -> int:
        """从套餐中读取指定配额上限

        Args:
            plan: 配额套餐
            quota_type: 配额类型

        Returns:
            int: 配额上限（0 表示无限制）
        """
        field_map: dict[str, str] = {
            "image_generation": "t_image_generation_limit",
            "audio_synthesis": "t_audio_synthesis_limit",
            "transcription_minutes": "t_transcription_minutes_limit",
            "meeting_summary": "t_meeting_summary_limit",
            "ai_translation": "t_ai_translation_limit",
            "ai_summarization": "t_ai_summarization_limit",
            "agent_tool_call": "t_agent_tool_call_limit",
        }
        field = field_map.get(quota_type)
        if field:
            return getattr(plan, field, 0)
        return 0

    def increment_usage(
        self,
        record: UserQuotaUsageModel,
        quota_type: str,
        delta: int = 1,
    ) -> int:
        """增加配额使用量

        Args:
            record: 配额使用记录
            quota_type: 配额类型
            delta: 增量（默认 1）

        Returns:
            int: 扣减后的新余额
        """
        field_map: dict[str, str] = {
            "image_generation": "t_image_generation_used",
            "audio_synthesis": "t_audio_synthesis_used",
            "transcription_minutes": "t_transcription_minutes_used",
            "meeting_summary": "t_meeting_summary_used",
            "ai_translation": "t_ai_translation_used",
            "ai_summarization": "t_ai_summarization_used",
            "agent_tool_call": "t_agent_tool_call_used",
        }
        field = field_map.get(quota_type)
        if field:
            current = getattr(record, field, 0)
            setattr(record, field, current + delta)
            record.t_updated_at = datetime.now()
            self._session.flush()
            return current + delta
        return 0

    def add_transaction_log(
        self,
        user_id: str,
        billing_month: str,
        transaction_type: str,
        quota_type: str,
        delta: int,
        balance_before: int,
        balance_after: int,
        tool_id: str | None = None,
        session_id: str | None = None,
        trace_id: str | None = None,
    ) -> None:
        """记录配额变动流水

        Args:
            user_id: 用户 ID
            billing_month: 账单月份
            transaction_type: 交易类型
            quota_type: 配额类型
            delta: 变动量
            balance_before: 变动前余额
            balance_after: 变动后余额
            tool_id: 关联工具 ID
            session_id: 关联会话 ID
            trace_id: 链路追踪 ID
        """
        log = QuotaTransactionLogModel(
            t_user_id=user_id,
            t_billing_month=billing_month,
            t_transaction_type=transaction_type,
            t_quota_type=quota_type,
            t_delta=delta,
            t_balance_before=balance_before,
            t_balance_after=balance_after,
            t_tool_id=tool_id,
            t_session_id=session_id,
            t_trace_id=trace_id,
        )
        self._session.add(log)
        self._session.flush()

    def seed_default_plans(self) -> None:
        """初始化默认配额套餐"""
        default_plans = [
            ("Guest", "guest", 5, 10, 30, 2, 20, 10, 50),
            ("Normal User", "normal", 50, 100, 300, 20, 200, 100, 500),
            ("VIP", "vip", 0, 0, 0, 0, 0, 0, 0),
            ("Admin", "admin", 0, 0, 0, 0, 0, 0, 0),
        ]

        for name, role, *limits in default_plans:
            existing = self.get_plan_by_role(role)
            if existing:
                continue

            plan = QuotaPlanModel(
                t_plan_name=name,
                t_user_role=role,
                t_image_generation_limit=limits[0],
                t_audio_synthesis_limit=limits[1],
                t_transcription_minutes_limit=limits[2],
                t_meeting_summary_limit=limits[3],
                t_ai_translation_limit=limits[4],
                t_ai_summarization_limit=limits[5],
                t_agent_tool_call_limit=limits[6],
            )
            self._session.add(plan)

        self._session.flush()
        logger.info("默认配额套餐初始化完成")


__all__ = ["QuotaRepository"]
