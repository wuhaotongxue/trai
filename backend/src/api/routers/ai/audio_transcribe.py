#!/usr/bin/env python
# 文件名: audio_transcribe.py
# 作者: wuhao
# 日期: 2026_05_29_11:15:53
# 描述: 语音转写 API, 支持上传音频、后台 ASR 处理、生成多格式报告并推送通知

import os
import tempfile
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from api.deps import CurrentUserOptional, get_current_user
from infrastructure.ai.audio.local_asr_client import get_asr_client
from infrastructure.database.database import get_db_session
from infrastructure.database.models import AudioRecordModel
from infrastructure.notify.feishu_ai_notify import get_feishu_ai_notify_service
from infrastructure.services.task_flow_service import TaskFlowService
from infrastructure.storage.s3_storage import get_s3_storage

router = APIRouter()
s3_storage = get_s3_storage()


class RealtimeASRResponse(BaseModel):
    """实时 ASR 响应模型"""

    code: int = 200
    msg: str = "OK"
    data: dict = Field(default_factory=dict)


class TranscribeListResponse(BaseModel):
    """
    转写历史列表响应模型
    """

    code: int = 200
    msg: str = "OK"
    data: dict
    req_id: str = "N/A"
    ts: str = Field(default_factory=lambda: datetime.now().isoformat())


