#!/usr/bin/env python
# 文件名: models.py
# 作者: wuhao
# 日期: 2026_04_10_09:21:00
# 描述: 数据模型

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base
from infrastructure.database.department_model import DepartmentModel, UserDepartmentMappingModel
from infrastructure.database.user_model import UserModel


class ChatSessionModel(Base):
    """AI 对话会话模型"""

    __tablename__ = "t_chat_sessions"
    __table_args__ = {"comment": "AI 对话会话表,存储会话元数据和消息历史"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_session_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="会话唯一标识 UUID")
    t_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, comment="用户 ID")
    t_username: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="用户姓名/昵称")
    t_title: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="会话标题")
    t_model: Mapped[str] = mapped_column(String(64), nullable=False, comment="使用的 AI 模型名称")
    t_messages: Mapped[dict[str, Any]] = mapped_column(JSON, default=list, comment="消息历史 JSON 数组")
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="扩展数据字段")
    t_client_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="客户端 IP 地址")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")
    t_created_by_name: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="创建人姓名")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="最后更新时间")
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="最后修改人 user_id")
    t_deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="软删除时间,为空表示未删除")
    t_deleted_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="删除操作人 user_id")
    t_deleted_by_name: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="删除人姓名")
    t_deleted_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="删除时的客户端 IP 地址")


class MessageModel(Base):
    """AI 对话消息模型"""

    __tablename__ = "t_messages"
    __table_args__ = {"comment": "AI 对话消息表,存储单条消息内容"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_session_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="关联的会话 session_id")
    t_role: Mapped[str] = mapped_column(String(32), nullable=False, comment="消息角色:system/user/assistant")
    t_content: Mapped[str] = mapped_column(Text, nullable=False, comment="消息内容")
    t_image_keys: Mapped[list[str]] = mapped_column(JSON, default=list, comment="关联的图片 S3 对象键列表")
    t_msg_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="消息扩展元数据")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")
    t_client_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="客户端 IP 地址")


class QuotaPlanModel(Base):
    """配额套餐模型"""

    __tablename__ = "t_quota_plans"
    __table_args__ = {"comment": "配额套餐表,定义各角色的月度配额上限"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_plan_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="套餐名称")
    t_user_role: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True, comment="用户角色:admin/vip/normal/guest")
    t_image_generation_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="图片生成配额(0 表示无限制)")
    t_audio_synthesis_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="语音合成配额(0 表示无限制)")
    t_transcription_minutes_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="语音转录配额(分钟)")
    t_meeting_summary_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="会议摘要配额")
    t_ai_translation_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="AI 翻译配额")
    t_ai_summarization_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="AI 摘要配额")
    t_agent_tool_call_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="Agent 工具调用配额(0 表示无限制)")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="最后更新时间")
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="最后修改人 user_id")


class UserQuotaUsageModel(Base):
    """用户配额使用模型"""

    __tablename__ = "t_user_quota_usage"
    __table_args__ = {"comment": "用户配额使用表,按自然月记录各类型配额消耗"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="用户 ID")
    t_billing_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True, comment="账单月份 YYYY-MM")
    t_image_generation_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="图片生成已用次数")
    t_audio_synthesis_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="语音合成已用次数")
    t_transcription_minutes_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="语音转录已用分钟数")
    t_meeting_summary_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="会议摘要已用次数")
    t_ai_translation_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="AI 翻译已用次数")
    t_ai_summarization_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="AI 摘要已用次数")
    t_agent_tool_call_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="Agent 工具调用已用次数")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="最后更新时间")
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="最后修改人 user_id")


class QuotaTransactionLogModel(Base):
    """配额变动流水模型"""

    __tablename__ = "t_quota_transaction_log"
    __table_args__ = {"comment": "配额变动流水表,记录每次配额增减及原因"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="用户 ID")
    t_billing_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True, comment="账单月份 YYYY-MM")
    t_transaction_type: Mapped[str] = mapped_column(String(20), nullable=False, comment="交易类型:deduct/reset/grant/purchase")
    t_quota_type: Mapped[str] = mapped_column(String(50), nullable=False, comment="配额类型")
    t_delta: Mapped[int] = mapped_column(Integer, nullable=False, comment="变动数量(正数为增加,负数为扣减)")
    t_balance_before: Mapped[int] = mapped_column(Integer, nullable=False, comment="变动前余额")
    t_balance_after: Mapped[int] = mapped_column(Integer, nullable=False, comment="变动后余额")
    t_tool_id: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="关联工具 ID")
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="关联会话 session_id")
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="链路追踪 ID")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")


