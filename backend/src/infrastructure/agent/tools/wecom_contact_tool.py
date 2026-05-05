#!/usr/bin/env python
# 文件名: wecom_contact_tool.py
# 作者: wuhao
# 日期: 2026_04_10
# 描述: 企业微信通讯录工具 - Agent 可调用工具(用户查询/部门查询)

from __future__ import annotations

from typing import Any

from loguru import logger

from infrastructure.agent.tools.base import (
    BaseTool,
    ExecutionContext,
    RiskLevel,
    ToolCallResult,
    ToolCategory,
    ToolDefinition,
    ToolParameter,
)
from infrastructure.agent.tools.wecom_contact import (
    WeComContactClient,
    WeComUser,
)


class WeComContactTool(BaseTool):
    """企业微信通讯录工具

    提供用户查询,部门查询等能力,供 AI Agent 在对话中调用,
    帮助解答「某人在哪个部门」「某部门的负责人是谁」等问题.
    """

    def __init__(self) -> None:
        super().__init__()
        self._client = WeComContactClient()

    @property
    def definition(self) -> ToolDefinition:
        if self._definition is None:
            self._definition = ToolDefinition(
                id="wecom_contact",
                name="企业微信通讯录",
                description=(
                    "查询企业微信中的用户信息和部门结构.可根据用户姓名,工号查询用户详细信息,"
                    "或列出指定部门的成员列表及部门树结构.返回中文格式化的结果."
                ),
                category=ToolCategory.UTILITY,
                risk_level=RiskLevel.SAFE,
                parameters=[
                    ToolParameter(
                        name="action",
                        description="操作类型:get_user(查询用户详情),list_users(查询部门成员),list_departments(查询部门列表),search_user(按姓名搜索用户)",
                        type="string",
                        required=True,
                        enum=["get_user", "list_users", "list_departments", "search_user"],
                    ),
                    ToolParameter(
                        name="user_id",
                        description="用户工号(仅 get_user 时需要)",
                        type="string",
                        required=False,
                    ),
                    ToolParameter(
                        name="department_id",
                        description="部门 ID(list_users 时需要)",
                        type="integer",
                        required=False,
                    ),
                    ToolParameter(
                        name="name",
                        description="姓名关键字(search_user 时需要)",
                        type="string",
                        required=False,
                    ),
                ],
                requires_watermark=False,
                monthly_quota_check=False,
                audit_log=True,
            )
        return self._definition

    async def execute(self, params: dict[str, Any], context: ExecutionContext) -> ToolCallResult:
        import time

        start = time.monotonic()
        action = params.get("action", "")

        if not self._client.is_configured():
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error="企业微信未正确配置(缺少 WECOM_CORP_ID 或 Secret),请联系管理员",
            )

        try:
            if action == "get_user":
                user_id = params.get("user_id", "")
                if not user_id:
                    return ToolCallResult(
                        tool_call_id="",
                        tool_id=self.definition.id,
                        success=False,
                        error="get_user 需要提供 user_id 参数(用户工号)",
                    )
                user: WeComUser = await self._client.get_user(user_id)
                output = self._client.format_user_summary(user)

            elif action == "list_users":
                dept_id = params.get("department_id", 1)
                users = await self._client.list_users_by_department(dept_id)
                lines = [f"部门 {dept_id} 成员(共 {len(users)} 人):"]
                for u in users:
                    lines.append(f"  · {u.name} | 工号:{u.user_id} | 职位:{u.position or '未设置'}")
                output = "\n".join(lines)

            elif action == "list_departments":
                dept_id = params.get("department_id")
                depts = await self._client.list_departments(dept_id if dept_id is not None else None)
                lines = [f"部门列表(共 {len(depts)} 个):"]
                for d in depts:
                    prefix = "  " if d.parent_id != 0 else ""
                    lines.append(f"{prefix}· {d.name}(ID:{d.id},上级:{d.parent_id})")
                output = "\n".join(lines)

            elif action == "search_user":
                name = params.get("name", "")
                if not name:
                    return ToolCallResult(
                        tool_call_id="",
                        tool_id=self.definition.id,
                        success=False,
                        error="search_user 需要提供 name 参数(姓名关键字)",
                    )
                matched = await self._client.search_users_by_name(name)
                if not matched:
                    output = f"未找到姓名包含「{name}」的用户"
                else:
                    lines = [f"找到 {len(matched)} 条匹配结果:"]
                    for u in matched:
                        lines.append(
                            f"  · {u.name} | 工号:{u.user_id} | 部门:{u.department} | 职位:{u.position or '未设置'}"
                        )
                    output = "\n".join(lines)

            else:
                return ToolCallResult(
                    tool_call_id="",
                    tool_id=self.definition.id,
                    success=False,
                    error=f"不支持的操作类型:{action},支持 get_user / list_users / list_departments / search_user",
                )

            duration_ms = int((time.monotonic() - start) * 1000)
            logger.info(
                f"企业微信通讯录工具执行成功 | action={action} | user={context.user_id} | duration={duration_ms}ms"
            )
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=True,
                output=output,
                duration_ms=duration_ms,
            )

        except Exception as e:
            duration_ms = int((time.monotonic() - start) * 1000)
            logger.error(f"企业微信通讯录工具执行失败 | action={action} | error={e}")
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error=f"企业微信通讯录查询异常:{str(e)}",
                duration_ms=duration_ms,
            )


__all__ = ["WeComContactTool"]
