#!/usr/bin/env python
# 文件名: blacklist.py
# 作者: wuhao
# 日期: 2026_04_21_10:47:31
# 描述: 令牌黑名单服务

from __future__ import annotations

import os

import redis
from loguru import logger


class TokenBlacklistService:
    """令牌黑名单服务

    基于 Redis 实现 JWT Token 的注销与黑名单机制
    """

    def __init__(self) -> None:
        self._redis_client: redis.Redis | None = None
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
        except Exception as e:
            logger.warning(f"TokenBlacklistService Redis 连接失败,黑名单功能将失效: {e}")
            self._redis_client = None

    def add(self, token: str, expire_seconds: int) -> bool:
        """将令牌加入黑名单

        Args:
            token: JWT 令牌
            expire_seconds: 令牌剩余过期时间(秒)

        Returns:
            bool: 是否成功加入黑名单
        """
        if not self._redis_client:
            return False

        if expire_seconds <= 0:
            return True

        cache_key = f"token:blacklist:{token}"
        try:
            self._redis_client.setex(cache_key, expire_seconds, "blacklisted")
            return True
        except Exception as e:
            logger.error(f"加入令牌黑名单失败: {e}")
            return False

    def is_blacklisted(self, token: str) -> bool:
        """检查令牌是否在黑名单中

        Args:
            token: JWT 令牌

        Returns:
            bool: 是否在黑名单中
        """
        if not self._redis_client:
            return False

        cache_key = f"token:blacklist:{token}"
        try:
            return self._redis_client.exists(cache_key) > 0
        except Exception as e:
            logger.warning(f"检查令牌黑名单异常: {e}")
            return False


def get_blacklist_service() -> TokenBlacklistService:
    """获取令牌黑名单服务实例"""
    return TokenBlacklistService()


__all__ = ["TokenBlacklistService", "get_blacklist_service"]