class ImageGenerationModel(Base):
    """AI 图片生成模型"""

    __tablename__ = "t_image_generations"
    __table_args__ = {"comment": "AI 图片生成任务表,存储图片生成请求和结果"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="任务唯一标识 UUID")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="用户 ID")
    t_prompt: Mapped[str] = mapped_column(Text, nullable=False, comment="图片生成提示词")
    t_negative_prompt: Mapped[str | None] = mapped_column(Text, nullable=True, comment="反向提示词")
    t_style: Mapped[str] = mapped_column(String(32), default="auto", nullable=False, comment="图片风格")
    t_size: Mapped[str] = mapped_column(String(16), default="1024x1024", nullable=False, comment="图片尺寸")
    t_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True, comment="任务状态:pending/processing/completed/failed")
    t_result_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="生成结果 URL")
    t_error_message: Mapped[str | None] = mapped_column(Text, nullable=True, comment="错误信息")
    t_model: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="使用的模型")
    t_width: Mapped[int] = mapped_column(Integer, default=1024, nullable=False, comment="图片宽度")
    t_height: Mapped[int] = mapped_column(Integer, default=1024, nullable=False, comment="图片高度")
    t_steps: Mapped[int] = mapped_column(Integer, default=30, nullable=False, comment="采样步数")
    t_seed: Mapped[int] = mapped_column(Integer, default=-1, nullable=False, comment="随机种子")
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="关联会话 session_id")
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="链路追踪 ID")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="最后更新时间")
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="最后修改人 user_id")


class UploadTaskModel(Base):
    """文件上传任务模型"""

    __tablename__ = "t_upload_tasks"
    __table_args__ = {"comment": "文件上传任务表,存储上传请求和结果"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="任务唯一标识 UUID")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="用户 ID")
    t_file_name: Mapped[str] = mapped_column(String(255), nullable=False, comment="文件名")
    t_file_type: Mapped[str] = mapped_column(String(32), nullable=False, comment="文件类型:image/video/audio/document")
    t_file_size: Mapped[int] = mapped_column(Integer, nullable=False, comment="文件大小(字节)")
    t_content_type: Mapped[str] = mapped_column(String(64), nullable=False, comment="Content-Type 头部")
    t_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True, comment="任务状态:pending/uploading/completed/failed")
    t_file_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="文件访问 URL")
    t_error_message: Mapped[str | None] = mapped_column(Text, nullable=True, comment="错误信息")
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="关联会话 session_id")
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="链路追踪 ID")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="最后更新时间")
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="最后修改人 user_id")


class ClientReleaseModel(Base):
    """客户端版本发布模型"""

    __tablename__ = "t_client_releases"
    __table_args__ = {"comment": "客户端版本发布表,记录 Electron 客户端的各个版本信息及 S3 路径"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_version: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True, comment="版本号,例如 0.1.0")
    t_release_notes: Mapped[str | None] = mapped_column(Text, nullable=True, comment="更新日志")
    t_latest_yml_key: Mapped[str] = mapped_column(String(255), nullable=False, comment="S3 中 latest.yml 文件的 Key")
    t_installer_exe_key: Mapped[str] = mapped_column(String(255), nullable=False, comment="S3 中安装包 .exe 文件的 Key")
    t_is_active: Mapped[bool] = mapped_column(default=True, nullable=False, comment="是否激活(可用于下线有 bug 的版本)")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="发布人 user_id")