class AudioTranscribeRouter:
    """
    音频转写 API 路由处理器类, 封装上传及历史查询接口
    """

    @staticmethod
    @router.post(
        "/audio/incremental_transcribe",
        tags=["AI 语音分析"],
        summary="增量/实时语音识别",
        description="仅执行 ASR 识别并返回文本, 不触发 S3 同步或通知, 适用于前端实时展示",
    )
    async def incremental_transcribe(
        file: UploadFile = File(..., description="录音分片 Blob"),
    ):
        """
        处理增量录音识别, 仅返回文本
        """
        # 1. 保存临时文件
        suffix = ".wav"
        if file.filename:
            suffix = os.path.splitext(file.filename)[1] or ".wav"

        tmp_fd, tmp_path = tempfile.mkstemp(suffix=suffix)
        os.close(tmp_fd)

        try:
            with open(tmp_path, "wb") as f:
                f.write(await file.read())

            # 2. 执行 ASR 识别
            asr_client = get_asr_client()
            srt_result = await asr_client.transcribe(tmp_path)
            transcript = AudioTranscribeUtils.extract_text_from_srt(srt_result)

            if not transcript.strip():
                transcript = ""

            if transcript:
                logger.info(f"增量识别结果: {transcript}")

            return {"code": 200, "msg": "OK", "data": {"transcript": transcript}}

        except Exception as e:
            logger.error(f"Incremental ASR failed: {e}")
            return {"code": 500, "msg": str(e), "data": {"transcript": ""}}
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    @staticmethod
    @router.post(
        "/audio/realtime_transcribe",
        tags=["AI 语音分析"],
        summary="实时录音转写",
        description="接收前端录音 Blob, 执行高精度识别并自动同步 S3/通知",
    )
    async def realtime_transcribe(
        background_tasks: BackgroundTasks,
        file: UploadFile = File(..., description="录音文件 Blob"),
        current_user: CurrentUserOptional = None,
        db: Session = Depends(get_db_session),
    ):
        """
        处理实时录音转写

        1. 保存临时文件
        2. ASR 识别
        3. 调用 TaskFlowService (异步)
        4. 立即返回识别文本
        """
        user_id = current_user.get("user_id", "anonymous") if current_user else "anonymous"
        username = current_user.get("display_name", "游客") if current_user else "游客"

        # 1. 保存临时文件
        suffix = ".wav"
        if file.filename:
            suffix = os.path.splitext(file.filename)[1] or ".wav"

        tmp_fd, tmp_path = tempfile.mkstemp(suffix=suffix)
        os.close(tmp_fd)

        try:
            with open(tmp_path, "wb") as f:
                f.write(await file.read())

            # 2. 立即执行 ASR 识别 (为了前端实时感)
            asr_client = get_asr_client()
            logger.info(f"实时识别开始: {tmp_path}")
            srt_result = await asr_client.transcribe(tmp_path)
            transcript = AudioTranscribeUtils.extract_text_from_srt(srt_result)

            if not transcript.strip():
                transcript = "未能识别到清晰语音"
            else:
                logger.info(f"实时识别最终结果: {transcript}")

            # 3. 异步执行 TaskFlow (上传 S3 + 数据库 + 通知)
            task_id = str(uuid.uuid4())

            # 定义专家点评提示词
            expert_prompt = (
                f"用户完成了一段实时语音转录, 识别内容为: '{transcript[:500]}...'. 请评价其录音质量或内容要点."
            )

            # 后台处理后续流程
            # 注意: 不要直接传递 Depends(get_db_session) 注入的 db, 因为它在请求结束后会被关闭
            # 我们在后台任务中手动获取一个新的 session
            from infrastructure.database.database import DatabaseProvider

            def run_background_task(tid, uid, uname, path, filename, trans):
                with DatabaseProvider.get_session() as background_db:
                    task_flow = TaskFlowService(background_db)
                    import asyncio

                    # process_and_notify 是 async 方法, 需要用 event loop 运行
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        loop.run_until_complete(
                            task_flow.process_and_notify(
                                task_id=tid,
                                user_id=uid,
                                username=uname,
                                local_file_path=path,
                                s3_prefix="audio/asr",
                                record_model_class=AudioRecordModel,
                                task_data={
                                    "t_task_type": "asr",
                                    "t_title": f"实时识别: {filename or '未命名'}",
                                    "t_extra_data": {"transcript": trans, "original_filename": filename},
                                },
                                notify_title="🎙️ 实时语音识别完成",
                                expert_prompt=expert_prompt,
                            )
                        )
                    finally:
                        loop.close()

            background_tasks.add_task(
                run_background_task,
                task_id,
                user_id,
                username,
                tmp_path,
                file.filename,
                transcript,
            )

            return {
                "code": 200,
                "msg": "OK",
                "data": {"task_id": task_id, "transcript": transcript, "status": "completed"},
            }

        except Exception as e:
            logger.error(f"Realtime ASR failed: {e}")
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    @router.post(
        "/audio/transcribe",
        tags=["AI 语音分析"],
        summary="上传音频并转写",
        description="支持多种音频格式上传, 后台异步启动 ASR 转写并生成文档报告",
    )
    async def create_transcribe_task(
        background_tasks: BackgroundTasks,
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db_session),
    ):
        """
        上传音频并创建转写任务

        参数:
            background_tasks (BackgroundTasks): 后台任务管理器
            file (UploadFile): 上传的音频文件
            current_user (dict): 当前用户信息
            db (Session): 数据库会话
        返回值:
            dict: 包含 record_id 和 status 的结果字典
        """
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
        s3_storage.upload_file(tmp_path, s3_key)
        source_url = s3_storage.get_file_url(s3_key)

        # 3. 创建数据库记录
        record = AudioRecordModel(
            t_task_id=uuid.uuid4().hex,
            t_user_id=user_id,
            t_username=current_user.get("display_name", "游客"),
            t_task_type="asr",
            t_source_url=source_url,
            t_status="processing",
            t_extra_data={"original_filename": file.filename},
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        # 4. 提交后台任务
        background_tasks.add_task(AudioTranscribeTask.process_audio_task, record.t_id, tmp_path, file.filename, user_id)

        return {"code": 200, "msg": "OK", "data": {"record_id": str(record.t_id), "status": record.t_status}}

    @staticmethod
    @router.get(
        "/audio/transcribe/history",
        response_model=TranscribeListResponse,
        tags=["AI 语音分析"],
        summary="获取转写历史",
        description="查询当前用户的音频转写任务历史记录, 支持分页",
    )
    async def get_transcribe_history(
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db_session),
    ):
        """
        获取转写历史列表 (支持分页)

        参数:
            page (int): 页码
            page_size (int): 每页数量
            current_user (dict): 当前用户信息
            db (Session): 数据库会话
        返回值:
            TranscribeListResponse: 分页历史记录列表
        """
        user_id = current_user.get("username", "anonymous")

        query = (
            select(AudioRecordModel)
            .where(AudioRecordModel.t_user_id == user_id, AudioRecordModel.t_task_type == "asr")
            .order_by(desc(AudioRecordModel.t_created_at))
        )

        total = db.scalar(select(func.count()).select_from(query.subquery()))

        records = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()

        items = []
        for r in records:
            items.append(
                {
                    "id": str(r.t_id),
                    "file_name": r.t_extra_data.get("original_filename", "未知文件"),
                    "status": r.t_status,
                    "created_at": r.t_created_at.isoformat() if r.t_created_at else "",
                    "source_audio_url": r.t_source_url,
                    "result_url": r.t_result_url,
                    "result_text": r.t_extra_data.get("transcript", "")[:100] + "..."
                    if r.t_extra_data.get("transcript")
                    else None,
                }
            )

        return TranscribeListResponse(data={"items": items, "total": total, "page": page, "page_size": page_size})


