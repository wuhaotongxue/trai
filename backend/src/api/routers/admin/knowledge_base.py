#!/usr/bin/env python
# 文件名: knowledge_base.py
# 作者: wuhao
# 日期: 2026_04_17_14:21:28
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
    """
    创建知识库 Demo 请求.

    用途:
        用于触发百炼知识库的建库与上传链路验证.

    参数:
        无.

    返回:
        无.

    异常:
        无.
    """

    content: str | None = Field(default=None, description="上传到知识库的 Markdown 内容（为空则使用默认 demo）")
    file_name: str | None = Field(default=None, description="上传文件名（为空则自动生成）")
    index_name: str | None = Field(default=None, description="知识库名称（为空则自动生成）")


class KnowledgeBaseDemoCreateResponse(BaseModel):
    """
    创建知识库 Demo 响应.

    用途:
        返回建库与上传任务的关键 ID, 便于客户端后续轮询与状态展示.

    参数:
        无.

    返回:
        无.

    异常:
        无.
    """

    index_id: str = Field(description="知识库 ID（IndexId）")
    index_name: str = Field(description="知识库名称")
    file_id: str = Field(description="文档 ID（FileId）")
    file_name: str = Field(description="文档名称")
    job_id: str = Field(description="建库任务 ID（JobId）")
    job_status: str = Field(description="建库任务状态")


class KnowledgeBaseListResponse(BaseModel):
    """
    通用列表响应.

    用途:
        管理后台知识库相关列表接口的统一响应结构, 支持分页与原始响应透传.

    参数:
        无.

    返回:
        无.

    异常:
        无.
    """

    items: list[dict[str, Any]] = Field(default_factory=list, description="列表数据")
    raw: dict[str, Any] = Field(default_factory=dict, description="原始响应, 便于排查字段变更")
    total: int | None = Field(default=None, description="总数, 可用于分页")
    page_number: int | None = Field(default=None, description="页码, 从 1 开始")
    page_size: int | None = Field(default=None, description="每页数量")


class KnowledgeBaseUploadTextRequest(BaseModel):
    """
    上传文本到知识库请求.

    用途:
        以文本方式上传内容到指定知识库, 由后端转为百炼数据中心文件并触发解析.

    参数:
        无.

    返回:
        无.

    异常:
        无.
    """

    content: str = Field(min_length=1, description="上传到知识库的文本内容(建议 Markdown)")
    file_name: str | None = Field(default=None, description="上传文件名(为空则自动生成)")


class KnowledgeBaseUploadTextResponse(BaseModel):
    """
    上传文本到知识库响应.

    用途:
        返回 file_id 与 job_id, 便于客户端显示上传与解析状态.

    参数:
        无.

    返回:
        无.

    异常:
        无.
    """

    index_id: str = Field(description="知识库 ID")
    file_id: str = Field(description="文档 ID")
    file_name: str = Field(description="文档名称")
    job_id: str = Field(description="增量建库任务 ID")
    job_status: str = Field(description="增量建库任务状态")


class KnowledgeBaseRenameIndexRequest(BaseModel):
    """
    重命名知识库请求.

    用途:
        修改百炼知识库的 name 字段.

    参数:
        无.

    返回:
        无.

    异常:
        无.
    """

    index_name: str = Field(min_length=1, max_length=20, description="知识库名称, 最长 20 字符")


class KnowledgeBaseRenameIndexResponse(BaseModel):
    """
    重命名知识库响应.

    用途:
        返回最新的 index_name.

    参数:
        无.

    返回:
        无.

    异常:
        无.
    """

    index_id: str = Field(description="知识库 ID")
    index_name: str = Field(description="知识库名称")


class KnowledgeBaseDeleteResponse(BaseModel):
    """
    删除操作响应.

    用途:
        用于删除知识库或删除知识库文件等接口的统一返回.

    参数:
        无.

    返回:
        无.

    异常:
        无.
    """

    success: bool = Field(description="是否成功")


