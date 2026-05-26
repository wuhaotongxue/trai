#!/usr/bin/env python
# 文件名: subtitle.py
# 作者: wuhao
# 日期: 2026_05_23_10:00:00
# 描述: 提供 AI 影音工作室相关的路由接口，包含字幕生成、人声分离和声音克隆.

from __future__ import annotations

import uuid
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field

from api.deps import CurrentUserOptional
from application.ai.dubbing.separate_usecase import AudioSeparateUseCase
from application.ai.subtitle.usecases import SubtitleGenerateUseCase
from infrastructure.database.database import get_db_session
from infrastructure.repositories.subtitle_record_repository import SubtitleRecordRepository

router = APIRouter()


class SubtitleGenerationResponse(BaseModel):
    """字幕生成/音视频处理的响应模型"""

    task_id: str = Field(description="任务 ID")
    status: str = Field(description="任务状态")
    input_type: Literal["video", "audio"] = Field(description="输入类型")
    target_lang: str = Field(description="目标语言代码")
    burn_mode: Literal["none", "zh", "target", "bilingual", "vocal_separate", "clone_stub"] = Field(
        description="烧录模式"
    )
    zh_srt_url: str | None = Field(default=None, description="中文字幕 SRT URL")
    target_srt_url: str | None = Field(default=None, description="目标语言 SRT URL")
    output_video_url: str | None = Field(default=None, description="输出视频 URL(仅视频输入且 burn_mode!=none)")
    object_prefix: str = Field(description="S3 对象前缀")


def get_separate_usecase(session=Depends(get_db_session)) -> AudioSeparateUseCase:
    """
    获取人声分离应用层用例实例.

    参数:
        session: 数据库会话.

    返回值:
        AudioSeparateUseCase: 实例.

    异常:
        无.
    """
    repo = SubtitleRecordRepository(session)
    return AudioSeparateUseCase(repo)


@router.post(
    "/video/separate",
    response_model=SubtitleGenerationResponse,
    tags=["AI"],
    summary="视频人声分离",
    description="上传音视频文件, 使用 Demucs 进行人声和伴奏分离.",
)
async def separate_audio(
    request_http: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="上传视频或音频文件"),
    current_user: CurrentUserOptional = None,
    usecase: AudioSeparateUseCase = Depends(get_separate_usecase),
) -> SubtitleGenerationResponse:
    """
    视频人声分离接口.

    参数:
        request_http: Request, 请求对象.
        background_tasks: BackgroundTasks, 后台任务对象.
        file: UploadFile, 上传的文件.
        current_user: CurrentUserOptional, 当前用户.
        usecase: AudioSeparateUseCase, 用例实例.

    返回值:
        SubtitleGenerationResponse: 任务响应.

    异常:
        HTTPException: 处理异常.
    """
    user_id = current_user.get("user_id", "") if current_user else ""
    user_name = current_user.get("display_name", "") if current_user else "anonymous"
    tenant_id = current_user.get("tenant_id") if current_user else ""

    task_id = str(uuid.uuid4())
    filename = file.filename or "upload"
    content_type = file.content_type or ""

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

    background_tasks.add_task(
        usecase.execute,
        task_id=task_id,
        user_id=user_id,
        user_name=user_name,
        tenant_id=tenant_id,
        file_bytes=file_bytes,
        filename=filename,
        content_type=content_type,
    )

    safe_tenant_id = tenant_id or "default"
    safe_user_id = user_id or "anonymous"
    safe_task_id = task_id.replace("-", "")
    object_prefix = f"private/tenants/{safe_tenant_id}/ai_subtitles/{safe_user_id}/{safe_task_id}"

    input_is_video = AudioSeparateUseCase.is_video(filename, content_type)
    return SubtitleGenerationResponse(
        task_id=task_id,
        status="processing",
        input_type="video" if input_is_video else "audio",
        target_lang="vocal_separate",
        burn_mode="none",
        object_prefix=object_prefix,
    )


