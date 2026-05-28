#!/usr/bin/env python
# 文件名: music.py
# 作者: wuhao
# 日期: 2026_05_26_20:53:15
# 描述: 音乐生成 API, 提供基于 ACE-Step 模型的音乐生成、下载及列表查询接口.

import os
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, HTTPException
from loguru import logger
from pydantic import BaseModel, Field

from infrastructure.ai.audio.local_music_client import MusicClientProvider
from infrastructure.notifications.media_notify import media_notifier

router = APIRouter(prefix="/music", tags=["ai", "music"])


class MusicGenerateRequest(BaseModel):
    """
    音乐生成请求模型.
    """

    prompt: str = Field(..., description="音乐描述/提示词", min_length=1, max_length=500)
    duration: float | None = Field(30.0, description="音频时长（秒）", ge=5, le=300)
    steps: int | None = Field(27, description="推理步数", ge=1, le=100)
    guidance_scale: float | None = Field(7.0, description="引导强度", ge=1.0, le=20.0)
    model: str | None = Field("ace-step", description="模型名称 (ace-step)")


class MusicGenerateResponse(BaseModel):
    """
    音乐生成响应模型.
    """

    success: bool
    task_id: str
    message: str
    music_url: str | None = None
    file_path: str | None = None
    duration: float | None = None
    error: str | None = None


from typing import Any

_music_tasks: dict[str, Any] = {}


