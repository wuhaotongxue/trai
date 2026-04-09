#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: dingtalk.py
# 作者: wuhao
# 日期: 2026_04_09_14:15:00
# 描述: 钉钉（DingTalk）通知服务实现

from __future__ import annotations

import hashlib
import hmac
import time
from typing import TYPE_CHECKING, Any

import httpx

from trai.infrastructure.notify.base import (
    BaseNotifyService,
    NotifyLevel,
    NotifyMessage,
    NotifyResult,
    NotifyType,
)

if TYPE_CHECKING:
    from loguru import Logger


class DingTalkNotifyService(BaseNotifyService):
    """钉钉通知服务

    支持文本、Markdown、ActionCard、FeedCard 等多种消息类型
    Webhook 地址格式: https://oapi.dingtalk.com/robot/send?access_token=xxx
    支持加签密钥: secret=xxx
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

    def _generate_signature(self) -> str | None:
        """生成加签签名

        Returns:
            str | None: 签名字符串，secret 为空时返回 None
        """
        if not self._secret:
            return None

        timestamp = str(round(time.time() * 1000))
        secret_enc = self._secret.encode("utf-8")
        string_to_sign = f"{timestamp}\n{self._secret}"
        string_to_sign_enc = string_to_sign.encode("utf-8")
        hmac_code = hmac.new(secret_enc, string_to_sign_enc, digestmod=hashlib.sha256).digest()
        sign = hmac_code.hexdigest()
        return f"{timestamp}&{sign}"

    def _build_payload(self, message: NotifyMessage) -> dict[str, Any]:
        """构建钉钉消息载荷

        Args:
            message: 通知消息

        Returns:
            dict: 钉钉格式的载荷
        """
        payload: dict[str, Any] = {
            "msgtype": self._get_dingtalk_msg_type(message.msg_type),
        }

        if message.msg_type == NotifyType.TEXT:
            payload["text"] = {"content": message.content}
            if message.extra.get("at_mobiles"):
                payload["at"] = {"atMobiles": message.extra["at_mobiles"]}

        elif message.msg_type == NotifyType.MARKDOWN:
            payload["markdown"] = {
                "title": message.title or "Notification",
                "text": message.content,
            }

        elif message.msg_type == NotifyType.HTML:
            payload["text"] = {"content": message.content}

        return payload

    def _get_dingtalk_msg_type(self, msg_type: NotifyType) -> str:
        """转换消息类型为钉钉格式

        Args:
            msg_type: 通用消息类型

        Returns:
            str: 钉钉消息类型
        """
        mapping = {
            NotifyType.TEXT: "text",
            NotifyType.MARKDOWN: "markdown",
            NotifyType.HTML: "text",
            NotifyType.CARD: "actionCard",
        }
        return mapping.get(msg_type, "text")

    def _parse_response(self, response: httpx.Response) -> NotifyResult:
        """解析钉钉响应

        Args:
            response: HTTP 响应

        Returns:
            NotifyResult: 解析后的结果
        """
        try:
            data = response.json()
            errcode = data.get("errcode", 0)
            errmsg = data.get("errmsg", "")

            if errcode == 0:
                return NotifyResult(
                    success=True,
                    message="DingTalk notification sent successfully",
                    data=data,
                )
            else:
                return NotifyResult(
                    success=False,
                    message=f"DingTalk API error: {errmsg}",
                    data=data,
                    error=f"code={errcode}",
                )

        except Exception as e:
            return NotifyResult(
                success=False,
                message=f"Failed to parse DingTalk response: {str(e)}",
                error=str(e),
            )

    def send_with_signature(self, message: NotifyMessage) -> NotifyResult:
        """使用加签方式发送消息

        Args:
            message: 通知消息

        Returns:
            NotifyResult: 发送结果
        """
        if not self._secret:
            return NotifyResult(
                success=False,
                message="Secret not configured, cannot use signature",
                error="missing_secret",
            )

        signature = self._generate_signature()
        url = f"{self._webhook_url}&sign={signature}"

        try:
            payload = self._build_payload(message)
            client = self._get_client()
            response = client.post(url, json=payload)
            return self._parse_response(response)

        except Exception as e:
            self._logger.error(f"Failed to send DingTalk with signature: {str(e)}")
            return NotifyResult(success=False, message=str(e), error=str(e))

    def send_action_card(
        self,
        title: str,
        content: str,
        action_title: str = "查看详情",
        action_url: str = "",
        btn_orientation: str = "0",
    ) -> NotifyResult:
        """发送 ActionCard 消息

        Args:
            title: 标题
            content: 内容（支持 Markdown）
            action_title: 按钮文字
            action_url: 点击按钮跳转的 URL
            btn_orientation: 按钮排列方式: 0-按钮竖直排列, 1-按钮横向排列

        Returns:
            NotifyResult: 发送结果
        """
        payload = {
            "msgtype": "actionCard",
            "actionCard": {
                "title": title,
                "text": content,
                "btnOrientation": btn_orientation,
            },
        }

        if action_url:
            payload["actionCard"]["actionURL"] = action_url
        else:
            payload["actionCard"]["hideAvatar"] = "0"

        try:
            client = self._get_client()
            response = client.post(self._webhook_url, json=payload)
            return self._parse_response(response)

        except Exception as e:
            self._logger.error(f"Failed to send DingTalk action card: {str(e)}")
            return NotifyResult(success=False, message=str(e), error=str(e))

    def send_action_card_btns(
        self,
        title: str,
        content: str,
        btns: list[dict[str, str]],
        btn_orientation: str = "0",
    ) -> NotifyResult:
        """发送多按钮 ActionCard 消息

        Args:
            title: 标题
            content: 内容
            btns: 按钮列表 [{"title": "", "actionURL": ""}]
            btn_orientation: 按钮排列方式

        Returns:
            NotifyResult: 发送结果
        """
        payload = {
            "msgtype": "actionCard",
            "actionCard": {
                "title": title,
                "text": content,
                "btnOrientation": btn_orientation,
                "btns": btns,
            },
        }

        try:
            client = self._get_client()
            response = client.post(self._webhook_url, json=payload)
            return self._parse_response(response)

        except Exception as e:
            self._logger.error(f"Failed to send DingTalk action card with buttons: {str(e)}")
            return NotifyResult(success=False, message=str(e), error=str(e))

    def send_feed_card(self, links: list[dict[str, str]]) -> NotifyResult:
        """发送 FeedCard 消息

        Args:
            links: 链接列表 [{"title": "", "messageURL": "", "picURL": ""}]

        Returns:
            NotifyResult: 发送结果
        """
        payload = {
            "msgtype": "feedCard",
            "feedCard": {
                "links": links,
            },
        }

        try:
            client = self._get_client()
            response = client.post(self._webhook_url, json=payload)
            return self._parse_response(response)

        except Exception as e:
            self._logger.error(f"Failed to send DingTalk feed card: {str(e)}")
            return NotifyResult(success=False, message=str(e), error=str(e))

    def send_at(
        self,
        content: str,
        at_mobiles: list[str],
        is_at_all: bool = False,
    ) -> NotifyResult:
        """发送带 @ 提醒的消息

        Args:
            content: 消息内容
            at_mobiles: 被 @ 的手机号列表
            is_at_all: 是否 @ 所有人

        Returns:
            NotifyResult: 发送结果
        """
        message = NotifyMessage(
            title="",
            content=content,
            level=NotifyLevel.INFO,
            msg_type=NotifyType.TEXT,
            extra={"at_mobiles": at_mobiles},
        )

        payload = self._build_payload(message)
        if "at" not in payload:
            payload["at"] = {}
        payload["at"]["isAtAll"] = is_at_all

        try:
            client = self._get_client()
            response = client.post(self._webhook_url, json=payload)
            return self._parse_response(response)

        except Exception as e:
            self._logger.error(f"Failed to send DingTalk at message: {str(e)}")
            return NotifyResult(success=False, message=str(e), error=str(e))


__all__ = ["DingTalkNotifyService"]
