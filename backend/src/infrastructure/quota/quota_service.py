#!/usr/bin/env python
# 文件名: quota_service.py
# 作者: wuhao
# 日期: 2026_04_10_09:21:00
# 描述: 配额服务 - 统一配额检查和扣减入口

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from core.exceptions import AIQuotaExceededError
from core.logger import logger
from infrastructure.repositories.quota_repository import QuotaRepository

TOOL_TO_QUOTA_TYPE: dict[str, str] = {
    "image.generate": "image_generation",
    "audio.synthesize": "audio_synthesis",
    "audio.transcribe": "transcription_minutes",
    "meeting.summary.generate": "meeting_summary",
    "chat.message.translate": "ai_translation",
    "chat.message.summarize": "ai_summarization",
    "weather.current": "agent_tool_call",
    "utility.calculator": "agent_tool_call",
    "utility.search": "agent_tool_call",
    "utility.translate": "agent_tool_call",
}


@dataclass
class QuotaStatus:
    """配额状态"""

    quota_type: str
    used: int
    limit: int
    remaining: int
    unlimited: bool
    billing_month: str


class QuotaService:
    """配额服务 - 统一配额检查和扣减入口

    所有涉及配额的检查必须通过此类,禁止在业务代码中直接操作配额.
    """

    def __init__(self, quota_repository: QuotaRepository) -> None:
        self._repo = quota_repository
        self._billing_month = datetime.now().strftime("%Y-%m")

    def get_quota_type_for_tool(self, tool_id: str) -> str | None:
        """根据工具 ID 获取对应的配额类型

        Args:
            tool_id: 工具 ID

        Returns:
            str | None: 配额类型
        """
        return TOOL_TO_QUOTA_TYPE.get(tool_id)

    def check_quota(
        self,
        user_id: str,
        role: str,
        tool_id: str,
    ) -> None:
        """检查配额是否充足(不扣减)

        Args:
            user_id: 用户 ID
            role: 用户角色
            tool_id: 工具 ID

        Raises:
            AIQuotaExceededError: 配额不足
        """
        if role in ("vip", "admin"):
            return

        quota_type = self.get_quota_type_for_tool(tool_id)
        if quota_type is None:
            return

        plan = self._repo.get_plan_by_role(role)
        if plan is None:
            logger.warning(f"未找到角色配额套餐 | role={role} | 使用默认无限")
            return

        limit = self._repo.get_limit_field(plan, quota_type)
        if limit == 0:
            return

        usage_record = self._repo.get_or_create_usage(user_id, self._billing_month)
        used = self._repo.get_usage_field(usage_record, quota_type)

        if used >= limit:
            logger.warning(
                f"配额不足 | user_id={user_id} | tool_id={tool_id} | "
                f"quota_type={quota_type} | used={used} | limit={limit}"
            )
            raise AIQuotaExceededError(
                message="月度配额已用完,请下个月再试或升级为 VIP",
                details={
                    "quota_type": quota_type,
                    "used": used,
                    "limit": limit,
                    "billing_month": self._billing_month,
                },
            )

    def deduct_quota(
        self,
        user_id: str,
        role: str,
        tool_id: str,
        session_id: str | None = None,
        trace_id: str | None = None,
    ) -> int:
        """扣减配额

        Args:
            user_id: 用户 ID
            role: 用户角色
            tool_id: 工具 ID
            session_id: 会话 ID
            trace_id: 链路追踪 ID

        Returns:
            int: 扣减后的剩余配额

        Raises:
            AIQuotaExceededError: 配额不足
        """
        if role in ("vip", "admin"):
            logger.info(f"VIP/Admin 不扣配额 | user_id={user_id} | tool_id={tool_id}")
            return -1

        quota_type = self.get_quota_type_for_tool(tool_id)
        if quota_type is None:
            return -1

        plan = self._repo.get_plan_by_role(role)
        if plan is None:
            return -1

        limit = self._repo.get_limit_field(plan, quota_type)
        if limit == 0:
            return -1

        self.check_quota(user_id, role, tool_id)

        usage_record = self._repo.get_or_create_usage(user_id, self._billing_month)
        balance_before = self._repo.get_usage_field(usage_record, quota_type)
        new_balance = self._repo.increment_usage(usage_record, quota_type, delta=1)

        self._repo.add_transaction_log(
            user_id=user_id,
            billing_month=self._billing_month,
            transaction_type="deduct",
            quota_type=quota_type,
            delta=-1,
            balance_before=balance_before,
            balance_after=new_balance,
            tool_id=tool_id,
            session_id=session_id,
            trace_id=trace_id,
        )

        logger.info(
            f"配额已扣减 | user_id={user_id} | tool_id={tool_id} | "
            f"quota_type={quota_type} | balance={new_balance}/{limit}"
        )

        return limit - new_balance

    def get_user_quota_status(self, user_id: str, role: str) -> list[QuotaStatus]:
        """获取用户所有配额状态

        Args:
            user_id: 用户 ID
            role: 用户角色

        Returns:
            list[QuotaStatus]: 配额状态列表
        """
        plan = self._repo.get_plan_by_role(role)
        if plan is None:
            return []

        quota_types = [
            "image_generation",
            "audio_synthesis",
            "transcription_minutes",
            "meeting_summary",
            "ai_translation",
            "ai_summarization",
            "agent_tool_call",
        ]

        usage_record = self._repo.get_or_create_usage(user_id, self._billing_month)
        statuses: list[QuotaStatus] = []

        for qt in quota_types:
            limit = self._repo.get_limit_field(plan, qt)
            used = self._repo.get_usage_field(usage_record, qt)
            unlimited = limit == 0
            remaining = 0 if unlimited else max(0, limit - used)

            statuses.append(
                QuotaStatus(
                    quota_type=qt,
                    used=used,
                    limit=limit,
                    remaining=remaining,
                    unlimited=unlimited,
                    billing_month=self._billing_month,
                )
            )

        return statuses


_quota_service_instance: QuotaService | None = None


def get_quota_service(quota_repository: QuotaRepository) -> QuotaService:
    """创建配额服务实例

    Args:
        quota_repository: 配额数据访问实例

    Returns:
        QuotaService: 配额服务实例
    """
    return QuotaService(quota_repository)


__all__ = [
    "QuotaService",
    "QuotaStatus",
    "get_quota_service",
    "TOOL_TO_QUOTA_TYPE",
]
