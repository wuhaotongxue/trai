#!/usr/bin/env python
# 文件名: music.py
# 作者: wuhao
# 日期: 2026_05_26_20:53:15
# 描述: 音乐生成 API, 提供基于 ACE-Step 模型的音乐生成、下载及列表查询接口.

import os
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from infrastructure.ai.audio.local_music_client import MusicClientProvider

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


class MusicController:
    """音乐生成控制器类."""

    @staticmethod
    @router.post("/generate", response_model=MusicGenerateResponse)
    async def generate_music(
        request: MusicGenerateRequest,
        background_tasks: BackgroundTasks,
    ) -> MusicGenerateResponse:
        """
        生成音乐接口.

        参数:
            request: MusicGenerateRequest, 请求对象.
            background_tasks: BackgroundTasks, 后台任务管理器.

        返回值:
            MusicGenerateResponse: 生成结果.

        异常:
            无.
        """
        # 生成任务 ID
        task_id = f"music_{uuid.uuid4().hex[:12]}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        try:
            client = MusicClientProvider.get_music_client()

            # 同步生成（阻塞调用）
            result = client.generate(
                prompt=request.prompt,
                duration=request.duration,
                steps=request.steps,
                guidance_scale=request.guidance_scale,
            )

            if result.success:
                # 构建音乐 URL - 返回完整可访问的 URL
                filename = os.path.basename(result.file_path or "")
                music_url = f"http://localhost:5666/api_trai/v1/ai/music/files/{filename}"

                return MusicGenerateResponse(
                    success=True,
                    task_id=task_id,
                    message="音乐生成成功",
                    music_url=music_url,
                    file_path=result.file_path,
                    duration=result.duration,
                )
            else:
                return MusicGenerateResponse(
                    success=False,
                    task_id=task_id,
                    message="音乐生成失败",
                    error=result.error,
                )

        except Exception as e:
            return MusicGenerateResponse(
                success=False,
                task_id=task_id,
                message="音乐生成异常",
                error=str(e),
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
