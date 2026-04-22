#!/usr/bin/env python
# 文件名: release_client.py
# 作者: wuhao
# 日期: 2026_04_22_11:00:00
# 描述: 客户端发布用例,支持 S3 上传及通知推送

import os
from typing import Any

import requests
from core.logger import get_logger
from infrastructure.storage.s3_storage import S3Storage

logger = get_logger()

FEISHU_RELEASE_WEBHOOK = "https://open.feishu.cn/open-apis/bot/v2/hook/f95076d1-6ed9-4f59-8238-feddc69664b8"
WECOM_WEBHOOK = os.getenv("WECOM_CHAT_WEBHOOK_URL", "")

class ReleaseClientUseCase:
    """客户端发布用例"""

    def __init__(self) -> None:
        self._storage = S3Storage()

    async def execute(self, file_path: str, version: str, changelog: str) -> dict[str, Any]:
        """执行发布"""
        filename = os.path.basename(file_path)
        s3_key = f"releases/desktop/{version}/{filename}"
        
        try:
            logger.info(f"Uploading release to S3: {filename} (v{version})")
            with open(file_path, "rb") as f:
                self._storage.upload_file(f, s3_key)
            
            # 生成下载链接
            download_url = self._storage.generate_presigned_url(s3_key, expiration=31536000) # 1年有效
            
            # 推送通知
            self._send_notifications(version, download_url, changelog)
            
            return {
                "status": "success",
                "version": version,
                "url": download_url
            }
            
        except Exception as e:
            logger.error(f"Release failed: {e}")
            return {"status": "failed", "error": str(e)}

    def _send_notifications(self, version: str, url: str, changelog: str) -> None:
        """发送发布通知"""
        msg = f"🆕 **TRAI 客户端新版本发布 (v{version})**\n\n**更新日志:**\n{changelog}\n\n**下载地址:**\n[点击下载]({url})"
        
        # 飞书
        try:
            requests.post(FEISHU_RELEASE_WEBHOOK, json={
                "msg_type": "post",
                "content": {
                    "post": {
                        "zh_cn": {
                            "title": f"TRAI Desktop v{version} 发布",
                            "content": [[{"tag": "text", "text": msg}]]
                        }
                    }
                }
            })
        except: pass

        # 企微
        if WECOM_WEBHOOK:
            try:
                requests.post(WECOM_WEBHOOK, json={
                    "msg_type": "markdown",
                    "markdown": {"content": msg}
                })
            except: pass
