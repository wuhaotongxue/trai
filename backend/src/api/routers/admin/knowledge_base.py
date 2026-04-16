#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: knowledge_base.py
# 作者: wuhao
# 日期: 2026_04_16_11:18:54
# 描述: 管理后台知识库相关接口

from __future__ import annotations

import hashlib
import os
import time
from collections.abc import Mapping
from datetime import datetime
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from api.deps import AdminUser

router = APIRouter(prefix="/knowledge_base")


class KnowledgeBaseDemoCreateRequest(BaseModel):
    content: str | None = Field(default=None, description="上传到知识库的 Markdown 内容（为空则使用默认 demo）")
    file_name: str | None = Field(default=None, description="上传文件名（为空则自动生成）")
    index_name: str | None = Field(default=None, description="知识库名称（为空则自动生成）")


class KnowledgeBaseDemoCreateResponse(BaseModel):
    index_id: str = Field(description="知识库 ID（IndexId）")
    index_name: str = Field(description="知识库名称")
    file_id: str = Field(description="文档 ID（FileId）")
    file_name: str = Field(description="文档名称")
    job_id: str = Field(description="建库任务 ID（JobId）")
    job_status: str = Field(description="建库任务状态")


class KnowledgeBaseListResponse(BaseModel):
    items: list[dict[str, Any]] = Field(default_factory=list, description="列表数据")
    raw: dict[str, Any] = Field(default_factory=dict, description="原始响应, 便于排查字段变更")



