#!/usr/bin/env python
# 文件名: update.py
# 作者: wuhao
# 日期: 2026_04_14_16:45:00
# 描述: 客户端自动更新获取接口

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_db
from core.logger import get_logger
from infrastructure.database.models import ClientReleaseModel
from infrastructure.storage.s3_storage import S3StorageService

logger = get_logger()
router = APIRouter()


class ClientUpdateAPI:
    """客户端更新接口类"""

    @staticmethod
    @router.get("/update/latest.yml", summary="获取最新版本配置")
    async def get_latest_yml(
        db: AsyncSession = Depends(get_db),
        s3_service: S3StorageService = Depends(),
    ) -> RedirectResponse:
        """获取最新的 latest.yml 配置并重定向到 S3 预签名 URL

        Args:
            db: 数据库会话
            s3_service: S3 服务

        Returns:
            RedirectResponse: 临时重定向到 S3 下载地址

        Raises:
            HTTPException: 无版本记录时报错
        """
        # 查询最新激活版本
        stmt = (
            select(ClientReleaseModel)
            .where(ClientReleaseModel.t_is_active)
            .order_key(desc(ClientReleaseModel.t_created_at))
            .limit(1)
        )
        result = await db.execute(stmt)
        latest_release = result.scalar_one_or_none()

        if not latest_release:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": 404, "message": "尚未发布任何客户端版本"},
            )

        try:
            # 签发 5 分钟有效期的 S3 预签名 URL
            presigned_url = s3_service.get_presigned_url(latest_release.t_latest_yml_key, expires_in=300)

            # 使用 HTTP 302 临时重定向,避免 electron-updater 缓存
            return RedirectResponse(url=presigned_url, status_code=status.HTTP_302_FOUND)

        except Exception as e:
            logger.error(f"获取 latest.yml 失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": "获取更新配置失败"},
            )

    @staticmethod
    @router.get("/update/{filename}", summary="获取安装包文件")
    async def get_installer_exe(
        filename: str,
        db: AsyncSession = Depends(get_db),
        s3_service: S3StorageService = Depends(),
    ) -> RedirectResponse:
        """根据文件名请求安装包,动态重定向至 S3 预签名 URL

        Args:
            filename: 请求的文件名 (通常是 .exe)
            db: 数据库会话
            s3_service: S3 服务

        Returns:
            RedirectResponse: 临时重定向到 S3 下载地址

        Raises:
            HTTPException: 找不到对应文件时报错
        """
        if not filename.endswith(".exe"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "仅支持获取 exe 安装包"},
            )

        # electron-updater 请求 exe 时,通常是在读取 latest.yml 后
        # 这里为了简化,我们直接查询包含该 filename 的激活版本
        stmt = (
            select(ClientReleaseModel)
            .where(ClientReleaseModel.t_is_active, ClientReleaseModel.t_installer_exe_key.like(f"%/{filename}"))
            .limit(1)
        )

        result = await db.execute(stmt)
        target_release = result.scalar_one_or_none()

        if not target_release:
            # 兼容 fallback: 若找不到对应文件名,返回最新版的 exe
            stmt_fallback = (
                select(ClientReleaseModel)
                .where(ClientReleaseModel.t_is_active)
                .order_key(desc(ClientReleaseModel.t_created_at))
                .limit(1)
            )
            result_fallback = await db.execute(stmt_fallback)
            target_release = result_fallback.scalar_one_or_none()

            if not target_release:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={"code": 404, "message": "未找到对应的安装包"},
                )

        try:
            # 签发 30 分钟有效期的 S3 预签名 URL,供安装包下载
            presigned_url = s3_service.get_presigned_url(target_release.t_installer_exe_key, expires_in=1800)

            return RedirectResponse(url=presigned_url, status_code=status.HTTP_302_FOUND)

        except Exception as e:
            logger.error(f"获取安装包失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": "获取安装包失败"},
            )
