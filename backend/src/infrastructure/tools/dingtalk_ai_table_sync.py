#!/usr/bin/env python
# 文件名: dingtalk_ai_table_sync.py
# 作者: wuhao
# 日期: 2026_06_02_18:48:39
# 描述: 钉钉 AI 表格同步器, 负责将考试答卷按配置写入 Notable 数据表

from __future__ import annotations

import json
import os
from typing import Any

import httpx
from loguru import logger

from core.exceptions import ConfigurationError, ExternalServiceError


class DingTalkAiTableSyncService:
    """
    钉钉 AI 表格同步服务.

    用途:
        在配置齐全时, 将考试答卷同步到钉钉 AI 表格指定数据表中.
    参数:
        api_base_url: 钉钉 API 根地址.
        app_key: 企业内部应用 appKey.
        app_secret: 企业内部应用 appSecret.
        base_id: AI 表格 baseId.
        sheet_id: AI 表格 sheetId.
        operator_id: 操作人 unionId.
        timeout_seconds: HTTP 超时时间.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(
        self,
        api_base_url: str | None = None,
        app_key: str | None = None,
        app_secret: str | None = None,
        base_id: str | None = None,
        sheet_id: str | None = None,
        operator_id: str | None = None,
        timeout_seconds: int | None = None,
    ) -> None:
        """
        初始化钉钉 AI 表格同步服务.

        用途:
            读取运行时环境中的钉钉和 AI 表格配置, 供后续同步调用使用.
        参数:
            api_base_url: 钉钉 API 根地址.
            app_key: 企业内部应用 appKey.
            app_secret: 企业内部应用 appSecret.
            base_id: AI 表格 baseId.
            sheet_id: AI 表格 sheetId.
            operator_id: 操作人 unionId.
            timeout_seconds: HTTP 超时时间.
        返回值:
            None.
        异常:
            无.
        """
        self._api_base_url = (
            str(api_base_url or os.getenv("DINGTALK_API_BASE_URL", "https://api.dingtalk.com")).strip().rstrip("/")
        )
        self._app_key = str(app_key or os.getenv("DINGTALK_APP_KEY", "")).strip()
        self._app_secret = str(app_secret or os.getenv("DINGTALK_APP_SECRET", "")).strip()
        self._base_id = str(base_id or os.getenv("DINGTALK_AI_TABLE_BASE_ID", "")).strip()
        self._sheet_id = str(sheet_id or os.getenv("DINGTALK_AI_TABLE_SHEET_ID", "")).strip()
        self._operator_id = str(operator_id or os.getenv("DINGTALK_AI_TABLE_OPERATOR_ID", "")).strip()
        self._timeout_seconds = int(timeout_seconds or os.getenv("DINGTALK_AI_TABLE_TIMEOUT", "20"))

    def is_enabled(self) -> bool:
        """
        判断 AI 表格同步是否启用.

        用途:
            在外部调用同步前快速确认核心配置是否完整.
        参数:
            无.
        返回值:
            bool: True 表示配置完整, False 表示跳过同步.
        异常:
            无.
        """
        return all(
            [
                self._app_key,
                self._app_secret,
                self._base_id,
                self._sheet_id,
                self._operator_id,
            ]
        )

    async def sync_submission(
        self,
        exam_data: dict[str, Any],
        submission_data: dict[str, Any],
    ) -> dict[str, Any]:
        """
        同步考试答卷到 AI 表格.

        用途:
            将答卷转换为 AI 表格记录格式, 再调用钉钉 OpenAPI 写入指定数据表.
        参数:
            exam_data: 已发布考试数据.
            submission_data: 已评分答卷数据.
        返回值:
            dict[str, Any]: 同步结果字典.
        异常:
            ConfigurationError: 当配置缺失且外部仍强制调用时抛出.
            ExternalServiceError: 当钉钉接口调用失败时抛出.
        """
        if not self.is_enabled():
            return {
                "enabled": False,
                "status": "skipped",
                "message": "AI 表格同步未启用",
            }
        access_token = await self._get_access_token()
        payload = self._build_record_payload(exam_data=exam_data, submission_data=submission_data)
        response_data = await self._insert_record(access_token=access_token, payload=payload)
        logger.info(
            "[AI表格同步] 答卷同步完成 | "
            f"exam_id={submission_data.get('exam_id')} | "
            f"submission_id={submission_data.get('submission_id')}"
        )
        return {
            "enabled": True,
            "status": "synced",
            "message": "AI 表格同步成功",
            "response": response_data,
        }

    async def _get_access_token(self) -> str:
        """
        获取钉钉 access token.

        用途:
            使用企业内部应用 appKey 和 appSecret 换取钉钉新版服务端 access token.
        参数:
            无.
        返回值:
            str: access token.
        异常:
            ConfigurationError: 当 appKey 或 appSecret 缺失时抛出.
            ExternalServiceError: 当获取 token 失败时抛出.
        """
        if not self._app_key or not self._app_secret:
            raise ConfigurationError(message="钉钉 appKey 或 appSecret 未配置")
        request_url = f"{self._api_base_url}/v1.0/oauth2/accessToken"
        payload = {"appKey": self._app_key, "appSecret": self._app_secret}
        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.post(request_url, json=payload)
                response.raise_for_status()
                data = response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise ExternalServiceError(message="获取钉钉 access token 失败") from error
        access_token = str(data.get("accessToken", "")).strip()
        if not access_token:
            raise ExternalServiceError(message="钉钉 access token 响应缺少 accessToken")
        return access_token

    async def _insert_record(self, access_token: str, payload: dict[str, Any]) -> dict[str, Any]:
        """
        插入 AI 表格记录.

        用途:
            调用 Notable 数据表新增记录接口写入一条考试答卷.
        参数:
            access_token: 钉钉访问令牌.
            payload: 记录写入请求体.
        返回值:
            dict[str, Any]: 钉钉接口响应 JSON.
        异常:
            ExternalServiceError: 当记录写入失败时抛出.
        """
        request_url = f"{self._api_base_url}/v1.0/notable/bases/{self._base_id}/sheets/{self._sheet_id}/records"
        headers = {
            "x-acs-dingtalk-access-token": access_token,
            "Content-Type": "application/json",
        }
        params = {"operatorId": self._operator_id}
        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.post(request_url, headers=headers, params=params, json=payload)
                response.raise_for_status()
                data = response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise ExternalServiceError(message="写入 AI 表格记录失败") from error
        return data if isinstance(data, dict) else {"result": data}

    def _build_record_payload(
        self,
        exam_data: dict[str, Any],
        submission_data: dict[str, Any],
    ) -> dict[str, Any]:
        """
        构建 AI 表格记录请求体.

        用途:
            将考试和答卷数据组装为一条记录的字段对象.
        参数:
            exam_data: 已发布考试数据.
            submission_data: 已评分答卷数据.
        返回值:
            dict[str, Any]: 钉钉 AI 表格新增记录请求体.
        异常:
            无.
        """
        paper = exam_data.get("paper", {})
        return {
            "records": [
                {
                    "fields": {
                        "考试标题": str(paper.get("paper_title", "")),
                        "分享令牌": str(exam_data.get("share_token", "")),
                        "答题人姓名": str(submission_data.get("candidate_name", "")),
                        "答题人部门": str(submission_data.get("candidate_department", "")),
                        "自动得分": int(submission_data.get("score", 0)),
                        "试卷总分": int(submission_data.get("total_score", 0)),
                        "需人工复核": "是" if bool(submission_data.get("requires_manual_review", False)) else "否",
                        "提交时间": str(submission_data.get("submitted_at", "")),
                        "答案JSON": self._serialize_answers(answers=submission_data.get("answers", [])),
                    }
                }
            ]
        }

    def _serialize_answers(self, answers: Any) -> str:
        """
        序列化答卷答案列表.

        用途:
            将答案列表转成 JSON 字符串, 便于存入文本字段做审计和追溯.
        参数:
            answers: 原始答案对象.
        返回值:
            str: JSON 字符串.
        异常:
            无.
        """
        try:
            return json.dumps(answers, ensure_ascii=False)
        except TypeError:
            return "[]"


__all__ = ["DingTalkAiTableSyncService"]
