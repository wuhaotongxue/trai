#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: contact.py
# 作者: wuhao
# 日期: 2026_04_26_18:50:00
# 描述: 联系我们公开 API 接口

from __future__ import annotations

import re
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator

from api.deps import CurrentUserOptional
from core.logger import get_logger
from infrastructure.database.database import get_db_session
from infrastructure.services.email_service import EmailService


router = APIRouter()
logger = get_logger()


class ContactFormRequest(BaseModel):
    """联系我们表单请求"""

    name: str = Field(..., min_length=1, max_length=100, description="姓名")
    email: str | None = Field(None, max_length=255, description="邮箱(选填)")
    phone: str | None = Field(None, max_length=50, description="电话(选填)")
    company: str | None = Field(None, max_length=200, description="公司(选填)")
    contact_type: str = Field("other", description="咨询类型")
    content: str = Field(..., min_length=1, max_length=500, description="留言内容(限制50字)")
    attachment_urls: list[str] = Field(default_factory=list, description="附件 URL 列表")

    @field_validator("content")
    @classmethod
    def validate_content_length(cls, value: str) -> str:
        """验证留言内容长度不超过50字"""
        if len(value) > 50:
            raise ValueError("留言内容不能超过50个字")
        return value.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        """验证邮箱格式"""
        if value is None or value.strip() == "":
            return None
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, value.strip()):
            raise ValueError("邮箱格式不正确")
        return value.strip().lower()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        """验证电话格式"""
        if value is None or value.strip() == "":
            return None
        phone_pattern = r"^1[3-9]\d{9}$"
        clean_phone = re.sub(r"[\s\-()（）]", "", value.strip())
        if not re.match(phone_pattern, clean_phone):
            raise ValueError("电话格式不正确,请输入11位手机号")
        return clean_phone

    @field_validator("contact_type", mode="before")
    @classmethod
    def validate_contact_type_func(cls, value: str) -> str:
        """验证咨询类型"""
        valid_types = ["presale", "tech", "business", "purchase", "channel", "other"]
        if value not in valid_types:
            raise ValueError(f"咨询类型必须是以下之一: {', '.join(valid_types)}")
        return value

    @field_validator("attachment_urls")
    @classmethod
    def validate_attachment_urls(cls, value: list[str]) -> list[str]:
        """验证附件 URL 列表"""
        allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip", ".rar"]
        for url in value:
            if not any(url.lower().endswith(ext) for ext in allowed_extensions):
                raise ValueError(f"不支持的文件格式: {url}")
        return value


class ContactFormResponse(BaseModel):
    """联系我们表单响应"""

    code: int = 200
    message: str = "提交成功"
    data: dict[str, Any] | None = None


def send_contact_email(
    email_service: EmailService,
    contact_data: dict[str, Any],
    attachment_urls: list[str],
) -> None:
    """后台发送联系我们通知邮件

    Args:
        email_service: 邮件服务
        contact_data: 联系数据
        attachment_urls: 附件 URL 列表
    """
    try:
        result = email_service.send_contact_notification(
            contact_data=contact_data,
            attachment_urls=attachment_urls,
        )
        if result.get("success"):
            logger.info("Contact notification email sent successfully")
        else:
            logger.error(f"Failed to send contact notification email: {result.get('message')}")
    except Exception as error:
        logger.exception(f"Error sending contact email: {error}")