class AuditLogModel(Base):
    """审计日志模型"""

    __tablename__ = "t_audit_logs"
    __table_args__ = {"comment": "审计日志表,存储系统操作审计记录"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_log_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="日志唯一标识 UUID")
    t_timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True, comment="操作时间")
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, comment="链路追踪 ID")
    t_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, comment="操作用户 ID")
    t_username: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="操作用户名")
    t_role: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="操作者角色")
    t_action: Mapped[str] = mapped_column(String(50), nullable=False, index=True, comment="审计动作类型")
    t_level: Mapped[str] = mapped_column(String(20), nullable=False, comment="审计级别:info/warning/error/critical")
    t_method: Mapped[str] = mapped_column(String(10), nullable=False, comment="HTTP 方法")
    t_path: Mapped[str] = mapped_column(String(255), nullable=False, comment="请求路径")
    t_status_code: Mapped[int] = mapped_column(Integer, nullable=False, comment="HTTP 状态码")
    t_duration_ms: Mapped[int] = mapped_column(Integer, nullable=False, comment="响应耗时(毫秒)")
    t_client_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="客户端 IP")
    t_user_agent: Mapped[str | None] = mapped_column(Text, nullable=True, comment="浏览器 User-Agent")
    t_request_body: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True, comment="脱敏后的请求体")
    t_response_body: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True, comment="脱敏后的响应体")
    t_error: Mapped[str | None] = mapped_column(Text, nullable=True, comment="异常堆栈/错误信息")
    t_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="扩展元数据")


class ContactMessageModel(Base):
    """联系我们消息模型"""

    __tablename__ = "t_contact_messages"
    __table_args__ = {"comment": "联系我们消息表,存储用户提交的咨询信息"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="提交人姓名")
    t_email: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="提交人邮箱(选填)")
    t_phone: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="提交人电话(选填)")
    t_company: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="公司名称(选填)")
    t_type: Mapped[str] = mapped_column(String(50), nullable=False, comment="咨询类型:presale/tech/business/purchase/channel/other")
    t_content: Mapped[str] = mapped_column(String(500), nullable=False, comment="留言内容(限制50字)")
    t_attachment_urls: Mapped[list[str]] = mapped_column(JSON, default=list, comment="附件 URL 列表")
    t_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True, comment="处理状态:pending/processed/replied")
    t_reply_note: Mapped[str | None] = mapped_column(Text, nullable=True, comment="回复备注")
    t_ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="提交者 IP 地址")
    t_user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="浏览器 User-Agent")
    t_submission_id: Mapped[str | None] = mapped_column(String(36), nullable=True, unique=True, comment="提交唯一标识 UUID")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class EmailConfigModel(Base):
    """邮件配置模型"""

    __tablename__ = "t_email_configs"
    __table_args__ = {"comment": "邮件配置表,存储不同类型邮件的发送配置"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_config_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="配置名称:contact_notify/system_notify/alert")
    t_host: Mapped[str] = mapped_column(String(255), nullable=False, comment="SMTP 服务器地址")
    t_port: Mapped[int] = mapped_column(Integer, nullable=False, comment="SMTP 端口")
    t_use_ssl: Mapped[bool] = mapped_column(default=True, nullable=False, comment="是否使用 SSL")
    t_username: Mapped[str] = mapped_column(String(255), nullable=False, comment="邮箱用户名")
    t_password: Mapped[str] = mapped_column(String(255), nullable=False, comment="邮箱密码/授权码(加密存储)")
    t_from_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="发件人显示名称")
    t_to_emails: Mapped[list[str]] = mapped_column(JSON, default=list, comment="默认收件人列表")
    t_is_active: Mapped[bool] = mapped_column(default=True, nullable=False, comment="是否启用")
    t_remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注说明")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="更新人 user_id")


class AgentRoleModel(Base):
    """AI 角色模型"""

    __tablename__ = "t_agent_roles"
    __table_args__ = {"comment": "AI 角色表,存储 AI 角色名称和发布通知时的专属评论"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_role_name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="角色名称,如:地理专家/小甜心/御姐")
    t_role_comment: Mapped[str] = mapped_column(Text, nullable=False, comment="角色专属评论,发布通知时显示")
    t_role_keyword: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="触发关键词,逗号分隔,如:地理,专家,经纬度")
    t_style_type: Mapped[str] = mapped_column(String(32), default="default", comment="风格类型:甜美可爱/御姐型/软萌撒娇/知性温柔/活泼开朗")
    t_priority: Mapped[int] = mapped_column(Integer, default=100, comment="优先级,数字越小越优先")
    t_is_active: Mapped[bool] = mapped_column(default=True, nullable=False, comment="是否启用")
    t_remark: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注说明")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="更新人 user_id")


