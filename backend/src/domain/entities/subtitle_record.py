#!/usr/bin/env python
# 文件名: subtitle_record.py
# 作者: wuhao
# 日期: 2026_05_23
# 描述: 字幕生成记录领域实体

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class SubtitleRecord:
    """字幕生成记录实体"""

    id: str
    task_id: str
    user_id: str
    file_name: str
    target_lang: str
    burn_mode: str
    status: str
    task_type: str = "subtitle"
    zh_srt_url: str | None = None
    target_srt_url: str | None = None
    output_video_url: str | None = None
    vocal_url: str | None = None
    bgm_url: str | None = None
    error_message: str | None = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
