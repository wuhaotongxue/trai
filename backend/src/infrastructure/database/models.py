#!/usr/bin/env python
# 文件名: models.py
# 作者: wuhao
# 日期: 2026_04_10_09:21:00
# 描述: 数据模型

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, BigInteger, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base
from infrastructure.database.department_model import DepartmentModel, UserDepartmentMappingModel
from infrastructure.database.user_model import UserModel


class ChatSessionModel(Base):
    """AI 对话会话模型"""

    __tablename__ = "t_chat_sessions"
    __comment__ = "AI 对话会话表,存储会话元数据和消息历史"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_session_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """会话唯一标识 UUID"""
    t_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    """用户 ID"""
    t_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    """会话标题"""
    t_model: Mapped[str] = mapped_column(String(64), nullable=False)
    """使用的 AI 模型名称"""
    t_messages: Mapped[dict[str, Any]] = mapped_column(JSON, default=list)
    """消息历史 JSON 数组"""
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    """扩展数据字段"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""
    t_deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    """软删除时间,为空表示未删除"""
    t_deleted_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """删除操作人 user_id"""


class MessageModel(Base):
    """AI 对话消息模型"""

    __tablename__ = "t_messages"
    __comment__ = "AI 对话消息表,存储单条消息内容"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_session_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """关联的会话 session_id"""
    t_role: Mapped[str] = mapped_column(String(32), nullable=False)
    """消息角色:system/user/assistant"""
    t_content: Mapped[str] = mapped_column(Text, nullable=False)
    """消息内容"""
    t_msg_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    """消息扩展元数据"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""


class QuotaPlanModel(Base):
    """配额套餐模型"""

    __tablename__ = "t_quota_plans"
    __comment__ = "配额套餐表,定义各角色的月度配额上限"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_plan_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    """套餐名称"""
    t_user_role: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    """用户角色:admin/vip/normal/guest"""
    t_image_generation_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """图片生成配额(0 表示无限制)"""
    t_audio_synthesis_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音合成配额(0 表示无限制)"""
    t_transcription_minutes_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音转录配额(分钟)"""
    t_meeting_summary_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """会议摘要配额"""
    t_ai_translation_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 翻译配额"""
    t_ai_summarization_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 摘要配额"""
    t_agent_tool_call_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """Agent 工具调用配额(0 表示无限制)"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""


class UserQuotaUsageModel(Base):
    """用户配额使用模型"""

    __tablename__ = "t_user_quota_usage"
    __comment__ = "用户配额使用表,按自然月记录各类型配额消耗"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    t_billing_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    """账单月份 YYYY-MM"""
    t_image_generation_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """图片生成已用次数"""
    t_audio_synthesis_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音合成已用次数"""
    t_transcription_minutes_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """语音转录已用分钟数"""
    t_meeting_summary_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """会议摘要已用次数"""
    t_ai_translation_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 翻译已用次数"""
    t_ai_summarization_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """AI 摘要已用次数"""
    t_agent_tool_call_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    """Agent 工具调用已用次数"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""


