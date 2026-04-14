#!/usr/bin/env python
# 文件名: __init__.py
# 作者: wuhao
# 日期: 2026_04_09_14:20:00
# 描述: 通知服务子包，统一导出各平台通知服务

from infrastructure.notify.base import (
    BaseNotifyService,
    NotifyLevel,
    NotifyMessage,
    NotifyResult,
    NotifyType,
)
from infrastructure.notify.dingtalk import DingTalkNotifyService
from infrastructure.notify.feishu import FeishuNotifyService
from infrastructure.notify.wecom import WeComNotifyService

__all__ = [
    "BaseNotifyService",
    "NotifyLevel",
    "NotifyMessage",
    "NotifyResult",
    "NotifyType",
    "FeishuNotifyService",
    "WeComNotifyService",
    "DingTalkNotifyService",
]