class KnowledgeBaseDemoService:
    """
    百炼知识库 Demo 服务.

    用途:
        封装管理后台知识库相关的第三方调用, 包含列表, 上传, 重命名, 删除与分页处理.

    参数:
        无.

    返回:
        无.

    异常:
        HTTPException: 依赖缺失, 参数不合法, 或三方调用失败时抛出.
    """

    def _call_bailian_api(self, fn: Any, *args: Any, **kwargs: Any) -> Any:
        """
        调用百炼 SDK 并统一转为 HTTPException.

        参数:
            fn: SDK 调用函数.
            *args: 位置参数.
            **kwargs: 关键字参数.

        返回:
            Any: SDK 返回对象.

        异常:
            HTTPException: SDK 调用失败时抛出.
        """
        try:
            return fn(*args, **kwargs)
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
        """
        读取必需环境变量.

        参数:
            key: 环境变量名.

        返回:
            str: 环境变量值.

        异常:
            HTTPException: 环境变量缺失时抛出.
        """
        val = os.getenv(key)
        if not val:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": f"缺少环境变量: {key}"},
            )
        return val

    def _normalize_headers(self, headers: Any) -> dict[str, str]:
        """
        将百炼上传租约返回的 headers 规范化为 dict[str, str].

        参数:
            headers: 百炼返回的 headers, 可能为 dict 或字符串.

        返回:
            dict[str, str]: 规范化后的请求头.

        异常:
            HTTPException: headers 类型不支持时抛出.
        """
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

    def _extract_total(self, body: dict[str, Any]) -> int | None:
        """
        从响应体中提取 total.

        参数:
            body: 响应体字典.

        返回:
            int | None: total, 若不存在则为 None.

        异常:
            无.
        """
        if not isinstance(body, dict):
            return None
        for key in ("total", "total_count", "totalCount", "total_items", "totalItems"):
            val = body.get(key)
            if isinstance(val, int):
                return val
            if isinstance(val, str) and val.isdigit():
                return int(val)
        return None

    def _count_index_files(
        self,
        client: Any,
        bailian_models: Any,
        workspace_id: str,
        index_id: str,
        page_size: int,
    ) -> int:
        """
        统计知识库文件总数.

        参数:
            client: 百炼客户端.
            bailian_models: 百炼模型包.
            workspace_id: 工作空间 ID.
            index_id: 知识库 ID.
            page_size: 每页数量.

        返回:
            int: 文件总数.

        异常:
            HTTPException: 百炼 API 调用失败时抛出.
        """
        pages = 0
        seen_ids: set[str] = set()
        while True:
            pages += 1
            req = bailian_models.ListIndexFileDetailsRequest(
                index_id=index_id,
                page_number=str(pages),
                page_size=str(page_size),
            )
            resp = self._call_bailian_api(client.list_index_file_details, workspace_id, req)
            raw = self._extract_raw(resp)
            body = raw.get("data") if isinstance(raw.get("data"), dict) else raw
            items = self._extract_list(body)
            if not items:
                return len(seen_ids)

            new_count = 0
            for it in items:
                fid = str(
                    it.get("Id") or it.get("id") or it.get("file_id") or it.get("fileId") or it.get("FileId") or ""
                ).strip()
                if fid and fid not in seen_ids:
                    seen_ids.add(fid)
                    new_count += 1

            if new_count == 0:
                return len(seen_ids)

            if pages >= 1000:
                return len(seen_ids)

    def _create_bailian_client(self) -> tuple[Any, Any, str]:
        """
        创建百炼客户端并返回模型包与 workspace_id.

        参数:
            无.

        返回:
            tuple[Any, Any, str]: (client, bailian_models, workspace_id).

        异常:
            HTTPException: SDK 依赖缺失或环境变量缺失时抛出.
        """
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
        """
        从百炼响应体中提取列表字段.

        参数:
            data: 响应体, 可能为 dict 或 list.

        返回:
            list[dict[str, Any]]: 提取到的列表.

        异常:
            无.
        """
        if isinstance(data, list):
            return [x for x in data if isinstance(x, dict)]

        if not isinstance(data, dict):
            return []

        preferred_keys = ("items", "indices", "categories", "files", "documents", "data", "list")
        for key in preferred_keys:
            val = data.get(key)
            if isinstance(val, list):
                return [x for x in val if isinstance(x, dict)]
            if isinstance(val, dict):
                nested = self._extract_list(val)
                if nested:
                    return nested

        for val in data.values():
            if isinstance(val, list) and val and all(isinstance(x, dict) for x in val):
                return val
            if isinstance(val, dict):
                nested = self._extract_list(val)
                if nested:
                    return nested

        return []

    def _extract_raw(self, resp: Any) -> dict[str, Any]:
        """
        将百炼 SDK 响应对象转换为 dict 结构.

        参数:
            resp: 百炼 SDK 响应对象.

        返回:
            dict[str, Any]: 转换后的响应体.

        异常:
            无.
        """
        try:
            mapped = resp.to_map()
            body = mapped.get("body")

            if isinstance(body, dict):
                return body

            if body is not None and hasattr(body, "to_map"):
                body_map = body.to_map()
                if isinstance(body_map, dict):
                    return body_map

            if body is not None:
                return {"body": body}

            return mapped if isinstance(mapped, dict) else {"mapped": mapped}
        except Exception:
            return {}

    def demo_create(self, request: KnowledgeBaseDemoCreateRequest) -> KnowledgeBaseDemoCreateResponse:
        """
        创建知识库 Demo, 用于打通创建, 上传, 建库任务与轮询流程.

        参数:
            request: Demo 创建请求.

        返回:
            KnowledgeBaseDemoCreateResponse: 创建结果, 包含 index_id, file_id, job_id.

        异常:
            HTTPException: 三方调用失败或响应缺失时抛出.
        """
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

    def upload_text_to_index(
        self, index_id: str, request: KnowledgeBaseUploadTextRequest
    ) -> KnowledgeBaseUploadTextResponse:
        """
        上传文本内容到指定知识库并触发增量解析.

        参数:
            index_id: 知识库 ID.
            request: 上传请求, 包含 content 与可选 file_name.

        返回:
            KnowledgeBaseUploadTextResponse: 上传结果, 包含 file_id, job_id 等.

        异常:
            HTTPException: 三方调用失败或响应缺失时抛出.
        """
        client, bailian_models, workspace_id = self._create_bailian_client()

        now_suffix = datetime.now().strftime("%m%d_%H%M")
        file_name = request.file_name or f"trai_upload_{now_suffix}.md"

        content_bytes = request.content.encode("utf-8")
        md_5 = hashlib.md5(content_bytes).hexdigest()
        size_in_bytes = str(len(content_bytes))

        lease_req = bailian_models.ApplyFileUploadLeaseRequest(
            category_type="UNSTRUCTURED",
            file_name=file_name,
            md_5=md_5,
            size_in_bytes=size_in_bytes,
        )
        lease_resp = self._call_bailian_api(client.apply_file_upload_lease, "default", workspace_id, lease_req)
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
        add_file_resp = self._call_bailian_api(client.add_file, workspace_id, add_file_req)
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

        submit_req = bailian_models.SubmitIndexAddDocumentsJobRequest(
            index_id=index_id,
            document_ids=[file_id],
            source_type="DATA_CENTER_FILE",
        )
        submit_resp = self._call_bailian_api(client.submit_index_add_documents_job, workspace_id, submit_req)
        submit_body = submit_resp.body
        if not submit_body or not getattr(submit_body, "data", None):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "code": 502,
                    "message": "提交增量建库任务失败",
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
            status_resp = self._call_bailian_api(client.get_index_job_status, workspace_id, status_req)
            status_body = status_resp.body
            job_status = status_body.data.status if status_body and getattr(status_body, "data", None) else job_status
            if job_status in {"COMPLETED", "FAILED"}:
                break
            time.sleep(1.5)

        return KnowledgeBaseUploadTextResponse(
            index_id=index_id,
            file_id=file_id,
            file_name=file_name,
            job_id=job_id,
            job_status=job_status,
        )

    def rename_index(self, index_id: str, request: KnowledgeBaseRenameIndexRequest) -> KnowledgeBaseRenameIndexResponse:
        """
        重命名知识库.

        参数:
            index_id: 知识库 ID.
            request: 重命名请求.

        返回:
            KnowledgeBaseRenameIndexResponse: 重命名结果.

        异常:
            HTTPException: 三方调用失败时抛出.
        """
        client, bailian_models, workspace_id = self._create_bailian_client()
        req = bailian_models.UpdateIndexRequest(id=index_id, name=request.index_name)
        resp = self._call_bailian_api(client.update_index, workspace_id, req)
        raw = self._extract_raw(resp)
        data = raw.get("data") if isinstance(raw.get("data"), dict) else {}
        name = str(data.get("name") or request.index_name)
        return KnowledgeBaseRenameIndexResponse(index_id=index_id, index_name=name)

    def delete_index_file(self, index_id: str, file_id: str) -> KnowledgeBaseDeleteResponse:
        """
        删除知识库内指定文件, 同时删除数据中心文件.

        参数:
            index_id: 知识库 ID.
            file_id: 文件 ID.

        返回:
            KnowledgeBaseDeleteResponse: 删除结果.

        异常:
            HTTPException: 三方调用失败时抛出.
        """
        client, bailian_models, workspace_id = self._create_bailian_client()
        self._call_bailian_api(
            client.delete_index_document,
            workspace_id,
            bailian_models.DeleteIndexDocumentRequest(index_id=index_id, document_ids=[file_id]),
        )
        self._call_bailian_api(client.delete_file, file_id, workspace_id, bailian_models.DeleteFileRequest())
        return KnowledgeBaseDeleteResponse(success=True)

    def delete_index(self, index_id: str) -> KnowledgeBaseDeleteResponse:
        """
        删除知识库.

        参数:
            index_id: 知识库 ID.

        返回:
            KnowledgeBaseDeleteResponse: 删除结果.

        异常:
            HTTPException: 三方调用失败时抛出.
        """
        client, bailian_models, workspace_id = self._create_bailian_client()
        self._call_bailian_api(client.delete_index, workspace_id, bailian_models.DeleteIndexRequest(index_id=index_id))
        return KnowledgeBaseDeleteResponse(success=True)

    def list_categories(self) -> KnowledgeBaseListResponse:
        """
        获取知识库分类列表.

        参数:
            无.

        返回:
            KnowledgeBaseListResponse: 分类列表.

        异常:
            HTTPException: 三方调用失败时抛出, 会在上层做降级返回默认分类.
        """
        client, bailian_models, workspace_id = self._create_bailian_client()
        req = bailian_models.ListCategoryRequest(category_type="UNSTRUCTURED", max_results=100)
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
        """
        获取知识库列表.

        参数:
            index_name: 可选, 按名称过滤.

        返回:
            KnowledgeBaseListResponse: 知识库列表.

        异常:
            HTTPException: 三方调用失败时抛出.
        """
        client, bailian_models, workspace_id = self._create_bailian_client()
        req = bailian_models.ListIndicesRequest(index_name=index_name, page_number="1", page_size="100")
        resp = self._call_bailian_api(client.list_indices, workspace_id, req)
        raw = self._extract_raw(resp)
        body = raw.get("data") if isinstance(raw.get("data"), dict) else raw
        items = self._extract_list(body)
        return KnowledgeBaseListResponse(items=items, raw=raw)

    def list_index_files(
        self,
        index_id: str,
        page_number: int | None = None,
        page_size: int | None = None,
    ) -> KnowledgeBaseListResponse:
        """
        获取知识库文件列表.

        说明:
            百炼文件列表接口可能固定使用 page_size=10, 本方法会在需要时自动多页拉取并切片,
            以支持客户端选择 10, 20, 50 等每页数量.

        参数:
            index_id: 知识库 ID.
            page_number: 页码, 从 1 开始.
            page_size: 每页数量.

        返回:
            KnowledgeBaseListResponse: 文件列表与分页信息.

        异常:
            HTTPException: 三方调用失败时抛出.
        """
        client, bailian_models, workspace_id = self._create_bailian_client()
        effective_page_size = page_size if page_size and page_size > 0 else 10

        if page_number and page_number > 0:
            provider_page_size = 10
            start_index = (page_number - 1) * effective_page_size
            provider_start_page = start_index // provider_page_size + 1
            provider_start_offset = start_index % provider_page_size
            provider_need = effective_page_size + provider_start_offset
            provider_pages = (provider_need + provider_page_size - 1) // provider_page_size
            provider_end_page = provider_start_page + provider_pages - 1

            gathered: list[dict[str, Any]] = []
            raw: dict[str, Any] = {}
            total: int | None = None
            for p in range(provider_start_page, provider_end_page + 1):
                req = bailian_models.ListIndexFileDetailsRequest(
                    index_id=index_id,
                    page_number=str(p),
                    page_size=str(provider_page_size),
                )
                resp = self._call_bailian_api(client.list_index_file_details, workspace_id, req)
                raw = self._extract_raw(resp)
                body = raw.get("data") if isinstance(raw.get("data"), dict) else raw
                if isinstance(body, dict) and total is None:
                    total = self._extract_total(body)
                items = self._extract_list(body)
                if items:
                    gathered.extend(items)

                if len(items) < provider_page_size:
                    break

            items = gathered[provider_start_offset : provider_start_offset + effective_page_size]
            if total is None:
                total = self._count_index_files(client, bailian_models, workspace_id, index_id, provider_page_size)
            return KnowledgeBaseListResponse(
                items=items,
                raw={
                    **raw,
                    "provider_page_size": provider_page_size,
                    "provider_start_page": provider_start_page,
                    "provider_end_page": provider_end_page,
                },
                total=total,
                page_number=page_number,
                page_size=effective_page_size,
            )

        all_items: list[dict[str, Any]] = []
        pages = 0
        total: int | None = None
        seen_ids: set[str] = set()
        while True:
            pages += 1
            req = bailian_models.ListIndexFileDetailsRequest(
                index_id=index_id,
                page_number=str(pages),
                page_size=str(effective_page_size),
            )
            resp = self._call_bailian_api(client.list_index_file_details, workspace_id, req)
            raw = self._extract_raw(resp)
            body = raw.get("data") if isinstance(raw.get("data"), dict) else raw
            if isinstance(body, dict) and total is None:
                total = self._extract_total(body)
            items = self._extract_list(body)
            if not items:
                return KnowledgeBaseListResponse(
                    items=all_items,
                    raw={**raw, "fetched_pages": pages},
                    total=total if total is not None else len(all_items),
                )

            new_items: list[dict[str, Any]] = []
            for it in items:
                fid = str(
                    it.get("Id") or it.get("id") or it.get("file_id") or it.get("fileId") or it.get("FileId") or ""
                ).strip()
                if fid and fid not in seen_ids:
                    seen_ids.add(fid)
                    new_items.append(it)
            if new_items:
                all_items.extend(new_items)
            else:
                return KnowledgeBaseListResponse(
                    items=all_items,
                    raw={**raw, "fetched_pages": pages, "stopped_reason": "no_new_items"},
                    total=total if total is not None else len(all_items),
                )

            if len(items) < effective_page_size:
                return KnowledgeBaseListResponse(
                    items=all_items,
                    raw={**raw, "fetched_pages": pages},
                    total=total if total is not None else len(all_items),
                )


