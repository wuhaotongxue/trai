#!/usr/bin/env python
# 文件名: music.py
# 作者: wuhao
# 日期: 2026_05_26_20:53:15
# 描述: 音乐生成 API, 提供基于 ACE-Step 模型的音乐生成、下载及列表查询接口.

import asyncio
import os
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from loguru import logger
from pydantic import BaseModel, Field

from api.deps import CurrentUserOptional
from core.paths import ProjectPaths
from infrastructure.ai.audio.local_music_client import MusicClientProvider
from infrastructure.ai.core.openai_client import OpenAIClient
from infrastructure.ai.vision.image_client_factory import ImageClientFactory
from infrastructure.database import get_session
from infrastructure.database.models import MusicRecordModel
from infrastructure.notifications.media_notify import media_notifier
from infrastructure.services.agent_audit_log_service import AgentAuditLogService

router = APIRouter(prefix="/music", tags=["ai", "music"])


class MusicGenerateRequest(BaseModel):
    """
    音乐生成请求模型.
    """

    prompt: str = Field(..., description="音乐描述/提示词", min_length=1, max_length=500)
    duration: float | None = Field(30.0, description="音频时长（秒）", ge=5, le=300)
    steps: int | None = Field(27, description="推理步数", ge=1, le=100)
    guidance_scale: float | None = Field(7.0, description="引导强度", ge=1.0, le=20.0)
    model: str | None = Field("ace-step", description="模型名称 (ace-step)")


class MusicGenerateResponse(BaseModel):
    """
    音乐生成响应模型.
    """

    success: bool
    task_id: str
    message: str
    music_url: str | None = None
    lyrics: str | None = Field(None, description="AI 生成歌词")
    cover_url: str | None = Field(None, description="AI 生成封面图")
    file_path: str | None = None
    duration: float | None = None
    error: str | None = None


_music_tasks: dict[str, Any] = {}


