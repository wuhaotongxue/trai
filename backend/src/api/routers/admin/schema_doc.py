#!/usr/bin/env python
# 文件名: schema_doc.py
# 作者: wuhao
# 日期: 2026-04-23
# 描述: 数据库表结构文档 API

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text

from api.deps import require_admin
from infrastructure.database import get_session

router = APIRouter(prefix="/system/database", tags=["系统管理"])


class TableSchemaResponse(BaseModel):
    """表结构响应"""

    table_name: str = Field(description="表名")
    row_count: int = Field(description="行数")
    total_bytes: int = Field(description="总大小(字节)")
    columns: list[dict[str, Any]] = Field(description="列信息")
    description: str = Field(default="", description="表描述")


class SchemaSyncResponse(BaseModel):
    """Schema 同步响应"""

    tables: list[TableSchemaResponse] = Field(description="所有表信息")
    total_tables: int = Field(description="表总数")
    total_rows: int = Field(description="总行数")
    synced_at: str = Field(description="同步时间")


TABLE_DESCRIPTIONS: dict[str, str] = {
    "t_users": "用户表 - 存储用户基本信息",
    "t_chat_sessions": "聊天会话表 - 存储用户对话会话",
    "t_messages": "消息表 - 存储对话消息内容",
    "t_departments": "部门表 - 企业组织架构部门",
    "t_user_department_mapping": "用户部门映射表 - 用户与部门的关联",
    "t_quota_plans": "配额套餐表 - 用户配额配置",
    "t_audit_logs": "审计日志表 - 管理员操作记录",
    "t_image_generations": "图片生成记录表 - AI 图片生成历史",
    "t_knowledge_base_indices": "知识库索引表 - 知识库配置",
    "t_knowledge_base_files": "知识库文件表 - 知识库文档",
    "t_client_releases": "客户端版本表 - 软件版本管理",
    "t_sessions": "会话表 - 用户会话管理",
}


@router.get("/schema", response_model=SchemaSyncResponse, summary="获取数据库表结构文档")
async def get_schema_docs(
    current_user: dict = Depends(require_admin),
) -> SchemaSyncResponse:
    """获取所有表的结构和描述信息

    从 information_schema 自动获取表结构，并结合预定义的描述信息.
    支持手动同步，可以及时反映数据库的变化.

    Args:
        current_user: 管理员用户

    Returns:
        SchemaSyncResponse: 表结构文档
    """
    with get_session() as db:
        result = db.execute(
            text("""
                SELECT
                    t.table_name,
                    COALESCE(c.relrowsecurity, false) as has_rls,
                    pg_size_pretty(pg_total_relation_size(t.table_schema || '.' || t.table_name)::bigint) as size_pretty,
                    pg_total_relation_size(t.table_schema || '.' || t.table_name) as size_bytes
                FROM information_schema.tables t
                LEFT JOIN pg_class c ON c.relname = t.table_name
                WHERE t.table_schema = 'public'
                AND t.table_type = 'BASE TABLE'
                ORDER BY t.table_name
            """)
        ).fetchall()

        tables = []
        total_rows = 0

        for row in result:
            table_name = row[0]

            count_result = db.execute(
                text(f'SELECT COUNT(*) FROM "{table_name}"')
            ).scalar()
            row_count = int(count_result) if count_result else 0

            col_result = db.execute(
                text("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = :table_name
                    ORDER BY ordinal_position
                """),
                {"table_name": table_name},
            ).fetchall()

            columns = [
                {
                    "name": col[0],
                    "type": col[1],
                    "nullable": col[2] == "YES",
                    "default": col[3],
                }
                for col in col_result
            ]

            table_info = TableSchemaResponse(
                table_name=table_name,
                row_count=row_count,
                total_bytes=row[3] or 0,
                columns=columns,
                description=TABLE_DESCRIPTIONS.get(table_name, ""),
            )
            tables.append(table_info)
            total_rows += row_count

        return SchemaSyncResponse(
            tables=tables,
            total_tables=len(tables),
            total_rows=total_rows,
            synced_at=db.execute(text("SELECT NOW()")).scalar() or "",
        )


__all__ = ["router"]