class KnowledgeBaseDemoController:
    """
    知识库管理接口控制器.

    用途:
        作为 Router 与 Service 的薄层桥接, 负责权限入参对齐与调用编排.

    参数:
        无.

    返回:
        无.

    异常:
        HTTPException: 由 Service 层透出.
    """

    def __init__(self) -> None:
        """
        初始化控制器.

        参数:
            无.

        返回:
            无.

        异常:
            无.
        """
        self._service = KnowledgeBaseDemoService()

    def _is_super_admin(self, current_user: AdminUser) -> bool:
        """
        判断是否为超级管理员.

        规则:
            目前以 username=admin 作为超级管理员标识.

        参数:
            current_user: 当前管理员.

        返回:
            bool: True 为超级管理员.

        异常:
            无.
        """
        return str(current_user.get("username") or "") == "admin"

    def _get_owner_prefix(self, current_user: AdminUser) -> str:
        """
        获取当前用户的知识库名称前缀.

        参数:
            current_user: 当前管理员.

        返回:
            str: 前缀, 例如 `wuhao__`.

        异常:
            无.
        """
        username = str(current_user.get("username") or "").strip()
        return f"{username}__" if username else ""

    def _ensure_index_access(self, current_user: AdminUser, index_id: str) -> None:
        """
        校验当前用户是否有权限访问指定知识库.

        说明:
            为了实现多账号隔离, 非超级管理员仅允许访问 index_name 以 `{username}__` 开头的知识库.
            若用户拿到其他知识库的 index_id, 也会被拦截.

        参数:
            current_user: 当前管理员.
            index_id: 知识库 ID.

        返回:
            无.

        异常:
            HTTPException: 权限不足时抛出.
        """
        if self._is_super_admin(current_user):
            return

        owner_prefix = self._get_owner_prefix(current_user)
        if not owner_prefix:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": 403, "message": "权限不足"},
            )

        indices = self._service.list_indices(index_name=owner_prefix).items
        for item in indices:
            if str(item.get("id") or item.get("index_id") or "") == index_id:
                return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权访问该知识库"},
        )

    async def demo_create(
        self,
        request: KnowledgeBaseDemoCreateRequest,
        current_user: AdminUser,
    ) -> KnowledgeBaseDemoCreateResponse:
        """
        创建知识库 Demo.

        参数:
            request: Demo 创建请求.
            current_user: 当前管理员.

        返回:
            KnowledgeBaseDemoCreateResponse: 创建结果.

        异常:
            HTTPException: Service 调用失败时抛出.
        """
        if self._is_super_admin(current_user):
            return self._service.demo_create(request)

        owner_prefix = self._get_owner_prefix(current_user)
        index_name = request.index_name or ""
        if index_name and not index_name.startswith(owner_prefix):
            index_name = f"{owner_prefix}{index_name}"
        elif not index_name:
            suffix = datetime.now().strftime("%m%d_%H%M%S")
            index_name = f"{owner_prefix}kb_{suffix}"

        scoped_request = KnowledgeBaseDemoCreateRequest(
            content=request.content,
            file_name=request.file_name,
            index_name=index_name,
        )
        return self._service.demo_create(scoped_request)

    async def list_categories(self, current_user: AdminUser) -> KnowledgeBaseListResponse:
        """
        获取知识库分类列表.

        参数:
            current_user: 当前管理员.

        返回:
            KnowledgeBaseListResponse: 分类列表.

        异常:
            HTTPException: Service 调用失败时抛出.
        """
        if not self._is_super_admin(current_user):
            # 非管理员只返回默认分类
            return KnowledgeBaseListResponse(
                items=[
                    {
                        "category_id": "default",
                        "category_name": "默认类目",
                    }
                ],
                raw={"permission": "user", "filtered": True}
            )
        return self._service.list_categories()

    async def list_indices(self, current_user: AdminUser, index_name: str | None = None) -> KnowledgeBaseListResponse:
        """
        获取知识库列表.

        参数:
            current_user: 当前管理员.
            index_name: 可选, 按名称过滤.

        返回:
            KnowledgeBaseListResponse: 知识库列表.

        异常:
            HTTPException: Service 调用失败时抛出.
        """
        if self._is_super_admin(current_user):
            return self._service.list_indices(index_name=index_name)

        owner_prefix = self._get_owner_prefix(current_user)
        effective_filter = owner_prefix
        if index_name:
            effective_filter = f"{owner_prefix}{index_name}"
        return self._service.list_indices(index_name=effective_filter)

    async def list_index_files(
        self,
        current_user: AdminUser,
        index_id: str,
        page_number: int | None = None,
        page_size: int | None = None,
    ) -> KnowledgeBaseListResponse:
        """
        获取知识库文件列表.

        参数:
            current_user: 当前管理员.
            index_id: 知识库 ID.
            page_number: 页码.
            page_size: 每页数量.

        返回:
            KnowledgeBaseListResponse: 文件列表.

        异常:
            HTTPException: Service 调用失败时抛出.
        """
        self._ensure_index_access(current_user, index_id)
        return self._service.list_index_files(index_id=index_id, page_number=page_number, page_size=page_size)

    async def upload_text_to_index(
        self,
        current_user: AdminUser,
        index_id: str,
        request: KnowledgeBaseUploadTextRequest,
    ) -> KnowledgeBaseUploadTextResponse:
        """
        上传文本到知识库.

        参数:
            current_user: 当前管理员.
            index_id: 知识库 ID.
            request: 上传请求.

        返回:
            KnowledgeBaseUploadTextResponse: 上传结果.

        异常:
            HTTPException: Service 调用失败时抛出.
        """
        self._ensure_index_access(current_user, index_id)
        return self._service.upload_text_to_index(index_id=index_id, request=request)

    async def rename_index(
        self,
        current_user: AdminUser,
        index_id: str,
        request: KnowledgeBaseRenameIndexRequest,
    ) -> KnowledgeBaseRenameIndexResponse:
        """
        重命名知识库.

        参数:
            current_user: 当前管理员.
            index_id: 知识库 ID.
            request: 重命名请求.

        返回:
            KnowledgeBaseRenameIndexResponse: 重命名结果.

        异常:
            HTTPException: Service 调用失败时抛出.
        """
        self._ensure_index_access(current_user, index_id)
        if self._is_super_admin(current_user):
            return self._service.rename_index(index_id=index_id, request=request)

        owner_prefix = self._get_owner_prefix(current_user)
        index_name = request.index_name
        if not index_name.startswith(owner_prefix):
            index_name = f"{owner_prefix}{index_name}"
        scoped_request = KnowledgeBaseRenameIndexRequest(index_name=index_name)
        return self._service.rename_index(index_id=index_id, request=scoped_request)

    async def delete_index_file(
        self, current_user: AdminUser, index_id: str, file_id: str
    ) -> KnowledgeBaseDeleteResponse:
        """
        删除知识库文件.

        参数:
            current_user: 当前管理员.
            index_id: 知识库 ID.
            file_id: 文件 ID.

        返回:
            KnowledgeBaseDeleteResponse: 删除结果.

        异常:
            HTTPException: Service 调用失败时抛出.
        """
        self._ensure_index_access(current_user, index_id)
        return self._service.delete_index_file(index_id=index_id, file_id=file_id)

    async def delete_index(self, current_user: AdminUser, index_id: str) -> KnowledgeBaseDeleteResponse:
        """
        删除知识库.

        参数:
            current_user: 当前管理员.
            index_id: 知识库 ID.

        返回:
            KnowledgeBaseDeleteResponse: 删除结果.

        异常:
            HTTPException: Service 调用失败时抛出.
        """
        self._ensure_index_access(current_user, index_id)
        return self._service.delete_index(index_id=index_id)


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
    """
    创建知识库 Demo.

    用途:
        用于验证百炼知识库建库与上传链路, 便于联调与问题定位.

    参数:
        request: Demo 创建请求.
        current_user: 当前管理员.

    返回:
        KnowledgeBaseDemoCreateResponse: 创建结果.

    异常:
        HTTPException: 由控制器与服务层透出.
    """
    return await controller.demo_create(request, current_user)


