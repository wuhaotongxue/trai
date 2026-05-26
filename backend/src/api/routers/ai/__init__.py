#!/usr/bin/env python
# 文件名: __init__.py
# 作者: wuhao
# 日期: 2026_04_10_09:19:27
# 描述: AI 路由包

from fastapi import APIRouter

from .agent import router as agent_router
from .audio_transcribe import router as transcribe_router
from .comfyui import router as comfyui_router
from .image import router as image_router
from .management import router as management_router
from .music import router as music_router
from .video import router as video_router

router = APIRouter()

router.include_router(agent_router)
router.include_router(image_router)
router.include_router(music_router)
router.include_router(video_router)
router.include_router(management_router)
router.include_router(comfyui_router)
router.include_router(transcribe_router)

__all__ = ["router"]
