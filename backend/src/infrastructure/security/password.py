#!/usr/bin/env python
# 文件名: password.py
# 作者: wuhao
# 日期: 2026_04_09_20:30:00
# 描述: 密码哈希与验证服务

from __future__ import annotations

import os

from passlib.context import CryptContext
from passlib.exc import UnknownHashError

from core.exceptions import ConfigurationError


class PasswordService:
    """密码服务

    封装密码哈希与验证逻辑，使用 passlib + bcrypt/argon2
    遵循安全规范：禁止明文存储、使用强哈希算法
    """

    _ALGORITHM_ARGON2 = "argon2"
    _ALGORITHM_BCRYPT = "bcrypt"
    _DEFAULT_ALGORITHM = "argon2"

    def __init__(self) -> None:
        self._algorithm: str = os.getenv("PASSWORD_ALGORITHM", self._DEFAULT_ALGORITHM)
        self._pwd_context: CryptContext = self._create_context()

    def _create_context(self) -> CryptContext:
        """创建密码哈希上下文

        Returns:
            CryptContext: passlib 密码上下文
        """
        try:
            return CryptContext(schemes=[self._algorithm], deprecated="auto")
        except Exception as e:
            raise ConfigurationError(
                message=f"密码哈希算法配置失败: {e}",
                details={"algorithm": self._algorithm},
            )

    def hash(self, plain_password: str) -> str:
        """哈希密码

        Args:
            plain_password: 明文密码

        Returns:
            str: 哈希后的密码字符串
        """
        if not plain_password:
            raise ValueError("密码不能为空")

        return self._pwd_context.hash(plain_password)

    def verify(self, plain_password: str, hashed_password: str) -> bool:
        """验证密码

        Args:
            plain_password: 明文密码
            hashed_password: 哈希后的密码

        Returns:
            bool: 验证是否通过
        """
        if not plain_password or not hashed_password:
            return False

        try:
            return self._pwd_context.verify(plain_password, hashed_password)
        except UnknownHashError:
            return False

    def needs_rehash(self, hashed_password: str) -> bool:
        """检查是否需要重新哈希

        Args:
            hashed_password: 哈希后的密码

        Returns:
            bool: 是否需要使用新算法重新哈希
        """
        try:
            return self._pwd_context.needs_rehash(hashed_password)
        except UnknownHashError:
            return True

    @property
    def algorithm(self) -> str:
        """当前使用的哈希算法"""
        return self._algorithm


_password_service: PasswordService | None = None


def get_password_service() -> PasswordService:
    """获取密码服务实例（单例）

    Returns:
        PasswordService: 密码服务实例
    """
    global _password_service
    if _password_service is None:
        _password_service = PasswordService()
    return _password_service


__all__ = ["PasswordService", "get_password_service"]