class AudioTranscribeUtils:
    """
    音频转写工具类, 封装内部使用的辅助函数
    """

    @staticmethod
    def extract_text_from_srt(srt_content: str) -> str:
        """
        从 SRT 格式字符串中提取纯文本

        参数:
            srt_content (str): SRT 格式内容
        返回值:
            str: 提取出的纯文本内容
        """
        lines = srt_content.strip().split("\n")
        text_parts = []

        for line in lines:
            line = line.strip()
            # 跳过数字序号、时间戳行、空行
            if not line:
                continue
            if line.isdigit():
                continue
            if "-->" in line:
                continue
            text_parts.append(line)

        return "".join(text_parts)

    @staticmethod
    def send_transcribe_notify(
        user_id: str, file_name: str, text: str, md_url: str, txt_url: str, pdf_url: str
    ) -> None:
        """
        发送音频转写完成飞书通知 (不阻塞主请求)

        参数:
            user_id (str): 用户 ID
            file_name (str): 原始文件名
            text (str): 转写文本内容
            md_url (str): Markdown 下载链接
            txt_url (str): TXT 下载链接
            pdf_url (str): PDF 下载链接
        返回值:
            None
        """
        if not os.getenv("NOTIFY_FEISHU_AUDIO_ENABLED", "true").lower() == "true":
            return
        try:
            service = get_feishu_ai_notify_service()
            card_content = f"""**📝 音频转写完成**

**用户**: {user_id}
**文件**: {file_name}

**转写内容预览**:
{text[:200]}{"..." if len(text) > 200 else ""}

**下载链接**:
- 📝 [Markdown]({md_url})
- 📄 [TXT]({txt_url})
- 📑 [PDF]({pdf_url})"""

            service.send_card(title="🎙️ 音频转写完成通知", content=card_content, extra={"level": "INFO"})
            logger.info(f"飞书通知发送成功: {user_id} - {file_name}")
        except Exception as e:
            logger.error(f"发送飞书通知失败: {e}")