class ChatLogModel(Base):
    """AI 对话日志模型"""

    __tablename__ = "t_chat_logs"
    __table_args__ = {"comment": "AI 对话日志表,存储会话相关的日志记录"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_log_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="日志唯一标识 UUID")
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, comment="关联的会话 session_id")
    t_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, comment="用户 ID")
    t_username: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="用户姓名/昵称")
    t_level: Mapped[str] = mapped_column(String(20), nullable=False, index=True, comment="日志级别:debug/info/warning/error/critical")
    t_module: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="日志来源模块")
    t_message: Mapped[str] = mapped_column(Text, nullable=False, comment="日志消息内容")
    t_stack_trace: Mapped[str | None] = mapped_column(Text, nullable=True, comment="错误堆栈信息")
    t_client_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="客户端 IP 地址")
    t_request_path: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="请求路径")
    t_method: Mapped[str | None] = mapped_column(String(10), nullable=True, comment="HTTP 方法")
    t_status_code: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="HTTP 状态码")
    t_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="响应耗时(毫秒)")
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="扩展数据字段")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True, comment="日志记录时间")


class ImageRecordModel(Base):
    """AI 图片记录模型

    统一存储文生图、图生图、图片编辑三种类型任务的完整信息，
    支持追溯：请求人 IP、登录用户/游客、操作人、任务参数、结果 URL。
    """

    __tablename__ = "t_image_records"
    __table_args__ = {
        "comment": "AI 图片记录表，统一存储文生图/图生图/图片编辑任务的完整信息。支持追溯：请求 IP、登录用户/游客、操作人、任务参数、结果 URL、通知状态。"
    }

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="任务唯一标识 UUID")
    t_record_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True, comment="记录类型: text_to_image / image_to_image / image_edit")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="用户 ID（游客为空字符串）")
    t_username: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="用户名/昵称")
    t_client_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True, comment="客户端 IP 地址")
    t_request_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="请求来源 IP（可能与 client_ip 不同）")
    t_user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="浏览器 User-Agent")
    t_is_guest: Mapped[bool] = mapped_column(default=False, nullable=False, comment="是否为游客")
    t_tenant_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, comment="租户 ID")
    t_prompt: Mapped[str] = mapped_column(Text, nullable=False, comment="图片生成/编辑提示词")
    t_source_image_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="源图片 URL（图生图/图片编辑）")
    t_source_image_url_2: Mapped[str | None] = mapped_column(Text, nullable=True, comment="第二张源图片 URL（双图联动编辑）")
    t_source_image_object_key: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="源图片 S3 对象键")
    t_source_image_object_key_2: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="第二张源图片 S3 对象键（双图联动编辑）")
    t_result_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="结果图片 S3 URL")
    t_result_base64: Mapped[str | None] = mapped_column(Text, nullable=True, comment="结果图片 base64（临时存储，存入 S3 后清空）")
    t_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True, comment="任务状态: pending / processing / completed / failed")
    t_error_message: Mapped[str | None] = mapped_column(Text, nullable=True, comment="错误信息")
    t_model: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="使用的模型")
    t_width: Mapped[int] = mapped_column(Integer, default=1024, nullable=False, comment="图片宽度")
    t_height: Mapped[int] = mapped_column(Integer, default=1024, nullable=False, comment="图片高度")
    t_steps: Mapped[int] = mapped_column(Integer, default=25, nullable=False, comment="采样步数")
    t_seed: Mapped[int] = mapped_column(Integer, default=-1, nullable=False, comment="随机种子，-1 表示随机")
    t_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="关联会话 session_id")
    t_trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, comment="链路追踪 ID")
    t_feishu_notified: Mapped[bool] = mapped_column(default=False, nullable=False, comment="是否已发送飞书通知")
    t_notify_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, comment="通知状态: pending / success / failed")
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="扩展数据字段（JSON）")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="最后更新时间")
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="最后修改人 user_id")
    t_completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="任务完成时间")
    t_deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="软删除时间，为空表示未删除")
    t_deleted_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="删除操作人 user_id")
    t_deleted_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="删除时的客户端 IP 地址")