@router.get(
    "/categories",
    response_model=KnowledgeBaseListResponse,
    summary="获取知识库分类列表",
    description="从百炼工作空间读取知识库分类列表.",
    tags=["管理后台"],
)
async def list_categories(current_user: AdminUser) -> KnowledgeBaseListResponse:
    """
    获取知识库分类列表.

    参数:
        current_user: 当前管理员.

    返回:
        KnowledgeBaseListResponse: 分类列表.

    异常:
        HTTPException: 由控制器与服务层透出.
    """
    return await controller.list_categories(current_user)


@router.get(
    "/indices",
    response_model=KnowledgeBaseListResponse,
    summary="获取知识库列表",
    description="从百炼工作空间读取知识库列表(索引列表).",
    tags=["管理后台"],
)
async def list_indices(current_user: AdminUser, index_name: str | None = None) -> KnowledgeBaseListResponse:
    """
    获取知识库列表.

    参数:
        current_user: 当前管理员.
        index_name: 可选, 按名称过滤.

    返回:
        KnowledgeBaseListResponse: 知识库列表.

    异常:
        HTTPException: 由控制器与服务层透出.
    """
    return await controller.list_indices(current_user, index_name=index_name)


@router.get(
    "/indices/{index_id}/files",
    response_model=KnowledgeBaseListResponse,
    summary="获取知识库文件列表",
    description="根据知识库 ID 获取文件明细列表, 支持分页参数.",
    tags=["管理后台"],
)
async def list_index_files(
    current_user: AdminUser,
    index_id: str,
    page_number: int | None = None,
    page_size: int | None = None,
) -> KnowledgeBaseListResponse:
    """
    获取知识库文件列表.

    参数:
        current_user: 当前管理员.
        index_id: 知识库 ID.
        page_number: 页码, 从 1 开始.
        page_size: 每页数量.

    返回:
        KnowledgeBaseListResponse: 文件列表与分页信息.

    异常:
        HTTPException: 由控制器与服务层透出.
    """
    return await controller.list_index_files(
        current_user, index_id=index_id, page_number=page_number, page_size=page_size
    )


