#!/usr/bin/env python
# 文件名: session_schemas.py
# 作者: wuhao
# 日期: 2026_05_04_14:30:00
# 描述: 会话管理相关的 Pydantic 模型定义, 统一请求和响应格式

from __future__ import annotations

from enum import Enum
from typing import Annotated, Any

from pydantic import BaseModel, Field


class UnifiedResponse(BaseModel):
    """统一响应格式 (Skills 规范: code/msg/data/req_id/ts)"""

    code: int = Field(description="业务状态码, 200=成功")
    msg: str = Field(description="响应消息")
    data: dict[str, Any] | None = Field(default=None, description="业务数据")
    req_id: str | None = Field(default=None, description="请求追踪ID")
    ts: str | None = Field(default=None, description="时间戳")


class SessionItem(BaseModel):
    """会话项模型"""

    session_id: str = Field(description="会话唯一标识")
    title: str | None = Field(default=None, description="会话标题")
    model: str = Field(description="模型名称")
    message_count: int = Field(default=0, description="消息数量")
    created_at: str | None = Field(default=None, description="创建时间")
    updated_at: str | None = Field(default=None, description="更新时间")


class CreateSessionRequest(BaseModel):
    """创建会话请求"""

    title: Annotated[str | None, Field(default=None, max_length=255, description="会话标题")] = None
    model: Annotated[str, Field(default="gpt-4o", description="模型名称")] = "gpt-4o"


class CreateSessionResponse(BaseModel):
    """创建会话响应"""

    session_id: str = Field(description="会话唯一标识")
    title: str | None = Field(default=None, description="会话标题")
    model: str = Field(description="模型名称")
    message_count: int = Field(default=0, description="消息数量")
    message: str = Field(default="会话创建成功", description="提示信息")


class SessionListResponse(BaseModel):
    """会话列表响应"""

    total: int = Field(description="会话总数")
    sessions: list[SessionItem] = Field(description="会话列表")


class SessionDetailResponse(BaseModel):
    """会话详情响应"""

    session_id: str = Field(description="会话唯一标识")
    title: str | None = Field(default=None, description="会话标题")
    model: str = Field(description="模型名称")
    messages: list[dict[str, Any]] = Field(description="消息列表")
    created_at: str | None = Field(default=None, description="创建时间")
    updated_at: str | None = Field(default=None, description="更新时间")


class SendMessageRequest(BaseModel):
    """发送消息请求"""

    content: Annotated[str, Field(min_length=1, max_length=32000, description="消息内容")]
    role: Annotated[str, Field(default="user", description="消息角色")] = "user"


class SendMessageResponse(BaseModel):
    """发送消息响应"""

    session_id: str = Field(description="会话 ID")
    user_message: dict[str, Any] = Field(description="用户消息")
    assistant_message: dict[str, Any] = Field(description="助手回复")


class RenameSessionRequest(BaseModel):
    """重命名会话请求"""

    title: Annotated[str, Field(min_length=1, max_length=255, description="新标题")]


class ActionResponse(BaseModel):
    """操作响应"""

    message: str = Field(description="提示信息")


class SearchSessionsRequest(BaseModel):
    """搜索会话请求"""

    keyword: Annotated[str, Field(default="", max_length=100, description="搜索关键词(标题/消息内容)")] = ""
    model: Annotated[str | None, Field(default=None, description="模型过滤")] = None
    date_from: Annotated[str | None, Field(default=None, description="开始日期 YYYY-MM-DD")] = None
    date_to: Annotated[str | None, Field(default=None, description="结束日期 YYYY-MM-DD")] = None
    min_messages: Annotated[int | None, Field(default=None, ge=0, description="最小消息数")] = None


class PaginatedMessagesResponse(BaseModel):
    """分页消息响应"""

    total: int = Field(description="总消息数")
    page: int = Field(description="当前页")
    page_size: int = Field(description="每页大小")
    messages: list[dict[str, Any]] = Field(description="消息列表")


class SessionStatsResponse(BaseModel):
    """会话统计响应"""

    total_sessions: int = Field(description="总会话数")
    active_sessions: int = Field(description="活跃会话数")
    total_messages: int = Field(description="总消息数")
    today_sessions: int = Field(description="今日新建会话")
    today_messages: int = Field(description="今日消息数")
    popular_models: list[dict[str, Any]] = Field(description="常用模型统计")


class BatchDeleteRequest(BaseModel):
    """批量删除请求"""

    session_ids: list[str] = Field(description="要删除的会话ID列表")


class EditMessageRequest(BaseModel):
    """编辑消息请求"""

    content: Annotated[str, Field(min_length=1, max_length=32000, description="新内容")]


class ExportFormat(str, Enum):
    """导出格式枚举"""

    JSON = "json"
    MARKDOWN = "markdown"
    TEXT = "text"


class CompressContextRequest(BaseModel):
    """压缩上下文请求"""

    max_tokens: Annotated[int, Field(ge=100, le=32000, default=4000, description="最大token数")] = 4000
    strategy: Annotated[str, Field(default="smart", description="压缩策略: smart/recent/summary")] = "smart"


class TagSessionRequest(BaseModel):
    """标签操作请求"""

    tags: list[str] = Field(description="标签列表")


class UsageStatsResponse(BaseModel):
    """使用量统计响应"""

    total_requests: int = Field(description="总请求数")
    total_tokens: int = Field(description="总Token消耗")
    by_model: dict[str, int] = Field(description="各模型使用次数")
    daily_stats: list[dict[str, Any]] = Field(description="每日统计")


__all__ = [
    "UnifiedResponse",
    "SessionItem",
    "CreateSessionRequest",
    "CreateSessionResponse",
    "SessionListResponse",
    "SessionDetailResponse",
    "SendMessageRequest",
    "SendMessageResponse",
    "RenameSessionRequest",
    "ActionResponse",
    "SearchSessionsRequest",
    "PaginatedMessagesResponse",
    "SessionStatsResponse",
    "BatchDeleteRequest",
    "EditMessageRequest",
    "ExportFormat",
    "CompressContextRequest",
    "TagSessionRequest",
    "UsageStatsResponse",
]
