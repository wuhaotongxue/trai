#!/usr/bin/env python
# 文件名: error_log_recorder.py
# 作者: wuhao
# 日期: 2026_05_22_17:29:22
# 描述: 统一错误日志记录器, 用于将后端错误按照 Markdown 格式记录到项目目录下

from __future__ import annotations

import json
import re
import traceback
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ErrorLogRecord:
    """
    错误日志记录实体.

    参数:
        feature: str, 功能模块名称
        task_id: str, 任务 ID
        step: str, 执行步骤
        message: str, 错误信息
        exception_type: str, 异常类型
        traceback_text: str, 堆栈信息
        extra: dict[str, Any], 额外信息字典
        created_at: datetime, 创建时间

    异常:
        无.
    """
    feature: str
    task_id: str
    step: str
    message: str
    exception_type: str
    traceback_text: str
    extra: dict[str, Any]
    created_at: datetime


class ErrorLogRecorder:
    """
    错误日志记录服务, 负责过滤敏感信息并写入本地 md 文件.

    参数:
        无.

    异常:
        无.
    """
    _SK_RE = re.compile(r"\bsk-[A-Za-z0-9]{8,}\b")
    _BEARER_RE = re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._-]{8,}\b")
    _PASSWORD_RE = re.compile(r"(?i)\b(password|secret|token|api_key)\s*=\s*[^,\s]{4,}")

    @staticmethod
    def record(
        feature: str,
        task_id: str,
        step: str,
        message: str,
        exc: Exception,
        extra: dict[str, Any] | None = None,
    ) -> str:
        """
        记录错误日志.

        参数:
            feature: str, 功能模块名称
            task_id: str, 任务 ID
            step: str, 执行步骤
            message: str, 错误信息
            exc: Exception, 异常对象
            extra: dict[str, Any] | None, 额外信息字典

        返回值:
            str: 写入的相对路径

        异常:
            无.
        """
        now = datetime.now()
        record = ErrorLogRecord(
            feature=feature.strip() or "unknown",
            task_id=task_id.strip() or "unknown",
            step=step.strip() or "unknown",
            message=message.strip() or str(exc),
            exception_type=type(exc).__name__,
            traceback_text=traceback.format_exc(),
            extra=extra or {},
            created_at=now,
        )
        return ErrorLogRecorder._write_record(record)

    @staticmethod
    def _write_record(record: ErrorLogRecord) -> str:
        """
        写入记录到本地文件.

        参数:
            record: ErrorLogRecord, 错误记录实体

        返回值:
            str: 写入的相对路径

        异常:
            无.
        """
        root = Path("/home/qyjgylc_whf/code/trai")
        base_dir = root / "md" / "error_logs"
        base_dir.mkdir(parents=True, exist_ok=True)

        week_dir = base_dir / ErrorLogRecorder._week_folder_name(record.created_at)
        week_dir.mkdir(parents=True, exist_ok=True)

        day_path = week_dir / f"{record.created_at:%Y-%m-%d}.md"
        content = ErrorLogRecorder._render_markdown(record)
        if not day_path.exists():
            day_path.write_text(content, encoding="utf-8")
        else:
            with day_path.open("a", encoding="utf-8") as f:
                f.write("\n")
                f.write(content)

        return str(day_path.relative_to(root))

    @staticmethod
    def _week_folder_name(ts: datetime) -> str:
        """
        获取按周归档的文件夹名称.

        参数:
            ts: datetime, 当前时间

        返回值:
            str: 文件夹名称如 2026_W20

        异常:
            无.
        """
        iso_year, iso_week, _ = ts.isocalendar()
        return f"{iso_year}_W{iso_week:02d}"

    @staticmethod
    def _render_markdown(record: ErrorLogRecord) -> str:
        """
        将记录渲染为 Markdown 文本.

        参数:
            record: ErrorLogRecord, 错误记录实体

        返回值:
            str: 渲染后的文本

        异常:
            无.
        """
        ts = record.created_at.strftime("%Y-%m-%d %H:%M:%S")
        extra_json = ErrorLogRecorder._safe_json(record.extra)
        tb = ErrorLogRecorder._redact(record.traceback_text)
        msg = ErrorLogRecorder._redact(record.message)

        lines: list[str] = []
        lines.append(f"## {ts} | {record.feature}")
        lines.append("")
        lines.append(f"- task_id: {record.task_id}")
        lines.append(f"- step: {record.step}")
        lines.append(f"- exception: {record.exception_type}")
        lines.append(f"- message: {msg}")
        lines.append("")
        lines.append("### Extra")
        lines.append("")
        lines.append("```json")
        lines.append(extra_json)
        lines.append("```")
        lines.append("")
        lines.append("### Traceback")
        lines.append("")
        lines.append("```")
        lines.append(tb.strip()[:12000])
        lines.append("```")
        lines.append("")
        return "\n".join(lines)

    @staticmethod
    def _safe_json(data: dict[str, Any]) -> str:
        """
        安全序列化 JSON 字符串.

        参数:
            data: dict[str, Any], 要序列化的数据

        返回值:
            str: 序列化后的字符串

        异常:
            无.
        """
        try:
            raw = json.dumps(data, ensure_ascii=False, indent=2, default=str)
        except Exception:
            raw = json.dumps({"error": "json_serialize_failed"}, ensure_ascii=True)
        return ErrorLogRecorder._redact(raw)

    @staticmethod
    def _redact(text: str) -> str:
        """
        脱敏文本中的密钥和密码.

        参数:
            text: str, 原始文本

        返回值:
            str: 脱敏后的文本

        异常:
            无.
        """
        if not text:
            return ""
        out = ErrorLogRecorder._SK_RE.sub("sk-***", text)
        out = ErrorLogRecorder._BEARER_RE.sub("Bearer ***", out)
        out = ErrorLogRecorder._PASSWORD_RE.sub(lambda m: f"{m.group(1)}=***", out)
        return out


__all__ = ["ErrorLogRecorder"]
