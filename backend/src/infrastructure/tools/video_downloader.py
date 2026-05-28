#!/usr/bin/env python
# 文件名: video_downloader.py
# 作者: wuhao
# 日期: 2026_05_26_21:05:00
# 描述: 视频下载基础设施实现, 支持 Bilibili 等主流平台的高清解析与下载

from __future__ import annotations

import shutil
import subprocess
import sys
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
        self._yt_dlp_path = self._find_yt_dlp()

    def _find_yt_dlp(self) -> str:
        """
        寻找 yt-dlp 可执行文件的路径.
        """
        # 1. 尝试从 PATH 中寻找
        path = shutil.which("yt-dlp")
        if path:
            logger.info(f"yt-dlp found in PATH: {path}")
            return path

        # 2. 尝试在当前 Python 解释器所在的 bin 目录下寻找
        executable_dir = Path(sys.executable).parent
        path = executable_dir / "yt-dlp"
        if path.exists():
            logger.info(f"yt-dlp found in Python bin: {path}")
            return str(path)

        # 3. 兜底: 尝试常见的 Conda 路径 (TRAI 项目专用)
        conda_path = Path("/home/qyjgylc_whf/miniconda3/envs/trai31313/bin/yt-dlp")
        if conda_path.exists():
            logger.info(f"yt-dlp found in Conda env path: {conda_path}")
            return str(conda_path)

        # 4. 默认返回 'yt-dlp', 让 subprocess 报错以便捕获
        logger.warning("yt-dlp not found in any known locations, falling back to 'yt-dlp'")
        return "yt-dlp"

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
            # 检查 yt-dlp 是否可用
            if self._yt_dlp_path == "yt-dlp" and not shutil.which("yt-dlp"):
                return {
                    "success": False,
                    "error": "系统未找到 yt-dlp 依赖, 请确保已安装并配置在环境变量中.",
                }

            # 第一步: 获取视频元数据
            info_cmd = [self._yt_dlp_path, "--print", "%(title)s<SEP>%(ext)s<SEP>%(id)s", "--no-playlist", url]

            result = subprocess.run(info_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.error(f"Failed to fetch video info: {result.stderr}")
                return {"success": False, "error": result.stderr}

            output = result.stdout.strip().split("<SEP>")
            if len(output) < 3:
                return {"success": False, "error": f"Invalid video info format: {result.stdout}"}

            title, ext, video_id = output[:3]
            output_template = str(self.download_path / f"{video_id}.%(ext)s")

            # 第二步: 执行高清下载与合并
            download_cmd = [
                self._yt_dlp_path,
                "-f",
                "bestvideo+bestaudio/best",
                "--merge-output-format",
                "mp4",
                "-o",
                output_template,
                url,
            ]

            logger.info(f"Downloading video from {url}...")
            process = subprocess.run(download_cmd, capture_output=True, text=True)

            if process.returncode == 0:
                file_path = str(self.download_path / f"{video_id}.mp4")
                return {"success": True, "title": title, "file_path": file_path, "video_id": video_id}
            else:
                logger.error(f"Download process failed: {process.stderr}")
                return {"success": False, "error": process.stderr}

        except Exception as e:
            logger.error(f"Unexpected error during Bilibili download: {str(e)}")
            return {"success": False, "error": str(e)}


class BilibiliDownloader(VideoDownloader):
    """
    Bilibili 专用下载器实现类
    """

    pass
