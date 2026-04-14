#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: tools.py
# 作者: wuhao
# 日期: 2026_04_14_08:12:51
# 描述: 常见文件转换和压缩工具接口

from __future__ import annotations

import os
import uuid
import zipfile
from io import BytesIO
from pathlib import Path
from typing import Annotated, Any

import markdown
import pdfkit
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from PIL import Image
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from core.logger import get_logger
from infrastructure.database import get_session
from infrastructure.storage.s3_storage import S3StorageService

logger = get_logger()
router = APIRouter()


class ToolResultResponse(BaseModel):
    """工具处理结果响应"""
    url: str = Field(description="处理后的文件下载链接 (预签名 URL)")
    expires_in: int = Field(description="链接过期时间 (秒)")
    file_name: str = Field(description="文件名")
    message: str = Field(default="处理成功", description="提示信息")


class ToolsAPI:
    """工具接口类"""

    @staticmethod
    async def convert_md_to_pdf(
        file: UploadFile,
        current_user: CurrentUser,
        s3_service: S3StorageService,
    ) -> ToolResultResponse:
        """Markdown 转 PDF 接口

        Args:
            file: 上传的 Markdown 文件
            current_user: 当前用户
            s3_service: S3 存储服务

        Returns:
            ToolResultResponse: 转换后的 PDF 文件信息和预签名 URL

        Raises:
            HTTPException: 转换失败或文件格式不正确
        """
        if not file.filename or not file.filename.endswith(".md"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "只支持 .md 格式文件"},
            )

        try:
            content = await file.read()
            md_text = content.decode("utf-8")
            html_text = markdown.markdown(md_text, extensions=["tables", "fenced_code"])
            
            # 使用 pdfkit 将 HTML 转换为 PDF
            # 注意: 需要系统安装 wkhtmltopdf
            pdf_bytes = pdfkit.from_string(html_text, False)
            
            if not pdf_bytes:
                raise ValueError("PDF 生成为空")

            # 上传到 S3
            object_key = f"tools/pdf/{current_user.user_id}/{uuid.uuid4().hex}.pdf"
            s3_service.upload_bytes(pdf_bytes, object_key, content_type="application/pdf")
            
            # 获取预签名 URL (5分钟有效)
            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)
            
            return ToolResultResponse(
                url=presigned_url,
                expires_in=300,
                file_name=file.filename.replace(".md", ".pdf"),
            )
        except Exception as e:
            logger.error(f"Markdown 转 PDF 失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": f"文件转换失败: {str(e)}"},
            )

    @staticmethod
    async def compress_image(
        file: UploadFile,
        quality: int,
        current_user: CurrentUser,
        s3_service: S3StorageService,
    ) -> ToolResultResponse:
        """图片压缩接口

        Args:
            file: 上传的图片文件
            quality: 压缩质量 (1-100)
            current_user: 当前用户
            s3_service: S3 存储服务

        Returns:
            ToolResultResponse: 压缩后的图片信息和预签名 URL

        Raises:
            HTTPException: 压缩失败或格式不支持
        """
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "只支持图片格式文件"},
            )

        try:
            content = await file.read()
            image = Image.open(BytesIO(content))
            
            # 转换为 RGB 以支持 JPEG 保存
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
                
            output_buffer = BytesIO()
            image.save(output_buffer, format="JPEG", quality=quality)
            compressed_bytes = output_buffer.getvalue()
            
            # 上传到 S3
            object_key = f"tools/images/{current_user.user_id}/{uuid.uuid4().hex}.jpg"
            s3_service.upload_bytes(compressed_bytes, object_key, content_type="image/jpeg")
            
            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)
            
            original_name = Path(file.filename or "image.jpg").stem
            return ToolResultResponse(
                url=presigned_url,
                expires_in=300,
                file_name=f"{original_name}_compressed.jpg",
            )
        except Exception as e:
            logger.error(f"图片压缩失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": "图片压缩失败"},
            )

    @staticmethod
    async def convert_image(
        file: UploadFile,
        target_format: str,
        current_user: CurrentUser,
        s3_service: S3StorageService,
    ) -> ToolResultResponse:
        """图片格式转换接口

        Args:
            file: 上传的图片文件
            target_format: 目标格式 (如 png, jpeg, ico, webp)
            current_user: 当前用户
            s3_service: S3 存储服务

        Returns:
            转换后的图片信息和预签名 URL
        """
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "只支持图片格式文件"},
            )

        fmt = target_format.upper()
        if fmt == "JPG":
            fmt = "JPEG"

        try:
            content = await file.read()
            image = Image.open(BytesIO(content))
            
            # 如果目标是 JPEG 或目标是不支持 Alpha 通道的格式，且原图带 Alpha
            if fmt in ("JPEG", "BMP") and image.mode in ("RGBA", "LA", "P"):
                # 处理透明背景为白色
                background = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "RGBA":
                    background.paste(image, mask=image.split()[3])
                else:
                    background.paste(image)
                image = background
            elif fmt == "ICO":
                # ICO 推荐尺寸
                image = image.resize((256, 256), Image.Resampling.LANCZOS)
                
            output_buffer = BytesIO()
            
            # 保存转换后的图片
            image.save(output_buffer, format=fmt)
            converted_bytes = output_buffer.getvalue()
            
            ext = fmt.lower()
            content_type = f"image/{ext}" if ext != "ico" else "image/x-icon"
            
            # 上传到 S3
            object_key = f"tools/images_converted/{current_user.user_id}/{uuid.uuid4().hex}.{ext}"
            s3_service.upload_bytes(converted_bytes, object_key, content_type=content_type)
            
            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)
            
            original_name = Path(file.filename or "image.jpg").stem
            return ToolResultResponse(
                url=presigned_url,
                expires_in=300,
                file_name=f"{original_name}.{ext}",
            )
        except Exception as e:
            logger.error(f"图片格式转换失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": "图片格式转换失败，可能是不支持的格式"},
            )

    @staticmethod
    async def compress_files_to_zip(
        files: list[UploadFile],
        current_user: CurrentUser,
        s3_service: S3StorageService,
    ) -> ToolResultResponse:
        """多文件 ZIP 压缩接口

        Args:
            files: 多个上传的文件
            current_user: 当前用户
            s3_service: S3 存储服务

        Returns:
            ToolResultResponse: 压缩后的 ZIP 文件信息和预签名 URL

        Raises:
            HTTPException: 压缩失败
        """
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "未提供要压缩的文件"},
            )

        try:
            zip_buffer = BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for file in files:
                    content = await file.read()
                    file_name = file.filename or f"file_{uuid.uuid4().hex[:8]}"
                    zip_file.writestr(file_name, content)
            
            zip_bytes = zip_buffer.getvalue()
            
            # 上传到 S3
            object_key = f"tools/zip/{current_user.user_id}/{uuid.uuid4().hex}.zip"
            s3_service.upload_bytes(zip_bytes, object_key, content_type="application/zip")
            
            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)
            
            return ToolResultResponse(
                url=presigned_url,
                expires_in=300,
                file_name="archive.zip",
            )
        except Exception as e:
            logger.error(f"ZIP 压缩失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": "ZIP 压缩失败"},
            )


