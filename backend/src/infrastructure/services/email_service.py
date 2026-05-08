#!/usr/bin/env python
# 文件名: email_service.py
# 作者: wuhao
# 日期: 2026_04_26_18:45:00
# 描述: 邮件发送服务,支持多邮箱配置

from __future__ import annotations

import smtplib
import ssl
from email.header import Header
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.logger import get_logger
from infrastructure.database.models import EmailConfigModel
from infrastructure.security.encryption import get_encryption_service


class EmailService:
    """邮件发送服务"""

    def __init__(self, db_session: Session) -> None:
        self._db_session = db_session
        self._logger = get_logger()
        self._config_cache: dict[str, dict[str, Any]] = {}
        self._encryption_service = get_encryption_service()

    def _load_config(self, config_name: str) -> dict[str, Any] | None:
        """从数据库加载邮件配置

        Args:
            config_name: 配置名称

        Returns:
            dict | None: 配置字典或 None
        """
        if config_name in self._config_cache:
            return self._config_cache[config_name]

        stmt = select(EmailConfigModel).where(
            EmailConfigModel.t_config_name == config_name,
            EmailConfigModel.t_is_active == True,
        )
        result = self._db_session.execute(stmt)
        config_model = result.scalar_one_or_none()

        if not config_model:
            self._logger.warning(f"Email config not found or inactive: {config_name}")
            return None

        # 解密邮箱密码
        try:
            decrypted_password = self._encryption_service.decrypt(config_model.t_password)
        except Exception as e:
            self._logger.error(f"Failed to decrypt email password for {config_name}: {e}")
            # 如果解密失败,可能是旧的明文密码,直接使用
            decrypted_password = config_model.t_password

        config = {
            "host": config_model.t_host,
            "port": config_model.t_port,
            "use_ssl": config_model.t_use_ssl,
            "username": config_model.t_username,
            "password": decrypted_password,
            "from_name": config_model.t_from_name,
            "to_emails": config_model.t_to_emails or [],
        }
        self._config_cache[config_name] = config
        return config

    def _create_message(
        self,
        config: dict[str, Any],
        to_emails: list[str],
        subject: str,
        html_content: str,
        attachments: list[dict[str, Any]] | None = None,
    ) -> MIMEMultipart:
        """创建邮件消息

        Args:
            config: 邮件配置
            to_emails: 收件人列表
            subject: 邮件主题
            html_content: HTML 内容
            attachments: 附件列表

        Returns:
            MIMEMultipart: 邮件消息对象
        """
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{Header(config['from_name'], 'utf-8').encode()} <{config['username']}>"
        message["To"] = ", ".join(to_emails)

        html_part = MIMEText(html_content, "html", "utf-8")
        message.attach(html_part)

        if attachments:
            for attachment in attachments:
                file_name = attachment.get("filename", "attachment")
                file_content = attachment.get("content", b"")
                part = MIMEApplication(file_content, Name=file_name)
                part["Content-Disposition"] = f'attachment; filename="{file_name}"'
                message.attach(part)

        return message

    def send_email(
        self,
        config_name: str,
        to_emails: list[str] | None = None,
        subject: str = "",
        html_content: str = "",
        attachments: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """发送邮件

        Args:
            config_name: 配置名称
            to_emails: 收件人列表(如果为空则使用配置的默认收件人)
            subject: 邮件主题
            html_content: HTML 内容
            attachments: 附件列表

        Returns:
            dict: 发送结果
        """
        config = self._load_config(config_name)
        if not config:
            return {
                "success": False,
                "message": f"邮件配置不存在或未启用: {config_name}",
            }

        target_emails = to_emails if to_emails else config["to_emails"]
        if not target_emails:
            return {
                "success": False,
                "message": "未指定收件人",
            }

        try:
            message = self._create_message(
                config=config,
                to_emails=target_emails,
                subject=subject,
                html_content=html_content,
                attachments=attachments,
            )

            if config["use_ssl"]:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(config["host"], config["port"], context=context) as server:
                    server.login(config["username"], config["password"])
                    server.sendmail(config["username"], target_emails, message.as_string())
            else:
                with smtplib.SMTP(config["host"], config["port"]) as server:
                    server.starttls()
                    server.login(config["username"], config["password"])
                    server.sendmail(config["username"], target_emails, message.as_string())

            self._logger.info(f"Email sent successfully via {config_name} to {target_emails}")
            return {
                "success": True,
                "message": "邮件发送成功",
                "data": {
                    "config_name": config_name,
                    "to_emails": target_emails,
                },
            }

        except smtplib.SMTPAuthenticationError as error:
            self._logger.error(f"SMTP authentication failed: {error}")
            return {
                "success": False,
                "message": "邮件认证失败,请检查用户名和密码",
                "error": str(error),
            }

        except smtplib.SMTPRecipientsRefused as error:
            self._logger.error(f"SMTP recipients refused: {error}")
            return {
                "success": False,
                "message": "收件人地址被拒绝",
                "error": str(error),
            }

        except smtplib.SMTPException as error:
            self._logger.error(f"SMTP error: {error}")
            return {
                "success": False,
                "message": f"SMTP 错误: {str(error)}",
                "error": str(error),
            }

        except Exception as error:
            self._logger.exception(f"Failed to send email: {error}")
            return {
                "success": False,
                "message": f"邮件发送失败: {str(error)}",
                "error": str(error),
            }

    def send_contact_notification(
        self,
        contact_data: dict[str, Any],
        attachment_urls: list[str] | None = None,
    ) -> dict[str, Any]:
        """发送联系我们通知邮件

        Args:
            contact_data: 联系数据
            attachment_urls: 附件 URL 列表

        Returns:
            dict: 发送结果
        """
        import json
        import urllib.request

        name = contact_data.get("name", "匿名")
        email = contact_data.get("email") or "未填写"
        phone = contact_data.get("phone") or "未填写"
        company = contact_data.get("company") or "未填写"
        contact_type = contact_data.get("type", "other")
        content = contact_data.get("content", "")
        ip_address = contact_data.get("ip_address", "未知")

        ip_location = "未知"
        if ip_address and ip_address != "unknown":
            try:
                url = f"http://ip-api.com/json/{ip_address}?fields=status,country,regionName,city,isp"
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=3) as response:
                    geo_data = json.loads(response.read().decode("utf-8"))
                    if geo_data.get("status") == "success":
                        country = geo_data.get("country", "")
                        region = geo_data.get("regionName", "")
                        city = geo_data.get("city", "")
                        isp = geo_data.get("isp", "")
                        ip_location = f"{country} {region} {city} ({isp})"
            except Exception:
                ip_location = "获取位置失败"

        type_map = {
            "presale": "售前咨询",
            "tech": "技术支持",
            "business": "商务合作",
            "purchase": "企业采购",
            "channel": "渠道代理",
            "other": "其他",
        }
        type_display = type_map.get(contact_type, "其他")

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.8; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 20px; }}
                .content {{ background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; font-size: 14px; }}
                .field {{ margin-bottom: 8px; }}
                .field-label {{ color: #64748b; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>您有一条新的联系我们消息</h1>
                </div>
                <div class="content">
                    <div class="field">【姓名】: {name}</div>
                    <div class="field">【电话】: {phone or "未填写"}</div>
                    <div class="field">【邮箱】: {email or "未填写"}</div>
                    <div class="field">【公司/区域】: {company or "未填写"}</div>
                    <div class="field">【咨询类型】: {type_display}</div>
                    <div class="field">【留言内容】: {content}</div>
                    <div class="field">【IP地址】: {ip_address}</div>
                    <div class="field">【地理位置】: {ip_location}</div>
                    <div class="field">【提交时间】: {contact_data.get("created_at", "未知")}</div>
                    <div class="field">【浏览器UA】: {contact_data.get("user_agent", "未知")[:100]}</div>
                    <div class="field">【提交ID】: {contact_data.get("submission_id", "未知")}</div>
                </div>
            </div>
        </body>
        </html>
        """

        subject = f"[TRAI] 新的联系我们消息 - {type_display} - {name}"

        return self.send_email(
            config_name="contact_notify",
            subject=subject,
            html_content=html_content,
        )

    def clear_cache(self) -> None:
        """清除配置缓存"""
        self._config_cache.clear()
        self._logger.info("Email config cache cleared")


def get_email_service(db_session: Session) -> EmailService:
    """获取邮件服务实例

    Args:
        db_session: 数据库会话

    Returns:
        EmailService: 邮件服务实例
    """
    return EmailService(db_session)


__all__ = [
    "EmailService",
    "get_email_service",
]