@router.post(
    "/indices/{index_id}/files/upload_text",
    response_model=KnowledgeBaseUploadTextResponse,
    summary="上传文本到知识库",
    description="向指定知识库上传文本文件并触发增量解析.",
    tags=["管理后台"],
)
async def upload_text_to_index(
    current_user: AdminUser,
    index_id: str,
    request: KnowledgeBaseUploadTextRequest,
) -> KnowledgeBaseUploadTextResponse:
    """
    上传文本到知识库.

    参数:
        current_user: 当前管理员.
        index_id: 知识库 ID.
        request: 上传请求.

    返回:
        KnowledgeBaseUploadTextResponse: 上传结果.

    异常:
        HTTPException: 由控制器与服务层透出.
    """
    return await controller.upload_text_to_index(current_user, index_id=index_id, request=request)


@router.put(
    "/indices/{index_id}",
    response_model=KnowledgeBaseRenameIndexResponse,
    summary="修改知识库名称",
    description="修改知识库名称(百炼 Index).",
    tags=["管理后台"],
)
async def rename_index(
    current_user: AdminUser,
    index_id: str,
    request: KnowledgeBaseRenameIndexRequest,
) -> KnowledgeBaseRenameIndexResponse:
    """
    重命名知识库.

    参数:
        current_user: 当前管理员.
        index_id: 知识库 ID.
        request: 重命名请求.

    返回:
        KnowledgeBaseRenameIndexResponse: 重命名结果.

    异常:
        HTTPException: 由控制器与服务层透出.
    """
    return await controller.rename_index(current_user, index_id=index_id, request=request)


