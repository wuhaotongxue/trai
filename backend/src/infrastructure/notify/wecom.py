#!/usr/bin/env python
# 文件名: wecom.py
# 作者: wuhao
# 日期: 2026_04_09_14:10:00
# 描述: 企业微信(WeCom)通知服务实现

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


class WeComNotifyService(BaseNotifyService):
    """企业微信通知服务

    支持文本,Markdown,图文等多种消息类型
    Webhook 地址格式: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
    """

    def __init__(
        self,
        webhook_url: str,
        timeout: int = 30,
        agent_id: str | None = None,
    ) -> None:
        super().__init__(webhook_url, timeout)
        self._agent_id: str | None = agent_id
        self._logger: Logger = self._logger

    def _build_payload(self, message: NotifyMessage) -> dict[str, Any]:
        """构建企业微信消息载荷

        Args:
            message: 通知消息

        Returns:
            dict: 企业微信格式的载荷
        """
        payload: dict[str, Any] = {
            "msgtype": self._get_wecom_msg_type(message.msg_type),
        }

        if message.msg_type == NotifyType.TEXT:
            text_content = message.content
            if message.extra.get("mentioned_list"):
                mentioned_list = message.extra["mentioned_list"]
                text_content += "\n" + "".join(f"<@{uid}>" for uid in mentioned_list)
                payload["mentioned_list"] = mentioned_list

            if message.extra.get("mentioned_mobile_list"):
                mentioned_mobile_list = message.extra["mentioned_mobile_list"]
                payload["mentioned_mobile_list"] = mentioned_mobile_list

            payload["text"] = {"content": text_content}

        elif message.msg_type == NotifyType.MARKDOWN:
            payload["markdown"] = {"content": message.content}

        elif message.msg_type == NotifyType.HTML:
            payload["text"] = {"content": message.content}

        return payload

    def _get_wecom_msg_type(self, msg_type: NotifyType) -> str:
        """转换消息类型为企业微信格式

        Args:
            msg_type: 通用消息类型

        Returns:
            str: 企业微信消息类型
        """
        mapping = {
            NotifyType.TEXT: "text",
            NotifyType.MARKDOWN: "markdown",
            NotifyType.HTML: "text",
            NotifyType.CARD: "news",
        }
        return mapping.get(msg_type, "text")

    def _parse_response(self, response: httpx.Response) -> NotifyResult:
        """解析企业微信响应

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
                    message="WeCom notification sent successfully",
                    data=data,
                )
            else:
                return NotifyResult(
                    success=False,
                    message=f"WeCom API error: {errmsg}",
                    data=data,
                    error=f"code={errcode}",
                )

        except Exception as e:
            return NotifyResult(
                success=False,
                message=f"Failed to parse WeCom response: {str(e)}",
                error=str(e),
            )

    def send_text_with_mentions(
        self,
        content: str,
        mentioned_list: list[str] | None = None,
        mentioned_mobile_list: list[str] | None = None,
    ) -> NotifyResult:
        """发送带 @ 提醒的文本消息

        Args:
            content: 消息内容
            mentioned_list: 用户 ID 列表
            mentioned_mobile_list: 手机号列表

        Returns:
            NotifyResult: 发送结果
        """
        message = NotifyMessage(
            title="",
            content=content,
            level=NotifyLevel.INFO,
            msg_type=NotifyType.TEXT,
            extra={
                "mentioned_list": mentioned_list or [],
                "mentioned_mobile_list": mentioned_mobile_list or [],
            },
        )
        return self.send(message)

    def send_news(
        self,
        title: str,
        description: str,
        url: str,
        picurl: str | None = None,
    ) -> NotifyResult:
        """发送图文消息

        Args:
            title: 标题
            description: 描述
            url: 点击后跳转的链接
            picurl: 图片 URL

        Returns:
            NotifyResult: 发送结果
        """
        payload = {
            "msgtype": "news",
            "news": {
                "articles": [
                    {
                        "title": title,
                        "description": description,
                        "url": url,
                        "picurl": picurl or "",
                    }
                ]
            },
        }

        try:
            client = self._get_client()
            response = client.post(self._webhook_url, json=payload)
            return self._parse_response(response)

        except Exception as e:
            self._logger.error(f"Failed to send WeCom news: {str(e)}")
            return NotifyResult(success=False, message=str(e), error=str(e))

    def send_template_card(
        self,
        card_type: str,
        main_title: dict[str, str],
        emphasis_content: dict[str, str] | None = None,
        quote_area: dict[str, str] | None = None,
        sub_title_text: str = "",
        horizontal_content_list: list[dict[str, Any]] | None = None,
        jump_list: list[dict[str, Any]] | None = None,
        card_action: dict[str, Any] | None = None,
    ) -> NotifyResult:
        """发送模板卡片消息

        Args:
            card_type: 卡片类型 (text_notice, news_notice, button_interaction)
            main_title: 主标题 {"title": "", "desc": ""}
            emphasis_content: 强调内容 {"title": "", "desc": ""}
            quote_area: 引用区域 {"title": "", "quote_source": ""}
            sub_title_text: 副标题
            horizontal_content_list: 横向内容 [{"keyname": "", "value": ""}]
            jump_list: 跳转列表 [{"type": 1, "url": "", "title": ""}]
            card_action: 整体卡片点击跳转 {"type": 1, "url": ""}

        Returns:
            NotifyResult: 发送结果
        """
        card: dict[str, Any] = {
            "msgtype": "template_card",
            "template_card": {
                "card_type": card_type,
                "source": {
                    "desc_text": "TRAI System",
                },
                "main_title": main_title,
            },
        }

        template_card = card["template_card"]

        if emphasis_content:
            template_card["emphasis_content"] = emphasis_content

        if quote_area:
            template_card["quote_area"] = quote_area

        if sub_title_text:
            template_card["sub_title_text"] = sub_title_text

        if horizontal_content_list:
            template_card["horizontal_content_list"] = horizontal_content_list

        if jump_list:
            template_card["jump_list"] = jump_list

        if card_action:
            template_card["card_action"] = card_action

        try:
            client = self._get_client()
            response = client.post(self._webhook_url, json=card)
            return self._parse_response(response)

        except Exception as e:
            self._logger.error(f"Failed to send WeCom template card: {str(e)}")
            return NotifyResult(success=False, message=str(e), error=str(e))


__all__ = ["WeComNotifyService"]
