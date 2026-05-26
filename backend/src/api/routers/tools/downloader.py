from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from src.infrastructure.tools.video_downloader import BilibiliDownloader
from src.application.common.result import Result

router = APIRouter(prefix="/tools/video", tags=["tools"])

class DownloadRequest(BaseModel):
    url: str = Field(..., description="视频链接 (Bilibili 等)")

@router.post("/download")
async def download_video(req: DownloadRequest):
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
