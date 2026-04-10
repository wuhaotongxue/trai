#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: notify.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: 通知管理接口

from __future__ import annotations

import os
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from api.deps import CurrentUser, require_admin
from infrastructure.notify.base import NotifyLevel, NotifyMessage, NotifyType
from infrastructure.notify.factory import NotifyServiceFactory, NotifyPlatform

router = APIRouter()


class SendNotifyRequest(BaseModel):
    """发送通知请求"""
    platform: Annotated[str, Field(description="平台类型: feishu/wecom/dingtalk")]
    title: Annotated[str, Field(max_length=200, description="通知标题")]
    content: Annotated[str, Field(min_length=1, max_length=10000, description="通知内容")]
    msg_type: Annotated[str, Field(default="text", description="消息类型: text/markdown/card")] = "text"
    level: Annotated[str, Field(default="info", description="通知级别: debug/info/warning/error/critical")] = "info"
    extra: dict[str, Any] = Field(default_factory=dict, description="额外参数")


class SendNotifyResponse(BaseModel):
    """发送通知响应"""
    success: bool = Field(description="是否成功")
    platform: str = Field(description="平台类型")
    message: str = Field(description="提示信息")
    data: dict[str, Any] = Field(default_factory=dict, description="响应数据")


class NotifyTestRequest(BaseModel):
    """测试通知请求"""
    platform: Annotated[str, Field(description="平台类型: feishu/wecom/dingtalk")]


class NotifyConfig(BaseModel):
    """通知配置"""
    platform: str = Field(description="平台类型")
    enabled: bool = Field(description="是否已启用")
    webhook_configured: bool = Field(description="Webhook 是否已配置")


class NotifyConfigListResponse(BaseModel):
    """通知配置列表响应"""
    configs: list[NotifyConfig] = Field(description="配置列表")


def _get_webhook_url(platform: str) -> str | None:
    """获取平台 Webhook URL"""
    env_map = {
        "feishu": "FEISHU_WEBHOOK_URL",
        "wecom": "WECOM_WEBHOOK_URL",
        "dingtalk": "DINGTALK_WEBHOOK_URL",
    }
    env_key = env_map.get(platform.lower())
    if not env_key:
        return None
    return os.getenv(env_key)


def _get_secret(platform: str) -> str | None:
    """获取平台密钥"""
    env_map = {
        "feishu": "FEISHU_SECRET",
        "wecom": "WECOM_AGENT_ID",
        "dingtalk": "DINGTALK_SECRET",
    }
    env_key = env_map.get(platform.lower())
    if not env_key:
        return None
    return os.getenv(env_key)


@router.post("/notify/send", response_model=SendNotifyResponse, tags=["通知"])
async def send_notify(
    request: SendNotifyRequest,
    current_user: Annotated[dict, Depends(require_admin)],
) -> SendNotifyResponse:
    """发送通知（仅管理员）

    Args:
        request: 通知请求
        current_user: 当前登录管理员

    Returns:
        SendNotifyResponse: 发送结果

    Raises:
        HTTPException: 配置错误或发送失败
    """
    webhook_url = _get_webhook_url(request.platform)

    if not webhook_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": f"平台 {request.platform} 未配置 Webhook URL"},
        )

    try:
        # 获取密钥
        secret = _get_secret(request.platform)

        # 创建服务
        service = NotifyServiceFactory.create(
            platform=request.platform,
            webhook_url=webhook_url,
            secret=secret,
        )

        # 构建消息
        msg_type = NotifyType(request.msg_type)
        level = NotifyLevel(request.level)

        message = NotifyMessage(
            title=request.title,
            content=request.content,
            level=level,
            msg_type=msg_type,
            extra=request.extra,
        )

        # 发送
        result = service.send(message)

        return SendNotifyResponse(
            success=result.success,
            platform=request.platform,
            message=result.message,
            data=result.data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": str(e)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": f"发送通知失败: {str(e)}"},
        )


@router.post("/notify/test", response_model=SendNotifyResponse, tags=["通知"])
async def test_notify(
    request: NotifyTestRequest,
    current_user: Annotated[dict, Depends(require_admin)],
) -> SendNotifyResponse:
    """测试通知发送（仅管理员）

    Args:
        request: 测试请求
        current_user: 当前登录管理员

    Returns:
        SendNotifyResponse: 发送结果
    """
    webhook_url = _get_webhook_url(request.platform)

    if not webhook_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": f"平台 {request.platform} 未配置 Webhook URL"},
        )

    try:
        service = NotifyServiceFactory.create(
            platform=request.platform,
            webhook_url=webhook_url,
            secret=_get_secret(request.platform),
        )

        message = NotifyMessage(
            title="TRAI 通知测试",
            content=f"这是一条来自 TRAI 系统的测试消息\n发送时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            level=NotifyLevel.INFO,
            msg_type=NotifyType.TEXT,
        )

        result = service.send(message)

        return SendNotifyResponse(
            success=result.success,
            platform=request.platform,
            message="测试消息发送成功" if result.success else result.message,
            data=result.data,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": f"测试发送失败: {str(e)}"},
        )


@router.get("/notify/configs", response_model=NotifyConfigListResponse, tags=["通知"])
async def list_notify_configs(
    current_user: Annotated[dict, Depends(require_admin)],
) -> NotifyConfigListResponse:
    """获取通知配置列表（仅管理员）

    Args:
        current_user: 当前登录管理员

    Returns:
        NotifyConfigListResponse: 配置列表
    """
    platforms = [
        {"id": "feishu", "name": "飞书"},
        {"id": "wecom", "name": "企业微信"},
        {"id": "dingtalk", "name": "钉钉"},
    ]

    configs = []
    for p in platforms:
        webhook = _get_webhook_url(p["id"])
        configs.append(NotifyConfig(
            platform=p["name"],
            enabled=bool(webhook),
            webhook_configured=bool(webhook),
        ))

    return NotifyConfigListResponse(configs=configs)


__all__ = ["router"]
