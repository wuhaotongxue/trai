#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: yida_form_client.py
# 作者: wuhao
# 日期: 2026_06_02_18:25:48
# 描述: 宜搭表单创建客户端, 负责调用 formdesign 接口创建空白表单并保存 Schema

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

import httpx
from loguru import logger

from core.exceptions import ConfigurationError, ExternalServiceError


@dataclass(slots=True)
class YidaCreateFormResult:
    """
    宜搭表单创建结果.

    用途:
        承载宜搭表单创建成功后的核心返回信息.
    参数:
        app_type: 宜搭应用 ID.
        form_uuid: 新创建的表单 UUID.
        form_title: 表单标题.
        version: 表单版本号.
        base_url: 宜搭站点根地址.
    返回值:
        None.
    异常:
        无.
    """

    app_type: str
    form_uuid: str
    form_title: str
    version: int
    base_url: str


class YidaFormClient:
    """
    宜搭表单创建客户端.

    用途:
        基于宜搭登录态 Cookie 和 csrf_token 调用 formdesign 接口完成表单创建流程.
    参数:
        base_url: 宜搭站点根地址.
        csrf_token: 宜搭登录态 csrf_token.
        cookie: 宜搭登录态 Cookie 字符串.
        timeout: HTTP 超时时间, 单位秒.
    返回值:
        None.
    异常:
        无.
    """

    _DEFAULT_BASE_URL = "https://www.aliwork.com"

    def __init__(
        self,
        base_url: str | None = None,
        csrf_token: str | None = None,
        cookie: str | None = None,
        timeout: int | None = None,
    ) -> None:
        """
        初始化宜搭表单创建客户端.

        用途:
            读取运行时环境中的宜搭登录态配置, 供后续 formdesign 接口调用复用.
        参数:
            base_url: 宜搭站点根地址.
            csrf_token: 宜搭登录态 csrf_token.
            cookie: 宜搭登录态 Cookie 字符串.
            timeout: HTTP 超时时间.
        返回值:
            None.
        异常:
            无.
        """
        self._base_url = self._normalize_base_url(base_url or os.getenv("YIDA_BASE_URL", self._DEFAULT_BASE_URL))
        self._csrf_token = str(csrf_token or os.getenv("YIDA_CSRF_TOKEN", "")).strip()
        self._cookie = str(cookie or os.getenv("YIDA_COOKIE", "")).strip()
        self._timeout = int(timeout or os.getenv("YIDA_TIMEOUT", "30"))

    async def create_form(
        self,
        app_type: str,
        form_title: str,
        schema: dict[str, object],
    ) -> YidaCreateFormResult:
        """
        创建宜搭表单并保存 Schema.

        用途:
            串联创建空白表单, 保存 Schema 和更新配置三步, 返回最终表单标识.
        参数:
            app_type: 宜搭应用 ID.
            form_title: 表单标题.
            schema: 已生成的宜搭 Schema.
        返回值:
            YidaCreateFormResult: 创建结果对象.
        异常:
            ConfigurationError: 当宜搭配置缺失时抛出.
            ExternalServiceError: 当宜搭接口调用失败时抛出.
        """
        self._ensure_configuration()
        form_uuid = await self._create_blank_form(app_type=app_type, form_title=form_title)
        version = 1
        await self._save_form_schema(app_type=app_type, form_uuid=form_uuid, schema=schema)
        await self._update_form_config(app_type=app_type, form_uuid=form_uuid, version=version)
        logger.info(
            "[宜搭表单创建] 创建成功 | "
            f"app_type={app_type} | form_uuid={form_uuid} | form_title={form_title}"
        )
        return YidaCreateFormResult(
            app_type=app_type,
            form_uuid=form_uuid,
            form_title=form_title,
            version=version,
            base_url=self._base_url,
        )

    async def _create_blank_form(self, app_type: str, form_title: str) -> str:
        """
        创建空白宜搭表单.

        用途:
            调用 saveFormSchemaInfo 接口生成空白表单并获取 formUuid.
        参数:
            app_type: 宜搭应用 ID.
            form_title: 表单标题.
        返回值:
            str: 新创建的表单 UUID.
        异常:
            ExternalServiceError: 当接口调用失败或返回缺少 formUuid 时抛出.
        """
        payload = {
            "_csrf_token": self._csrf_token,
            "formType": "receipt",
            "title": json.dumps(self._build_i18n_text(form_title), ensure_ascii=False),
        }
        data = await self._post_formdesign(
            app_type=app_type,
            api_name="saveFormSchemaInfo",
            payload=payload,
            prefix="",
        )
        form_uuid = str(data.get("content", {}).get("formUuid", "")).strip()
        if not form_uuid:
            raise ExternalServiceError(message="宜搭创建空白表单失败, 未返回 formUuid")
        return form_uuid

    async def _save_form_schema(
        self,
        app_type: str,
        form_uuid: str,
        schema: dict[str, object],
    ) -> None:
        """
        保存宜搭表单 Schema.

        用途:
            调用 saveFormSchema 接口将完整 superform Schema 写入新创建的表单.
        参数:
            app_type: 宜搭应用 ID.
            form_uuid: 表单 UUID.
            schema: 宜搭 Schema 内容.
        返回值:
            None.
        异常:
            ExternalServiceError: 当接口调用失败时抛出.
        """
        payload = {
            "_csrf_token": self._csrf_token,
            "formUuid": form_uuid,
            "content": json.dumps(schema, ensure_ascii=False),
            "schemaVersion": "V5",
            "importSchema": "true",
        }
        await self._post_formdesign(
            app_type=app_type,
            api_name="saveFormSchema",
            payload=payload,
            prefix="_view",
        )

    async def _update_form_config(self, app_type: str, form_uuid: str, version: int) -> None:
        """
        更新宜搭表单配置.

        用途:
            调用 updateFormConfig 接口关闭 MINI_RESOURCE 开关, 让表单配置与 openyida 默认行为保持一致.
        参数:
            app_type: 宜搭应用 ID.
            form_uuid: 表单 UUID.
            version: 当前表单版本号.
        返回值:
            None.
        异常:
            ExternalServiceError: 当接口调用失败时抛出.
        """
        payload = {
            "_csrf_token": self._csrf_token,
            "formUuid": form_uuid,
            "version": str(version),
            "configType": "MINI_RESOURCE",
            "value": "0",
        }
        await self._post_formdesign(
            app_type=app_type,
            api_name="updateFormConfig",
            payload=payload,
            prefix="",
        )

    async def _post_formdesign(
        self,
        app_type: str,
        api_name: str,
        payload: dict[str, str],
        prefix: str,
    ) -> dict[str, Any]:
        """
        发送 formdesign POST 请求.

        用途:
            统一处理宜搭 formdesign 接口的 URL 构造, 表单提交与错误解析.
        参数:
            app_type: 宜搭应用 ID.
            api_name: formdesign 接口名称.
            payload: 表单提交参数.
            prefix: 接口路径前缀, 如 `_view`.
        返回值:
            dict[str, Any]: 接口响应 JSON.
        异常:
            ExternalServiceError: 当 HTTP 请求失败或响应结构异常时抛出.
        """
        request_url = self._build_formdesign_url(app_type=app_type, api_name=api_name, prefix=prefix)
        headers = self._build_headers()
        try:
            async with httpx.AsyncClient(timeout=self._timeout, follow_redirects=True) as client:
                response = await client.post(request_url, data=payload, headers=headers)
        except httpx.HTTPError as error:
            raise ExternalServiceError(message=f"宜搭接口调用失败: {api_name}") from error
        if response.status_code >= 400:
            raise ExternalServiceError(
                message=f"宜搭接口响应异常: {api_name}",
                details={"status_code": response.status_code, "response_text": response.text[:500]},
            )
        data = self._parse_json_response(response=response, api_name=api_name)
        self._raise_if_yida_failed(api_name=api_name, data=data)
        return data

    def _build_formdesign_url(self, app_type: str, api_name: str, prefix: str) -> str:
        """
        构建宜搭 formdesign 接口地址.

        用途:
            统一拼接宜搭应用 formdesign 相关接口路径.
        参数:
            app_type: 宜搭应用 ID.
            api_name: formdesign 接口名称.
            prefix: 接口路径前缀.
        返回值:
            str: 完整接口地址.
        异常:
            无.
        """
        normalized_prefix = f"/{prefix.strip('/')}" if str(prefix).strip("/") else ""
        return f"{self._base_url}/dingtalk/web/{app_type}{normalized_prefix}/query/formdesign/{api_name}.json"

    def _build_headers(self) -> dict[str, str]:
        """
        构建宜搭请求头.

        用途:
            注入 Cookie 与标准 form 提交头, 保障 formdesign 接口鉴权通过.
        参数:
            无.
        返回值:
            dict[str, str]: HTTP 请求头.
        异常:
            无.
        """
        return {
            "Cookie": self._cookie,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json, text/plain, */*",
            "X-Requested-With": "XMLHttpRequest",
        }

    def _parse_json_response(self, response: httpx.Response, api_name: str) -> dict[str, Any]:
        """
        解析接口 JSON 响应.

        用途:
            将宜搭返回体转换为字典, 并在非 JSON 场景下抛出明确异常.
        参数:
            response: HTTP 响应对象.
            api_name: 接口名称.
        返回值:
            dict[str, Any]: 解析后的 JSON 字典.
        异常:
            ExternalServiceError: 当响应无法解析为 JSON 时抛出.
        """
        try:
            parsed = response.json()
        except ValueError as error:
            raise ExternalServiceError(
                message=f"宜搭接口返回非 JSON 响应: {api_name}",
                details={"response_text": response.text[:500]},
            ) from error
        if not isinstance(parsed, dict):
            raise ExternalServiceError(message=f"宜搭接口返回结构异常: {api_name}")
        return parsed

    def _raise_if_yida_failed(self, api_name: str, data: dict[str, Any]) -> None:
        """
        检查宜搭业务响应是否失败.

        用途:
            根据 success, errorCode 和 errorMsg 字段统一抛出业务异常.
        参数:
            api_name: 接口名称.
            data: 接口响应 JSON.
        返回值:
            None.
        异常:
            ExternalServiceError: 当宜搭业务返回失败时抛出.
        """
        if bool(data.get("success", False)):
            return
        error_code = str(data.get("errorCode", "")).strip()
        error_message = str(data.get("errorMsg", "")).strip() or f"宜搭接口返回失败: {api_name}"
        raise ExternalServiceError(
            message=error_message,
            details={"api_name": api_name, "error_code": error_code, "response": data},
        )

    def _ensure_configuration(self) -> None:
        """
        校验宜搭运行配置.

        用途:
            在调用外部接口前确保 base_url, csrf_token 和 Cookie 已配置完整.
        参数:
            无.
        返回值:
            None.
        异常:
            ConfigurationError: 当关键配置缺失时抛出.
        """
        if not self._base_url:
            raise ConfigurationError(message="YIDA_BASE_URL 未配置")
        if not self._csrf_token:
            raise ConfigurationError(message="YIDA_CSRF_TOKEN 未配置, 无法调用宜搭表单创建接口")
        if not self._cookie:
            raise ConfigurationError(message="YIDA_COOKIE 未配置, 无法调用宜搭表单创建接口")

    def _normalize_base_url(self, base_url: str) -> str:
        """
        规范化宜搭基础地址.

        用途:
            去除末尾斜杠, 避免后续 URL 拼接出现双斜杠.
        参数:
            base_url: 原始基础地址.
        返回值:
            str: 规范化后的基础地址.
        异常:
            无.
        """
        return str(base_url).strip().rstrip("/")

    def _build_i18n_text(self, text: str) -> dict[str, str]:
        """
        构建表单标题 i18n 结构.

        用途:
            将表单标题转换为 saveFormSchemaInfo 接口要求的多语言格式.
        参数:
            text: 原始标题文本.
        返回值:
            dict[str, str]: i18n 文本对象.
        异常:
            无.
        """
        normalized_text = str(text).strip()
        return {
            "zh_CN": normalized_text,
            "en_US": normalized_text,
            "type": "i18n",
        }


__all__ = ["YidaCreateFormResult", "YidaFormClient"]
