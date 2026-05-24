#!/usr/bin/env python
# 文件名: dto.py
# 作者: wuhao
# 日期: 2026_05_24_13:01:17
# 描述: 多智能体与知识库数据传输对象

from pydantic import BaseModel, Field


class CreateAgentRequest(BaseModel):
    """
    创建智能体请求模型.

    参数:
        无

    返回:
        None: 无返回值

    异常:
        Exception: 捕获并记录所有执行异常
    """

    name: str = Field(..., description="智能体名称")
    prompt: str = Field(..., description="系统提示词")
    tools: list[str] = Field(default_factory=list, description="挂载的工具列表")
    creator_id: str = Field(..., description="创建者 ID")


class CreateKnowledgeBaseRequest(BaseModel):
    """
    创建知识库请求模型.

    参数:
        无

    返回:
        None: 无返回值

    异常:
        Exception: 捕获并记录所有执行异常
    """

    name: str = Field(..., description="知识库名称")
    description: str | None = Field(None, description="知识库描述")
    creator_id: str = Field(..., description="创建者 ID")


class CreateAITraceLogRequest(BaseModel):
    """
    创建追踪日志请求模型.

    参数:
        无

    返回:
        None: 无返回值

    异常:
        Exception: 捕获并记录所有执行异常
    """

    session_id: str = Field(..., description="关联会话 ID")
    prompt_tokens: int = Field(default=0, description="提示词消耗 Tokens")
    completion_tokens: int = Field(default=0, description="生成消耗 Tokens")
    duration_ms: int = Field(default=0, description="耗时毫秒")
    tools_used: list[str] = Field(default_factory=list, description="调用的工具列表")