@router.post(
    "/video/lipsync",
    response_model=SubtitleGenerationResponse,
    tags=["AI"],
    summary="口型同步",
    description="上传视频和音频文件, 使用 Wav2Lip 等模型将视频人物的口型与新音频同步.",
)
async def lipsync_video(
    request_http: Request,
    background_tasks: BackgroundTasks,
    video_file: UploadFile = File(..., description="上传原始视频文件"),
    audio_file: UploadFile = File(..., description="上传需要同步的音频文件"),
    current_user: CurrentUserOptional = None,
    session=Depends(get_db_session),
) -> SubtitleGenerationResponse:
    """
    口型同步接口.

    参数:
        request_http: Request, 请求对象.
        background_tasks: BackgroundTasks, 后台任务对象.
        video_file: UploadFile, 视频文件.
        audio_file: UploadFile, 音频文件.
        current_user: CurrentUserOptional, 当前用户.
        session: 数据库会话.

    返回值:
        SubtitleGenerationResponse: 任务响应.

    异常:
        无.
    """
    import uuid
    from pathlib import Path

    import aiofiles
    from infrastructure.persistence.repositories.subtitle_repository import SubtitleRecordRepositoryImpl

    from application.ai.dubbing.lipsync_usecase import LipSyncUseCase
    from domain.entities.subtitle_record import SubtitleRecord, SubtitleTaskType

    task_id = str(uuid.uuid4())
    user_id_str = current_user.user_id if current_user else "anonymous"

    record = SubtitleRecord(
        id=task_id,
        user_id=user_id_str,
        task_type=SubtitleTaskType.LIPSYNC if hasattr(SubtitleTaskType, "LIPSYNC") else "lipsync",
        status="pending",
        input_type="video",
        target_lang="none",
        burn_mode="none",
        object_prefix="none",
    )

    repo = SubtitleRecordRepositoryImpl(session)
    await repo.save(record)

    # 异步保存文件
    tmp_dir = Path("/tmp/trai_workspace")
    tmp_dir.mkdir(parents=True, exist_ok=True)

    v_ext = Path(video_file.filename or "video.mp4").suffix
    local_video_path = tmp_dir / f"{task_id}_video{v_ext}"
    async with aiofiles.open(local_video_path, "wb") as f:
        while chunk := await video_file.read(8192):
            await f.write(chunk)

    a_ext = Path(audio_file.filename or "audio.wav").suffix
    local_audio_path = tmp_dir / f"{task_id}_audio{a_ext}"
    async with aiofiles.open(local_audio_path, "wb") as f:
        while chunk := await audio_file.read(8192):
            await f.write(chunk)

    usecase = LipSyncUseCase(repo)
    background_tasks.add_task(usecase.execute, record, local_video_path, local_audio_path)

    return SubtitleGenerationResponse(
        task_id=task_id,
        status="processing",
        input_type="video",
        target_lang="none",
        burn_mode="none",
        object_prefix="none",
    )