class KnowledgeBaseDemoService:
    def _call_bailian_api(self, fn: Any, *args: Any, **kwargs: Any) -> Any:
        try:
            return fn(*args, **kwargs)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "code": 502,
                    "message": "调用百炼接口失败",
                    "detail": str(e),
                },
            ) from e

    def _get_env(self, key: str) -> str:
        val = os.getenv(key)
        if not val:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": f"缺少环境变量: {key}"},
            )
        return val

    def _normalize_headers(self, headers: Any) -> dict[str, str]:
        if isinstance(headers, Mapping):
            return {str(k): str(v) for k, v in headers.items()}

        if isinstance(headers, str):
            cleaned = headers.strip()
            if cleaned.startswith("{") and cleaned.endswith("}"):
                cleaned = cleaned[1:-1].strip()
            cleaned = cleaned.replace("\r", "\n")
            parts = [p.strip() for p in cleaned.replace("\n", ",").split(",") if p.strip()]
            result: dict[str, str] = {}
            for part in parts:
                if ":" not in part:
                    continue
                k, v = part.split(":", 1)
                k = k.strip().strip('"').strip("'")
                v = v.strip().strip('"').strip("'")
                if k:
                    result[k] = v
            return result

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": "上传参数 headers 格式不支持"},
        )

    def _create_bailian_client(self) -> tuple[Any, Any, str]:
        try:
            from alibabacloud_bailian20231229 import models as bailian_models
            from alibabacloud_bailian20231229.client import Client as BailianClient
            from alibabacloud_tea_openapi import models as open_api_models
        except ImportError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": 500,
                    "message": "缺少依赖 alibabacloud-bailian20231229, 请先安装后再调用",
                    "detail": str(e),
                },
            ) from e

        region = os.getenv("BAILIAN_REGION", "cn-beijing")
        workspace_id = self._get_env("BAILIAN_WORKSPACE_ID")
        access_key_id = self._get_env("ALIBABA_CLOUD_ACCESS_KEY_ID")
        access_key_secret = self._get_env("ALIBABA_CLOUD_ACCESS_KEY_SECRET")

        config = open_api_models.Config(
            access_key_id=access_key_id,
            access_key_secret=access_key_secret,
            endpoint=f"bailian.{region}.aliyuncs.com",
        )
        client = BailianClient(config)
        return client, bailian_models, workspace_id

    def _extract_list(self, data: Any) -> list[dict[str, Any]]:
        if isinstance(data, list):
            return [x for x in data if isinstance(x, dict)]
        if isinstance(data, dict):
            for key in ("items", "indices", "categories", "files", "documents", "data", "list"):
                val = data.get(key)
                if isinstance(val, list):
                    return [x for x in val if isinstance(x, dict)]
        return []

    def _extract_raw(self, resp: Any) -> dict[str, Any]:
        try:
            mapped = resp.to_map()
            body = mapped.get("body")
            if isinstance(body, dict):
                return body
            return {"body": body} if body is not None else mapped
        except Exception:
            return {}

    def demo_create(self, request: KnowledgeBaseDemoCreateRequest) -> KnowledgeBaseDemoCreateResponse:
        client, bailian_models, workspace_id = self._create_bailian_client()

        now_suffix = datetime.now().strftime("%m%d_%H%M")

        content = request.content or (
            "# TRAI Bailian Knowledge Base Demo\n\n"
            f"- created_at: {datetime.now().isoformat()}\n"
            "- purpose: verify kb create + upload + index build\n"
        )
        content_bytes = content.encode("utf-8")
        md_5 = hashlib.md5(content_bytes).hexdigest()
        size_in_bytes = str(len(content_bytes))

        file_name = request.file_name or f"trai_demo_{now_suffix}.md"
        index_name = (request.index_name or f"trai_demo_{now_suffix}")[:20]

        lease_req = bailian_models.ApplyFileUploadLeaseRequest(
            category_type="UNSTRUCTURED",
            file_name=file_name,
            md_5=md_5,
            size_in_bytes=size_in_bytes,
        )
        lease_resp = client.apply_file_upload_lease("default", workspace_id, lease_req)
        lease_body = lease_resp.body
        if not lease_body or not getattr(lease_body, "data", None):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "code": 502,
                    "message": "申请上传租约失败",
                    "provider_code": getattr(lease_body, "code", None),
                    "provider_message": getattr(lease_body, "message", None),
                },
            )

        lease_id = lease_body.data.file_upload_lease_id
        upload_param = lease_body.data.param
        upload_url = upload_param.url
        headers = self._normalize_headers(upload_param.headers)

        with httpx.Client(timeout=120.0) as http_client:
            upload_resp = http_client.put(upload_url, content=content_bytes, headers=headers)
            upload_resp.raise_for_status()

        add_file_req = bailian_models.AddFileRequest(
            lease_id=lease_id,
            parser="DASHSCOPE_DOCMIND",
            category_id="default",
            category_type="UNSTRUCTURED",
        )
        add_file_resp = client.add_file(workspace_id, add_file_req)
        add_file_body = add_file_resp.body
        if not add_file_body or not getattr(add_file_body, "data", None):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "code": 502,
                    "message": "导入文件到应用数据失败",
                    "provider_code": getattr(add_file_body, "code", None),
                    "provider_message": getattr(add_file_body, "message", None),
                },
            )

        file_id = add_file_body.data.file_id

        create_req = bailian_models.CreateIndexRequest(
            name=index_name,
            structure_type="unstructured",
            sink_type="BUILT_IN",
            source_type="DATA_CENTER_FILE",
            document_ids=[file_id],
        )
        create_resp = client.create_index(workspace_id, create_req)
        create_body = create_resp.body
        if not create_body or not getattr(create_body, "data", None):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "code": 502,
                    "message": "创建知识库失败",
                    "provider_code": getattr(create_body, "code", None),
                    "provider_message": getattr(create_body, "message", None),
                },
            )

        index_id = create_body.data.id

        submit_resp = client.submit_index_job(workspace_id, bailian_models.SubmitIndexJobRequest(index_id=index_id))
        submit_body = submit_resp.body
        if not submit_body or not getattr(submit_body, "data", None):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "code": 502,
                    "message": "提交建库任务失败",
                    "provider_code": getattr(submit_body, "code", None),
                    "provider_message": getattr(submit_body, "message", None),
                },
            )

        job_id = submit_body.data.id
        job_status = "PENDING"

        for _ in range(12):
            status_req = bailian_models.GetIndexJobStatusRequest(
                job_id=job_id,
                index_id=index_id,
                page_number=1,
                page_size=10,
            )
            status_resp = client.get_index_job_status(workspace_id, status_req)
            status_body = status_resp.body
            job_status = status_body.data.status if status_body and getattr(status_body, "data", None) else job_status
            if job_status in {"COMPLETED", "FAILED"}:
                break
            time.sleep(1.5)

        return KnowledgeBaseDemoCreateResponse(
            index_id=index_id,
            index_name=index_name,
            file_id=file_id,
            file_name=file_name,
            job_id=job_id,
            job_status=job_status,
        )

    def list_categories(self) -> KnowledgeBaseListResponse:
        client, bailian_models, workspace_id = self._create_bailian_client()
        req = bailian_models.ListCategoryRequest(max_results=100)
        try:
            resp = self._call_bailian_api(client.list_category, workspace_id, req)
            raw = self._extract_raw(resp)
            body = raw.get("data") if isinstance(raw.get("data"), dict) else raw
            items = self._extract_list(body)
            return KnowledgeBaseListResponse(items=items, raw=raw)
        except HTTPException as e:
            fallback_items = [
                {
                    "category_id": "default",
                    "category_name": "默认",
                }
            ]
            raw = {"fallback": True, "error": e.detail}
            return KnowledgeBaseListResponse(items=fallback_items, raw=raw)

    def list_indices(self, index_name: str | None = None) -> KnowledgeBaseListResponse:
        client, bailian_models, workspace_id = self._create_bailian_client()
        req = bailian_models.ListIndicesRequest(index_name=index_name, page_number="1", page_size="100")
        resp = self._call_bailian_api(client.list_indices, workspace_id, req)
        raw = self._extract_raw(resp)
        body = raw.get("data") if isinstance(raw.get("data"), dict) else raw
        items = self._extract_list(body)
        return KnowledgeBaseListResponse(items=items, raw=raw)

    def list_index_files(self, index_id: str) -> KnowledgeBaseListResponse:
        client, bailian_models, workspace_id = self._create_bailian_client()
        req = bailian_models.ListIndexFileDetailsRequest(index_id=index_id, page_number=1, page_size=100)
        resp = self._call_bailian_api(client.list_index_file_details, workspace_id, req)
        raw = self._extract_raw(resp)
        body = raw.get("data") if isinstance(raw.get("data"), dict) else raw
        items = self._extract_list(body)
        return KnowledgeBaseListResponse(items=items, raw=raw)


