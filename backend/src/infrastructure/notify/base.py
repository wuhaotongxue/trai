#!/usr/bin/env python
# 文件名: base.py
# 作者: wuhao
# 日期: 2026_04_09_13:55:00
# 描述: 通知服务基类,定义统一的通知接口

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Any

import httpx

if TYPE_CHECKING:
    from loguru import Logger

from core.logger import get_logger


class NotifyLevel(Enum):
    """通知级别枚举"""

    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class NotifyType(Enum):
    """通知类型枚举"""

    TEXT = "text"
    MARKDOWN = "markdown"
    HTML = "html"
    CARD = "card"


@dataclass
class NotifyMessage:
    """通知消息数据结构"""

    title: str
    content: str
    level: NotifyLevel = NotifyLevel.INFO
    msg_type: NotifyType = NotifyType.TEXT
    extra: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """转换为字典

        Returns:
            dict: 消息字典
        """
        return {
            "title": self.title,
            "content": self.content,
            "level": self.level.value,
            "msg_type": self.msg_type.value,
            "extra": self.extra,
        }


@dataclass
class NotifyResult:
    """通知发送结果"""

    success: bool
    message: str
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """转换为字典

        Returns:
            dict: 结果字典
        """
        return {
            "success": self.success,
            "message": self.message,
            "data": self.data,
            "error": self.error,
        }


class BaseNotifyService(ABC):
    """通知服务基类

    所有通知服务(飞书,企业微信,钉钉等)都应继承此类
    实现统一的发送接口
    """

    def __init__(self, webhook_url: str, timeout: int = 30) -> None:
        self._webhook_url: str = webhook_url
        self._timeout: int = timeout
        self._logger: Logger = get_logger()
        self._client: httpx.Client | None = None

    @property
    def webhook_url(self) -> str:
        """获取 Webhook URL"""
        return self._webhook_url

    @property
    def timeout(self) -> int:
        """获取超时时间"""
        return self._timeout

    @abstractmethod
    def _build_payload(self, message: NotifyMessage) -> dict[str, Any]:
        """构建发送载荷

        Args:
            message: 通知消息

        Returns:
            dict: 平台特定的载荷格式
        """
        pass

    @abstractmethod
    def _parse_response(self, response: httpx.Response) -> NotifyResult:
        """解析响应

        Args:
            response: HTTP 响应

        Returns:
            NotifyResult: 解析后的结果
        """
        pass

    def _get_client(self) -> httpx.Client:
        """获取 HTTP 客户端

        Returns:
            httpx.Client: HTTP 客户端实例
        """
        if self._client is None:
            self._client = httpx.Client(timeout=self._timeout)
        return self._client

    def send(self, message: NotifyMessage) -> NotifyResult:
        """发送通知

        Args:
            message: 通知消息

        Returns:
            NotifyResult: 发送结果
        """
        self._logger.info(f"Sending {self.__class__.__name__} notification: {message.title}")

        try:
            payload = self._build_payload(message)
            client = self._get_client()
            response = client.post(self._webhook_url, json=payload)
            return self._parse_response(response)

        except httpx.TimeoutException:
            error_msg = f"{self.__class__.__name__} request timeout"
            self._logger.error(error_msg)
            return NotifyResult(success=False, message=error_msg, error="timeout")

        except httpx.RequestError as e:
            error_msg = f"{self.__class__.__name__} request error: {str(e)}"
            self._logger.error(error_msg)
            return NotifyResult(success=False, message=error_msg, error=str(e))

        except Exception as e:
            error_msg = f"{self.__class__.__name__} unexpected error: {str(e)}"
            self._logger.exception(error_msg)
            return NotifyResult(success=False, message=error_msg, error=str(e))

    async def send_async(self, message: NotifyMessage) -> NotifyResult:
        """异步发送通知

        Args:
            message: 通知消息

        Returns:
            NotifyResult: 发送结果
        """
        self._logger.info(f"Sending async {self.__class__.__name__} notification: {message.title}")

        try:
            payload = self._build_payload(message)
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(self._webhook_url, json=payload)
                return self._parse_response(response)

        except httpx.TimeoutException:
            error_msg = f"{self.__class__.__name__} request timeout"
            self._logger.error(error_msg)
            return NotifyResult(success=False, message=error_msg, error="timeout")

        except httpx.RequestError as e:
            error_msg = f"{self.__class__.__name__} request error: {str(e)}"
            self._logger.error(error_msg)
            return NotifyResult(success=False, message=error_msg, error=str(e))

        except Exception as e:
            error_msg = f"{self.__class__.__name__} unexpected error: {str(e)}"
            self._logger.exception(error_msg)
            return NotifyResult(success=False, message=error_msg, error=str(e))

    def send_text(
        self,
        content: str,
        title: str = "",
        level: NotifyLevel = NotifyLevel.INFO,
    ) -> NotifyResult:
        """发送文本通知

        Args:
            content: 通知内容
            title: 通知标题
            level: 通知级别

        Returns:
            NotifyResult: 发送结果
        """
        message = NotifyMessage(
            title=title,
            content=content,
            level=level,
            msg_type=NotifyType.TEXT,
        )
        return self.send(message)

    def close(self) -> None:
        """关闭 HTTP 客户端"""
        if self._client is not None:
            self._client.close()
            self._client = None

    def __enter__(self) -> BaseNotifyService:
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.close()

    def __del__(self) -> None:
        self.close()


__all__ = [
    "NotifyLevel",
    "NotifyType",
    "NotifyMessage",
    "NotifyResult",
    "BaseNotifyService",
]
