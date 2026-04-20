#!/usr/bin/env python
# 文件名: jwt.py
# 作者: wuhao
# 日期: 2026_04_09_20:30:00
# 描述: JWT 认证服务

from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from loguru import logger

from core.exceptions import AuthenticationError


class JWTService:
    """JWT 认证服务

    负责 Token 生成与验证,支持 Access Token 和 Refresh Token
    """

    def __init__(self) -> None:
        self._secret_key: str = os.getenv("JWT_SECRET_KEY", "")
        if not self._secret_key:
            raise ValueError("JWT_SECRET_KEY 环境变量未配置, 必须在生产环境中设置")
        if len(self._secret_key) < 32:
            logger.warning("JWT_SECRET_KEY 长度小于32字节, 存在安全风险, 建议使用强随机密钥")

        self._algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
        self._access_token_expire_minutes: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self._refresh_token_expire_days: int = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    def create_access_token(
        self,
        user_id: str,
        username: str,
        role: str = "normal",
        tenant_id: str | None = None,
        extra_claims: dict[str, Any] | None = None,
    ) -> str:
        """创建访问令牌

        Args:
            user_id: 用户 ID
            username: 用户名
            role: 用户角色
            tenant_id: 租户 ID(可选)
            extra_claims: 额外声明(可选)

        Returns:
            str: JWT 访问令牌
        """
        now = datetime.now(UTC)
        expire = now + timedelta(minutes=self._access_token_expire_minutes)

        payload = {
            "sub": user_id,
            "username": username,
            "role": role,
            "type": "access",
            "iat": now,
            "exp": expire,
            "iss": "trai-backend",
        }

        if tenant_id:
            payload["tenant_id"] = tenant_id

        if extra_claims:
            payload.update(extra_claims)

        return jwt.encode(payload, self._secret_key, algorithm=self._algorithm)

    def create_refresh_token(self, user_id: str) -> str:
        """创建刷新令牌

        Args:
            user_id: 用��� ID

        Returns:
            str: JWT 刷新令牌
        """
        now = datetime.now(UTC)
        expire = now + timedelta(days=self._refresh_token_expire_days)

        payload = {
            "sub": user_id,
            "type": "refresh",
            "iat": now,
            "exp": expire,
            "iss": "trai-backend",
        }

        return jwt.encode(payload, self._secret_key, algorithm=self._algorithm)

    def verify_token(self, token: str, expected_type: str = "access") -> dict[str, Any]:
        """验证令牌

        Args:
            token: JWT 令牌
            expected_type: 期望的令牌类型(access/refresh)

        Returns:
            dict: 解码后的 payload

        Raises:
            AuthenticationError: 令牌无效或已过期
        """
        try:
            payload = jwt.decode(
                token,
                self._secret_key,
                algorithms=[self._algorithm],
            )

            token_type = payload.get("type")
            if token_type != expected_type:
                raise AuthenticationError(
                    message=f"令牌类型不匹配,期望 {expected_type}",
                    details={"actual_type": token_type},
                )

            return payload

        except JWTError as e:
            logger.warning(f"JWT 验证失败: {e}")
            raise AuthenticationError(
                message="令牌无效或已过期",
                details={"error": str(e)},
            )

    def get_user_id_from_token(self, token: str) -> str:
        """从令牌中获取用户 ID

        Args:
            token: JWT 令牌

        Returns:
            str: 用户 ID
        """
        payload = self.verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError(message="令牌中缺少用户 ID")
        return user_id

    def is_token_expired(self, token: str) -> bool:
        """检查令牌是否已过期

        Args:
            token: JWT 令牌

        Returns:
            bool: 是否已过期
        """
        try:
            payload = jwt.decode(
                token,
                self._secret_key,
                algorithms=[self._algorithm],
                options={"verify_exp": False},
            )
            exp = payload.get("exp")
            if exp:
                return datetime.fromtimestamp(exp, tz=UTC) < datetime.now(UTC)
            return False
        except JWTError:
            return True

    def get_token_payload(self, token: str) -> dict[str, Any]:
        """获取令牌载荷(不验证过期时间)

        Args:
            token: JWT 令牌

        Returns:
            dict: 解码后的 payload
        """
        try:
            return jwt.decode(
                token,
                self._secret_key,
                algorithms=[self._algorithm],
                options={"verify_exp": False},
            )
        except JWTError as e:
            raise AuthenticationError(
                message="令牌格式错误",
                details={"error": str(e)},
            )


_jwt_service: JWTService | None = None


def get_jwt_service() -> JWTService:
    """获取 JWT 服务实例(单例)

    Returns:
        JWTService: JWT 服务实例
    """
    global _jwt_service
    if _jwt_service is None:
        _jwt_service = JWTService()
    return _jwt_service


__all__ = ["JWTService", "get_jwt_service"]
