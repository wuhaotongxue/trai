#!/usr/bin/env python
# 文件名: client_release.py
# 作者: wuhao
# 日期: 2026_04_14_16:45:00
# 描述: 客户端发版管理接口

from __future__ import annotations

from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from api.deps import AdminUser, CurrentUser
from core.logger import get_logger
from infrastructure.database import get_db_session, get_session
from infrastructure.database.models import ClientReleaseModel
from infrastructure.storage.s3_storage import S3StorageService

logger = get_logger()
router = APIRouter()

# 构建状态存储 (生产环境应使用 Redis)
_build_status = {
    "status": "idle",
    "message": None,
    "version": None,
    "error": None
}


class ReleaseResponse(BaseModel):
    """发版结果响应"""

    version: str = Field(description="版本号")
    message: str = Field(description="提示信息")


class BuildAndReleaseRequest(BaseModel):
    """一键打包发布请求"""

    release_notes: str | None = Field(default=None, description="更新日志内容")


class BuildStatus(BaseModel):
    """构建状态"""

    status: str = Field(description="状态: idle/running/success/failed")
    message: str | None = Field(default=None, description="状态消息")
    version: str | None = Field(default=None, description="构建完成的版本号")
    error: str | None = Field(default=None, description="错误信息")


class DeleteReleaseResponse(BaseModel):
    """删除结果"""

    ok: bool = Field(description="是否成功")
    message: str = Field(description="结果消息")


class ReleaseListItem(BaseModel):
    """发版列表项"""

    id: int = Field(description="ID")
    version: str = Field(description="版本号")
    release_notes: str | None = Field(default=None, description="更新日志")
    created_at: str = Field(description="创建时间")
    installer_url: str | None = Field(default=None, description="下载链接")


class ReleaseListResponse(BaseModel):
    """分页发版列表响应"""

    total: int = Field(description="总记录数")
    items: list[ReleaseListItem] = Field(description="版本列表")


class SessionGroupedItem(BaseModel):
    """按用户分组的会话统计项"""

    session_id: str = Field(description="会话ID")
    user_id: str = Field(description="用户ID")
    username: str = Field(description="用户名")
    display_name: str | None = Field(default=None, description="显示名称")
    email: str | None = Field(default=None, description="邮箱")
    sessions_count: int = Field(default=0, description="会话数量")
    messages_count: int = Field(default=0, description="消息数量")
    agent_calls: int = Field(default=0, description="Agent 调用次数")
    last_active: str | None = Field(default=None, description="最后活跃时间")
    status: str = Field(default="inactive", description="状态")


class SessionGroupedResponse(BaseModel):
    """按用户分组的会话统计响应"""

    total: int = Field(description="总数")
    sessions: list[SessionGroupedItem] = Field(description="会话列表")


