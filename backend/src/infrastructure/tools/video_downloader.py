import os
import subprocess
import json
from typing import Optional, Dict, Any
from loguru import logger

class VideoDownloader:
    def __init__(self, download_path: str = "temp/downloads"):
        self.download_path = download_path
        if not os.path.exists(self.download_path):
            os.makedirs(self.download_path)

    async def download_bilibili(self, url: str) -> Dict[str, Any]:
        """
        使用 yt-dlp 下载 Bilibili 视频
        """
        try:
            # 获取视频信息
            info_cmd = [
                "yt-dlp",
                "--print", "%(title)s|%(ext)s|%(id)s",
                "--no-playlist",
                url
            ]
            
            result = subprocess.run(info_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"Failed to fetch video info: {result.stderr}")
            
            title, ext, video_id = result.stdout.strip().split('|')
            output_template = os.path.join(self.download_path, f"{video_id}.%(ext)s")
            
            # 执行下载
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
                file_path = os.path.join(self.download_path, f"{video_id}.mp4")
                return {
                    "success": True,
                    "title": title,
                    "file_path": file_path,
                    "video_id": video_id
                }
            else:
                return {
                    "success": False,
                    "error": process.stderr
                }
                
        except Exception as e:
            logger.error(f"Error downloading Bilibili video: {str(e)}")
            return {"success": False, "error": str(e)}

class BilibiliDownloader(VideoDownloader):
    pass
