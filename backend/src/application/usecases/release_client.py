#!/usr/bin/env python
# 文件名: release_client.py
# 作者: wuhao
# 日期: 2026_04_22_11:00:00
# 描述: 客户端发布用例,支持 S3 上传及通知推送

import os
from datetime import datetime
from typing import Any

import requests

from core.logger import get_logger
from infrastructure.storage.s3_storage import S3StorageService

logger = get_logger()

# 飞书发布通知 Webhook, 从环境变量读取, 优先使用已有的 NOTIFY_FEISHU_WEBHOOK
FEISHU_RELEASE_WEBHOOK = os.getenv("NOTIFY_FEISHU_WEBHOOK", "")
# 企微通知 Webhook
WECOM_WEBHOOK = os.getenv("NOTIFY_WECOM_WEBHOOK", "")


class ReleaseClientUseCase:
    """客户端发布用例"""

    def __init__(self) -> None:
        self._storage = S3StorageService()

    async def execute(self, file_path: str, version: str, changelog: str) -> dict[str, Any]:
        """执行发布流程, 包括上传文件到 S3 并发送通知.

        Args:
            file_path: 待上传的文件本地路径
            version: 发布的版本号
            changelog: 更新日志内容

        Returns:
            dict[str, Any]: 包含执行状态、版本号及下载 URL 的字典
        """
        filename = os.path.basename(file_path)
        s3_key = f"releases/desktop/{version}/{filename}"

        try:
            logger.info(f"Uploading release to S3: {filename} (v{version})")
            with open(file_path, "rb") as f:
                self._storage.upload_file(file_path, s3_key)

            # 生成下载链接 (优先使用 get_file_url 以配合 Nginx 静态代理)
            download_url = self._storage.get_file_url(s3_key)

            # 推送通知
            self._send_notifications(version, download_url, changelog)

            return {"status": "success", "version": version, "url": download_url}

        except Exception as e:
            logger.error(f"Release failed: {e}")
            return {"status": "failed", "error": str(e)}

    def _send_notifications(self, version: str, url: str, changelog: str) -> None:
        """发送发布通知 (飞书富文本卡片 + 企微 Markdown).

        Args:
            version: 版本号
            url: 下载地址
            changelog: 更新日志
        """
        
        # 飞书富文本卡片格式
        feishu_card = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": f"🚀 TRAI Desktop v{version} 正式发布"},
                    "template": "blue",
                },
                "elements": [
                    {
                        "tag": "div",
                        "text": {"tag": "lark_md", "content": f"**版本号:** v{version}\n**发布时间:** {datetime.now().strftime('%Y-%m-%d %H:%M')}"},
                    },
                    {"tag": "hr"},
                    {
                        "tag": "div",
                        "text": {"tag": "lark_md", "content": f"**更新内容:**\n{changelog}"},
                    },
                    {
                        "tag": "action",
                        "actions": [
                            {
                                "tag": "button",
                                "text": {"tag": "plain_text", "content": "立即下载 (EXE)"},
                                "url": url,
                                "type": "primary",
                            },
                            {
                                "tag": "button",
                                "text": {"tag": "plain_text", "content": "查看更新日志"},
                                "url": "https://ai.tuoren.com/changelog",
                                "type": "default",
                            },
                        ],
                    },
                    {
                        "tag": "note",
                        "elements": [{"tag": "plain_text", "content": "提示: 如果下载缓慢, 请检查内网代理设置"}],
                    },
                ],
            },
        }

        # 飞书发送 (仅当 Webhook 配置了才发送)
        if FEISHU_RELEASE_WEBHOOK:
            try:
                res = requests.post(FEISHU_RELEASE_WEBHOOK, json=feishu_card, timeout=10)
                logger.info(f"Feishu notification sent: {res.status_code}")
            except Exception as e:
                logger.error(f"Failed to send Feishu notification: {e}")

        # 企微 Markdown
        if WECOM_WEBHOOK:
            wecom_msg = {
                "msgtype": "markdown",
                "markdown": {
                    "content": f"🆕 **TRAI 客户端新版本发布 (v{version})**\n\n"
                               f"> **更新日志:**\n>{changelog.replace('\\n', '\\n>')}\n\n"
                               f"**下载地址:** [点击下载 EXE]({url})"
                }
            }
            try:
                requests.post(WECOM_WEBHOOK, json=wecom_msg, timeout=10)
            except Exception as e:
                logger.error(f"Failed to send WeCom notification: {e}")