@router.get("/client/releases", response_model=ReleaseListResponse, summary="获取发版历史列表")
async def list_releases(
    current_user: CurrentUser,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    search: Annotated[str | None, Query(max_length=100)] = None,
    s3_service: S3StorageService = Depends(),
) -> ReleaseListResponse:
    """获取已发布的版本列表（分页 + 搜索）.

    Args:
        current_user: 当前管理员信息
        limit: 每页数量，默认20，最大100
        offset: 偏移量，默认0
        search: 搜索关键词，匹配版本号或更新日志
        s3_service: S3 存储服务实例

    Returns:
        ReleaseListResponse: 包含总记录数和版本列表
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "仅管理员可查看发版记录"},
        )

    db = get_session()
    try:
        # 构建查询条件
        base_model = ClientReleaseModel
        if search:
            search_pattern = f"%{search}%"
            where_clause = or_(
                base_model.t_version.ilike(search_pattern),
                base_model.t_release_notes.ilike(search_pattern),
            )
        else:
            where_clause = None

        # 查询总数
        count_stmt = select(func.count()).select_from(base_model)
        if where_clause is not None:
            count_stmt = count_stmt.where(where_clause)
        total = db.execute(count_stmt).scalar() or 0

        # 查询分页数据
        stmt = select(base_model).order_by(base_model.t_created_at.desc())
        if where_clause is not None:
            stmt = stmt.where(where_clause)
        stmt = stmt.limit(limit).offset(offset)
        releases = db.execute(stmt).scalars().all()

        items = []
        for r in releases:
            url = s3_service.get_file_url(r.t_installer_exe_key) if r.t_installer_exe_key else None
            items.append(
                ReleaseListItem(
                    id=r.t_id,
                    version=r.t_version,
                    release_notes=r.t_release_notes,
                    created_at=r.t_created_at.isoformat(),
                    installer_url=url,
                )
            )
        return ReleaseListResponse(total=total, items=items)
    finally:
        db.close()


@router.delete(
    "/client/release/{release_id}",
    response_model=DeleteReleaseResponse,
    summary="删除发版记录",
    description="删除指定的客户端发版记录，同时删除 S3 上的安装包和 latest.yml",
)
async def delete_release(
    release_id: int,
    current_user: CurrentUser,
    s3_service: S3StorageService = Depends(),
) -> DeleteReleaseResponse:
    """删除指定的客户端发版记录及 S3 上的文件."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "仅管理员可删除发版记录"},
        )

    db = get_session()
    try:
        stmt = select(ClientReleaseModel).where(ClientReleaseModel.t_id == release_id)
        release = db.execute(stmt).scalars().first()

        if not release:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": 404, "message": f"发版记录不存在: id={release_id}"},
            )

        version_label = release.t_version

        # 删除 S3 上的文件
        for key in [release.t_installer_exe_key, release.t_latest_yml_key]:
            if key:
                try:
                    s3_service.delete_file(key)
                except Exception as e:
                    logger.warning(f"删除 S3 文件失败 [{key}]: {e}")

        # 删除数据库记录
        db.delete(release)
        db.commit()

        logger.info(f"删除发版记录成功: {version_label}")
        return DeleteReleaseResponse(ok=True, message=f"版本 {version_label} 已删除")
    finally:
        db.close()


@router.post(
    "/client/release",
    response_model=ReleaseResponse,
    summary="发布新版本客户端",
    description="管理员发布新版本的 Electron 客户端并上传至 S3, 自动发送飞书和企微通知.",
)
async def release_client(
    version: Annotated[str, Form(..., description="版本号, 如 0.1.0")],
    latest_yml: Annotated[UploadFile, File(..., description="latest.yml 文件")],
    installer_exe: Annotated[UploadFile, File(..., description="安装包 exe 文件")],
    current_user: CurrentUser,
    s3_service: S3StorageService = Depends(),
    release_notes: str | None = Form(None, description="更新日志内容"),
) -> ReleaseResponse:
    """管理员发布新版本的 Electron 客户端并上传至 S3.

    Args:
        version: 版本号 (如 1.0.0)
        latest_yml: electron-builder 生成的 yml 配置文件
        installer_exe: 客户端安装包二进制文件
        current_user: 当前登录的管理员信息
        s3_service: S3 存储服务实例
        release_notes: 本次版本的更新日志

    Returns:
        ReleaseResponse: 包含版本号和成功提示的消息

    Raises:
        HTTPException: 权限不足、版本冲突或上传失败
    """
    # 简单权限校验
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "仅管理员可执行发布操作"},
        )

    db = get_session()
    try:
        # 1. 上传 latest.yml
        yml_content = await latest_yml.read()
        yml_key = f"releases/{version}/latest.yml"
        s3_service.upload_bytes(yml_content, yml_key, content_type="application/x-yaml")

        # 2. 上传 installer
        exe_content = await installer_exe.read()
        exe_key = f"releases/{version}/{installer_exe.filename}"
        s3_service.upload_bytes(exe_content, exe_key, content_type="application/x-msdownload")

        # 3. 取消旧版本的激活状态（只保留最新版本为激活状态）
        old_releases = db.query(ClientReleaseModel).filter(
            ClientReleaseModel.t_is_active == True
        ).all()
        for old in old_releases:
            old.t_is_active = False
            logger.info(f"取消旧版本激活状态: {old.t_version}")

        # 4. 记录到数据库（新版本自动为激活状态）
        new_release = ClientReleaseModel(
            t_version=version,
            t_release_notes=release_notes,
            t_latest_yml_key=yml_key,
            t_installer_exe_key=exe_key,
            t_is_active=True,  # 新版本自动激活
            t_created_by=current_user.get("user_id"),
        )
        db.add(new_release)
        db.commit()

        logger.info(f"用户 {current_user.get('user_id')} 成功发布客户端新版本 {version}")

        # 5. 发送通知 (飞书 & 企微)
        from application.usecases.release_client import ReleaseClientUseCase

        releaser = ReleaseClientUseCase()
        download_url = s3_service.get_file_url(exe_key)
        releaser._send_notifications(version, download_url, release_notes or "无更新日志")

        return ReleaseResponse(version=version, message="发布成功, 已通知飞书和企业微信")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"发布客户端失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": f"发布客户端失败: {str(e)}"},
        )
    finally:
        db.close()


