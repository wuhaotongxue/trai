#!/usr/bin/env python
# 文件名: feishu.py
# 作者: wuhao
# 日期: 2026_04_09_14:00:00
# 描述: 飞书(Lark)通知服务实现

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import httpx

from infrastructure.notify.base import (
    BaseNotifyService,
    NotifyLevel,
    NotifyMessage,
    NotifyResult,
    NotifyType,
)

if TYPE_CHECKING:
    from loguru import Logger


class FeishuNotifyService(BaseNotifyService):
    """飞书通知服务

    支持文本,Markdown,卡片等多种消息类型
    Webhook 地址格式: https://open.feishu.cn/open-apis/bot/v2/hook/xxx
    """

    def __init__(
        self,
        webhook_url: str,
        timeout: int = 30,
        secret: str | None = None,
    ) -> None:
        super().__init__(webhook_url, timeout)
        self._secret: str | None = secret
        self._logger: Logger = self._logger

    def _build_payload(self, message: NotifyMessage) -> dict[str, Any]:
        """构建飞书消息载荷

        Args:
            message: 通知消息

        Returns:
            dict: 飞书格式的载荷
        """
        payload: dict[str, Any] = {
            "msg_type": self._get_feishu_msg_type(message.msg_type),
            "content": {},
        }

        if message.msg_type == NotifyType.TEXT:
            payload["content"] = {"text": message.content}

        elif message.msg_type == NotifyType.MARKDOWN:
            # 飞书文本类型不支持 Markdown，转换为交互式卡片以支持
            payload["msg_type"] = "interactive"
            payload["card"] = {
                "header": {
                    "title": {"content": message.title or "TRAI 助手通知", "tag": "plain_text"},
                    "template": "blue",
                },
                "elements": [{"tag": "markdown", "content": message.content}],
            }

        elif message.msg_type == NotifyType.HTML:
            payload["content"] = {"text": message.content}

        if message.extra.get("at_mobiles"):
            payload["at"] = {"atMobiles": message.extra["at_mobiles"]}

        if message.title:
            payload["content"]["text"] = f"{message.title}\n{payload['content']['text']}"

        return payload

    def _get_feishu_msg_type(self, msg_type: NotifyType) -> str:
        """转换消息类型为飞书格式

        Args:
            msg_type: 通用消息类型

        Returns:
            str: 飞书消息类型
        """
        mapping = {
            NotifyType.TEXT: "text",
            NotifyType.MARKDOWN: "text",
            NotifyType.HTML: "text",
            NotifyType.CARD: "interactive",
        }
        return mapping.get(msg_type, "text")

    def _parse_response(self, response: httpx.Response) -> NotifyResult:
        """解析飞书响应

        Args:
            response: HTTP 响应

        Returns:
            NotifyResult: 解析后的结果
        """
        try:
            data = response.json()
            status_code = data.get("code", 0)
            status_msg = data.get("msg", "")

            if status_code == 0:
                return NotifyResult(
                    success=True,
                    message="Feishu notification sent successfully",
                    data=data,
                )
            else:
                return NotifyResult(
                    success=False,
                    message=f"Feishu API error: {status_msg}",
                    data=data,
                    error=f"code={status_code}",
                )

        except Exception as e:
            return NotifyResult(
                success=False,
                message=f"Failed to parse Feishu response: {str(e)}",
                error=str(e),
            )

    def send_card(self, title: str, content: str, extra: dict[str, Any] | None = None) -> NotifyResult:
        """发送卡片消息

        Args:
            title: 卡片标题
            content: 卡片内容(支持 Markdown)
            extra: 额外配置

        Returns:
            NotifyResult: 发送结果
        """
        extra = extra or {}

        card = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": extra.get("wide_screen", True)},
                "header": {
                    "title": {"tag": "plain_text", "content": title},
                    "template": self._get_card_color(extra.get("level", NotifyLevel.INFO)),
                },
                "elements": [
                    {
                        "tag": "markdown",
                        "content": content,
                    },
                ],
            },
        }

        if extra.get("actions"):
            card["card"]["elements"].append(
                {
                    "tag": "action",
                    "actions": extra["actions"],
                }
            )

        try:
            client = self._get_client()
            response = client.post(self._webhook_url, json=card)
            return self._parse_card_response(response)

        except Exception as e:
            self._logger.error(f"Failed to send Feishu card: {str(e)}")
            return NotifyResult(success=False, message=str(e), error=str(e))

    def _parse_card_response(self, response: httpx.Response) -> NotifyResult:
        """解析卡片响应

        Args:
            response: HTTP 响应

        Returns:
            NotifyResult: 解析后的结果
        """
        return self._parse_response(response)

    def _get_card_color(self, level: NotifyLevel) -> str:
        """根据级别获取卡片颜色

        Args:
            level: 通知级别

        Returns:
            str: 飞书卡片颜色
        """
        mapping = {
            NotifyLevel.DEBUG: "grey",
            NotifyLevel.INFO: "blue",
            NotifyLevel.WARNING: "yellow",
            NotifyLevel.ERROR: "red",
            NotifyLevel.CRITICAL: "red",
        }
        return mapping.get(level, "blue")

    def send_with_image(
        self,
        title: str,
        content: str,
        image_key: str,
    ) -> NotifyResult:
        """发送带图片的消息

        Args:
            title: 标题
            content: 内容
            image_key: 飞书图片 key

        Returns:
            NotifyResult: 发送结果
        """
        payload = {
            "msg_type": "post",
            "content": {
                "post": {
                    "zh_cn": {
                        "title": title,
                        "content": [
                            [{"tag": "text", "text": content}],
                            [{"tag": "img", "image_key": image_key, "width": 300}],
                        ],
                    }
                }
            },
        }

        try:
            client = self._get_client()
            response = client.post(self._webhook_url, json=payload)
            return self._parse_response(response)

        except Exception as e:
            self._logger.error(f"Failed to send Feishu image message: {str(e)}")
            return NotifyResult(success=False, message=str(e), error=str(e))


__all__ = ["FeishuNotifyService"]
