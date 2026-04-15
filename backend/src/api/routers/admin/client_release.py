#!/usr/bin/env python
# 文件名: client_release.py
# 作者: wuhao
# 日期: 2026_04_14_16:45:00
# 描述: 客户端发版管理接口

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import CurrentUser, get_db
from core.logger import get_logger
from infrastructure.database.models import ClientReleaseModel
from infrastructure.storage.s3_storage import S3StorageService

logger = get_logger()
router = APIRouter()


class ReleaseResponse(BaseModel):
    """发版结果响应"""

    version: str = Field(description="版本号")
    message: str = Field(description="提示信息")


class AdminClientReleaseAPI:
    """管理端客户端发布接口类"""

    @staticmethod
    @router.post("/client/release", response_model=ReleaseResponse, summary="发布新版本客户端")
    async def release_client(
        version: Annotated[str, Form(..., description="版本号, 如 0.1.0")],
        latest_yml: Annotated[UploadFile, File(..., description="latest.yml 文件")],
        installer_exe: Annotated[UploadFile, File(..., description="安装包 exe 文件")],
        current_user: CurrentUser,
        db: AsyncSession = Depends(get_db),
        s3_service: S3StorageService = Depends(),
        release_notes: str | None = Form(None, description="更新日志"),
    ) -> ReleaseResponse:
        """管理员发布新版本的 Electron 客户端

        Args:
            version: 版本号
            latest_yml: electron-builder 生成的 latest.yml
            installer_exe: 安装包
            current_user: 当前登录的管理员
            db: 数据库会话
            s3_service: S3 服务
            release_notes: 更新日志

        Returns:
            ReleaseResponse: 发布结果

        Raises:
            HTTPException: 权限不足或上传失败
        """
        # 简单权限校验
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": 403, "message": "仅管理员可执行发布操作"},
            )

        # 检查版本号是否已存在
        stmt = select(ClientReleaseModel).where(ClientReleaseModel.t_version == version)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": f"版本 {version} 已存在"},
            )

        try:
            # 1. 上传 latest.yml
            yml_content = await latest_yml.read()
            yml_key = f"releases/{version}/latest.yml"
            s3_service.upload_bytes(yml_content, yml_key, content_type="application/x-yaml")

            # 2. 上传 installer
            exe_content = await installer_exe.read()
            exe_key = f"releases/{version}/{installer_exe.filename}"
            s3_service.upload_bytes(exe_content, exe_key, content_type="application/x-msdownload")

            # 3. 记录到数据库
            new_release = ClientReleaseModel(
                t_version=version,
                t_release_notes=release_notes,
                t_latest_yml_key=yml_key,
                t_installer_exe_key=exe_key,
                t_created_by=current_user.user_id,
            )
            db.add(new_release)
            await db.commit()

            logger.info(f"用户 {current_user.user_id} 成功发布客户端新版本 {version}")

            return ReleaseResponse(version=version, message="发布成功")

        except Exception as e:
            logger.error(f"发布客户端失败: {str(e)}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": f"发布客户端失败: {str(e)}"},
            )