class QuotaTransactionLogModel(Base):
    """配额变动流水模型"""

    __tablename__ = "t_quota_transaction_log"
    __comment__ = "配额变动流水表,记录每次配额增减及原因"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    t_billing_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True)
    """账单月份 YYYY-MM"""
    t_transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    """交易类型:deduct/reset/grant/purchase"""
    t_quota_type: Mapped[str] = mapped_column(String(50), nullable=False)
    """配额类型"""
    t_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    """变动数量(正数为增加,负数为扣减)"""
    t_balance_before: Mapped[int] = mapped_column(Integer, nullable=False)
    """变动前余额"""
    t_balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    """变动后余额"""
    t_tool_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    """关联工具 ID"""
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """关联会话 session_id"""
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """链路追踪 ID"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""


class ImageGenerationModel(Base):
    """AI 图片生成模型"""

    __tablename__ = "t_image_generations"
    __comment__ = "AI 图片生成任务表,存储图片生成请求和结果"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """任务唯一标识 UUID"""
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    t_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    """图片生成提示词"""
    t_negative_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    """反向提示词"""
    t_style: Mapped[str] = mapped_column(String(32), default="auto", nullable=False)
    """图片风格"""
    t_size: Mapped[str] = mapped_column(String(16), default="1024x1024", nullable=False)
    """图片尺寸"""
    t_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    """任务状态:pending/processing/completed/failed"""
    t_result_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    """生成结果 URL"""
    t_error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    """错误信息"""
    t_model: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """使用的模型"""
    t_width: Mapped[int] = mapped_column(Integer, default=1024, nullable=False)
    """图片宽度"""
    t_height: Mapped[int] = mapped_column(Integer, default=1024, nullable=False)
    """图片高度"""
    t_steps: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    """采样步数"""
    t_seed: Mapped[int] = mapped_column(Integer, default=-1, nullable=False)
    """随机种子"""
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """关联会话 session_id"""
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """链路追踪 ID"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""


