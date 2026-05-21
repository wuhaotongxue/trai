#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: feishu_ai_notify.py
# 作者: wuhao
# 日期: 2026_05_20_0815
# 描述: 飞书 AI 事件通知服务（文生图 + 图生图 + AI 对话）
# 支持格式化卡片消息，包含图片预览、对话摘要等富文本内容
# 图片通过 S3 Presigned URL 下载后上传至飞书，获得 image_key 后嵌入卡片


from __future__ import annotations

import base64
import io
import os
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any

import httpx

if TYPE_CHECKING:
    pass


class AINotifyEvent(Enum):
    """AI 通知事件类型"""

    IMAGE_GENERATED = "image_generated"
    """文生图完成"""

    IMAGE_EDITED = "image_edited"
    """图生图（图片编辑）完成"""

    IMAGE_FAILED = "image_failed"
    """文生图失败"""

    CHAT_COMPLETED = "chat_completed"
    """AI 对话完成"""

    VIDEO_GENERATED = "video_generated"
    """视频生成完成"""


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
class ImageEditedEvent:
    """图生图（图片编辑）事件数据"""

    user_id: str
    user_name: str
    prompt: str
    source_image_url: str = ""
    source_image_url_2: str = ""
    """第二张源图片 URL（双图联动编辑）"""
    result_image_url: str = ""
    model: str = "Qwen/Qwen-Image-Edit-2511"
    task_id: str = ""
    width: int = 1024
    height: int = 1024
    steps: int = 25
    seed: int = -1


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
class VideoGeneratedEvent:
    """视频生成完成事件数据"""

    user_id: str
    user_name: str
    prompt: str
    video_url: str = ""
    object_key: str = ""
    public_url: str = ""
    model: str = "Wan-AI/Wan2.1-T2V-1.3B"
    task_id: str = ""
    frames: int = 81
    resolution: str = "1280x720"


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

    将 AI 事件（文生图、图生图、AI 对话）通过飞书卡片消息推送到指定 Webhook
    图片内容通过 S3 Presigned URL 下载后，上传至飞书获得 image_key，再嵌入卡片
    """

    def __init__(
        self,
        webhook_url: str | None = None,
        timeout: int = 30,
    ) -> None:
        self._webhook_url = webhook_url or os.getenv("NOTIFY_FEISHU_IMAGE_WEBHOOK", "") or os.getenv(
            "FEISHU_AI_WEBHOOK_URL", ""
        )
        self._timeout = timeout

    def _get_client(self) -> httpx.Client:
        return httpx.Client(timeout=self._timeout)

    def _send_card(self, card: dict[str, Any]) -> dict[str, Any]:
        """发送飞书卡片消息"""
        if not self._webhook_url:
            return {"success": False, "code": -1, "msg": "NOTIFY_FEISHU_IMAGE_WEBHOOK not configured"}
        try:
            client = self._get_client()
            response = client.post(self._webhook_url, json=card)
            return response.json()
        except Exception as e:
            return {"success": False, "code": -2, "msg": str(e)}

    def _download_image(self, image_url: str) -> bytes:
        """从 S3 Presigned URL 下载图片数据

        Args:
            image_url: S3 Presigned URL 或 data URL

        Returns:
            bytes: 图片二进制数据
        """
        if not image_url:
            return b""

        if image_url.startswith("data:"):
            b64_part = image_url.split(",", 1)[1] if "," in image_url else image_url.split(";base64,", 1)[-1]
            return base64.b64decode(b64_part)

        if len(image_url) > 200 and not image_url.startswith("http"):
            try:
                return base64.b64decode(image_url)
            except Exception:
                pass

        try:
            response = httpx.get(image_url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception:
            return b""

    def _upload_image_to_feishu(self, image_data: bytes, image_type: str = "message") -> str:
        """上传图片到飞书并获取 image_key

        飞书 img 标签必须使用 image_key，不能直接用 URL。
        流程：下载 S3 图片 → base64 编码 → POST 到飞书上传接口 → 提取 image_key

        Args:
            image_data: 图片二进制数据
            image_type: 图片类型，message|avatar

        Returns:
            str: 飞书 image_key，失败时返回空字符串
        """
        feishu_token_url = os.getenv("FEISHU_UPLOAD_TOKEN_URL", "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal")
        feishu_upload_url = os.getenv("FEISHU_UPLOAD_URL", "https://open.feishu.cn/open-apis/im/v1/images")

        app_id = os.getenv("FEISHU_APP_ID", "")
        app_secret = os.getenv("FEISHU_APP_SECRET", "")

        if not app_id or not app_secret:
            return ""

        try:
            client = self._get_client()

            token_resp = client.post(
                feishu_token_url,
                json={"app_id": app_id, "app_secret": app_secret},
            )
            token_resp.raise_for_status()
            token_data = token_resp.json()
            access_token = token_data.get("tenant_access_token", "")
            if not access_token:
                return ""
        except Exception:
            return ""

        try:
            b64_data = base64.b64encode(image_data).decode("utf-8")
            upload_resp = client.post(
                feishu_upload_url,
                headers={"Authorization": f"Bearer {access_token}"},
                data={"image_type": image_type},
                files={"image": ("image.png", io.BytesIO(image_data), "image/png")},
            )
            upload_resp.raise_for_status()
            upload_result = upload_resp.json()
            if upload_result.get("code") == 0:
                return upload_result.get("data", {}).get("image_key", "")
        except Exception:
            pass

        return ""

    def notify_image_generated(self, event: ImageGeneratedEvent) -> dict[str, Any]:
        """通知文生图完成事件

        Args:
            event: 文生图事件数据

        Returns:
            dict: 飞书 API 响应
        """
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prompt_preview = event.prompt[:200] + ("..." if len(event.prompt) > 200 else "")

        image_key = ""
        if event.image_url and event.image_url.startswith("http"):
            image_bytes = self._download_image(event.image_url)
            if image_bytes:
                image_key = self._upload_image_to_feishu(image_bytes)

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
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": "**\u7528\u6237**\n" + event.user_name},
                            },
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": "**\u6a21\u578b**\n" + event.model},
                            },
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**\u5c3a\u5bf8**\n" + f"{event.width}x{event.height}",
                                },
                            },
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**\u4efb\u52a1ID**\n" + event.task_id[:16] + "...",
                                },
                            },
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
                ],
            },
        }

        if image_key:
            card["card"]["elements"].insert(
                len(card["card"]["elements"]) - 1,
                {
                    "tag": "img",
                    "img_key": image_key,
                    "alt": {"tag": "plain_text", "content": "AI \u751f\u6210\u56fe\u7247"},
                    "width": 300,
                },
            )
        elif event.image_url:
            card["card"]["elements"].insert(
                len(card["card"]["elements"]) - 1,
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": "**\u56fe\u7247\u94fe\u63a5**\n[" + event.image_url[:80] + "...\u94fe\u63a5](" + event.image_url + ")",
                    },
                },
            )

        if event.image_url and event.image_url.startswith("http"):
            card["card"]["elements"].append(
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

        card["card"]["elements"].append(
            {
                "tag": "note",
                "elements": [
                    {"tag": "plain_text", "content": f"TRAI AI \u901a\u77e5 \u00b7 {now_str}"},
                ],
            },
        )

        return self._send_card(card)

    def notify_image_edited(self, event: ImageEditedEvent) -> dict[str, Any]:
        """通知图生图（图片编辑）完成事件

        Args:
            event: 图片编辑事件数据

        Returns:
            dict: 飞书 API 响应
        """
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prompt_preview = event.prompt[:200] + ("..." if len(event.prompt) > 200 else "")
        is_dual = bool(event.source_image_url_2)

        result_image_key = ""
        if event.result_image_url and event.result_image_url.startswith("http"):
            result_bytes = self._download_image(event.result_image_url)
            if result_bytes:
                result_image_key = self._upload_image_to_feishu(result_bytes)

        source1_key = ""
        if event.source_image_url and event.source_image_url.startswith("http"):
            source1_bytes = self._download_image(event.source_image_url)
            if source1_bytes:
                source1_key = self._upload_image_to_feishu(source1_bytes)

        source2_key = ""
        if is_dual and event.source_image_url_2 and event.source_image_url_2.startswith("http"):
            source2_bytes = self._download_image(event.source_image_url_2)
            if source2_bytes:
                source2_key = self._upload_image_to_feishu(source2_bytes)

        header_title = "\u2705 AI \u53cc\u56fe\u8054\u52a8\u7f16\u8f91\u5b8c\u6210" if is_dual else "\u2705 AI \u56fe\u7247\u7f16\u8f91\u5b8c\u6210"
        template = "purple" if is_dual else "blue"

        card = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": header_title},
                    "template": template,
                },
                "elements": [
                    {
                        "tag": "div",
                        "fields": [
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": "**\u7528\u6237**\n" + event.user_name},
                            },
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": "**\u6a21\u578b**\n" + event.model},
                            },
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**\u5c3a\u5bf8**\n" + f"{event.width}x{event.height}",
                                },
                            },
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**\u6b65\u6570**\n" + str(event.steps),
                                },
                            },
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**Seed**\n" + (str(event.seed) if event.seed >= 0 else "\u968f\u673a"),
                                },
                            },
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**\u7c7b\u578b**\n" + ("\u53cc\u56fe" if is_dual else "\u5355\u56fe"),
                                },
                            },
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**\u4efb\u52a1ID**\n" + event.task_id[:16] + "..."
                                    if event.task_id
                                    else "**\u4efb\u52a1ID**\n\u2014",
                                },
                            },
                        ],
                    },
                    {"tag": "hr"},
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": "**Edit Prompt**\n" + prompt_preview,
                        },
                    },
                ],
            },
        }

        if is_dual:
            # 双图模式：三图并排（源图1 | 源图2 | 结果图）
            card["card"]["elements"].insert(
                len(card["card"]["elements"]) - 1,
                {
                    "tag": "div",
                    "fields": [
                        {"is_short": True, "text": {"tag": "lark_md", "content": "**\u539f\u56fe 1**"}},
                        {"is_short": True, "text": {"tag": "lark_md", "content": "**\u539f\u56fe 2**"}},
                        {"is_short": True, "text": {"tag": "lark_md", "content": "**\u7ed3\u679c\u56fe**"}},
                    ],
                },
            )
            card["card"]["elements"].insert(
                len(card["card"]["elements"]) - 1,
                {
                    "tag": "div",
                    "fields": [
                        {"is_short": True, "text": {"tag": "lark_md", "content": ""},
                         "img": {"img_key": source1_key, "width": 120} if source1_key else None},
                        {"is_short": True, "text": {"tag": "lark_md", "content": ""},
                         "img": {"img_key": source2_key, "width": 120} if source2_key else None},
                        {"is_short": True, "text": {"tag": "lark_md", "content": ""},
                         "img": {"img_key": result_image_key, "width": 120} if result_image_key else None},
                    ],
                },
            )
        elif source1_key:
            # 单图模式：原图 | 结果图 并排
            card["card"]["elements"].insert(
                len(card["card"]["elements"]) - 1,
                {
                    "tag": "div",
                    "fields": [
                        {"is_short": True, "text": {"tag": "lark_md", "content": "**\u539f\u56fe**"}},
                        {"is_short": True, "text": {"tag": "lark_md", "content": "**\u7ed3\u679c\u56fe**"}},
                    ],
                },
            )
            card["card"]["elements"].insert(
                len(card["card"]["elements"]) - 1,
                {
                    "tag": "div",
                    "fields": [
                        {"is_short": True, "text": {"tag": "lark_md", "content": ""},
                         "img": {"img_key": source1_key, "width": 150}},
                        {"is_short": True, "text": {"tag": "lark_md", "content": ""},
                         "img": {"img_key": result_image_key, "width": 150} if result_image_key else None},
                    ],
                },
            )
        elif result_image_key:
            card["card"]["elements"].insert(
                len(card["card"]["elements"]) - 1,
                {
                    "tag": "img",
                    "img_key": result_image_key,
                    "alt": {"tag": "plain_text", "content": "AI \u7f16\u8f91\u7ed3\u679c"},
                    "width": 300,
                },
            )
        elif event.result_image_url:
            card["card"]["elements"].insert(
                len(card["card"]["elements"]) - 1,
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": "**\u56fe\u7247\u94fe\u63a5**\n[" + event.result_image_url[:80] + "...\u94fe\u63a5]("
                        + event.result_image_url + ")",
                    },
                },
            )

        if event.result_image_url and event.result_image_url.startswith("http"):
            card["card"]["elements"].append(
                {
                    "tag": "action",
                    "actions": [
                        {
                            "tag": "button",
                            "text": {"tag": "plain_text", "content": "\u6253\u5f00\u56fe\u7247"},
                            "type": "primary",
                            "url": event.result_image_url,
                        }
                    ],
                },
            )

        card["card"]["elements"].append(
            {
                "tag": "note",
                "elements": [
                    {"tag": "plain_text", "content": f"TRAI AI \u901a\u77e5 \u00b7 {now_str}"},
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
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": "**\u7528\u6237**\n" + event.user_name},
                            },
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": "**\u6a21\u578b**\n" + event.model},
                            },
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
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": "**\u7528\u6237**\n" + event.user_name},
                            },
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": "**\u6a21\u578b**\n" + event.model},
                            },
                            {"is_short": True, "text": {"tag": "lark_md", "content": "**Tokens**\n" + tokens_str}},
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**\u4f1a\u8bddID**\n"
                                    + (event.session_id[:16] + "..." if event.session_id else "\u2014"),
                                },
                            },
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


    def notify_video_generated(self, event: VideoGeneratedEvent) -> dict[str, Any]:
        """通知视频生成完成事件

        Args:
            event: 视频生成事件数据

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
                    "title": {"tag": "plain_text", "content": "\U0001f3ac AI \u89c6\u9891\u751f\u6210"},
                    "template": "orange",
                },
                "elements": [
                    {
                        "tag": "div",
                        "fields": [
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": "**\u7528\u6237**\n" + event.user_name},
                            },
                            {
                                "is_short": True,
                                "text": {"tag": "lark_md", "content": "**\u6a21\u578b**\n" + event.model},
                            },
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**\u5206\u8fa8\u7387**\n" + event.resolution,
                                },
                            },
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**\u5e27\u6570**\n" + str(event.frames),
                                },
                            },
                            {
                                "is_short": True,
                                "text": {
                                    "tag": "lark_md",
                                    "content": "**\u4efb\u52a1ID**\n" + event.task_id[:16] + "..."
                                    if event.task_id
                                    else "**\u4efb\u52a1ID**\n\u2014",
                                },
                            },
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
                    {"tag": "hr"},
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": "**S3 \u5bf9\u8c61\u952e**\n" + event.object_key,
                        },
                    },
                ],
            },
        }

        # 添加两个URL按钮（Presigned 域名 + 公共域名）
        actions = []

        # Presigned URL 按钮（30天有效）
        if event.video_url and event.video_url.startswith("http"):
            actions.append(
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "\u6253\u5f00\u89c6\u9891(Presigned-30\u5929)"},
                    "type": "primary",
                    "url": event.video_url,
                }
            )

        # 公共域名 URL 按钮
        if event.public_url and event.public_url.startswith("http"):
            actions.append(
                {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": "\u6253\u5f00\u89c6\u9891(\u516c\u5171\u57df\u540d)"},
                    "type": "default",
                    "url": event.public_url,
                }
            )

        if actions:
            card["card"]["elements"].append({"tag": "action", "actions": actions})

        card["card"]["elements"].append(
            {
                "tag": "note",
                "elements": [
                    {"tag": "plain_text", "content": f"TRAI AI \u901a\u77e5 \u00b7 {now_str}"},
                ],
            },
        )

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
    "ImageEditedEvent",
    "ImageFailedEvent",
    "ChatCompletedEvent",
    "VideoGeneratedEvent",
    "FeishuAINotifyService",
    "get_feishu_ai_notify_service",
]