@router.post(
    "/video/clone",
    response_model=SubtitleGenerationResponse,
    tags=["AI"],
    summary="声音克隆",
    description="上传音视频文件, 使用魔塔社区的 CosyVoice 进行零样本声音克隆.",
)
async def clone_voice(
    request_http: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="上传视频或音频文件"),
    target_lang: str = Form("英文", description="目标语言"),
    source_lang: str = Form("auto", description="源语言"),
    current_user: CurrentUserOptional = None,
    session=Depends(get_db_session),
) -> SubtitleGenerationResponse:
    """
    声音克隆接口.

    参数:
        request_http: Request, 请求对象.
        background_tasks: BackgroundTasks, 后台任务对象.
        file: UploadFile, 上传的文件.
        target_lang: str, 目标语言.
        source_lang: str, 源语言.
        current_user: CurrentUserOptional, 当前用户.
        session: 数据库会话.

    返回值:
        SubtitleGenerationResponse: 任务响应.

    异常:
        无.
    """
    import uuid
    from pathlib import Path

    import aiofiles
    from infrastructure.persistence.repositories.subtitle_repository import SubtitleRecordRepositoryImpl

    from application.ai.dubbing.clone_usecase import CloneVoiceUseCase
    from domain.entities.subtitle_record import SubtitleRecord, SubtitleTaskType

    task_id = str(uuid.uuid4())
    user_id_str = current_user.user_id if current_user else "anonymous"

    record = SubtitleRecord(
        id=task_id,
        user_id=user_id_str,
        task_type=SubtitleTaskType.CLONE,
        status="pending",
        input_type="video",
        target_lang=target_lang,
        burn_mode="none",
        object_prefix="none",
    )

    repo = SubtitleRecordRepositoryImpl(session)
    await repo.save(record)

    # 异步保存文件
    tmp_dir = Path("/tmp/trai_workspace")
    tmp_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "test.mp4").suffix
    local_file_path = tmp_dir / f"{task_id}{ext}"

    async with aiofiles.open(local_file_path, "wb") as f:
        while chunk := await file.read(8192):
            await f.write(chunk)

    usecase = CloneVoiceUseCase(repo)
    background_tasks.add_task(usecase.execute, record, local_file_path)

    return SubtitleGenerationResponse(
        task_id=task_id,
        status="processing",
        input_type="video",
        target_lang=target_lang,
        burn_mode="none",
        object_prefix="none",
    )


def get_subtitle_usecase(session=Depends(get_db_session)) -> SubtitleGenerateUseCase:
    """
    获取字幕生成应用层用例实例.

    参数:
        session: 数据库会话.

    返回值:
        SubtitleGenerateUseCase: 实例.

    异常:
        无.
    """
    repo = SubtitleRecordRepository(session)
    return SubtitleGenerateUseCase(repo)


@router.post(
    "/subtitle/generate",
    response_model=SubtitleGenerationResponse,
    tags=["AI"],
    summary="字幕生成",
    description="上传音视频文件, 生成多语言字幕并支持烧录到视频中.",
)
async def generate_subtitle(
    request_http: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="上传视频或音频文件"),
    target_lang: str = Form("en", description="目标语言代码, 如 en"),
    source_lang: str = Form("", description="源语言代码, 为空则自动识别"),
    include_zh_subtitle: bool = Form(True, description="是否生成中文字幕(SRT)"),
    include_target_subtitle: bool = Form(True, description="是否生成目标语言字幕(SRT)"),
    burn_mode: Literal["none", "zh", "target", "bilingual"] = Form("bilingual", description="烧录模式"),
    current_user: CurrentUserOptional = None,
    usecase: SubtitleGenerateUseCase = Depends(get_subtitle_usecase),
) -> SubtitleGenerationResponse:
    """
    视频/音频字幕生成接口.

    参数:
        request_http: Request, 请求对象.
        background_tasks: BackgroundTasks, 后台任务对象.
        file: UploadFile, 上传的文件.
        target_lang: str, 目标语言代码.
        source_lang: str, 源语言代码.
        include_zh_subtitle: bool, 是否生成中文字幕.
        include_target_subtitle: bool, 是否生成目标语言字幕.
        burn_mode: Literal, 烧录模式.
        current_user: CurrentUserOptional, 当前用户.
        usecase: SubtitleGenerateUseCase, 用例实例.

    返回值:
        SubtitleGenerationResponse: 任务响应.

    异常:
        HTTPException: 处理异常.
    """
    user_id = current_user.get("user_id", "") if current_user else ""
    user_name = current_user.get("display_name", "") if current_user else "anonymous"
    tenant_id = current_user.get("tenant_id") if current_user else ""

    task_id = str(uuid.uuid4())
    filename = file.filename or "upload"
    content_type = file.content_type or ""

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": 500, "message": f"read file failed: {e}", "task_id": task_id},
        )

    # 提交到后台执行
    background_tasks.add_task(
        usecase.execute,
        task_id=task_id,
        user_id=user_id,
        user_name=user_name,
        tenant_id=tenant_id,
        file_bytes=file_bytes,
        filename=filename,
        content_type=content_type,
        target_lang=target_lang,
        source_lang=source_lang,
        include_zh_subtitle=include_zh_subtitle,
        include_target_subtitle=include_target_subtitle,
        burn_mode=burn_mode,
    )

    safe_tenant_id = tenant_id or "default"
    safe_user_id = user_id or "anonymous"
    safe_task_id = task_id.replace("-", "")
    object_prefix = f"private/tenants/{safe_tenant_id}/ai_subtitles/{safe_user_id}/{safe_task_id}"

    input_is_video = SubtitleGenerateUseCase.is_video(filename, content_type)
    input_type: Literal["video", "audio"] = "video" if input_is_video else "audio"

    return SubtitleGenerationResponse(
        task_id=task_id,
        status="processing",
        input_type=input_type,
        target_lang=target_lang,
        burn_mode=burn_mode if input_is_video else "none",
        zh_srt_url=None,
        target_srt_url=None,
        output_video_url=None,
        object_prefix=object_prefix,
    )


