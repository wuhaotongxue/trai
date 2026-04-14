#!/usr/bin/env python
# 文件名: factory.py
# 作者: wuhao
# 日期: 2026_04_09_14:25:00
# 描述: 通知服务工厂类,根据配置创建对应的通知服务

from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING, Any

from infrastructure.notify.base import BaseNotifyService
from infrastructure.notify.dingtalk import DingTalkNotifyService
from infrastructure.notify.feishu import FeishuNotifyService
from infrastructure.notify.wecom import WeComNotifyService

if TYPE_CHECKING:
    from loguru import Logger


class NotifyPlatform(Enum):
    """通知平台枚举"""

    FEISHU = "feishu"
    WECOM = "wecom"
    DINGTALK = "dingtalk"


class NotifyServiceFactory:
    """通知服务工厂类

    根据平台类型和配置创建对应的通知服务实例
    """

    _services: dict[str, BaseNotifyService] = {}
    _logger: Logger | None = None

    @classmethod
    def _get_logger(cls) -> Logger:
        """获取日志器

        Returns:
            Logger: 日志器实例
        """
        if cls._logger is None:
            from core.logger import get_logger

            cls._logger = get_logger()
        return cls._logger

    @classmethod
    def create(
        cls,
        platform: NotifyPlatform | str,
        webhook_url: str,
        timeout: int = 30,
        **kwargs: Any,
    ) -> BaseNotifyService:
        """创建通知服务实例

        Args:
            platform: 平台类型
            webhook_url: Webhook 地址
            timeout: 超时时间(秒)
            **kwargs: 额外参数(如 secret, agent_id 等)

        Returns:
            BaseNotifyService: 通知服务实例

        Raises:
            ValueError: 不支持的平台类型
        """
        logger = cls._get_logger()
        platform_str = platform.value if isinstance(platform, NotifyPlatform) else platform.lower()

        logger.info(f"Creating notify service for platform: {platform_str}")

        service_key = f"{platform_str}:{webhook_url}"

        if service_key in cls._services:
            logger.debug(f"Returning cached service for {platform_str}")
            return cls._services[service_key]

        if platform_str == NotifyPlatform.FEISHU.value:
            service = FeishuNotifyService(webhook_url=webhook_url, timeout=timeout, **kwargs)

        elif platform_str == NotifyPlatform.WECOM.value:
            service = WeComNotifyService(webhook_url=webhook_url, timeout=timeout, **kwargs)

        elif platform_str == NotifyPlatform.DINGTALK.value:
            service = DingTalkNotifyService(webhook_url=webhook_url, timeout=timeout, **kwargs)

        else:
            raise ValueError(f"Unsupported notify platform: {platform_str}")

        cls._services[service_key] = service
        return service

    @classmethod
    def create_feishu(
        cls,
        webhook_url: str,
        secret: str | None = None,
        timeout: int = 30,
    ) -> FeishuNotifyService:
        """创建飞书通知服务

        Args:
            webhook_url: Webhook 地址
            secret: 加签密钥
            timeout: 超时时间

        Returns:
            FeishuNotifyService: 飞书通知服务实例
        """
        return cls.create(NotifyPlatform.FEISHU, webhook_url, timeout, secret=secret)

    @classmethod
    def create_wecom(
        cls,
        webhook_url: str,
        agent_id: str | None = None,
        timeout: int = 30,
    ) -> WeComNotifyService:
        """创建企业微信通知服务

        Args:
            webhook_url: Webhook 地址
            agent_id: 应用 Agent ID
            timeout: 超时时间

        Returns:
            WeComNotifyService: 企业微信通知服务实例
        """
        return cls.create(NotifyPlatform.WECOM, webhook_url, timeout, agent_id=agent_id)

    @classmethod
    def create_dingtalk(
        cls,
        webhook_url: str,
        secret: str | None = None,
        timeout: int = 30,
    ) -> DingTalkNotifyService:
        """创建钉钉通知服务

        Args:
            webhook_url: Webhook 地址
            secret: 加签密钥
            timeout: 超时时间

        Returns:
            DingTalkNotifyService: 钉钉通知服务实例
        """
        return cls.create(NotifyPlatform.DINGTALK, webhook_url, timeout, secret=secret)

    @classmethod
    def get_service(cls, platform: NotifyPlatform | str, webhook_url: str) -> BaseNotifyService | None:
        """获取已创建的通知服务实例

        Args:
            platform: 平台类型
            webhook_url: Webhook 地址

        Returns:
            BaseNotifyService | None: 已存在的服务实例,不存在返回 None
        """
        platform_str = platform.value if isinstance(platform, NotifyPlatform) else platform.lower()
        service_key = f"{platform_str}:{webhook_url}"
        return cls._services.get(service_key)

    @classmethod
    def clear_cache(cls) -> None:
        """清除所有缓存的服务实例"""
        logger = cls._get_logger()
        logger.info(f"Clearing {len(cls._services)} cached notify services")

        for service in cls._services.values():
            service.close()

        cls._services.clear()

    @classmethod
    def create_all(
        cls,
        configs: dict[str, dict[str, Any]],
    ) -> dict[str, BaseNotifyService]:
        """根据配置创建所有平台的的通知服务

        Args:
            configs: 平台配置字典,格式: {"feishu": {"webhook_url": "...", "secret": "..."}}

        Returns:
            dict[str, BaseNotifyService]: 创建的服务字典
        """
        logger = cls._get_logger()
        services: dict[str, BaseNotifyService] = {}

        for platform_name, config in configs.items():
            try:
                webhook_url = config.get("webhook_url")
                if not webhook_url:
                    logger.warning(f"Missing webhook_url for platform: {platform_name}")
                    continue

                service = cls.create(
                    platform=platform_name,
                    webhook_url=webhook_url,
                    timeout=config.get("timeout", 30),
                    **{k: v for k, v in config.items() if k != "webhook_url" and k != "timeout"},
                )
                services[platform_name] = service
                logger.info(f"Created notify service for: {platform_name}")

            except Exception as e:
                logger.error(f"Failed to create notify service for {platform_name}: {str(e)}")

        return services


__all__ = [
    "NotifyPlatform",
    "NotifyServiceFactory",
]