@router.get(
    "/client/build/status",
    response_model=BuildStatus,
    summary="获取打包状态",
)
async def get_build_status(current_user: CurrentUser) -> BuildStatus:
    """获取一键打包的当前状态"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可用")
    return BuildStatus(**_build_status)


@router.post(
    "/client/build_release",
    response_model=BuildStatus,
    summary="一键打包并发布",
    description="在服务器上执行打包命令，自动上传到 S3 并发送飞书通知",
)
async def build_and_release(
    body: BuildAndReleaseRequest,
    current_user: CurrentUser,
    s3_service: S3StorageService = Depends(),
) -> BuildStatus:
    """一键打包并发布新版本"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可用")

    if _build_status["status"] == "running":
        return BuildStatus(status="running", message="正在构建中...")

    async def _do_build():
        import subprocess
        import hashlib
        import datetime as dt
        import asyncio
        import yaml

        try:
            _build_status["status"] = "running"
            _build_status["message"] = "正在构建..."
            _build_status["error"] = None

            client_dir = Path(__file__).parent.parent.parent.parent.parent.parent / "client_electron"
            build_script = client_dir / "build_with_version.js"

            if not build_script.exists():
                raise FileNotFoundError(f"构建脚本不存在: {build_script}")

            # 执行构建 (在后台线程运行，不阻塞事件循环)
            _build_status["message"] = "正在编译前端 (vite build)..."
            result = await asyncio.to_thread(
                subprocess.run,
                ["node", "build_with_version.js"],
                cwd=str(client_dir),
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=300,
            )

            if result.returncode != 0:
                raise RuntimeError(f"构建失败: {result.stderr}")

            # 读取版本号 (JS 脚本写入的临时文件)
            import json as json_lib
            version_file = client_dir / ".build_version.json"
            if not version_file.exists():
                raise RuntimeError("版本号文件不存在，请检查构建是否正常完成")
            with open(version_file, "r", encoding="utf-8") as f:
                version_info = json_lib.load(f)
            full_version = version_info["fullVersion"]
            version = version_info["buildVersion"]
            # 清理临时文件
            version_file.unlink(missing_ok=True)

            exe_file = client_dir / "release" / f"TRAI Setup {full_version}.exe"
            if not exe_file.exists():
                # 查找最新的 exe
                exe_files = list((client_dir / "release").glob("TRAI Setup *.exe"))
                if exe_files:
                    exe_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
                    exe_file = exe_files[0]
                    full_version = exe_file.stem.replace("TRAI Setup ", "")

            if not exe_file.exists():
                raise FileNotFoundError(f"安装包不存在: {exe_file}")

            # 计算 SHA512
            _build_status["message"] = f"正在计算校验和 (SHA512)..."
            sha512_hash = hashlib.sha512()
            with open(exe_file, "rb") as f:
                for chunk in iter(lambda: f.read(8192), b""):
                    sha512_hash.update(chunk)
            sha512 = sha512_hash.hexdigest()

            # 生成 latest.yml
            now = dt.datetime.now()
            yml_data = {
                "version": full_version,
                "releaseDate": now.isoformat(),
                "files": [{"url": exe_file.name, "sha512": sha512, "size": exe_file.stat().st_size}],
                "path": exe_file.name,
            }
            yml_content = yaml.dump(yml_data)

            # 上传到 S3
            _build_status["message"] = f"正在上传到 S3 ({full_version})..."
            exe_key = f"releases/{full_version}/{exe_file.name}"
            with open(exe_file, "rb") as f:
                s3_service.upload_bytes(f.read(), exe_key, content_type="application/x-msdownload")
            s3_service.upload_bytes(yml_content.encode(), f"releases/{full_version}/latest.yml", content_type="application/x-yaml")

            # 保存到数据库
            _build_status["message"] = "正在保存版本记录..."
            with get_session() as db:
                # 取消旧版本激活
                db.query(ClientReleaseModel).filter(ClientReleaseModel.t_is_active == True).update({"t_is_active": False})
                new_release = ClientReleaseModel(
                    t_version=full_version,
                    t_release_notes=body.release_notes,
                    t_latest_yml_key=f"releases/{full_version}/latest.yml",
                    t_installer_exe_key=exe_key,
                    t_is_active=True,
                    t_created_by=current_user.get("user_id"),
                )
                db.add(new_release)
                db.commit()

            # 发送通知
            _build_status["message"] = "正在发送通知..."
            from application.usecases.release_client import ReleaseClientUseCase, FEISHU_RELEASE_WEBHOOK
            logger.info(f"[飞书通知] Webhook 已配置: {bool(FEISHU_RELEASE_WEBHOOK)}, 长度={len(FEISHU_RELEASE_WEBHOOK)}")
            releaser = ReleaseClientUseCase()
            download_url = s3_service.get_file_url(exe_key)
            releaser._send_notifications(full_version, download_url, body.release_notes or "无更新日志")
            logger.info(f"[飞书通知] 发送完成: v{full_version}")

            _build_status["status"] = "success"
            _build_status["message"] = "构建并发布成功"
            _build_status["version"] = full_version

        except Exception as e:
            _build_status["status"] = "failed"
            _build_status["error"] = str(e)
            logger.error(f"一键打包失败: {e}")

    # 后台执行构建
    import asyncio
    asyncio.create_task(_do_build())
    return BuildStatus(status="running", message="已启动构建，请在页面刷新查看进度")


