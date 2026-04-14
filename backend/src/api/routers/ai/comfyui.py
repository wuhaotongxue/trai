#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: comfyui.py
# 作者: wuhao
# 日期: 2026_04_14_15:27:00
# 描述: ComfyUI 集成路由，提供图像生成工作流转发

from typing import Any

from fastapi import APIRouter, Depends
from loguru import logger
from pydantic import BaseModel, Field

from api.deps import get_current_user

router = APIRouter(prefix="/comfyui", tags=["AI ComfyUI"])


class ComfyUIGenerateRequest(BaseModel):
    """ComfyUI 生成请求模型"""

    prompt: str = Field(..., description="正向提示词")
    negative_prompt: str | None = Field(default=None, description="反向提示词")
    workflow_id: str | None = Field(default="default", description="工作流 ID")


class ComfyUIAPI:
    """ComfyUI 接口类"""

    @staticmethod
    @router.post("/generate", summary="提交 ComfyUI 生成任务")
    async def generate_image(
        request: ComfyUIGenerateRequest, user: dict[str, Any] = Depends(get_current_user)
    ) -> Any:
        """向 ComfyUI 提交工作流生成图像

        Args:
            request: 生成参数
            user: 当前登录用户

        Returns:
            提交结果统一响应
        """
        logger.info(f"User {user.get('user_id')} submitted comfyui task: {request.prompt}")
        
        # 模拟后端直接返回一张 Mock 图片（实际应通过 requests 调用本地或远端 ComfyUI /prompt 接口）
        return {
            "code": 200,
            "msg": "任务已提交",
            "data": {
                "task_id": "comfy-task-001",
                "status": "completed",
                # 此处用一张占位图模拟生成的图片
                "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
            },
        }

    @staticmethod
    @router.get("/status/{task_id}", summary="获取任务状态")
    async def get_status(task_id: str, user: dict[str, Any] = Depends(get_current_user)) -> Any:
        """获取指定 ComfyUI 任务的状态

        Args:
            task_id: 任务 ID
            user: 当前登录用户

        Returns:
            任务状态统一响应
        """
        return {
            "code": 200,
            "msg": "获取成功",
            "data": {
                "task_id": task_id,
                "status": "completed",
                "progress": 100,
            },
        }
