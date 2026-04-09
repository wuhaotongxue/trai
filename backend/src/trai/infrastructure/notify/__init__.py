#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: __init__.py
# 作者: wuhao
# 日期: 2026_04_09_14:20:00
# 描述: 通知服务子包，统一导出各平台通知服务

from trai.infrastructure.notify.base import (
    BaseNotifyService,
    NotifyLevel,
    NotifyMessage,
    NotifyResult,
    NotifyType,
)
from trai.infrastructure.notify.dingtalk import DingTalkNotifyService
from trai.infrastructure.notify.feishu import FeishuNotifyService
from trai.infrastructure.notify.wecom import WeComNotifyService

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