@router.get(
    "/sessions/grouped",
    response_model=SessionGroupedResponse,
    tags=["管理后台"],
    summary="获取按用户分组的会话统计",
    description="获取所有用户的会话统计信息, 用于管理后台会话记录页面.",
)
async def get_sessions_grouped_by_user(
    current_user: AdminUser,
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> SessionGroupedResponse:
    """获取所有用户的会话统计信息

    Args:
        current_user: 管理员用户
        session: 数据库会话

    Returns:
        SessionGroupedResponse: 按用户分组的会话统计列表
    """
    from infrastructure.repositories.session_repository import SessionRepository
    from datetime import datetime, timedelta

    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "仅管理员可查看"},
        )

    session_repo = SessionRepository(session)
    sessions = session_repo.list_sessions(user_id=None, limit=10000, offset=0)

    user_stats: dict[str, dict[str, Any]] = {}
    for s in sessions:
        uid = s.t_user_id or "guest"
        if uid not in user_stats:
            user_stats[uid] = {
                "user_id": uid,
                "username": uid[:8] if uid != "guest" else "游客",
                "display_name": uid[:8] if uid != "guest" else "游客",
                "email": None,
                "sessions_count": 0,
                "messages_count": 0,
                "agent_calls": 0,
                "last_active": None,
                "status": "inactive",
            }
        user_stats[uid]["sessions_count"] += 1
        if s.t_updated_at:
            last = user_stats[uid]["last_active"]
            if not last or s.t_updated_at.isoformat() > last:
                user_stats[uid]["last_active"] = s.t_updated_at.isoformat()
            if s.t_updated_at >= datetime.now() - timedelta(days=30):
                user_stats[uid]["status"] = "active"

    items = [
        SessionGroupedItem(
            session_id="",
            user_id=uid,
            username=stats["username"],
            display_name=stats["display_name"],
            email=stats["email"],
            sessions_count=stats["sessions_count"],
            messages_count=0,
            agent_calls=stats["agent_calls"],
            last_active=stats["last_active"],
            status=stats["status"],
        )
        for uid, stats in user_stats.items()
    ]

    # 应用分页
    total_items = len(items)
    start_idx = offset
    end_idx = offset + limit
    paginated_items = items[start_idx:end_idx]

    return SessionGroupedResponse(total=total_items, sessions=paginated_items)
