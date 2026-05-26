#!/usr/bin/env python
# 文件名: contact.py
# 作者: wuhao
# 日期: 2026_05_26_20:42:13
# 描述: 联系我们公开 API 接口

from __future__ import annotations

import re
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel, Field, field_validator

from api.deps import CurrentUserOptional
from core.logger import get_logger
from infrastructure.services.email_service import EmailService

router = APIRouter()
logger = get_logger()


class ContactFormRequest(BaseModel):
    """联系我们表单请求模型"""

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
    """联系我们表单响应模型"""

    code: int = 200
    message: str = "提交成功"
    data: dict[str, Any] | None = None


class ContactUtils:
    """联系我们辅助工具类"""

    @staticmethod
    def send_contact_email(
        email_service: EmailService,
        contact_data: dict[str, Any],
        attachment_urls: list[str],
    ) -> None:
        """
        后台异步发送联系我们通知邮件

        参数:
            email_service (EmailService): 邮件服务实例
            contact_data (dict): 联系人信息字典
            attachment_urls (list): 附件链接列表
        返回值:
            None
        """
        try:
            email_service.send_contact_form(contact_data, attachment_urls)
            logger.info(f"联系通知邮件已发送: {contact_data.get('email')}")
        except Exception as e:
            logger.error(f"发送联系通知邮件失败: {e}")


class ContactRouter:
    """联系我们 API 路由处理器"""

    @staticmethod
    @router.post(
        "/contact/submit",
        response_model=ContactFormResponse,
        summary="提交联系表单",
        description="接收用户咨询信息并触发后台邮件通知",
    )
    async def submit_contact_form(
        req: ContactFormRequest,
        background_tasks: BackgroundTasks,
        email_service: EmailService = Depends(EmailService),
        current_user: CurrentUserOptional = None,
    ) -> ContactFormResponse:
        """
        处理联系表单提交

        参数:
            req (ContactFormRequest): 表单数据
            background_tasks (BackgroundTasks): 后台任务管理器
            email_service (EmailService): 邮件服务
            current_user (CurrentUserOptional): 可选的当前用户
        返回值:
            ContactFormResponse: 提交结果
        """
        contact_data = req.model_dump()
        if current_user:
            contact_data["user_id"] = current_user.id
            contact_data["username"] = current_user.username

        # 异步发送邮件通知
        background_tasks.add_task(ContactUtils.send_contact_email, email_service, contact_data, req.attachment_urls)

        return ContactFormResponse()


__all__ = ["ContactRouter", "router"]