# 注册路由
@router.post("/md_to_pdf", response_model=ToolResultResponse, tags=["工具"])
async def md_to_pdf_endpoint(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    s3_service: S3StorageService = Depends(S3StorageService),
) -> ToolResultResponse:
    """将 Markdown 文件转换为 PDF 并上传到 S3 返回限时下载链接"""
    return await ToolsAPI.convert_md_to_pdf(file, current_user, s3_service)


@router.post("/compress_image", response_model=ToolResultResponse, tags=["工具"])
async def compress_image_endpoint(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    quality: int = 70,
    s3_service: S3StorageService = Depends(S3StorageService),
) -> ToolResultResponse:
    """压缩图片并上传到 S3 返回限时下载链接"""
    return await ToolsAPI.compress_image(file, quality, current_user, s3_service)


@router.post("/compress_zip", response_model=ToolResultResponse, tags=["工具"])
async def compress_zip_endpoint(
    current_user: CurrentUser,
    files: list[UploadFile] = File(...),
    s3_service: S3StorageService = Depends(S3StorageService),
) -> ToolResultResponse:
    """将多个文件压缩为 ZIP 并上传到 S3 返回限时下载链接"""
    return await ToolsAPI.compress_files_to_zip(files, current_user, s3_service)


@router.post("/convert_image", response_model=ToolResultResponse, tags=["工具"])
async def convert_image_endpoint(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    target_format: str = Form(..., description="目标格式，如 png, jpeg, ico, webp"),
    s3_service: S3StorageService = Depends(S3StorageService),
) -> ToolResultResponse:
    """转换图片格式并上传到 S3 返回限时下载链接"""
    return await ToolsAPI.convert_image(file, target_format, current_user, s3_service)

__all__ = ["router", "ToolsAPI"]
