#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: video_downloader.py
# 作者: wuhao
# 日期: 2026_05_26_21:05:00
# 描述: 视频下载基础设施实现, 支持 Bilibili 等主流平台的高清解析与下载

from __future__ import annotations

import os
import subprocess
from pathlib import Path
from typing import Any
from loguru import logger

class VideoDownloader:
    """
    视频下载基类, 提供通用的下载逻辑与环境管理
    """

    def __init__(self, download_path: str = "temp/downloads") -> None:
        """
        初始化下载器并确保存储目录存在
        
        参数:
            download_path (str): 下载文件存储的本地路径
        返回值:
            None
        异常:
            OSError: 目录创建失败时抛出
        """
        self.download_path = Path(download_path)
        if not self.download_path.exists():
            self.download_path.mkdir(parents=True, exist_ok=True)

    async def download_bilibili(self, url: str) -> dict[str, Any]:
        """
        使用 yt-dlp 工具高清下载 Bilibili 视频
        
        参数:
            url (str): Bilibili 视频播放链接
        返回值:
            dict[str, Any]: 包含以下字段的结果字典:
                - success (bool): 是否成功
                - title (str): 视频标题
                - file_path (str): 本地存储路径
                - video_id (str): 视频 ID
                - error (str, optional): 错误详情
        异常:
            Exception: 捕获下载过程中的进程执行或文件系统异常
        """
        try:
            # 第一步: 获取视频元数据
            info_cmd = [
                "yt-dlp",
                "--print", "%(title)s|%(ext)s|%(id)s",
                "--no-playlist",
                url
            ]
            
            result = subprocess.run(info_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.error(f"Failed to fetch video info: {result.stderr}")
                return {"success": False, "error": result.stderr}
            
            output = result.stdout.strip().split('|')
            if len(output) < 3:
                return {"success": False, "error": "Invalid video info format from yt-dlp"}
                
            title, ext, video_id = output
            output_template = str(self.download_path / f"{video_id}.%(ext)s")
            
            # 第二步: 执行高清下载与合并
            download_cmd = [
                "yt-dlp",
                "-f", "bestvideo+bestaudio/best",
                "--merge-output-format", "mp4",
                "-o", output_template,
                url
            ]
            
            logger.info(f"Downloading video from {url}...")
            process = subprocess.run(download_cmd, capture_output=True, text=True)
            
            if process.returncode == 0:
                file_path = str(self.download_path / f"{video_id}.mp4")
                return {
                    "success": True,
                    "title": title,
                    "file_path": file_path,
                    "video_id": video_id
                }
            else:
                logger.error(f"Download process failed: {process.stderr}")
                return {
                    "success": False,
                    "error": process.stderr
                }
                
        except Exception as e:
            logger.error(f"Unexpected error during Bilibili download: {str(e)}")
            return {"success": False, "error": str(e)}

class BilibiliDownloader(VideoDownloader):
    """
    Bilibili 专用下载器实现类
    """
    pass