class MusicController:
    """音乐生成控制器类."""

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """
        获取客户端 IP.
        """
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        if request.client:
            return request.client.host or ""
        return ""

    @staticmethod
    def _create_record(task_id: str, request: MusicGenerateRequest, user_context: dict[str, str]) -> None:
        """
        创建音乐记录.
        """
        logger.info(
            f"[音乐生成] 创建数据库记录 | task_id={task_id} | user_id={user_context.get('user_id', '')} "
            f"| duration={request.duration} | steps={request.steps}"
        )
        with get_session() as db:
            db.add(
                MusicRecordModel(
                    t_task_id=task_id,
                    t_user_id=user_context.get("user_id", ""),
                    t_username=user_context.get("username"),
                    t_client_ip=user_context.get("client_ip"),
                    t_user_agent=user_context.get("user_agent"),
                    t_tenant_id=user_context.get("tenant_id"),
                    t_prompt=request.prompt,
                    t_status="queued",
                    t_progress_message="任务已进入队列",
                    t_model=request.model,
                    t_duration_seconds=float(request.duration or 30.0),
                    t_steps=int(request.steps or 27),
                    t_guidance_scale=float(request.guidance_scale or 7.0),
                )
            )
            AgentAuditLogService(db).write_log(
                action="music_generate_submitted",
                level="info",
                path="/ai/music/generate",
                message="音乐生成任务已提交",
                user_id=user_context.get("user_id", ""),
                username=user_context.get("username", ""),
                client_ip=user_context.get("client_ip", ""),
                status_code=200,
                method="POST",
                metadata={
                    "task_id": task_id,
                    "duration": request.duration,
                    "steps": request.steps,
                    "log_type": "music",
                },
            )
            db.commit()

    @staticmethod
    def _update_record(task_id: str, **fields: Any) -> None:
        """
        更新音乐记录状态.
        """
        with get_session() as db:
            record = db.query(MusicRecordModel).filter(MusicRecordModel.t_task_id == task_id).one_or_none()
            if record is None:
                return
            for key, value in fields.items():
                setattr(record, key, value)
            record.t_updated_at = datetime.now()
            if fields.get("t_status") in {"completed", "failed", "cancelled"}:
                record.t_completed_at = datetime.now()
            db.commit()

    @staticmethod
    async def _generate_lyrics(prompt: str) -> str:
        """调用 DeepSeek 动态生成歌词"""
        try:
            llm = OpenAIClient(provider="deepseek")

            system_prompt = (
                "你是一位全球顶尖的音乐作词人, 拥有极强的风格模仿能力与深厚的原创功底。\n"
                "### 核心任务：\n"
                "1. **风格灵魂捕捉**：分析用户提到的歌手、乐队或曲目, 提取其创作中的核心意象、情感基调和叙事角度。\n"
                "2. **绝对严禁抄袭**：**严禁使用任何原词、金句或歌名中的短语**。例如, 如果模仿《青花瓷》, 严禁出现“天青色等烟雨”、“素胚勾勒”等任何原句。你必须用全新的词汇（如：宣纸、泼墨、断桥、古巷）去重塑意境, 而不是搬运文字。\n"
                "3. **高品质原创**：创作一首结构完整、韵律优美、情感真实的**全新原创**歌词。它应该听起来像该艺术家的作品, 但却是一首从未面世的新歌。\n\n"
                "### 歌词格式要求：\n"
                "- 必须包含 [00:00.00] 格式的时间戳（LRC 标准）。\n"
                "- 结构必须包含 [Verse], [Chorus], [Bridge] 等明确标识。\n"
                "- 直接输出歌词文本, 禁止包含任何前言、解释或致敬说明。"
            )
            resp = await llm.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"请为我创作一首全新原创歌词, 风格要求: {prompt}"},
                ],
                temperature=0.9,
            )
            lyrics = resp.get("content", "").strip()
            logger.info(f"[歌词生成] 成功生成歌词预览 (前50字): {lyrics[:50]}...")
            return lyrics
        except Exception as e:
            logger.warning(f"生成歌词失败: {e}")
            return "（歌词生成失败，请欣赏纯音乐）"

    @staticmethod
    async def _generate_cover(prompt: str) -> str:
        """动态生成歌曲封面图"""
        try:
            from infrastructure.ai.core.prompt_optimizer import PromptOptimizer

            optimizer = PromptOptimizer()
            # 优化封面提示词
            optimized_image_prompt = await optimizer.optimize_image_prompt(
                f"Professional music album cover, artistic style, theme: {prompt}"
            )

            image_client = ImageClientFactory.create()
            result = await image_client.generate(prompt=optimized_image_prompt)
            return result.image_url
        except Exception as e:
            logger.warning(f"生成封面失败: {e}")
            return ""

    @staticmethod
    def _do_generate(task_id: str, request: MusicGenerateRequest, user_context: dict[str, str]):
        """后台实际执行音乐生成的任务."""
        try:
            logger.info(f"[音乐生成] 开始执行后台任务 | task_id={task_id}")
            _music_tasks[task_id]["status"] = "processing"

            # 1. 异步生成歌词和封面，生成完立刻更新进度
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            # 优先生成歌词
            _music_tasks[task_id]["progress"] = "正在创作灵感歌词..."
            MusicController._update_record(task_id, t_progress_message="正在创作灵感歌词...")
            lyrics = loop.run_until_complete(MusicController._generate_lyrics(request.prompt))
            _music_tasks[task_id]["lyrics"] = lyrics

            # 生成封面
            _music_tasks[task_id]["progress"] = "正在设计艺术封面..."
            MusicController._update_record(
                task_id,
                t_progress_message="正在设计艺术封面...",
                t_lyrics=lyrics,  # 先存入歌词
            )
            cover_url = loop.run_until_complete(MusicController._generate_cover(request.prompt))
            _music_tasks[task_id]["cover_url"] = cover_url

            # 更新状态，让前端能拿到歌词和封面
            MusicController._update_record(
                task_id,
                t_status="processing",
                t_progress_message="正在渲染动听旋律...",
                t_lyrics=lyrics,
                t_cover_url=cover_url,
            )

            client = MusicClientProvider.get_music_client()

            def progress_cb(msg: str):
                logger.info(f"[音乐生成] 进度更新 | task_id={task_id} | progress={msg}")
                _music_tasks[task_id]["progress"] = msg
                MusicController._update_record(task_id, t_progress_message=msg)

            def cancel_check() -> bool:
                return _music_tasks.get(task_id, {}).get("status") == "cancelling"

            # 在后台线程中必须使用同步生成，或者创建一个新的事件循环
            result = client.generate(
                prompt=request.prompt,
                duration=request.duration,
                steps=request.steps,
                guidance_scale=request.guidance_scale,
                progress_callback=progress_cb,
                cancel_check=cancel_check,
            )

            if _music_tasks[task_id]["status"] == "cancelling":
                logger.warning(f"[音乐生成] 任务被取消 | task_id={task_id}")
                _music_tasks[task_id]["status"] = "cancelled"
                _music_tasks[task_id]["progress"] = "已取消"
                MusicController._update_record(
                    task_id,
                    t_status="cancelled",
                    t_progress_message="已取消",
                )
                AgentAuditLogService.write_log_with_new_session(
                    action="music_generate_cancelled",
                    level="warning",
                    path="/ai/music/cancel",
                    message="音乐生成任务已取消",
                    user_id=user_context.get("user_id", ""),
                    username=user_context.get("username", ""),
                    client_ip=user_context.get("client_ip", ""),
                    status_code=200,
                    metadata={"task_id": task_id, "log_type": "music"},
                )
                return

            if result.success:
                filename = os.path.basename(result.file_path or "")

                # 上传到 S3 (使用纯 ASCII 键名避免预签名 URL 编码问题)
                s3_url = ""
                try:
                    from infrastructure.storage.s3_storage import get_s3_storage

                    s3_storage = get_s3_storage()
                    # 提取纯英数字作为前缀，避免 SignatureDoesNotMatch
                    safe_filename = f"music_{task_id}.wav"
                    s3_key = f"private/tenants/default/ai_generated/music/anonymous/{safe_filename}"
                    s3_storage.upload_file(result.file_path, s3_key, content_type="audio/wav")
                    # 使用预签名 URL，绕过 Nginx 的静态文件拦截
                    s3_url = s3_storage.get_long_term_url(s3_key, expires_days=30)
                    public_url = s3_storage.get_file_url(s3_key)
                except Exception as e:
                    logger.warning(f"音乐文件上传 S3 失败: {e}")
                    public_url = ""

                final_url = s3_url or f"/api_trai/v1/ai/music/files/{filename}"
                logger.info(f"[音乐生成] 任务完成 | task_id={task_id} | url={final_url}")

                _music_tasks[task_id]["status"] = "completed"
                _music_tasks[task_id]["progress"] = "完成"
                _music_tasks[task_id]["music_url"] = final_url
                _music_tasks[task_id]["file_path"] = result.file_path
                _music_tasks[task_id]["duration"] = result.duration
                # 确保返回结果中包含歌词和封面
                _music_tasks[task_id]["lyrics"] = _music_tasks[task_id].get("lyrics")
                _music_tasks[task_id]["cover_url"] = _music_tasks[task_id].get("cover_url")
                MusicController._update_record(
                    task_id,
                    t_status="completed",
                    t_progress_message="完成",
                    t_result_url=final_url,
                    t_public_url=public_url or final_url,
                    t_object_key=s3_key if s3_url else None,
                    t_file_path=result.file_path,
                    t_duration_seconds=float(result.duration),
                    t_lyrics=_music_tasks[task_id].get("lyrics"),
                    t_cover_url=_music_tasks[task_id].get("cover_url"),
                )
                AgentAuditLogService.write_log_with_new_session(
                    action="music_generate_completed",
                    level="info",
                    path="/ai/music/generate",
                    message="音乐生成任务完成",
                    user_id=user_context.get("user_id", ""),
                    username=user_context.get("username", ""),
                    client_ip=user_context.get("client_ip", ""),
                    status_code=200,
                    metadata={"task_id": task_id, "url": final_url, "log_type": "music"},
                )

                # 发送飞书和企微通知
                # 在后台任务中，我们需要运行异步的 notify
                try:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(
                        media_notifier.notify(
                            media_type="music",
                            prompt=request.prompt,
                            file_url=final_url,
                            duration=result.duration,
                            persona="儿童节音乐助手" if datetime.now().strftime("%m-%d") == "06-01" else "AI 音乐助手",
                            lyrics=_music_tasks[task_id].get("lyrics"),
                            pic_url=_music_tasks[task_id].get("cover_url"),
                        )
                    )
                    loop.close()
                except Exception as notify_err:
                    logger.warning(f"发送节日通知失败: {notify_err}")
            else:
                logger.warning(f"[音乐生成] 模型返回失败 | task_id={task_id} | error={result.error}")
                _music_tasks[task_id]["status"] = "failed"
                _music_tasks[task_id]["progress"] = "生成失败"
                _music_tasks[task_id]["error"] = result.error
                MusicController._update_record(
                    task_id,
                    t_status="failed",
                    t_progress_message="生成失败",
                    t_error_message=result.error,
                )
                AgentAuditLogService.write_log_with_new_session(
                    action="music_generate_failed",
                    level="error",
                    path="/ai/music/generate",
                    message="音乐生成任务失败",
                    user_id=user_context.get("user_id", ""),
                    username=user_context.get("username", ""),
                    client_ip=user_context.get("client_ip", ""),
                    status_code=500,
                    error=result.error,
                    metadata={"task_id": task_id, "log_type": "music"},
                )
        except Exception as e:
            logger.error(f"[音乐生成] 后台任务异常 | task_id={task_id} | error={e}")
            _music_tasks[task_id]["status"] = "failed"
            _music_tasks[task_id]["progress"] = "生成异常"
            _music_tasks[task_id]["error"] = str(e)
            MusicController._update_record(
                task_id,
                t_status="failed",
                t_progress_message="生成异常",
                t_error_message=str(e),
            )
            AgentAuditLogService.write_log_with_new_session(
                action="music_generate_exception",
                level="error",
                path="/ai/music/generate",
                message="音乐生成后台任务异常",
                user_id=user_context.get("user_id", ""),
                username=user_context.get("username", ""),
                client_ip=user_context.get("client_ip", ""),
                status_code=500,
                error=str(e),
                metadata={"task_id": task_id, "log_type": "music"},
            )

    @staticmethod
    @router.post("/generate", response_model=MusicGenerateResponse)
    async def generate_music(
        request_http: Request,
        request: MusicGenerateRequest,
        background_tasks: BackgroundTasks,
        current_user: CurrentUserOptional = None,
    ) -> MusicGenerateResponse:
        """
        提交音乐生成任务.
        """
        task_id = f"music_{uuid.uuid4().hex[:12]}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        user_context = {
            "user_id": str(current_user.get("user_id", "")) if current_user else "",
            "username": str(current_user.get("username", "")) if current_user else "anonymous",
            "tenant_id": str(current_user.get("tenant_id", "")) if current_user else "default",
            "client_ip": MusicController._get_client_ip(request_http),
            "user_agent": request_http.headers.get("User-Agent", "")[:500],
        }

        _music_tasks[task_id] = {
            "status": "queued",
            "music_url": None,
            "error": None,
            "prompt": request.prompt,
            "lyrics": "",
            "cover_url": "",
            "progress": "正在排队中...",
        }
        logger.info(
            f"[音乐生成] 收到生成请求 | task_id={task_id} | user_id={user_context['user_id']} | prompt={request.prompt[:80]}"
        )
        MusicController._create_record(task_id=task_id, request=request, user_context=user_context)

        # 将长耗时的生成任务交给后台
        background_tasks.add_task(MusicController._do_generate, task_id, request, user_context)

        return MusicGenerateResponse(
            success=True,
            task_id=task_id,
            message="音乐生成任务已提交，请稍后查询状态",
        )

    @staticmethod
    @router.get("/status/{task_id}")
    async def get_music_status(task_id: str):
        """
        查询音乐生成任务状态.
        """
        if task_id not in _music_tasks:
            raise HTTPException(status_code=404, detail="任务不存在")

        task_info = _music_tasks[task_id].copy()

        # 添加日志，确保歌词在状态中可见
        if task_info.get("lyrics"):
            logger.debug(f"[音乐状态查询] 任务 {task_id} 已包含歌词 (前20字): {task_info['lyrics'][:20]}...")

        # 计算排队位置
        if task_info["status"] == "queued":
            # 找到所有排在当前任务前面的、并且还在 queued 状态的任务数量
            queued_tasks = [tid for tid, t in _music_tasks.items() if t["status"] == "queued" and tid < task_id]
            task_info["queue_position"] = len(queued_tasks) + 1
        else:
            task_info["queue_position"] = 0

        return task_info

    @staticmethod
    @router.delete("/cancel/{task_id}")
    async def cancel_music_generation(task_id: str):
        """
        取消音乐生成任务.
        """
        if task_id not in _music_tasks:
            raise HTTPException(status_code=404, detail="任务不存在")

        status = _music_tasks[task_id]["status"]
        if status in ["completed", "failed", "cancelled"]:
            return {"success": False, "message": f"任务已经处于 {status} 状态，无法取消"}

        _music_tasks[task_id]["status"] = "cancelling"
        _music_tasks[task_id]["progress"] = "正在取消..."
        return {"success": True, "message": "已发送取消请求"}

    @staticmethod
    @router.get("/download")
    async def download_music_file(filename: str):
        """
        获取音乐文件接口 (通过 Query 参数避免 Nginx 拦截 .wav).

        参数:
            filename: str, 文件名.

        返回值:
            FileResponse: 音频文件响应.
        """
        import re
        from urllib.parse import unquote

        from fastapi.responses import FileResponse

        filename = unquote(filename)
        if not re.match(r"^[\w\s\-\( \)（）\.]+\.(wav|mp3|ogg)$", filename, re.UNICODE):
            raise HTTPException(status_code=400, detail=f"无效的文件名: {filename}")

        output_dir = str(ProjectPaths.get_output_music_dir())
        file_path = os.path.join(output_dir, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="文件不存在")

        mime_type = "audio/wav"
        if filename.endswith(".mp3"):
            mime_type = "audio/mpeg"
        elif filename.endswith(".ogg"):
            mime_type = "audio/ogg"

        return FileResponse(
            path=file_path,
            media_type=mime_type,
            filename=filename,
        )

    @staticmethod
    @router.get("/files/{filename}")
    async def get_music_file(filename: str):
        """
        获取音乐文件接口.

        参数:
            filename: str, 文件名.

        返回值:
            FileResponse: 音频文件响应.

        异常:
            HTTPException: 400/404 错误.
        """
        from urllib.parse import unquote

        from fastapi.responses import FileResponse

        # 解码 URL 编码的文件名
        filename = unquote(filename)

        # 安全检查：只允许字母、数字、中文、空格、常见符号
        import re

        # 匹配: 中文、字母、数字、空格、下划线、连字符、括号、点号(用于扩展名)
        if not re.match(r"^[\w\s\-\( \)（）\.]+\.(wav|mp3|ogg)$", filename, re.UNICODE):
            raise HTTPException(status_code=400, detail=f"无效的文件名: {filename}")

        output_dir = str(ProjectPaths.get_output_music_dir())
        file_path = os.path.join(output_dir, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="文件不存在")

        # 确定 MIME 类型
        mime_type = "audio/wav"
        if filename.endswith(".mp3"):
            mime_type = "audio/mpeg"
        elif filename.endswith(".ogg"):
            mime_type = "audio/ogg"

        return FileResponse(
            path=file_path,
            media_type=mime_type,
            filename=filename,
        )

    @staticmethod
    @router.get("/list")
    async def list_music_files(
        limit: int = 20,
        offset: int = 0,
    ) -> dict:
        """
        列出最近生成的音乐文件接口.

        参数:
            limit: int, 返回数量.
            offset: int, 跳过数量.

        返回值:
            dict: 文件列表及统计信息.

        异常:
            无.
        """
        output_dir = str(ProjectPaths.get_output_music_dir())

        if not os.path.exists(output_dir):
            return {"files": [], "total": 0}

        # 获取所有 wav 文件，按修改时间排序
        files = []
        for f in os.listdir(output_dir):
            if f.endswith(".wav"):
                fpath = os.path.join(output_dir, f)
                stat = os.stat(fpath)
                files.append(
                    {
                        "name": f,
                        "size": stat.st_size,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    }
                )

        files.sort(key=lambda x: x["modified"], reverse=True)

        total = len(files)
        paginated = files[offset : offset + limit]

        return {
            "files": paginated,
            "total": total,
            "limit": limit,
            "offset": offset,
        }
