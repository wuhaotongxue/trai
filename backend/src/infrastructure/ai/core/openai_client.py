#!/usr/bin/env python
# 文件名: openai_client.py
# 作者: wuhao
# 日期: 2026_04_16_16:42:28
# 描述: OpenAI 客户端适配器(支持 Vision 多模态,abort 中断,流式 token 统计)

from __future__ import annotations

import asyncio
import mimetypes
import os
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any

import httpx
from loguru import logger

from core.exceptions import ExternalServiceError


@dataclass
class StreamEvent:
    """流式事件"""

    type: str
    content: str = ""
    tool_call_id: str = ""
    tool_name: str = ""
    tool_args: str = ""
    finish_reason: str = ""
    usage: dict[str, Any] = field(default_factory=dict)


class OpenAIClient:
    """OpenAI 客户端"""

    @staticmethod
    def _first_env(*names: str) -> tuple[str, str]:
        """按优先级获取第一个非空环境变量

        Args:
            *names: 环境变量名列表,按优先级排列.

        Returns:
            tuple[str, str]: (env_name, env_value),若都为空则返回 ("","").

        Raises:
            无.
        """
        for name in names:
            value = os.getenv(name, "")
            if value:
                return name, value
        return "", ""

    def __init__(self, provider: str | None = None) -> None:
        self._provider = provider or (os.getenv("LLM_PROVIDER", "openai") or "openai").strip()
        if self._provider == "modelscope":
            self._api_key_env: str = "DASHSCOPE_API_KEY"
            self._api_key_source_env, self._api_key = self._first_env(
                "DASHSCOPE_API_KEY",
                "AI_DASHSCOPE_API_KEY",
                "MODELSCOPE_API_KEY",
            )
            self._api_key = (self._api_key or "").strip()
            self._base_url: str = (
                os.getenv("DASHSCOPE_API_BASE", "")
                or os.getenv("MODELSCOPE_API_BASE", "")
                or os.getenv("AI_DASHSCOPE_API_BASE", "")
                or "https://dashscope.aliyuncs.com/compatible-mode/v1"
            )
            self._base_url = (self._base_url or "").strip()
            self._model: str = os.getenv("DASHSCOPE_CHAT_MODEL", "") or os.getenv("MODELSCOPE_CHAT_MODEL", "qwen-plus")
            self._timeout: int = int(os.getenv("MODELSCOPE_TIMEOUT", "120"))
        elif self._provider == "qwen_vl":
            self._api_key_env: str = "DASHSCOPE_API_KEY"
            self._api_key_source_env, self._api_key = self._first_env(
                "DASHSCOPE_API_KEY",
                "AI_DASHSCOPE_API_KEY",
                "MODELSCOPE_API_KEY",
            )
            self._api_key = (self._api_key or "").strip()
            self._base_url: str = (
                os.getenv("DASHSCOPE_API_BASE", "")
                or os.getenv("MODELSCOPE_API_BASE", "")
                or os.getenv("AI_DASHSCOPE_API_BASE", "")
                or "https://dashscope.aliyuncs.com/compatible-mode/v1"
            )
            self._base_url = (self._base_url or "").strip()
            self._model: str = os.getenv("MODELSCOPE_VISION_MODEL", "Qwen/Qwen2.5-VL-7B-Instruct")
            self._timeout: int = int(os.getenv("MODELSCOPE_TIMEOUT", "300"))
        elif self._provider == "deepseek":
            self._api_key_env = "DEEPSEEK_API_KEY"
            self._api_key: str = (os.getenv("DEEPSEEK_API_KEY", "") or "").strip()
            self._api_key_source_env = "DEEPSEEK_API_KEY" if self._api_key else ""
            self._base_url: str = (os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1") or "").strip()
            self._model: str = (os.getenv("DEEPSEEK_CHAT_MODEL", "deepseek-reasoner") or "").strip()
            self._timeout: int = int(os.getenv("DEEPSEEK_TIMEOUT", "120"))
        else:
            self._api_key_env = "OPENAI_API_KEY"
            self._api_key: str = (os.getenv("OPENAI_API_KEY", "") or "").strip()
            self._api_key_source_env = "OPENAI_API_KEY" if self._api_key else ""
            self._base_url: str = (os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1") or "").strip()
            self._model: str = (os.getenv("OPENAI_MODEL", "gpt-4o") or "").strip()
            self._timeout: int = int(os.getenv("OPENAI_TIMEOUT", "120"))

    def _ensure_api_key(self) -> None:
        """检查 API 密钥配置

        Args:
            None.

        Returns:
            None.

        Raises:
            ExternalServiceError: 密钥缺失时抛出.
        """
        if self._api_key:
            return
        raise ExternalServiceError(
            message="LLM API 密钥未配置",
            details={
                "provider": self._provider,
                "api_key_env": self._api_key_env,
                "api_key_source_env": getattr(self, "_api_key_source_env", ""),
                "base_url": self._base_url,
            },
        )

    def _build_auth_headers(self) -> dict[str, str]:
        self._ensure_api_key()
        return {
            "Authorization": f"Bearer {self._api_key}",
        }

    def _get_stt_model(self) -> str:
        if self._provider == "modelscope":
            return os.getenv("STT_MODEL", "") or os.getenv("MODELSCOPE_STT_MODEL", "") or "sensevoice-v1"
        return (
            os.getenv("STT_MODEL", "")
            or os.getenv("OPENAI_STT_MODEL", "")
            or os.getenv("OPENAI_WHISPER_MODEL", "")
            or "whisper-1"
        )

    def _get_tts_model(self) -> str:
        return os.getenv("TTS_MODEL", "") or os.getenv("OPENAI_TTS_MODEL", "") or "gpt-4o-mini-tts"

    async def transcribe_audio(
        self,
        file,
        language: str | None = None,
        response_format: str = "json",
        model: str | None = None,
    ) -> dict[str, Any] | str:
        """语音转文字(STT), OpenAI 兼容接口: /audio/transcriptions"""
        headers = self._build_auth_headers()
        url = f"{self._base_url}/audio/transcriptions"

        filename = getattr(file, "name", "") or "audio.wav"
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

        try:
            file_bytes = file.read() if hasattr(file, "read") else file
            if not isinstance(file_bytes, (bytes, bytearray)):
                raise TypeError("audio file must be bytes or a file-like object")

            data: dict[str, Any] = {
                "model": model or self._get_stt_model(),
                "response_format": response_format,
            }
            if language:
                data["language"] = language

            files = {
                "file": (os.path.basename(filename), file_bytes, content_type),
            }

            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(url, headers=headers, data=data, files=files)
                response.raise_for_status()

                if response_format in {"json", "verbose_json"}:
                    return response.json()
                return response.text

        except httpx.HTTPStatusError as e:
            logger.warning(f"STT HTTP 错误 | 状态码: {e.response.status_code} | 响应: {e.response.text}")
            raise ExternalServiceError(
                message=f"STT 请求失败: status_code={e.response.status_code} - {e.response.text}",
                details={
                    "provider": self._provider,
                    "base_url": self._base_url,
                    "status_code": e.response.status_code,
                },
            )
        except ExternalServiceError:
            raise
        except Exception as e:
            err_msg = str(e) or repr(e)
            logger.warning(f"STT 请求异常 | 错误: {err_msg}")
            raise ExternalServiceError(
                message=f"STT 请求异常: {err_msg}",
                details={
                    "provider": self._provider,
                    "base_url": self._base_url,
                    "error": err_msg,
                },
            )

    async def synthesize_speech(
        self,
        text: str,
        voice: str = "alloy",
        response_format: str = "mp3",
        speed: float = 1.0,
        model: str | None = None,
    ) -> bytes:
        """文字转语音(TTS), OpenAI 兼容接口: /audio/speech"""
        headers = self._build_auth_headers()
        url = f"{self._base_url}/audio/speech"

        payload: dict[str, Any] = {
            "model": model or self._get_tts_model(),
            "input": text,
            "voice": voice,
            "response_format": response_format,
            "speed": speed,
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return response.content

        except httpx.HTTPStatusError as e:
            logger.error(f"TTS HTTP 错误 | 状态码: {e.response.status_code} | 响应: {e.response.text}")
            raise ExternalServiceError(
                message=f"TTS 请求失败: status_code={e.response.status_code} - {e.response.text}",
                details={
                    "provider": self._provider,
                    "base_url": self._base_url,
                    "status_code": e.response.status_code,
                },
            )
        except ExternalServiceError:
            raise
        except Exception as e:
            logger.error(f"TTS 请求异常 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"TTS 请求异常: {str(e)}",
                details={
                    "provider": self._provider,
                    "base_url": self._base_url,
                    "error": str(e),
                },
            )

    async def chat(
        self,
        messages: list[dict[str, Any]] | str,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict[str, Any]] | None = None,
        tool_choice: str | None = None,
    ) -> dict[str, Any]:
        """发送对话请求

        Args:
            messages: 消息列表(支持多模态 Vision 内容) 或 纯文本字符串(将自动包装为 user 消息)
                文本消息: {"role": "user", "content": "text"}
                图片消息: {"role": "user", "content": [
                    {"type": "text", "text": "..."},
                    {"type": "image_url", "image_url": {"url": "https://..."}},
                ]}
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大 token 数
            tools: OpenAI tool_calls 格式的工具定义列表
            tool_choice: 工具选择策略: "auto" | "none" 或具体工具名

        Returns:
            dict: 响应结果
        """
        self._ensure_api_key()

        # 健壮性处理: 如果传入的是字符串,自动包装为 messages 列表
        if isinstance(messages, str):
            logger.warning(f"检测到非标准调用: chat() 接收到字符串 messages,已自动包装为 list[dict]. 内容预览: {messages[:50]}...")
            messages = [{"role": "user", "content": messages}]

        url = f"{self._base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": model or self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = tool_choice or "auto"

        logger.info(
            f"LLM 请求 | provider: {self._provider} | 模型: {payload['model']} | 工具数: {len(tools) if tools else 0}"
        )

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                return {
                    "content": data["choices"][0]["message"].get("content", ""),
                    "reasoning_content": data["choices"][0]["message"].get("reasoning_content", ""),
                    "model": data["model"],
                    "usage": data.get("usage", {}),
                    "tool_calls": data["choices"][0]["message"].get("tool_calls", []),
                    "finish_reason": data["choices"][0].get("finish_reason", ""),
                }

        except httpx.HTTPStatusError as e:
            logger.error(f"LLM HTTP 错误 | 状态码: {e.response.status_code} | 响应: {e.response.text}")
            if e.response.status_code == 400:
                logger.error(f"导致 400 错误的 Payload: {payload}")
            provider_hint = f"provider={self._provider}, api_key_env={self._api_key_env}"
            raise ExternalServiceError(
                message=f"LLM API 请求失败: {provider_hint}, status_code={e.response.status_code} - {e.response.text}",
                details={
                    "provider": self._provider,
                    "api_key_env": self._api_key_env,
                    "base_url": self._base_url,
                    "status_code": e.response.status_code,
                },
            )
        except ExternalServiceError:
            raise
        except Exception as e:
            logger.error(f"LLM 请求异常 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"LLM API 请求异常: {str(e)}",
                details={
                    "provider": self._provider,
                    "api_key_env": self._api_key_env,
                    "base_url": self._base_url,
                    "error": str(e),
                },
            )

    async def chat_stream(
        self,
        messages: list[dict[str, Any]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict[str, Any]] | None = None,
        abort_event: asyncio.Event | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """发送流式对话请求(支持 Vision / abort / token 统计)

        事件流格式:
        - token: 普通文本片段
        - tool_call_start: 工具调用开始
        - tool_call_arg: 工具参数增量
        - tool_call_end: 工具调用结束
        - done: 流结束,包含 usage 统计

        Args:
            messages: 消息列表(支持多模态 Vision 内容)
            model: 模型名称
            temperature: 温度参数
            max_tokens: 最大 token 数
            tools: OpenAI tool_calls 格式的工具定义列表
            abort_event: 中断信号,为 None 则忽略

        Yields:
            StreamEvent: 流式事件
        """
        self._ensure_api_key()

        url = f"{self._base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": model or self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        if tools:
            payload["tools"] = tools

        # 添加思考过程支持 (DeepSeek v4 模型)
        if (model or self._model) in ["deepseek-v4-pro", "deepseek-v4-flash"]:
            payload["reasoning_effort"] = "high"
            payload["extra_body"] = {"thinking": {"type": "enabled"}}

        logger.info(f"LLM 流式请求 | provider: {self._provider} | 模型: {payload['model']}")

        tool_call_id = ""
        tool_name = ""
        tool_args_parts: list[str] = []
        in_tool_call = False

        logger.info("[Stream] 开始处理流式响应")

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code >= 400:
                        err_bytes = await response.aread()
                        err_text = err_bytes.decode("utf-8", errors="replace")
                        logger.error(
                            "LLM 流式 HTTP 错误 | provider: {} | 状态码: {} | 响应: {}",
                            self._provider,
                            response.status_code,
                            err_text,
                        )
                        provider_hint = f"provider={self._provider}, api_key_env={self._api_key_env}"
                        raise ExternalServiceError(
                            message=f"LLM API 流式请求失败: {provider_hint}, status_code={response.status_code} - {err_text}",
                            details={
                                "provider": self._provider,
                                "api_key_env": self._api_key_env,
                                "base_url": self._base_url,
                                "status_code": response.status_code,
                            },
                        )
                    async for line in response.aiter_lines():
                        if abort_event and abort_event.is_set():
                            logger.info("流式请求被 abort 终止")
                            yield StreamEvent(type="abort", content="请求已被取消")
                            break

                        if not line or not line.startswith("data: "):
                            continue

                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break

                        import json

                        try:
                            chunk = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue

                        if "choices" not in chunk or not chunk["choices"]:
                            continue

                        choice = chunk["choices"][0]
                        delta = choice.get("delta", {})

                        # 兼容处理思维链 (reasoning_content)
                        if "reasoning_content" in delta and delta["reasoning_content"]:
                            yield StreamEvent(type="reasoning", content=delta["reasoning_content"])

                        # 正常内容文本
                        if "content" in delta and delta["content"]:
                            yield StreamEvent(type="token", content=delta["content"])

                        # 处理 tool_calls
                        if "tool_calls" in delta and delta["tool_calls"]:
                            tc = delta["tool_calls"][0]
                            logger.info(f"[Stream] 收到 tool_call 块: {repr(tc)}")

                            # 只要有 function.name 就更新, 不管是哪个块!
                            if tc.get("function", {}).get("name"):
                                new_name = tc["function"]["name"]
                                if tool_name != new_name:
                                    logger.info(f"[Stream] 更新 tool_name 更新: {tool_name} → {new_name}")
                                    tool_name = new_name

                            # 新的一个工具调用开始
                            if tc.get("id"):
                                logger.info(f"[Stream] 新工具调用开始: id={tc['id']}, name={tool_name}")
                                # 如果上一个工具还在处理中,则先发送结束事件
                                if in_tool_call and tool_call_id:
                                    logger.info(
                                        f"[Stream] 结束前一个工具调用: id={tool_call_id}, args={repr(''.join(tool_args_parts))}"
                                    )
                                    yield StreamEvent(
                                        type="tool_call_end",
                                        tool_call_id=tool_call_id,
                                        tool_name=tool_name,
                                        content="".join(tool_args_parts),
                                        finish_reason="",
                                    )

                                in_tool_call = True
                                tool_call_id = tc["id"]
                                tool_args_parts = []
                                arg_text = tc.get("function", {}).get("arguments", "")
                                if arg_text:
                                    logger.info(f"[Stream] 初始参数块: {repr(arg_text)}")
                                    tool_args_parts.append(arg_text)
                                    yield StreamEvent(
                                        type="tool_call_arg",
                                        tool_call_id=tool_call_id,
                                        tool_name=tool_name,
                                        content=arg_text,
                                    )
                            else:
                                # 参数追加
                                arg_text = tc.get("function", {}).get("arguments", "")
                                if arg_text:
                                    logger.info(f"[Stream] 追加参数块: {repr(arg_text)}")
                                    tool_args_parts.append(arg_text)
                                    logger.info(
                                        f"[Stream] 当前 tool_args_parts 总长度: {len(tool_args_parts)}, 内容: {repr(''.join(tool_args_parts))}"
                                    )
                                    yield StreamEvent(
                                        type="tool_call_arg",
                                        tool_call_id=tool_call_id,
                                        tool_name=tool_name,
                                        content=arg_text,
                                    )

                        # 处理完成和 usage
                        finish_reason = choice.get("finish_reason")
                        if finish_reason is not None:
                            if in_tool_call and tool_call_id:
                                final_args = "".join(tool_args_parts)
                                logger.info(
                                    f"[Stream] 工具调用结束 (finish_reason={finish_reason}): id={tool_call_id}, name={tool_name}, final_args={repr(final_args)}"
                                )
                                yield StreamEvent(
                                    type="tool_call_end",
                                    tool_call_id=tool_call_id,
                                    tool_name=tool_name,
                                    content=final_args,
                                    finish_reason=finish_reason,
                                )
                                in_tool_call = False
                                tool_call_id = ""
                                tool_name = ""
                                tool_args_parts = []

                            # 如果 API 将 usage 放到了最后的 chunk 且外层包含
                            usage = chunk.get("usage", {})
                            if usage:
                                yield StreamEvent(
                                    type="done",
                                    finish_reason=finish_reason,
                                    usage={
                                        "prompt_tokens": usage.get("prompt_tokens", 0),
                                        "completion_tokens": usage.get("completion_tokens", 0),
                                        "total_tokens": usage.get("total_tokens", 0),
                                    },
                                )
                            else:
                                yield StreamEvent(
                                    type="done",
                                    finish_reason=finish_reason,
                                )

        except ExternalServiceError:
            raise
        except Exception as e:
            logger.error(f"LLM 流式请求异常 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"LLM API 流式请求异常: {str(e)}",
                details={
                    "provider": self._provider,
                    "api_key_env": self._api_key_env,
                    "base_url": self._base_url,
                    "error": str(e),
                },
            )


__all__ = ["OpenAIClient", "StreamEvent"]