class UploadTaskModel(Base):
    """文件上传任务模型"""

    __tablename__ = "t_upload_tasks"
    __comment__ = "文件上传任务表,存储上传请求和结果"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """任务唯一标识 UUID"""
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    """用户 ID"""
    t_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    """文件名"""
    t_file_type: Mapped[str] = mapped_column(String(32), nullable=False)
    """文件类型:image/video/audio/document"""
    t_file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    """文件大小(字节)"""
    t_content_type: Mapped[str] = mapped_column(String(64), nullable=False)
    """Content-Type 头部"""
    t_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    """任务状态:pending/uploading/completed/failed"""
    t_file_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    """文件访问 URL"""
    t_error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    """错误信息"""
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """关联会话 session_id"""
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """链路追踪 ID"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """最后修改人 user_id"""


class ClientReleaseModel(Base):
    """客户端版本发布模型"""

    __tablename__ = "t_client_releases"
    __comment__ = "客户端版本发布表,记录 Electron 客户端的各个版本信息及 S3 路径"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_version: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    """版本号,例如 0.1.0"""
    t_release_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    """更新日志"""
    t_latest_yml_key: Mapped[str] = mapped_column(String(255), nullable=False)
    """S3 中 latest.yml 文件的 Key"""
    t_installer_exe_key: Mapped[str] = mapped_column(String(255), nullable=False)
    """S3 中安装包 .exe 文件的 Key"""
    t_is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    """是否激活(可用于下线有 bug 的版本)"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """发布人 user_id"""


class AuditLogModel(Base):
    """审计日志模型"""

    __tablename__ = "t_audit_logs"
    __comment__ = "审计日志表,存储系统操作审计记录"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_log_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """日志唯一标识 UUID"""
    t_timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True)
    """操作时间"""
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    """链路追踪 ID"""
    t_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    """操作用户 ID"""
    t_username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    """操作用户名"""
    t_role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    """操作者角色"""
    t_action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    """审计动作类型"""
    t_level: Mapped[str] = mapped_column(String(20), nullable=False)
    """审计级别:info/warning/error/critical"""
    t_method: Mapped[str] = mapped_column(String(10), nullable=False)
    """HTTP 方法"""
    t_path: Mapped[str] = mapped_column(String(255), nullable=False)
    """请求路径"""
    t_status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    """HTTP 状态码"""
    t_duration_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    """响应耗时(毫秒)"""
    t_client_ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    """客户端 IP"""
    t_user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    """浏览器 User-Agent"""
    t_request_body: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    """脱敏后的请求体"""
    t_response_body: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    """脱敏后的响应体"""
    t_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    """异常堆栈/错误信息"""
    t_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    """扩展元数据"""


class ContactMessageModel(Base):
    """联系我们消息模型"""

    __tablename__ = "t_contact_messages"
    __comment__ = "联系我们消息表,存储用户提交的咨询信息"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_name: Mapped[str] = mapped_column(String(100), nullable=False)
    """提交人姓名"""
    t_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    """提交人邮箱(选填)"""
    t_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    """提交人电话(选填)"""
    t_company: Mapped[str | None] = mapped_column(String(200), nullable=True)
    """公司名称(选填)"""
    t_type: Mapped[str] = mapped_column(String(50), nullable=False)
    """咨询类型:presale/tech/business/purchase/channel/other"""
    t_content: Mapped[str] = mapped_column(String(500), nullable=False)
    """留言内容(限制50字)"""
    t_attachment_urls: Mapped[list[str]] = mapped_column(JSON, default=list)
    """附件 URL 列表"""
    t_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    """处理状态:pending/processed/replied"""
    t_reply_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    """回复备注"""
    t_ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    """提交者 IP 地址"""
    t_user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    """浏览器 User-Agent"""
    t_submission_id: Mapped[str | None] = mapped_column(String(36), nullable=True, unique=True)
    """提交唯一标识 UUID"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """更新时间"""


class EmailConfigModel(Base):
    """邮件配置模型"""

    __tablename__ = "t_email_configs"
    __comment__ = "邮件配置表,存储不同类型邮件的发送配置"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_config_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    """配置名称:contact_notify/system_notify/alert"""
    t_host: Mapped[str] = mapped_column(String(255), nullable=False)
    """SMTP 服务器地址"""
    t_port: Mapped[int] = mapped_column(Integer, nullable=False)
    """SMTP 端口"""
    t_use_ssl: Mapped[bool] = mapped_column(default=True, nullable=False)
    """是否使用 SSL"""
    t_username: Mapped[str] = mapped_column(String(255), nullable=False)
    """邮箱用户名"""
    t_password: Mapped[str] = mapped_column(String(255), nullable=False)
    """邮箱密码/授权码(加密存储)"""
    t_from_name: Mapped[str] = mapped_column(String(100), nullable=False)
    """发件人显示名称"""
    t_to_emails: Mapped[list[str]] = mapped_column(JSON, default=list)
    """默认收件人列表"""
    t_is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    """是否启用"""
    t_remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    """备注说明"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """更新人 user_id"""


class AgentRoleModel(Base):
    """AI 角色模型"""

    __tablename__ = "t_agent_roles"
    __comment__ = "AI 角色表,存储 AI 角色名称和发布通知时的专属评论"

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    """自增主键 ID"""
    t_role_name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """角色名称,如:地理专家/小甜心/御姐"""
    t_role_comment: Mapped[str] = mapped_column(Text, nullable=False)
    """角色专属评论,发布通知时显示"""
    t_role_keyword: Mapped[str | None] = mapped_column(String(255), nullable=True)
    """触发关键词,逗号分隔,如:地理,专家,经纬度"""
    t_style_type: Mapped[str] = mapped_column(String(32), default="default")
    """风格类型:甜美可爱/御姐型/软萌撒娇/知性温柔/活泼开朗"""
    t_priority: Mapped[int] = mapped_column(Integer, default=100)
    """优先级,数字越小越优先"""
    t_is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    """是否启用"""
    t_remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    """备注说明"""
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """创建人 user_id"""
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """更新时间"""
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    """更新人 user_id"""


__all__ = [
    "Base",
    "ChatSessionModel",
    "MessageModel",
    "UserModel",
    "QuotaPlanModel",
    "UserQuotaUsageModel",
    "QuotaTransactionLogModel",
    "ImageGenerationModel",
    "UploadTaskModel",
    "ClientReleaseModel",
    "AuditLogModel",
    "DepartmentModel",
    "UserDepartmentMappingModel",
    "ContactMessageModel",
    "EmailConfigModel",
    "AgentRoleModel",
]
