#!/usr/bin/env python
# 文件名: downloader.py
# 作者: wuhao
# 日期: 2026_05_26_21:05:00
# 描述: 视频下载工具路由, 提供 Bilibili 视频下载接口

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

from infrastructure.tools.video_downloader import BilibiliDownloader

router = APIRouter(prefix="/tools/video", tags=["工具"])


class DownloadRequest(BaseModel):
    """
    视频下载请求模型
    """

    url: str = Field(..., description="视频链接, 例如 Bilibili 播放页地址")


class VideoDownloaderRouter:
    """
    视频下载路由处理器类, 封装所有下载相关的接口逻辑
    """

    @staticmethod
    @router.post(
        "/download",
        summary="下载 Bilibili 视频",
        description="接收 Bilibili 视频链接, 使用 yt-dlp 进行高清解析并下载至服务器临时目录",
    )
    async def download_video(req: DownloadRequest):
        """
        执行视频下载任务

        参数:
            req (DownloadRequest): 包含视频 URL 的请求对象
        返回值:
            统一响应格式: code/msg/data
        异常:
            None: 错误信息封装在响应中返回
        """
        downloader = BilibiliDownloader()
        result = await downloader.download_bilibili(req.url)
        req_id = str(uuid4())
        ts = datetime.now().isoformat()

        if result["success"]:
            return {"code": 200, "msg": "OK", "data": {"title": result["title"], "file_path": result["file_path"], "video_id": result["video_id"]}, "req_id": req_id, "ts": ts}
        else:
            return {"code": 500, "msg": result["error"], "data": None, "req_id": req_id, "ts": ts}


__all__ = ["VideoDownloaderRouter", "router"]