class KnowledgeBaseDemoController:
    def __init__(self) -> None:
        self._service = KnowledgeBaseDemoService()

    async def demo_create(
        self,
        request: KnowledgeBaseDemoCreateRequest,
        current_user: AdminUser,
    ) -> KnowledgeBaseDemoCreateResponse:
        _ = current_user
        return self._service.demo_create(request)

    async def list_categories(self, current_user: AdminUser) -> KnowledgeBaseListResponse:
        _ = current_user
        return self._service.list_categories()

    async def list_indices(self, current_user: AdminUser, index_name: str | None = None) -> KnowledgeBaseListResponse:
        _ = current_user
        return self._service.list_indices(index_name=index_name)

    async def list_index_files(self, current_user: AdminUser, index_id: str) -> KnowledgeBaseListResponse:
        _ = current_user
        return self._service.list_index_files(index_id=index_id)


controller = KnowledgeBaseDemoController()


@router.post(
    "/demo_create",
    response_model=KnowledgeBaseDemoCreateResponse,
    summary="创建知识库 Demo",
    description="用于验证百炼知识库的建库与上传链路. 需要管理员权限与百炼相关环境变量.",
    tags=["管理后台"],
)
async def demo_create(
    request: KnowledgeBaseDemoCreateRequest,
    current_user: AdminUser,
) -> KnowledgeBaseDemoCreateResponse:
    return await controller.demo_create(request, current_user)


@router.get(
    "/categories",
    response_model=KnowledgeBaseListResponse,
    summary="获取知识库分类列表",
    description="从百炼工作空间读取知识库分类列表.",
    tags=["管理后台"],
)
async def list_categories(current_user: AdminUser) -> KnowledgeBaseListResponse:
    return await controller.list_categories(current_user)


@router.get(
    "/indices",
    response_model=KnowledgeBaseListResponse,
    summary="获取知识库列表",
    description="从百炼工作空间读取知识库列表(索引列表).",
    tags=["管理后台"],
)
async def list_indices(current_user: AdminUser, index_name: str | None = None) -> KnowledgeBaseListResponse:
    return await controller.list_indices(current_user, index_name=index_name)


@router.get(
    "/indices/{index_id}/files",
    response_model=KnowledgeBaseListResponse,
    summary="获取知识库文件列表",
    description="根据知识库 ID 获取文件明细列表.",
    tags=["管理后台"],
)
async def list_index_files(current_user: AdminUser, index_id: str) -> KnowledgeBaseListResponse:
    return await controller.list_index_files(current_user, index_id=index_id)