def send_contact_notification(
    contact_data: dict[str, Any],
    ip_location: str,
) -> None:
    """后台发送企业微信和飞书通知

    Args:
        contact_data: 联系数据
        ip_location: IP 地理位置
    """
    import os

    from infrastructure.notify.factory import NotifyServiceFactory

    name = contact_data.get("name", "匿名")
    phone = contact_data.get("phone") or "未填写"
    email = contact_data.get("email") or "未填写"
    company = contact_data.get("company") or "未填写"
    contact_type = contact_data.get("type", "other")
    content = contact_data.get("content", "")
    submission_id = contact_data.get("submission_id", "未知")

    type_map = {
        "presale": "售前咨询",
        "tech": "技术支持",
        "business": "商务合作",
        "purchase": "企业采购",
        "channel": "渠道代理",
        "other": "其他",
    }
    type_display = type_map.get(contact_type, "其他")

    markdown_content = f"""**新的联系我们消息**

**姓名**: {name}
**电话**: {phone}
**邮箱**: {email}
**公司/区域**: {company}
**咨询类型**: {type_display}
**留言内容**: {content}
**IP地址**: {contact_data.get("ip_address", "未知")}
**地理位置**: {ip_location}
**提交时间**: {contact_data.get("created_at", "未知")}
**提交ID**: {submission_id}"""

    if os.getenv("NOTIFY_WECOM_ENABLED", "false").lower() == "true":
        wecom_webhook = os.getenv("NOTIFY_WECOM_WEBHOOK")
        if wecom_webhook:
            try:
                wecom_service = NotifyServiceFactory.create_wecom(wecom_webhook)
                result = wecom_service.send_template_card(
                    card_type="normal_news",
                    main_title={"title": "📩 新的联系我们消息", "desc": f"来自 {name} 的 {type_display}"},
                    horizontal_content_list=[
                        {"title": "姓名", "desc": name},
                        {"title": "电话", "desc": phone},
                        {"title": "邮箱", "desc": email},
                        {"title": "公司", "desc": company},
                        {"title": "咨询类型", "desc": type_display},
                        {"title": "IP", "desc": contact_data.get("ip_address", "未知")},
                        {"title": "位置", "desc": ip_location},
                        {"title": "时间", "desc": contact_data.get("created_at", "未知")},
                    ],
                    sub_title_text=f"留言内容: {content}",
                    jump_list=[{"title": "查看详情", "action_name": "处理", "action_url": f"https://trai.tuoren.com/admin/contact/messages"}],
                )
                if result.success:
                    logger.info("WeCom notification sent successfully")
                else:
                    logger.error(f"Failed to send WeCom notification: {result.message}")
            except Exception as error:
                logger.exception(f"Error sending WeCom notification: {error}")

    if os.getenv("NOTIFY_FEISHU_ENABLED", "false").lower() == "true":
        feishu_webhook = os.getenv("NOTIFY_FEISHU_WEBHOOK")
        if feishu_webhook:
            try:
                feishu_service = NotifyServiceFactory.create_feishu(feishu_webhook)
                card_content = f"""姓名: {name}
电话: {phone}
邮箱: {email}
公司/区域: {company}
咨询类型: {type_display}
留言内容: {content}
IP地址: {contact_data.get("ip_address", "未知")}
地理位置: {ip_location}
提交时间: {contact_data.get("created_at", "未知")}
提交ID: {submission_id}"""
                result = feishu_service.send_card(
                    title=f"📩 新的联系我们消息 - {name}",
                    content=card_content,
                )
                if result.success:
                    logger.info("Feishu notification sent successfully")
                else:
                    logger.error(f"Failed to send Feishu notification: {result.message}")
            except Exception as error:
                logger.exception(f"Error sending Feishu notification: {error}")


@router.post(
    "/contact/submit",
    response_model=ContactFormResponse,
    summary="提交联系我们表单",
    description="用户提交联系我们表单,会自动发送邮件通知并记录到数据库",
    tags=["公开接口"],
)
async def submit_contact_form(
    request_data: ContactFormRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Annotated[Any, Depends(get_db_session)],
    current_user: CurrentUserOptional = None,
) -> dict[str, Any]:
    """提交联系我们表单

    Args:
        request_data: 表单数据
        background_tasks: 后台任务
        request: 请求对象
        db: 数据库会话
        current_user: 当前用户(可选)

    Returns:
        dict: 响应结果
    """
    email_service = EmailService(db)
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")[:500]

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    ip_location = "未知"
    if client_ip and client_ip != "unknown":
        try:
            import json
            import urllib.request

            url = f"http://ip-api.com/json/{client_ip}?fields=status,country,regionName,city,isp"
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

    contact_data = {
        "name": request_data.name.strip(),
        "email": request_data.email,
        "phone": request_data.phone,
        "company": request_data.company.strip() if request_data.company else None,
        "type": request_data.contact_type,
        "content": request_data.content,
        "created_at": created_at,
        "ip_address": client_ip,
        "user_agent": user_agent,
        "ip_location": ip_location,
    }

    try:
        import uuid
        from sqlalchemy import insert
        from infrastructure.database.models import ContactMessageModel

        submission_id = str(uuid.uuid4())
        contact_data["submission_id"] = submission_id

        stmt = insert(ContactMessageModel).values(
            t_name=request_data.name.strip(),
            t_email=request_data.email,
            t_phone=request_data.phone,
            t_company=request_data.company.strip() if request_data.company else None,
            t_type=request_data.contact_type,
            t_content=request_data.content,
            t_attachment_urls=request_data.attachment_urls,
            t_status="pending",
            t_ip_address=client_ip,
            t_user_agent=user_agent,
            t_submission_id=submission_id,
            t_created_at=datetime.now(),
            t_updated_at=datetime.now(),
        )
        db.execute(stmt)
        db.commit()

        logger.info(f"Contact message saved: name={request_data.name}, type={request_data.contact_type}")

    except Exception as error:
        logger.exception(f"Failed to save contact message: {error}")
        return {
            "code": 500,
            "message": "保存消息失败,请稍后重试",
            "data": None,
        }

    background_tasks.add_task(
        send_contact_email,
        email_service,
        contact_data,
        request_data.attachment_urls,
    )

    background_tasks.add_task(
        send_contact_notification,
        contact_data,
        ip_location,
    )

    return {
        "code": 200,
        "message": "提交成功,我们会尽快联系您",
        "data": {
            "submitted_at": created_at,
        },
    }


__all__ = ["router"]
