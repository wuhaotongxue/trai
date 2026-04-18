#!/usr/bin/env python
# 文件名: policy_engine.py
# 作者: wuhao
# 日期: 2026_04_10_09:12:17
# 描述: 策略引擎 - 高危操作三态决策(allow/deny/ask)

from __future__ import annotations

import os
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

import redis

from core.exceptions import AuthorizationError
from core.logger import logger


class PolicyDecision(StrEnum):
    """策略决策枚举"""

    ALLOW = "allow"
    DENY = "deny"
    ASK = "ask"





@dataclass
class PolicyContext:
    """策略评估上下文"""

    user_id: str
    role: str
    resource_type: str
    resource_id: str | None
    action: str
    session_id: str | None = None


@dataclass
class PolicyResult:
    """策略评估结果"""

    decision: PolicyDecision
    reason: str
    require_confirmation: bool = False
    policy_name: str = "default"


class PolicyEngine:
    """策略引擎 - 高危操作三态决策核心类"""

    def __init__(self) -> None:
        self._redis_client: redis.Redis | None = None
        self._policy_cache_ttl: int = int(os.getenv("POLICY_CACHE_TTL", "300"))
        self._ask_confirmation_timeout: int = int(os.getenv("POLICY_ASK_TIMEOUT", "600"))
        self._init_redis()

    def _init_redis(self) -> None:
        """初始化 Redis 连接"""
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        redis_db = int(os.getenv("REDIS_DB", "0"))
        redis_password = os.getenv("REDIS_PASSWORD", "")

        try:
            self._redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password or None,
                decode_responses=True,
            )
            self._redis_client.ping()
            logger.info("PolicyEngine Redis 连接成功")
        except Exception as e:
            logger.warning(f"PolicyEngine Redis 连接失败,降级为内存模式: {e}")
            self._redis_client = None

    def evaluate(self, context: PolicyContext) -> PolicyResult:
        """评估策略

        Args:
            context: 策略评估上下文

        Returns:
            PolicyResult: 策略评估结果
        """
        action = context.action

        if action in ("delete_session", "bulk_delete", "force_logout"):
            return self._evaluate_destructive_action(context)
        if action in ("admin_panel", "system_config", "user_manage"):
            return self._evaluate_admin_action(context)
        if action in ("data_export", "sensitive_query"):
            return self._evaluate_sensitive_action(context)

        return PolicyResult(
            decision=PolicyDecision.ALLOW,
            reason="默认放行",
            policy_name="default",
        )

    def _evaluate_destructive_action(self, context: PolicyContext) -> PolicyResult:
        """评估破坏性操作

        Args:
            context: 策略评估上下文

        Returns:
            PolicyResult: 策略评估结果
        """
        if context.role == "admin":
            return PolicyResult(
                decision=PolicyDecision.ALLOW,
                reason="管理员权限直接放行",
                policy_name="admin_bypass",
            )

        if context.role == "manager":
            cached = self._get_cached_confirmation(context)
            if cached:
                return PolicyResult(
                    decision=PolicyDecision.ALLOW,
                    reason="已确认,跳过二次确认",
                    require_confirmation=False,
                    policy_name="cached_confirmation",
                )

            return PolicyResult(
                decision=PolicyDecision.ASK,
                reason="该操作具有破坏性,需要二次确认",
                require_confirmation=True,
                policy_name="destructive_action_ask",
            )

        if context.session_id and context.user_id:
            if self._check_resource_ownership(context):
                cached = self._get_cached_confirmation(context)
                if cached:
                    return PolicyResult(
                        decision=PolicyDecision.ALLOW,
                        reason="资源所有者且已确认",
                        require_confirmation=False,
                        policy_name="owner_cached",
                    )
                return PolicyResult(
                    decision=PolicyDecision.ASK,
                    reason="操作他人资源需要确认",
                    require_confirmation=True,
                    policy_name="cross_user_ask",
                )

        return PolicyResult(
            decision=PolicyDecision.ALLOW,
            reason="删除自有资源直接放行",
            policy_name="owner_bypass",
        )

    def _evaluate_admin_action(self, context: PolicyContext) -> PolicyResult:
        """评估管理员操作

        Args:
            context: 策略评估上下文

        Returns:
            PolicyResult: 策略评估结果
        """
        if context.role == "admin":
            return PolicyResult(
                decision=PolicyDecision.ALLOW,
                reason="管理员权限",
                policy_name="admin_access",
            )

        return PolicyResult(
            decision=PolicyDecision.DENY,
            reason="仅管理员可执行此操作",
            policy_name="admin_required",
        )

    def _evaluate_sensitive_action(self, context: PolicyContext) -> PolicyResult:
        """评估敏感数据操作

        Args:
            context: 策略评估上下文

        Returns:
            PolicyResult: 策略评估结果
        """
        if context.role in ("admin", "manager"):
            return PolicyResult(
                decision=PolicyDecision.ALLOW,
                reason="管理人员权限",
                policy_name="manager_access",
            )

        return PolicyResult(
            decision=PolicyDecision.DENY,
            reason="权限不足,无法访问敏感数据",
            policy_name="sensitive_denied",
        )

    def _check_resource_ownership(self, context: PolicyContext) -> bool:
        """检查资源所有权

        Args:
            context: 策略评估上下文

        Returns:
            bool: 是否为资源所有者
        """
        if not context.session_id or not context.user_id:
            return False

        cache_key = f"policy:ownership:{context.resource_type}:{context.resource_id}:{context.user_id}"
        try:
            if self._redis_client:
                owner_id = self._redis_client.get(cache_key)
                return owner_id == context.user_id
        except Exception as e:
            logger.warning(f"资源所有权检查 Redis 异常: {e}")

        return False

    def _get_cached_confirmation(self, context: PolicyContext) -> bool:
        """获取缓存的确认状态

        Args:
            context: 策略评估上下文

        Returns:
            bool: 是否已确认
        """
        if not self._redis_client:
            return False

        cache_key = self._build_confirmation_key(context)
        try:
            return self._redis_client.exists(cache_key) > 0
        except Exception as e:
            logger.warning(f"确认状态缓存查询异常: {e}")
            return False

    def confirm_action(self, context: PolicyContext, ttl: int | None = None) -> bool:
        """记录操作确认

        Args:
            context: 策略评估上下文
            ttl: 缓存过期时间(秒),默认使用配置值

        Returns:
            bool: 是否记录成功
        """
        if not self._redis_client:
            logger.warning("Redis 未连接,无法记录确认状态")
            return False

        cache_key = self._build_confirmation_key(context)
        expire_seconds = ttl or self._ask_confirmation_timeout

        try:
            self._redis_client.setex(cache_key, expire_seconds, "confirmed")
            logger.info(f"操作已确认 | user_id={context.user_id} | action={context.action}")
            return True
        except Exception as e:
            logger.error(f"确认状态记录失败: {e}")
            return False

    def revoke_confirmation(self, context: PolicyContext) -> bool:
        """撤销操作确认

        Args:
            context: 策略评估上下文

        Returns:
            bool: 是否撤销成功
        """
        if not self._redis_client:
            return False

        cache_key = self._build_confirmation_key(context)
        try:
            self._redis_client.delete(cache_key)
            return True
        except Exception as e:
            logger.warning(f"确认状态撤销失败: {e}")
            return False

    def _build_confirmation_key(self, context: PolicyContext) -> str:
        """构建确认缓存 Key

        Args:
            context: 策略评估上下文

        Returns:
            str: Redis Key
        """
        return f"policy:confirm:{context.user_id}:{context.action}:{context.resource_type}:{context.resource_id}"

    def enforce(self, context: PolicyContext) -> None:
        """强制执行策略检查,未通过则抛出异常

        Args:
            context: 策略评估上下文

        Raises:
            AuthorizationError: 策略拒绝
        """
        result = self.evaluate(context)

        if result.decision == PolicyDecision.DENY:
            logger.warning(f"策略拒绝 | user_id={context.user_id} | action={context.action} | reason={result.reason}")
            raise AuthorizationError(
                message=result.reason,
                details={
                    "policy": result.policy_name,
                    "action": context.action,
                    "resource_type": context.resource_type,
                },
            )

        if result.decision == PolicyDecision.ASK:
            logger.info(f"策略需要确认 | user_id={context.user_id} | action={context.action}")
            raise AuthorizationError(
                message=result.reason,
                details={
                    "code": 403,
                    "policy": result.policy_name,
                    "decision": PolicyDecision.ASK.value,
                    "require_confirmation": True,
                },
            )