class AudioTranscribeTask:
    """
    音频转写后台任务处理类
    """

    @staticmethod
    async def process_audio_task(record_id: uuid.UUID, file_path: str, file_name: str, creator_id: str) -> None:
        """
        后台处理音频转写及文件生成

        参数:
            record_id (uuid.UUID): 数据库记录 ID
            file_path (str): 临时文件路径
            file_name (str): 原始文件名
            creator_id (str): 创建者 ID
        返回值:
            None
        """
        try:
            # 1. 提取文本
            asr_client = get_asr_client()
            logger.info(f"开始转写音频: {file_path}")
            result = await asr_client.transcribe(file_path)

            # 本地 ASR 返回的是 SRT 格式字符串
            if not result or not isinstance(result, str):
                raise Exception("ASR 返回空结果")

            # 从 SRT 格式中提取纯文本
            text = AudioTranscribeUtils.extract_text_from_srt(result)

            if not text.strip():
                raise Exception("转写结果为空")

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

                # 使用 fpdf2 生成真正的 PDF
                from fpdf import FPDF

                pdf = FPDF()
                pdf.add_page()
                pdf.set_font("SimSun", size=12)

                # 处理标题
                title = f"{base_name} - 语音转写报告"
                pdf.set_font("SimSun", style="B", size=16)
                pdf.cell(200, 15, txt=title, ln=True, align="C")

                pdf.set_font("SimSun", size=12)
                pdf.cell(200, 10, txt=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), ln=True, align="C")
                pdf.ln(10)

                # 添加分隔线
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.ln(10)

                # 添加正文内容, 自动换行
                pdf.set_font("SimSun", size=12)
                for line in text.split("\n"):
                    # 按固定宽度分割长行
                    while len(line) > 0:
                        pdf.cell(0, 10, txt=line[:40], ln=True)
                        line = line[40:]
                    pdf.ln(2)

                pdf.output(pdf_path)

                # 3. 上传到 S3
                date_prefix = datetime.now().strftime("%Y%m")
                md_key = f"transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.md"
                txt_key = f"transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.txt"
                pdf_key = f"transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.pdf"

                s3_storage.upload_file(md_path, md_key)
                s3_storage.upload_file(txt_path, txt_key)
                s3_storage.upload_file(pdf_path, pdf_key)

                md_url = s3_storage.get_file_url(md_key)
                txt_url = s3_storage.get_file_url(txt_key)
                pdf_url = s3_storage.get_file_url(pdf_key)

            # 4. 执行 TaskFlow 流程 (更新数据库 + 发送通知)
            from infrastructure.database.database import get_database
            from infrastructure.services.task_flow_service import TaskFlowService

            db = get_database().get_session()
            try:
                task_flow = TaskFlowService(db)
                # 定义专家点评提示词
                expert_prompt = f"用户上传了一段音频文件 '{file_name}' 并完成了识别. 识别内容为: '{text[:500]}...'. 请评价其录音质量或内容要点."

                # 直接调用同步方法或异步方法
                # 这里我们已经在后台线程了, 可以直接使用 TaskFlowService 的逻辑
                # 为了保持代码简洁, 我们手动触发核心更新和通知逻辑

                record = db.query(AudioRecordModel).filter(AudioRecordModel.t_id == record_id).first()
                if record:
                    record.t_status = "success"
                    extra = dict(record.t_extra_data or {})
                    extra.update({"transcript": text, "md_url": md_url, "txt_url": txt_url, "pdf_url": pdf_url})
                    record.t_extra_data = extra
                    record.t_result_url = md_url
                    db.commit()

                    # 发送多端通知
                    task_flow._send_notifications(
                        title="🎙️ 音频文件转写完成",
                        username=creator_id,
                        url=md_url,
                        expert_msg=expert_prompt,  # 使用生成的点评提示词作为预览
                        item_name=file_name,
                        transcript=text,  # 显式传入转录文本
                    )
            finally:
                db.close()

            logger.info(f"音频转写任务完成: {record_id}")

        except Exception as e:
            logger.error(f"处理音频转写任务异常: {e}")
            from infrastructure.database.database import get_database

            db = get_database().get_session()
            try:
                record = db.query(AudioRecordModel).filter(AudioRecordModel.t_id == record_id).first()
                if record:
                    record.t_status = "failed"
                    db.commit()
            finally:
                db.close()
        finally:
            # 清理原始音频文件
            if os.path.exists(file_path):
                os.remove(file_path)


__all__ = ["router"]