class MusicRecordModel(Base):
    """AI 音乐记录模型"""

    __tablename__ = "t_music_records"
    __table_args__ = {"comment": "AI 音乐记录表, 存储音乐生成任务、结果地址、参数与状态信息."}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="音乐任务唯一标识")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="创建任务的用户 ID")
    t_username: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="创建任务的用户名")
    t_client_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True, comment="请求来源 IP")
    t_user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="请求来源 User-Agent")
    t_tenant_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, comment="所属租户 ID")
    t_prompt: Mapped[str] = mapped_column(Text, nullable=False, comment="音乐生成提示词")
    t_status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False, index=True, comment="任务状态, 如 queued processing completed failed")
    t_progress_message: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="任务当前进度描述")
    t_result_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="结果文件访问地址")
    t_public_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="公共域名访问地址")
    t_object_key: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="S3 对象键")
    t_file_path: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="本地输出文件路径")
    t_error_message: Mapped[str | None] = mapped_column(Text, nullable=True, comment="任务失败时的错误信息")
    t_model: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="执行生成的模型名称")
    t_duration_seconds: Mapped[float] = mapped_column(Float, default=30.0, nullable=False, comment="目标音频时长, 单位秒")
    t_steps: Mapped[int] = mapped_column(Integer, default=27, nullable=False, comment="推理步数")
    t_guidance_scale: Mapped[float] = mapped_column(Float, default=7.0, nullable=False, comment="引导强度参数")
    t_notify_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, comment="通知发送状态")
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="扩展元数据")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True, comment="创建时间")


class VideoDownloadModel(Base):
    """B站视频下载记录模型"""

    __tablename__ = "t_video_downloads"
    __table_args__ = {"comment": "B站视频下载记录表, 存储视频标题、来源 URL、S3 地址及下载状态."}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="下载任务唯一标识")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="执行下载的用户 ID")
    t_username: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="执行下载的用户名")
    t_title: Mapped[str] = mapped_column(String(255), nullable=False, comment="视频标题")
    t_source_url: Mapped[str] = mapped_column(Text, nullable=False, comment="原始视频链接 (Bilibili 等)")
    t_s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="S3 存储键名")
    t_s3_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="S3 预签名下载 URL")
    t_file_size: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="文件大小(字节)")
    t_status: Mapped[str] = mapped_column(String(32), default="completed", nullable=False, comment="下载状态: completed / failed")
    t_client_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="下载来源 IP")
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="扩展元数据")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True, comment="创建时间")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class VideoRecordModel(Base):
    """AI 视频记录模型"""

    __tablename__ = "t_video_records"
    __table_args__ = {"comment": "AI 视频记录表, 存储视频生成任务、进度、结果地址与状态信息."}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="视频任务唯一标识")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="创建任务的用户 ID")
    t_username: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="创建任务的用户名")
    t_client_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True, comment="请求来源 IP")
    t_user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="请求来源 User-Agent")
    t_tenant_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, comment="所属租户 ID")
    t_prompt: Mapped[str] = mapped_column(Text, nullable=False, comment="视频生成提示词")
    t_status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False, index=True, comment="任务状态, 如 queued processing completed failed")
    t_stage: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="任务当前阶段标识")
    t_progress_message: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="任务当前进度描述")
    t_current_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False, comment="当前步骤序号")
    t_total_steps: Mapped[int] = mapped_column(Integer, default=9, nullable=False, comment="总步骤数量")
    t_result_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="结果视频访问地址")
    t_public_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="公共域名访问地址")
    t_object_key: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="S3 对象键")
    t_error_message: Mapped[str | None] = mapped_column(Text, nullable=True, comment="任务失败时的错误信息")
    t_model: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="执行生成的模型名称")
    t_frames: Mapped[int] = mapped_column(Integer, default=81, nullable=False, comment="目标视频帧数")
    t_resolution: Mapped[str] = mapped_column(String(32), default="1280x720", nullable=False, comment="目标视频分辨率")
    t_inference_time_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="模型纯推理耗时, 单位秒")
    t_total_time_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="总耗时, 单位秒")
    t_notify_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, comment="通知发送状态")
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="扩展元数据")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True, comment="创建时间")
    t_created_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="创建人 user_id")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")
    t_updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="更新人 user_id")
    t_completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="任务完成时间")
    t_deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="软删除时间")
    t_deleted_by: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="软删除操作人 user_id")
    t_deleted_ip: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="软删除来源 IP")


