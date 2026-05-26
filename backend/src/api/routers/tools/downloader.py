#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: downloader.py
# 作者: wuhao
# 日期: 2026_05_26_20:31:37
# 描述: 视频下载工具路由, 提供 Bilibili 视频下载接口

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from src.infrastructure.tools.video_downloader import BilibiliDownloader
from src.application.common.result import Result

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
    async def download_video(req: DownloadRequest) -> Result:
        """
        执行视频下载任务
        
        参数:
            req (DownloadRequest): 包含 url 的请求对象
        返回值:
            Result: 包含下载结果、标题及文件路径的统一响应格式
        """
        downloader = BilibiliDownloader()
        result = await downloader.download_bilibili(req.url)
        
        if result["success"]:
            return Result.success(data={
                "title": result["title"],
                "file_path": result["file_path"],
                "video_id": result["video_id"]
            })
        else:
            return Result.error(msg=result["error"])
