import os
import tempfile
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, UploadFile
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from api.deps import get_current_user
from infrastructure.ai.audio.local_asr_client import get_asr_client
from infrastructure.database.database import get_db
from infrastructure.database.transcribe_model import AudioTranscribeRecordModel
from infrastructure.storage.s3_storage import get_s3_storage

router = APIRouter()
s3_storage = get_s3_storage()


class TranscribeListResponse(BaseModel):
    code: int = 200
    msg: str = "OK"
    data: dict
    req_id: str = "N/A"
    ts: str = Field(default_factory=lambda: datetime.now().isoformat())


async def process_audio_task(record_id: uuid.UUID, file_path: str, file_name: str, creator_id: str):
    """后台处理音频转写及文件生成"""
    try:
        # 1. 提取文本
        asr_client = get_asr_client()
        logger.info(f"开始转写音频: {file_path}")
        result = await asr_client.transcribe(file_path)

        if not result.get("success"):
            raise Exception(f"ASR 失败: {result.get('error')}")

        text = result.get("text", "")

        # 2. 生成 MD, TXT, PDF (这里用临时文件模拟 PDF 生成)
        base_name = os.path.splitext(file_name)[0]
        md_content = f"# {base_name} - 语音转写报告\n\n**转写时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n---\n\n{text}"
        txt_content = f"语音转写结果: {base_name}\n时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n{text}"

        md_url = ""
        txt_url = ""
        pdf_url = ""

        with tempfile.TemporaryDirectory() as tmpdir:
            md_path = os.path.join(tmpdir, f"{base_name}.md")
            txt_path = os.path.join(tmpdir, f"{base_name}.txt")
            pdf_path = os.path.join(tmpdir, f"{base_name}.pdf")

            with open(md_path, "w", encoding="utf-8") as f:
                f.write(md_content)
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(txt_content)

            # TODO: 真实的 PDF 生成可以使用 reportlab 或 pdfkit，这里先用文本写入充当 PDF
            with open(pdf_path, "wb") as f:
                f.write(md_content.encode("utf-8"))

            # 3. 上传到 S3
            date_prefix = datetime.now().strftime("%Y%m")
            md_key = f"transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.md"
            txt_key = f"transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.txt"
            pdf_key = f"transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.pdf"

            await s3_storage.upload_file_async(md_path, md_key)
            await s3_storage.upload_file_async(txt_path, txt_key)
            await s3_storage.upload_file_async(pdf_path, pdf_key)

            md_url = f"{os.getenv('S3_ENDPOINT_URL')}/{os.getenv('S3_BUCKET_NAME')}/{md_key}"
            txt_url = f"{os.getenv('S3_ENDPOINT_URL')}/{os.getenv('S3_BUCKET_NAME')}/{txt_key}"
            pdf_url = f"{os.getenv('S3_ENDPOINT_URL')}/{os.getenv('S3_BUCKET_NAME')}/{pdf_key}"

        # 4. 更新数据库
        from infrastructure.database.database import SessionLocal

        with SessionLocal() as db:
            record = db.query(AudioTranscribeRecordModel).filter(AudioTranscribeRecordModel.id == record_id).first()
            if record:
                record.status = "success"
                record.result_text = text
                record.md_url = md_url
                record.txt_url = txt_url
                record.pdf_url = pdf_url
                db.commit()

        logger.info(f"音频转写任务完成: {record_id}")

    except Exception as e:
        logger.error(f"处理音频转写任务异常: {e}")
        from infrastructure.database.database import SessionLocal

        with SessionLocal() as db:
            record = db.query(AudioTranscribeRecordModel).filter(AudioTranscribeRecordModel.id == record_id).first()
            if record:
                record.status = "failed"
                db.commit()
    finally:
        # 清理原始音频文件
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/audio/transcribe", tags=["AI 语音分析"])
async def create_transcribe_task(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """上传音频并创建转写任务"""
    user_id = current_user.get("username", "anonymous")

    # 1. 保存音频到临时目录
    ext = os.path.splitext(file.filename)[1]
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=ext)
    os.close(tmp_fd)

    with open(tmp_path, "wb") as f:
        f.write(await file.read())

    # 2. 上传源音频到 S3
    date_prefix = datetime.now().strftime("%Y%m")
    s3_key = f"uploads/audio/{date_prefix}/{uuid.uuid4().hex[:8]}_{file.filename}"
    await s3_storage.upload_file_async(tmp_path, s3_key)
    source_url = f"{os.getenv('S3_ENDPOINT_URL')}/{os.getenv('S3_BUCKET_NAME')}/{s3_key}"

    # 3. 创建数据库记录
    record = AudioTranscribeRecordModel(
        creator_id=user_id, file_name=file.filename, source_audio_url=source_url, status="processing"
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # 4. 提交后台任务
    background_tasks.add_task(process_audio_task, record.id, tmp_path, file.filename, user_id)

    return {"code": 200, "msg": "OK", "data": {"record_id": str(record.id), "status": record.status}}


@router.get("/audio/transcribe/history", response_model=TranscribeListResponse, tags=["AI 语音分析"])
async def get_transcribe_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取转写历史列表 (支持分页)"""
    user_id = current_user.get("username", "anonymous")

    query = (
        select(AudioTranscribeRecordModel)
        .where(AudioTranscribeRecordModel.creator_id == user_id, AudioTranscribeRecordModel.is_deleted.is_(False))
        .order_by(desc(AudioTranscribeRecordModel.created_at))
    )

    total = db.scalar(select(func.count()).select_from(query.subquery()))

    records = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()

    items = []
    for r in records:
        items.append(
            {
                "id": str(r.id),
                "file_name": r.file_name,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
                "source_audio_url": r.source_audio_url,
                "md_url": r.md_url,
                "txt_url": r.txt_url,
                "pdf_url": r.pdf_url,
                "result_text": r.result_text[:100] + "..." if r.result_text else None,
            }
        )

    return TranscribeListResponse(data={"items": items, "total": total, "page": page, "page_size": page_size})


__all__ = ["router"]