class MusicController:
    """音乐生成控制器类."""

    @staticmethod
    def _do_generate(task_id: str, request: MusicGenerateRequest):
        """后台实际执行音乐生成的任务."""
        try:
            _music_tasks[task_id]["status"] = "processing"
            _music_tasks[task_id]["progress"] = "正在初始化生成任务..."
            client = MusicClientProvider.get_music_client()

            def progress_cb(msg: str):
                _music_tasks[task_id]["progress"] = msg

            def cancel_check() -> bool:
                return _music_tasks.get(task_id, {}).get("status") == "cancelling"

            # 在后台线程中必须使用同步生成，或者创建一个新的事件循环
            result = client.generate(
                prompt=request.prompt,
                duration=request.duration,
                steps=request.steps,
                guidance_scale=request.guidance_scale,
                progress_callback=progress_cb,
                cancel_check=cancel_check,
            )

            if _music_tasks[task_id]["status"] == "cancelling":
                _music_tasks[task_id]["status"] = "cancelled"
                _music_tasks[task_id]["progress"] = "已取消"
                return

            if result.success:
                filename = os.path.basename(result.file_path or "")

                # 上传到 S3
                s3_url = ""
                try:
                    from infrastructure.storage.s3_storage import get_s3_storage

                    s3_storage = get_s3_storage()
                    date_prefix = datetime.now().strftime("%Y%m")
                    s3_key = f"public/ai/music/{date_prefix}/{filename}"
                    s3_storage.upload_file(result.file_path, s3_key, content_type="audio/wav")
                    s3_url = s3_storage.get_file_url(s3_key)
                except Exception as e:
                    logger.warning(f"音乐文件上传 S3 失败: {e}")

                # 优先返回通过后端的下载链接，避免 Nginx 直接拦截静态文件 .wav 导致 404
                public_base = os.getenv("S3_PRESIGNED_PUBLIC_BASE", "https://ai.tuoren.com").rstrip("/")
                final_url = f"{public_base}/api_trai/v1/ai/music/download?filename={filename}"

                _music_tasks[task_id]["status"] = "completed"
                _music_tasks[task_id]["progress"] = "完成"
                _music_tasks[task_id]["music_url"] = final_url
                _music_tasks[task_id]["file_path"] = result.file_path
                _music_tasks[task_id]["duration"] = result.duration

                # 发送飞书和企微通知
                media_notifier.notify(
                    media_type="music",
                    prompt=request.prompt,
                    file_url=final_url,
                    duration=result.duration,
                )
            else:
                _music_tasks[task_id]["status"] = "failed"
                _music_tasks[task_id]["progress"] = "生成失败"
                _music_tasks[task_id]["error"] = result.error
        except Exception as e:
            _music_tasks[task_id]["status"] = "failed"
            _music_tasks[task_id]["progress"] = "生成异常"
            _music_tasks[task_id]["error"] = str(e)

    @staticmethod
    @router.post("/generate", response_model=MusicGenerateResponse)
    async def generate_music(
        request: MusicGenerateRequest,
        background_tasks: BackgroundTasks,
    ) -> MusicGenerateResponse:
        """
        提交音乐生成任务.
        """
        task_id = f"music_{uuid.uuid4().hex[:12]}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        _music_tasks[task_id] = {"status": "queued", "music_url": None, "error": None, "prompt": request.prompt}

        # 将长耗时的生成任务交给后台
        background_tasks.add_task(MusicController._do_generate, task_id, request)

        return MusicGenerateResponse(
            success=True,
            task_id=task_id,
            message="音乐生成任务已提交，请稍后查询状态",
        )

    @staticmethod
    @router.get("/status/{task_id}")
    async def get_music_status(task_id: str):
        """
        查询音乐生成任务状态.
        """
        if task_id not in _music_tasks:
            raise HTTPException(status_code=404, detail="任务不存在")

        task_info = _music_tasks[task_id].copy()

        # 计算排队位置
        if task_info["status"] == "queued":
            # 找到所有排在当前任务前面的、并且还在 queued 状态的任务数量
            queued_tasks = [tid for tid, t in _music_tasks.items() if t["status"] == "queued" and tid < task_id]
            task_info["queue_position"] = len(queued_tasks) + 1
        else:
            task_info["queue_position"] = 0

        return task_info

    @staticmethod
    @router.delete("/cancel/{task_id}")
    async def cancel_music_generation(task_id: str):
        """
        取消音乐生成任务.
        """
        if task_id not in _music_tasks:
            raise HTTPException(status_code=404, detail="任务不存在")

        status = _music_tasks[task_id]["status"]
        if status in ["completed", "failed", "cancelled"]:
            return {"success": False, "message": f"任务已经处于 {status} 状态，无法取消"}

        _music_tasks[task_id]["status"] = "cancelling"
        _music_tasks[task_id]["progress"] = "正在取消..."
        return {"success": True, "message": "已发送取消请求"}

    @staticmethod
    @router.get("/download")
    async def download_music_file(filename: str):
        """
        获取音乐文件接口 (通过 Query 参数避免 Nginx 拦截 .wav).

        参数:
            filename: str, 文件名.

        返回值:
            FileResponse: 音频文件响应.
        """
        import re
        from urllib.parse import unquote

        from fastapi.responses import FileResponse

        filename = unquote(filename)
        if not re.match(r"^[\w\s\-\( \)（）\.]+\.(wav|mp3|ogg)$", filename, re.UNICODE):
            raise HTTPException(status_code=400, detail=f"无效的文件名: {filename}")

        output_dir = "/home/qyjgylc_whf/code/trai/output_music"
        file_path = os.path.join(output_dir, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="文件不存在")

        mime_type = "audio/wav"
        if filename.endswith(".mp3"):
            mime_type = "audio/mpeg"
        elif filename.endswith(".ogg"):
            mime_type = "audio/ogg"

        return FileResponse(
            path=file_path,
            media_type=mime_type,
            filename=filename,
        )

    @staticmethod
    @router.get("/files/{filename}")
    async def get_music_file(filename: str):
        """
        获取音乐文件接口.

        参数:
            filename: str, 文件名.

        返回值:
            FileResponse: 音频文件响应.

        异常:
            HTTPException: 400/404 错误.
        """
        from urllib.parse import unquote

        from fastapi.responses import FileResponse

        # 解码 URL 编码的文件名
        filename = unquote(filename)

        # 安全检查：只允许字母、数字、中文、空格、常见符号
        import re

        # 匹配: 中文、字母、数字、空格、下划线、连字符、括号、点号(用于扩展名)
        if not re.match(r"^[\w\s\-\( \)（）\.]+\.(wav|mp3|ogg)$", filename, re.UNICODE):
            raise HTTPException(status_code=400, detail=f"无效的文件名: {filename}")

        output_dir = "/home/qyjgylc_whf/code/trai/output_music"
        file_path = os.path.join(output_dir, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="文件不存在")

        # 确定 MIME 类型
        mime_type = "audio/wav"
        if filename.endswith(".mp3"):
            mime_type = "audio/mpeg"
        elif filename.endswith(".ogg"):
            mime_type = "audio/ogg"

        return FileResponse(
            path=file_path,
            media_type=mime_type,
            filename=filename,
        )

    @staticmethod
    @router.get("/list")
    async def list_music_files(
        limit: int = 20,
        offset: int = 0,
    ) -> dict:
        """
        列出最近生成的音乐文件接口.

        参数:
            limit: int, 返回数量.
            offset: int, 跳过数量.

        返回值:
            dict: 文件列表及统计信息.

        异常:
            无.
        """
        output_dir = "/home/qyjgylc_whf/code/trai/output_music"

        if not os.path.exists(output_dir):
            return {"files": [], "total": 0}

        # 获取所有 wav 文件，按修改时间排序
        files = []
        for f in os.listdir(output_dir):
            if f.endswith(".wav"):
                fpath = os.path.join(output_dir, f)
                stat = os.stat(fpath)
                files.append(
                    {
                        "name": f,
                        "size": stat.st_size,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    }
                )

        files.sort(key=lambda x: x["modified"], reverse=True)

        total = len(files)
        paginated = files[offset : offset + limit]

        return {
            "files": paginated,
            "total": total,
            "limit": limit,
            "offset": offset,
        }