class LoginLogModel(Base):
    """用户登录日志模型"""

    __tablename__ = "t_login_logs"
    __table_args__ = {"comment": "用户登录日志表,记录用户登录历史"}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_log_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="日志唯一标识 UUID")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="用户 ID")
    t_username: Mapped[str] = mapped_column(String(100), nullable=False, comment="用户名")
    t_display_name: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="显示名称")
    t_role: Mapped[str] = mapped_column(String(20), nullable=False, comment="用户角色")
    t_tenant_id: Mapped[str | None] = mapped_column(String(64), nullable=True, comment="租户 ID")
    t_login_status: Mapped[str] = mapped_column(String(20), nullable=False, index=True, comment="登录状态:success/failure")
    t_failure_reason: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="失败原因")
    t_client_ip: Mapped[str] = mapped_column(String(50), nullable=False, comment="客户端 IP 地址")
    t_user_agent: Mapped[str | None] = mapped_column(Text, nullable=True, comment="浏览器 User-Agent")
    t_device_type: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="设备类型:desktop/mobile/tablet")
    t_browser: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="浏览器名称")
    t_os: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="操作系统")
    t_location: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="地理位置(可选)")
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="扩展数据字段")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True, comment="登录时间")


class AudioRecordModel(Base):
    """AI 音频记录模型 (人声分离, 声音克隆等)"""

    __tablename__ = "t_audio_records"
    __table_args__ = {"comment": "AI 音频记录表, 存储人声分离、克隆、转换等音频任务."}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="音频任务唯一标识")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="创建任务的用户 ID")
    t_username: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="创建任务的用户名")
    t_task_type: Mapped[str] = mapped_column(String(32), nullable=False, comment="任务类型: separation(人声分离), clone(声音克隆), conversion(格式转换), asr(语音识别)")
    t_status: Mapped[str] = mapped_column(String(32), default="processing", nullable=False, comment="任务状态: processing, completed, failed")
    t_source_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="原始音频/视频文件 URL")
    t_result_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="处理结果文件 URL (S3)")
    t_s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="S3 存储键名")
    t_file_size: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="结果文件大小(字节)")
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="扩展元数据 (JSON)")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True, comment="任务创建时间")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="任务最后更新时间")


class MeetingRecordModel(Base):
    """会议记录模型"""

    __tablename__ = "t_meeting_records"
    __table_args__ = {"comment": "会议记录表, 存储会议音频转录与 AI 纪要生成任务."}

    t_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment="自增主键 ID")
    t_task_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True, comment="会议记录唯一标识")
    t_user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True, comment="创建会议记录的用户 ID")
    t_username: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="创建记录的用户名")
    t_title: Mapped[str] = mapped_column(String(255), nullable=False, comment="会议标题")
    t_status: Mapped[str] = mapped_column(String(32), default="processing", nullable=False, comment="处理状态: processing, completed, failed")
    t_audio_url: Mapped[str | None] = mapped_column(Text, nullable=True, comment="会议录音 S3 地址")
    t_transcript: Mapped[str | None] = mapped_column(Text, nullable=True, comment="会议语音转文字全文")
    t_summary: Mapped[str | None] = mapped_column(Text, nullable=True, comment="AI 生成的会议纪要/总结")
    t_s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="S3 存储键名")
    t_extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, comment="会议元数据 (参会人、时长等)")
    t_created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True, comment="记录创建时间")
    t_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, comment="记录最后更新时间")


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
    "ImageRecordModel",
    "MusicRecordModel",
    "AudioRecordModel",
    "MeetingRecordModel",
    "VideoRecordModel",
    "VideoDownloadModel",
    "ChatLogModel",
    "LoginLogModel",
]
