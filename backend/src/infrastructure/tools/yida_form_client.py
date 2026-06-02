#!/usr/bin/env python
# 文件名: yida_form_client.py
# 作者: wuhao
# 日期: 2026_06_02_22:00:00
# 描述: 宜搭表单创建客户端, 支持钉钉 access_token 和 Cookie 两种认证方式

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
        调用宜搭 API 创建表单和操作表单数据.
        注意: 创建表单Schema需要使用Cookie认证(内部接口), 操作表单数据可用systemToken.
    参数:
        base_url: 宜搭站点根地址.
        csrf_token: 宜搭登录态 csrf_token(Cookie方式需要).
        cookie: 宜搭登录态 Cookie 字符串(Cookie方式需要).
        system_token: 宜搭应用 systemToken(开放API方式需要).
        app_key: 钉钉应用 appKey(可选).
        app_secret: 钉钉应用 appSecret(可选).
        timeout: HTTP 超时时间, 单位秒.
    返回值:
        None.
    异常:
        无.
    """

    _DEFAULT_BASE_URL = "https://www.aliwork.com"
    _DINGTALK_API_BASE = "https://api.dingtalk.com"
    _YIDA_OPEN_API_BASE = "https://s-api.alibaba-inc.com/yida_vpc/form"

    def __init__(
        self,
        base_url: str | None = None,
        csrf_token: str | None = None,
        cookie: str | None = None,
        system_token: str | None = None,
        app_key: str | None = None,
        app_secret: str | None = None,
        timeout: int | None = None,
    ) -> None:
        """
        初始化宜搭表单创建客户端.

        用途:
            读取运行时环境中的宜搭配置.
            创建表单Schema必须使用Cookie认证(内部接口).
            操作表单数据可用systemToken(开放API).
        参数:
            base_url: 宜搭站点根地址.
            csrf_token: 宜搭登录态 csrf_token.
            cookie: 宜搭登录态 Cookie 字符串.
            system_token: 宜搭应用 systemToken.
            app_key: 钉钉应用 appKey.
            app_secret: 钉钉应用 appSecret.
            timeout: HTTP 超时时间.
        返回值:
            None.
        异常:
            无.
        """
        self._base_url = self._normalize_base_url(base_url or os.getenv("YIDA_BASE_URL", self._DEFAULT_BASE_URL))
        self._csrf_token = str(csrf_token or os.getenv("YIDA_CSRF_TOKEN", "")).strip()
        self._cookie = str(cookie or os.getenv("YIDA_COOKIE", "")).strip()
        self._system_token = str(system_token or os.getenv("YIDA_SYSTEM_TOKEN", "")).strip()
        self._app_key = str(app_key or os.getenv("DINGTALK_APP_KEY", "")).strip()
        self._app_secret = str(app_secret or os.getenv("DINGTALK_APP_SECRET", "")).strip()
        self._timeout = int(timeout or os.getenv("YIDA_TIMEOUT", "30"))
        self._access_token: str | None = None
        self._token_expire_time: float = 0

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
        # 暂时跳过 updateFormConfig 步骤，该步骤非必需
        # try:
        #     await self._update_form_config(app_type=app_type, form_uuid=form_uuid, version=version)
        # except Exception as e:
        #     logger.warning(f"[宜搭] 更新表单配置失败(非必需步骤): {str(e)}")
        logger.info(f"[宜搭表单创建] 创建成功 | app_type={app_type} | form_uuid={form_uuid} | form_title={form_title}")
        return YidaCreateFormResult(
            app_type=app_type,
            form_uuid=form_uuid,
            form_title=form_title,
            version=version,
            base_url=self._base_url,
        )

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
        import time

        if not self._app_key or not self._app_secret:
            raise ConfigurationError(message="钉钉 appKey 或 appSecret 未配置")

        now = time.time()
        if self._access_token and now < self._token_expire_time:
            return self._access_token

        request_url = f"{self._DINGTALK_API_BASE}/v1.0/oauth2/accessToken"
        payload = {"appKey": self._app_key, "appSecret": self._app_secret}
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(request_url, json=payload)
                response.raise_for_status()
                data = response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise ExternalServiceError(message="获取钉钉 access token 失败") from error

        self._access_token = str(data.get("accessToken", "")).strip()
        expires_in = int(data.get("expiresIn", 7200))
        self._token_expire_time = now + expires_in - 60

        if not self._access_token:
            raise ExternalServiceError(message="钉钉 access token 响应缺少 accessToken")

        logger.debug(f"[宜搭] 获取钉钉 access_token 成功 | expires_in={expires_in}s")
        return self._access_token

    async def _create_blank_form(self, app_type: str, form_title: str) -> str:
        """
        创建空白宜搭表单.

        用途:
            调用 saveFormSchemaInfo 接口生成空白表单并获取 formUuid.
            注意: 此接口为内部接口, 必须使用Cookie认证.
        参数:
            app_type: 宜搭应用 ID.
            form_title: 表单标题.
        返回值:
            str: 新创建的表单 UUID.
        异常:
            ExternalServiceError: 当接口调用失败或返回缺少 formUuid 时抛出.
            ConfigurationError: 当Cookie配置缺失时抛出.
        """
        if not self._cookie or not self._csrf_token:
            raise ConfigurationError(message="创建表单Schema需要Cookie认证, 请配置 YIDA_COOKIE 和 YIDA_CSRF_TOKEN")

        payload = {
            "_csrf_token": self._csrf_token,
            "formType": "receipt",
            "title": json.dumps(self._build_i18n_text(form_title), ensure_ascii=False),
        }
        data = await self._post_request(
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
            注意: 此接口为内部接口, 必须使用Cookie认证.
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
            "schemaVersion": "5.0",
        }
        await self._post_request_form_design(
            app_type=app_type,
            api_name="saveFormSchema",
            payload=payload,
            use_cookie_only=True,
        )

    async def _update_form_config(self, app_type: str, form_uuid: str, version: int) -> None:
        """
        更新宜搭表单配置.

        用途:
            调用 updateFormConfig 接口关闭 MINI_RESOURCE 开关, 让表单配置与 openyida 默认行为保持一致.
            注意: 此接口为内部接口, 必须使用Cookie认证.
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
        await self._post_request(
            app_type=app_type,
            api_name="updateFormConfig",
            payload=payload,
            prefix="",
            use_cookie_only=True,
        )

    async def _post_request(
        self,
        app_type: str,
        api_name: str,
        payload: dict[str, str],
        prefix: str,
        use_cookie_only: bool = False,
    ) -> dict[str, Any]:
        """
        发送宜搭 API POST 请求.

        用途:
            统一处理宜搭接口的 URL 构造, 请求头构建与错误解析.
            内部接口必须使用Cookie认证(use_cookie_only=True).
            开放API可使用systemToken认证.
        参数:
            app_type: 宜搭应用 ID.
            api_name: 宜搭接口名称.
            payload: 表单提交参数.
            prefix: 接口路径前缀, 如 `_view`.
            use_cookie_only: 是否强制使用Cookie认证(内部接口必需).
        返回值:
            dict[str, Any]: 接口响应 JSON.
        异常:
            ExternalServiceError: 当 HTTP 请求失败或响应结构异常时抛出.
            ConfigurationError: 当Cookie缺失且use_cookie_only=True时抛出.
        """
        request_url = self._build_request_url(app_type=app_type, api_name=api_name, prefix=prefix)
        headers = await self._build_headers(use_cookie_only=use_cookie_only)

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

    async def _post_request_form_design(
        self,
        app_type: str,
        api_name: str,
        payload: dict[str, str],
        use_cookie_only: bool = False,
    ) -> dict[str, Any]:
        """
        发送宜搭 formDesign 路径的 API POST 请求.

        用途:
            处理路径为 /formDesign/xxx.json 的宜搭接口.
            如 saveFormSchema 需要使用此路径才能成功保存表单配置.
        参数:
            app_type: 宜搭应用 ID.
            api_name: 宜搭接口名称.
            payload: 表单提交参数.
            use_cookie_only: 是否强制使用Cookie认证(内部接口必需).
        返回值:
            dict[str, Any]: 接口响应 JSON.
        异常:
            ExternalServiceError: 当 HTTP 请求失败或响应结构异常时抛出.
            ConfigurationError: 当Cookie缺失且use_cookie_only=True时抛出.
        """
        request_url = f"{self._base_url}/dingtalk/web/{app_type}/formDesign/{api_name}.json"
        headers = await self._build_headers(use_cookie_only=use_cookie_only)

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

    def _build_request_url(self, app_type: str, api_name: str, prefix: str) -> str:
        """
        构建宜搭接口地址.

        用途:
            统一拼接宜搭应用接口路径.
        参数:
            app_type: 宜搭应用 ID.
            api_name: 接口名称.
            prefix: 接口路径前缀.
        返回值:
            str: 完整接口地址.
        异常:
            无.
        """
        normalized_prefix = f"/{prefix.strip('/')}" if str(prefix).strip("/") else ""
        return f"{self._base_url}/dingtalk/web/{app_type}{normalized_prefix}/query/formdesign/{api_name}.json"

    async def _build_headers(self, use_cookie_only: bool = False) -> dict[str, str]:
        """
        构建宜搭请求头.

        用途:
            根据接口类型构建认证请求头.
            use_cookie_only=True时强制使用Cookie认证(内部接口必需).
            否则优先使用钉钉 access_token, 回退到Cookie.
        参数:
            use_cookie_only: 是否强制使用Cookie认证.
        返回值:
            dict[str, str]: HTTP 请求头.
        异常:
            ConfigurationError: 当use_cookie_only=True但Cookie缺失时抛出.
        """
        headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept": "application/json, text/plain, */*",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"{self._base_url}/dingtalk/web/default_tianshu_app/appCenter/formDesign",
            "Origin": self._base_url,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }

        if use_cookie_only:
            if not self._cookie:
                raise ConfigurationError(message="内部接口需要Cookie认证, 但YIDA_COOKIE未配置")
            headers["Cookie"] = self._cookie
            logger.debug("[宜搭] 使用 Cookie 认证(内部接口)")
        elif self._app_key and self._app_secret:
            try:
                access_token = await self._get_access_token()
                headers["x-acs-dingtalk-access-token"] = access_token
                logger.debug("[宜搭] 使用钉钉 access_token 认证")
            except Exception as e:
                logger.warning(f"[宜搭] 获取 access_token 失败, 回退到 Cookie 认证: {str(e)}")
                headers["Cookie"] = self._cookie
        elif self._cookie:
            headers["Cookie"] = self._cookie
            logger.debug("[宜搭] 使用 Cookie 认证")

        return headers

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
            在调用外部接口前确保配置已完整.
            支持两种认证方式:
            1. 钉钉 access_token 方式: 需要 appKey 和 appSecret
            2. Cookie 方式: 需要 csrf_token 和 Cookie
        参数:
            无.
        返回值:
            None.
        异常:
            ConfigurationError: 当关键配置缺失时抛出.
        """
        if not self._base_url:
            raise ConfigurationError(message="YIDA_BASE_URL 未配置")

        if self._app_key and self._app_secret:
            return

        if self._csrf_token and self._cookie:
            return

        raise ConfigurationError(
            message="宜搭配置不完整. 请配置以下任一方式:\n"
            "方式一(推荐): DINGTALK_APP_KEY 和 DINGTALK_APP_SECRET\n"
            "方式二: YIDA_CSRF_TOKEN 和 YIDA_COOKIE"
        )

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
