#!/usr/bin/env python
# 文件名: backup_service.py
# 作者: wuhao
# 日期: 2026_04_22_10:55:00
# 描述: 数据库备份服务,支持 pg_dump 备份及 S3 上传

import os
import subprocess
import time
from datetime import datetime
from pathlib import Path

import requests
from core.logger import get_logger
from infrastructure.storage.s3_storage import S3StorageService

logger = get_logger()

FEISHU_SYNC_WEBHOOK = "https://open.feishu.cn/open-apis/bot/v2/hook/1210fc93-997c-475d-bb80-189330d8be8e"
WECOM_WEBHOOK = os.getenv("WECOM_CHAT_WEBHOOK_URL", "")

class BackupService:
    """数据库备份服务"""

    def __init__(self) -> None:
        self._db_host = os.getenv("DB_HOST", "localhost")
        self._db_port = os.getenv("DB_PORT", "5432")
        self._db_name = os.getenv("DB_NAME", "trai")
        self._db_user = os.getenv("DB_USER", "postgres")
        self._db_password = os.getenv("DB_PASSWORD", "")
        self._storage = S3StorageService()
        self._backup_dir = Path("backups")
        self._backup_dir.mkdir(exist_ok=True)

    def run_backup(self) -> dict:
        """执行备份任务"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"trai_db_{timestamp}.sql"
        filepath = self._backup_dir / filename

        try:
            logger.info(f"Starting database backup: {filename}")
            
            # 设置环境变量以便 pg_dump 使用密码
            env = os.environ.copy()
            env["PGPASSWORD"] = self._db_password

            # 执行 pg_dump
            cmd = [
                "pg_dump",
                "-h", self._db_host,
                "-p", self._db_port,
                "-U", self._db_user,
                "-f", str(filepath),
                self._db_name
            ]
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"pg_dump failed: {result.stderr}")

            # 上传到 S3
            logger.info(f"Uploading backup to S3: {filename}")
            s3_key = f"backups/db/{filename}"
            self._storage.upload_file(str(filepath), s3_key, "application/sql")
            # 获取预签名下载链接 (有效期 24 小时)
            download_url = self._storage.get_presigned_url(s3_key, 86400)

            # 发送通知
            self._send_notifications(filename, download_url)

            # 清理本地临时文件
            filepath.unlink()

            return {"status": "success", "filename": filename, "url": download_url}

        except Exception as e:
            logger.error(f"Database backup failed: {e}")
            self._send_error_notification(str(e))
            return {"status": "failed", "error": str(e)}

    def _send_notifications(self, filename: str, url: str) -> None:
        """发送成功通知"""
        msg = f"🚀 **数据库备份成功**\n文件名: {filename}\n下载地址: [点击下载]({url})\n有效期: 24小时"
        
        # 飞书
        try:
            requests.post(FEISHU_SYNC_WEBHOOK, json={
                "msg_type": "post",
                "content": {
                    "post": {
                        "zh_cn": {
                            "title": "数据库备份报告",
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

    def _send_error_notification(self, error: str) -> None:
        """发送失败通知"""
        msg = f"❌ **数据库备份失败**\n原因: {error}"
        try:
            requests.post(FEISHU_SYNC_WEBHOOK, json={
                "msg_type": "text",
                "text": {"content": msg}
            })
        except: pass
