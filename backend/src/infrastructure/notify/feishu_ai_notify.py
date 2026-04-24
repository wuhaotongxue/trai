#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: feishu_ai_notify.py
# 作者: wuhao
# 日期: 2026_04_23
# 描述: 飞书 AI 事件通知服务（文生图 + AI 对话）
# 支持格式化卡片消息，包含图片预览、对话摘要等富文本内容

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

import httpx


class AINotifyEvent(Enum):
    """AI 通知事件类型"""

    IMAGE_GENERATED = "image_generated"
    """文生图完成"""

    IMAGE_FAILED = "image_failed"
    """文生图失败"""

    CHAT_COMPLETED = "chat_completed"
    """AI 对话完成"""


@dataclass
class ImageGeneratedEvent:
    """文生图事件数据"""

    user_id: str
    user_name: str
    prompt: str
    image_url: str
    model: str
    task_id: str
    width: int = 1024
    height: int = 1024


@dataclass
class ChatCompletedEvent:
    """AI 对话完成事件数据"""

    user_id: str
    user_name: str
    model: str
    message_preview: str
    response_preview: str
    tokens_used: int = 0
    session_id: str | None = None


@dataclass
class ImageFailedEvent:
    """文生图失败事件数据"""

    user_id: str
    user_name: str
    prompt: str
    error_message: str
    model: str


