#!/usr/bin/env python
# 文件名: self_corrector.py
# 作者: wuhao
# 日期: 2026_04_10_09:21:00
# 描述: 自我纠错器 - 根据错误分类执行对应纠错策略

from __future__ import annotations

import asyncio
from collections.abc import Callable, Coroutine
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from loguru import logger

from infrastructure.agent.error_classifier import (
    ClassifiedError,
    ErrorAction,
    ErrorCategory,
    ErrorClassifier,
)


class CorrectionState(StrEnum):
    """纠错状态"""

    DETECTED = "detected"
    ATTEMPTING = "attempting_correction"
    RESOLVED = "resolved"
    ROLLING_BACK = "rolling_back"
    ROLLBACK_FAILED = "rollback_failed"
    ESCALATING = "escalating"
    ESCALATED = "escalated"


@dataclass
class CorrectionResult:
    """纠错结果"""

    state: CorrectionState
    success: bool
    recovered: bool
    message: str
    attempts: int
    final_error: ClassifiedError | None


class SelfCorrector:
    """自我纠错器 - 根据规范执行对应纠错策略

    错误分类 → 对应策略:
    - quota / permission / validation     → reject(直接拒绝,禁止纠错)
    - rate_limit                          → retry_with_backoff(退避重试)
    - tool_execution                      → retry → alternative → rollback
    - business_logic                      → rollback
    - external                            → retry
    - system                              → escalate(升级通知)
    """

    MAX_RETRIES = 3
    BACKOFF_BASE_MS = 1000
    BACKOFF_MAX_MS = 8000

    def __init__(self) -> None:
        self._classifier = ErrorClassifier()
        self._state = CorrectionState.DETECTED
        self._attempts = 0

    async def handle(
        self,
        error: Exception,
        retry_fn: Callable[..., Coroutine[Any, Any, Any]],
        *args: Any,
        **kwargs: Any,
    ) -> tuple[Any, CorrectionResult]:
        """处理错误并尝试纠错

        Args:
            error: 捕获的错误
            retry_fn: 可重试的异步函数
            *args: retry_fn 的位置参数
            **kwargs: retry_fn 的关键字参数

        Returns:
            tuple: (纠错后结果或 None, 纠错结果)
        """
        classified = self._classifier.classify(error, {})
        logger.info(
            f"错误已分类 | category={classified.category.value} | "
            f"action={classified.action.value} | correctable={classified.correctable}"
        )

        self._state = CorrectionState.DETECTED
        self._attempts = 0

        if not classified.correctable:
            return None, self._escalate(classified)

        self._state = CorrectionState.ATTEMPTING

        if classified.action == ErrorAction.RETRY_WITH_BACKOFF:
            return await self._retry_with_backoff(classified, retry_fn, *args, **kwargs)

        if classified.action in (ErrorAction.RETRY, ErrorAction.TOOL_EXECUTION):
            return await self._retry_and_alternative(classified, retry_fn, *args, **kwargs)

        if classified.action == ErrorAction.ROLLBACK:
            return await self._rollback(classified, retry_fn, *args, **kwargs)

        return None, self._escalate(classified)

    async def _retry_with_backoff(
        self,
        classified: ClassifiedError,
        retry_fn: Callable[..., Coroutine[Any, Any, Any]],
        *args: Any,
        **kwargs: Any,
    ) -> tuple[Any, CorrectionResult]:
        """退避重试

        Args:
            classified: 分类后的错误
            retry_fn: 重试函数
            *args: retry_fn 位置参数
            **kwargs: retry_fn 关键字参数

        Returns:
            tuple: (结果, 纠错结果)
        """
        for attempt in range(1, self.MAX_RETRIES + 1):
            self._attempts = attempt
            backoff_ms = min(
                self.BACKOFF_BASE_MS * (2 ** (attempt - 1)),
                self.BACKOFF_MAX_MS,
            )

            logger.info(f"退避重试 | attempt={attempt}/{self.MAX_RETRIES} | backoff={backoff_ms}ms")

            await asyncio.sleep(backoff_ms / 1000.0)

            try:
                result = await retry_fn(*args, **kwargs)
                self._state = CorrectionState.RESOLVED
                return result, CorrectionResult(
                    state=self._state,
                    success=True,
                    recovered=True,
                    message="退避重试成功",
                    attempts=attempt,
                    final_error=None,
                )
            except Exception as e:
                logger.warning(f"重试失败 | attempt={attempt} | error={e}")
                continue

        self._state = CorrectionState.ESCALATING
        return None, self._escalate(classified)

    async def _retry_and_alternative(
        self,
        classified: ClassifiedError,
        retry_fn: Callable[..., Coroutine[Any, Any, Any]],
        *args: Any,
        **kwargs: Any,
    ) -> tuple[Any, CorrectionResult]:
        """重试 → 替代 → 回退

        Args:
            classified: 分类后的错误
            retry_fn: 重试函数
            *args: retry_fn 位置参数
            **kwargs: retry_fn 关键字参数

        Returns:
            tuple: (结果, 纠错结果)
        """
        for attempt in range(1, self.MAX_RETRIES + 1):
            self._attempts = attempt

            logger.info(f"工具执行重试 | attempt={attempt}/{self.MAX_RETRIES}")
            await asyncio.sleep(0.5)

            try:
                result = await retry_fn(*args, **kwargs)
                self._state = CorrectionState.RESOLVED
                return result, CorrectionResult(
                    state=self._state,
                    success=True,
                    recovered=True,
                    message="重试成功",
                    attempts=attempt,
                    final_error=None,
                )
            except Exception:
                continue

        alternative_fn = kwargs.pop("_alternative_fn", None)
        if alternative_fn:
            logger.info("尝试替代方案")
            try:
                result = await alternative_fn(*args, **kwargs)
                return result, CorrectionResult(
                    state=CorrectionState.RESOLVED,
                    success=True,
                    recovered=True,
                    message="替代方案成功",
                    attempts=self._attempts,
                    final_error=None,
                )
            except Exception as alt_err:
                logger.warning(f"替代方案失败: {alt_err}")

        return await self._rollback(classified, retry_fn, *args, **kwargs)

    async def _rollback(
        self,
        classified: ClassifiedError,
        retry_fn: Callable[..., Coroutine[Any, Any, Any]],
        *args: Any,
        **kwargs: Any,
    ) -> tuple[Any, CorrectionResult]:
        """回退策略

        Args:
            classified: 分类后的错误
            retry_fn: 原始重试函数
            *args: 位置参数
            **kwargs: 关键字参数

        Returns:
            tuple: (结果, 纠错结果)
        """
        self._state = CorrectionState.ROLLING_BACK

        rollback_fn = kwargs.pop("_rollback_fn", None)
        if rollback_fn:
            try:
                await rollback_fn()
                logger.info("回退操作成功,通知用户")
            except Exception as rollback_err:
                logger.error(f"回退失败: {rollback_err}")
                self._state = CorrectionState.ROLLBACK_FAILED
                return None, self._escalate(classified)

        self._state = CorrectionState.ESCALATING
        return None, self._escalate(classified)

    def _escalate(self, classified: ClassifiedError) -> CorrectionResult:
        """升级策略 - 通知用户,记录审计

        Args:
            classified: 分类后的错误

        Returns:
            CorrectionResult: 纠错结果
        """
        self._state = CorrectionState.ESCALATING

        escalation_messages: dict[ErrorCategory, str] = {
            ErrorCategory.QUOTA: "月度配额已用完,请下个月重试或升级为 VIP",
            ErrorCategory.PERMISSION: "权限不足,无法执行此操作",
            ErrorCategory.VALIDATION: "参数校验失败,请检查输入",
            ErrorCategory.RATE_LIMIT: "请求过于频繁,请稍后重试",
            ErrorCategory.TOOL_EXECUTION: "工具执行失败,请联系管理员",
            ErrorCategory.BUSINESS_LOGIC: "业务逻辑异常,请联系管理员",
            ErrorCategory.EXTERNAL: "外部服务异常,请稍后重试",
            ErrorCategory.SYSTEM: "系统异常,请联系管理员",
        }

        message = escalation_messages.get(classified.category, classified.message)

        logger.warning(
            f"错误升级 | category={classified.category.value} | attempts={self._attempts} | message={message}"
        )

        self._state = CorrectionState.ESCALATED
        return CorrectionResult(
            state=self._state,
            success=False,
            recovered=False,
            message=message,
            attempts=self._attempts,
            final_error=classified,
        )


_self_corrector_instance: SelfCorrector | None = None


def get_self_corrector() -> SelfCorrector:
    """获取自我纠错器单例

    Returns:
        SelfCorrector: 自我纠错器实例
    """
    global _self_corrector_instance
    if _self_corrector_instance is None:
        _self_corrector_instance = SelfCorrector()
    return _self_corrector_instance


__all__ = [
    "SelfCorrector",
    "CorrectionResult",
    "CorrectionState",
    "get_self_corrector",
]