class SubtitleRecordDTO(BaseModel):
    task_id: str
    task_type: str = "subtitle"
    file_name: str
    target_lang: str
    burn_mode: str
    status: str
    zh_srt_url: str | None
    target_srt_url: str | None
    output_video_url: str | None
    vocal_url: str | None = None
    bgm_url: str | None = None
    error_message: str | None
    created_at: str


@router.post(
    "/subtitle/list",
    response_model=list[SubtitleRecordDTO],
    tags=["AI"],
    summary="查询历史记录",
    description="获取当前用户的 AI 影音工作室处理记录列表.",
)
def list_subtitles(
    current_user: CurrentUserOptional = None,
    session=Depends(get_db_session),
) -> list[SubtitleRecordDTO]:
    """
    获取用户的字幕生成历史记录.

    参数:
        current_user: CurrentUserOptional, 当前用户.
        session: 数据库会话.

    返回值:
        list[SubtitleRecordDTO]: 记录列表.

    异常:
        无.
    """
    from sqlalchemy import desc, select

    from infrastructure.database.subtitle_record_model import SubtitleRecordModel

    user_id = current_user.get("user_id", "") if current_user else ""
    safe_user_id = user_id or "anonymous"

    records = (
        session.execute(
            select(SubtitleRecordModel)
            .where(SubtitleRecordModel.user_id == safe_user_id)
            .order_by(desc(SubtitleRecordModel.created_at))
            .limit(50)
        )
        .scalars()
        .all()
    )

    out = []
    for r in records:
        out.append(
            SubtitleRecordDTO(
                task_id=r.task_id,
                task_type=r.task_type,
                file_name=r.file_name,
                target_lang=r.target_lang,
                burn_mode=r.burn_mode,
                status=r.status,
                zh_srt_url=r.zh_srt_url,
                target_srt_url=r.target_srt_url,
                output_video_url=r.output_video_url,
                vocal_url=r.vocal_url,
                bgm_url=r.bgm_url,
                error_message=r.error_message,
                created_at=r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
            )
        )
    return out


@router.post(
    "/subtitle/delete",
    tags=["AI"],
    summary="删除字幕记录",
    description="删除指定的字幕处理记录.",
)
def delete_subtitle(
    task_id: str = Form(..., description="任务 ID"),
    current_user: CurrentUserOptional = None,
    session=Depends(get_db_session),
) -> dict:
    """
    删除字幕记录.

    参数:
        task_id: str, 任务 ID.
        current_user: CurrentUserOptional, 当前用户.
        session: 数据库会话.

    返回值:
        dict: 删除结果.

    异常:
        HTTPException: 记录不存在或无权删除.
    """
    from infrastructure.database.subtitle_record_model import SubtitleRecordModel

    user_id = current_user.get("user_id", "") if current_user else ""
    safe_user_id = user_id or "anonymous"

    record = (
        session.query(SubtitleRecordModel)
        .filter(SubtitleRecordModel.task_id == task_id, SubtitleRecordModel.user_id == safe_user_id)
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    session.delete(record)
    session.commit()

    return {"code": 200, "msg": "Deleted successfully", "data": None}


__all__ = ["router"]