_policy_engine_instance: PolicyEngine | None = None


def get_policy_engine() -> PolicyEngine:
    """获取策略引擎单例

    Returns:
        PolicyEngine: 策略引擎实例
    """
    global _policy_engine_instance
    if _policy_engine_instance is None:
        _policy_engine_instance = PolicyEngine()
    return _policy_engine_instance


def require_policy(action: str, resource_type: str) -> Any:
    """策略检查装饰器工厂

    Args:
        action: 操作名称
        resource_type: 资源类型

    Returns:
        依赖函数
    """

    def policy_checker(
        current_user: dict[str, Any],
        session_id: str | None = None,
        resource_id: str | None = None,
    ) -> dict[str, Any]:
        context = PolicyContext(
            user_id=current_user.get("user_id", ""),
            role=current_user.get("role", "normal"),
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            session_id=session_id,
        )
        engine = get_policy_engine()
        result = engine.evaluate(context)

        if result.decision == PolicyDecision.DENY:
            raise AuthorizationError(
                message=result.reason,
                details={"policy": result.policy_name},
            )

        if result.decision == PolicyDecision.ASK:
            raise AuthorizationError(
                message=result.reason,
                details={
                    "code": 403,
                    "policy": result.policy_name,
                    "decision": PolicyDecision.ASK.value,
                    "require_confirmation": True,
                },
            )

        return current_user

    return policy_checker


__all__ = [
    "PolicyEngine",
    "PolicyDecision",
    "PolicyContext",
    "PolicyResult",
    "get_policy_engine",
    "require_policy",
]
