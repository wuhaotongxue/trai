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
    original_size: int | None = Field(default=None, description="原始文件大小(字节)")
    converted_size: int | None = Field(default=None, description="转换后文件大小(字节)")
    original_width: int | None = Field(default=None, description="原图宽度")
    original_height: int | None = Field(default=None, description="原图高度")
    converted_width: int | None = Field(default=None, description="转换后宽度")
    converted_height: int | None = Field(default=None, description="转换后高度")


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
        target_size_kb: int | None = None,
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
            original_size = len(content)
            image = Image.open(BytesIO(content))
            original_width, original_height = image.size
            
            # 转换为 RGB 以支持 JPEG 保存
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
                
            output_buffer = BytesIO()
            
            if target_size_kb and target_size_kb > 0:
                target_bytes = target_size_kb * 1024
                low, high = 1, 100
                best_quality = 60
                best_bytes = None
                
                # 二分查找合适的压缩质量
                while low <= high:
                    mid = (low + high) // 2
                    temp_buffer = BytesIO()
                    image.save(temp_buffer, format="JPEG", quality=mid)
                    size = len(temp_buffer.getvalue())
                    
                    if size <= target_bytes:
                        best_quality = mid
                        best_bytes = temp_buffer.getvalue()
                        low = mid + 1  # 尝试提高质量
                    else:
                        high = mid - 1 # 降低质量
                        
                if best_bytes:
                    output_buffer.write(best_bytes)
                else:
                    # 如果连最低质量(1)都无法满足，只能保存最低质量
                    image.save(output_buffer, format="JPEG", quality=1)
            else:
                image.save(output_buffer, format="JPEG", quality=quality)
                
            compressed_bytes = output_buffer.getvalue()
            converted_size = len(compressed_bytes)
            
            # 上传到 S3
            object_key = f"tools/images/{current_user.user_id}/{uuid.uuid4().hex}.jpg"
            s3_service.upload_bytes(compressed_bytes, object_key, content_type="image/jpeg")
            
            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)
            
            original_name = Path(file.filename or "image.jpg").stem
            return ToolResultResponse(
                url=presigned_url,
                expires_in=300,
                file_name=f"{original_name}_compressed.jpg",
                original_size=original_size,
                converted_size=converted_size,
                original_width=original_width,
                original_height=original_height,
                converted_width=original_width,
                converted_height=original_height
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
        sizes: list[int] | None = None,
        width: int | None = None,
        height: int | None = None,
        target_size_kb: int | None = None,
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
            original_size = len(content)
            image = Image.open(BytesIO(content))
            original_width, original_height = image.size
            
            # 如果目标是 JPEG 或目标是不支持 Alpha 通道的格式，且原图带 Alpha
            if fmt in ("JPEG", "BMP") and image.mode in ("RGBA", "LA", "P"):
                # 处理透明背景为白色
                background = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "RGBA":
                    background.paste(image, mask=image.split()[3])
                else:
                    background.paste(image)
                image = background
                
            output_buffer = BytesIO()
            converted_width, converted_height = original_width, original_height
            
            # 保存转换后的图片
            if fmt == "ICO":
                ico_sizes = [(s, s) for s in sizes] if sizes else [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
                # Pillow 保存 ICO 时支持 sizes 参数来打包多尺寸
                image.save(output_buffer, format=fmt, sizes=ico_sizes)
                if ico_sizes:
                    converted_width, converted_height = ico_sizes[-1] # use largest for display
            else:
                if width or height:
                    target_w = width if width else int(original_width * (height / original_height))
                    target_h = height if height else int(original_height * (width / original_width))
                    image = image.resize((target_w, target_h), Image.Resampling.LANCZOS)
                    converted_width, converted_height = target_w, target_h
                elif sizes and len(sizes) > 0:
                    # Fallback for older param if still passed for non-ico
                    image = image.resize((sizes[0], sizes[0]), Image.Resampling.LANCZOS)
                    converted_width, converted_height = sizes[0], sizes[0]
                    
                if target_size_kb and target_size_kb > 0 and fmt in ("JPEG", "WEBP"):
                    target_bytes = target_size_kb * 1024
                    low, high = 1, 100
                    best_quality = 80
                    best_bytes = None
                    
                    while low <= high:
                        mid = (low + high) // 2
                        temp_buffer = BytesIO()
                        image.save(temp_buffer, format=fmt, quality=mid)
                        size = len(temp_buffer.getvalue())
                        
                        if size <= target_bytes:
                            best_quality = mid
                            best_bytes = temp_buffer.getvalue()
                            low = mid + 1
                        else:
                            high = mid - 1
                            
                    if best_bytes:
                        output_buffer.write(best_bytes)
                    else:
                        image.save(output_buffer, format=fmt, quality=1)
                else:
                    # PNG, BMP 等不支持 quality 动态调整，或者未指定大小
                    if fmt in ("JPEG", "WEBP"):
                        image.save(output_buffer, format=fmt, quality=90)
                    else:
                        image.save(output_buffer, format=fmt)
                
            converted_bytes = output_buffer.getvalue()
            converted_size = len(converted_bytes)
            
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
                original_size=original_size,
                converted_size=converted_size,
                original_width=original_width,
                original_height=original_height,
                converted_width=converted_width,
                converted_height=converted_height
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
    quality: int = Form(60, description="压缩质量 (1-100)"),
    target_size_kb: int | None = Form(None, description="目标文件大小(KB)，若指定则动态调整 quality 尝试逼近该大小"),
    s3_service: S3StorageService = Depends(S3StorageService),
) -> ToolResultResponse:
    """压缩图片并上传到 S3 返回限时下载链接"""
    return await ToolsAPI.compress_image(file, quality, current_user, s3_service, target_size_kb)


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
    sizes: str | None = Form(None, description="尺寸列表，逗号分隔，如 16,32,256"),
    width: int | None = Form(None, description="指定转换宽度(像素)"),
    height: int | None = Form(None, description="指定转换高度(像素)"),
    target_size_kb: int | None = Form(None, description="目标大小(KB)，仅对支持压缩的格式如 JPEG/WEBP 有效"),
    s3_service: S3StorageService = Depends(S3StorageService),
) -> ToolResultResponse:
    """转换图片格式并上传到 S3 返回限时下载链接"""
    parsed_sizes = [int(s.strip()) for s in sizes.split(",") if s.strip().isdigit()] if sizes else None
    return await ToolsAPI.convert_image(file, target_format, current_user, s3_service, parsed_sizes, width, height, target_size_kb)

__all__ = ["router", "ToolsAPI"]