class FeishuAINotifyService:
    """飞书 AI 事件通知服务

    将 AI 事件（文生图、AI 对话）通过飞书卡片消息推送到指定 Webhook
    需配合 notify/notify.py 中的 FeishuWebhookUrlProvider 使用
    """

    def __init__(
        self,
        webhook_url: str | None = None,
        timeout: int = 30,
    ) -> None:
        self._webhook_url = webhook_url or os.getenv("FEISHU_AI_WEBHOOK_URL", "") or os.getenv("FEISHU_WEBHOOK_URL", "")
        self._timeout = timeout

    def _get_client(self) -> httpx.Client:
        return httpx.Client(timeout=self._timeout)

    def _send_card(self, card: dict[str, Any]) -> dict[str, Any]:
        """发送飞书卡片消息"""
        if not self._webhook_url:
            return {"success": False, "code": -1, "msg": "FEISHU_AI_WEBHOOK_URL not configured"}
        try:
            client = self._get_client()
            response = client.post(self._webhook_url, json=card)
            return response.json()
        except Exception as e:
            return {"success": False, "code": -2, "msg": str(e)}

    def notify_image_generated(self, event: ImageGeneratedEvent) -> dict[str, Any]:
        """通知文生图完成事件

        Args:
            event: 文生图事件数据

        Returns:
            dict: 飞书 API 响应
        """
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prompt_preview = event.prompt[:200] + ("..." if len(event.prompt) > 200 else "")

        card = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": "\u2705 AI \u6587\u751f\u56fe\u5b8c\u6210"},
                    "template": "green",
                },
                "elements": [
                    {
                        "tag": "div",
                        "fields": [
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**\u7528\u6237**\n" + event.user_name}},
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**\u6a21\u578b**\n" + event.model}},
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**\u5c3a\u5bf8**\n" + f"{event.width}x{event.height}"}},
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**\u4efb\u52a1ID**\n" + event.task_id[:16] + "..."}},
                        ],
                    },
                    {"tag": "hr"},
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": "**Prompt**\n" + prompt_preview,
                        },
                    },
                    {
                        "tag": "img",
                        "img_key": self._upload_image(event.image_url) if event.image_url.startswith("http") else "",
                        "alt": {"tag": "plain_text", "content": "generated image"},
                        "width": 300,
                    },
                    {"tag": "hr"},
                    {
                        "tag": "note",
                        "elements": [
                            {"tag": "plain_text", "content": f"TRAI AI \u901a\u77e5 \u00b7 {now_str}"},
                        ],
                    },
                ],
            },
        }

        if event.image_url and event.image_url.startswith("http"):
            card["card"]["elements"].insert(
                len(card["card"]["elements"]) - 2,
                {
                    "tag": "action",
                    "actions": [
                        {
                            "tag": "button",
                            "text": {"tag": "plain_text", "content": "\u6253\u5f00\u56fe\u7247"},
                            "type": "primary",
                            "url": event.image_url,
                        }
                    ],
                },
            )

        return self._send_card(card)

    def notify_image_failed(self, event: ImageFailedEvent) -> dict[str, Any]:
        """通知文生图失败事件

        Args:
            event: 文生图失败事件数据

        Returns:
            dict: 飞书 API 响应
        """
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prompt_preview = event.prompt[:200] + ("..." if len(event.prompt) > 200 else "")

        card = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": "\u274c AI \u6587\u751f\u56fe\u5931\u8d25"},
                    "template": "red",
                },
                "elements": [
                    {
                        "tag": "div",
                        "fields": [
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**\u7528\u6237**\n" + event.user_name}},
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**\u6a21\u578b**\n" + event.model}},
                        ],
                    },
                    {"tag": "hr"},
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": "**Prompt**\n" + prompt_preview,
                        },
                    },
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": "**\u9519\u8bef\u539f\u56e0**\n" + event.error_message[:200],
                        },
                    },
                    {"tag": "hr"},
                    {
                        "tag": "note",
                        "elements": [
                            {"tag": "plain_text", "content": f"TRAI AI \u901a\u77e5 \u00b7 {now_str}"},
                        ],
                    },
                ],
            },
        }
        return self._send_card(card)

    def notify_chat_completed(self, event: ChatCompletedEvent) -> dict[str, Any]:
        """通知 AI 对话完成事件

        Args:
            event: AI 对话完成事件数据

        Returns:
            dict: 飞书 API 响应
        """
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        tokens_str = f"{event.tokens_used:,}" if event.tokens_used else "\u2014"

        card = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": "\ud83e\udd16 AI \u5bf9\u8bdd\u5b8c\u6210"},
                    "template": "blue",
                },
                "elements": [
                    {
                        "tag": "div",
                        "fields": [
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**\u7528\u6237**\n" + event.user_name}},
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**\u6a21\u578b**\n" + event.model}},
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**Tokens**\n" + tokens_str}},
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**\u4f1a\u8bddID**\n" + (event.session_id[:16] + "..." if event.session_id else "\u2014")}},
                        ],
                    },
                    {"tag": "hr"},
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": "**\u7528\u6237\u53d1\u8a00**\n" + event.message_preview[:300],
                        },
                    },
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": "**AI \u56de\u590d**\n" + event.response_preview[:500],
                        },
                    },
                    {"tag": "hr"},
                    {
                        "tag": "note",
                        "elements": [
                            {"tag": "plain_text", "content": f"TRAI AI \u901a\u77e5 \u00b7 {now_str}"},
                        ],
                    },
                ],
            },
        }
        return self._send_card(card)

    def _upload_image(self, image_url: str) -> str:
        """上传图片到飞书获取 image_key

        由于飞书卡片中的 img 标签需要先上传图片获取 image_key
        此处返回空字符串，由调用方在外部上传图片后替换

        Args:
            image_url: 图片 URL

        Returns:
            str: 飞书图片 key，失败时返回空字符串
        """
        return ""

    def send_custom_card(
        self,
        title: str,
        content: str,
        template: str = "blue",
        extra_fields: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """发送自定义卡片消息

        Args:
            title: 卡片标题
            content: 卡片内容
            template: 卡片颜色模板 (blue/green/red/yellow/grey/purple)
            extra_fields: 额外的字段数据

        Returns:
            dict: 飞书 API 响应
        """
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        card = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": title},
                    "template": template,
                },
                "elements": [
                    {"tag": "div", "text": {"tag": "lark_md", "content": content}},
                    {"tag": "hr"},
                    {
                        "tag": "note",
                        "elements": [
                            {"tag": "plain_text", "content": f"TRAI AI \u901a\u77e5 \u00b7 {now_str}"},
                        ],
                    },
                ],
            },
        }
        return self._send_card(card)


_ai_notify_service: FeishuAINotifyService | None = None


def get_feishu_ai_notify_service() -> FeishuAINotifyService:
    """获取飞书 AI 通知服务单例"""
    global _ai_notify_service
    if _ai_notify_service is None:
        _ai_notify_service = FeishuAINotifyService()
    return _ai_notify_service


__all__ = [
    "AINotifyEvent",
    "ImageGeneratedEvent",
    "ImageFailedEvent",
    "ChatCompletedEvent",
    "FeishuAINotifyService",
    "get_feishu_ai_notify_service",
]