@router.delete(
    "/indices/{index_id}/files/{file_id}",
    response_model=KnowledgeBaseDeleteResponse,
    summary="删除知识库文件",
    description="从知识库移除文件并删除文件资源.",
    tags=["管理后台"],
)
async def delete_index_file(current_user: AdminUser, index_id: str, file_id: str) -> KnowledgeBaseDeleteResponse:
    """
    删除知识库文件.

    参数:
        current_user: 当前管理员.
        index_id: 知识库 ID.
        file_id: 文件 ID.

    返回:
        KnowledgeBaseDeleteResponse: 删除结果.

    异常:
        HTTPException: 由控制器与服务层透出.
    """
    return await controller.delete_index_file(current_user, index_id=index_id, file_id=file_id)


@router.delete(
    "/indices/{index_id}",
    response_model=KnowledgeBaseDeleteResponse,
    summary="删除知识库",
    description="删除知识库(百炼 Index).",
    tags=["管理后台"],
)
async def delete_index(current_user: AdminUser, index_id: str) -> KnowledgeBaseDeleteResponse:
    """
    删除知识库.

    参数:
        current_user: 当前管理员.
        index_id: 知识库 ID.

    返回:
        KnowledgeBaseDeleteResponse: 删除结果.

    异常:
        HTTPException: 由控制器与服务层透出.
    """
    return await controller.delete_index(current_user, index_id=index_id)
