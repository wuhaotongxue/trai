#!/usr/bin/env python
# 文件名: task_flow_service.py
# 作者: wuhao
# 日期: 2026_05_29_09:45:00
# 描述: 核心任务流服务, 封装 S3 上传、数据库记录持久化与多端通知推送逻辑.

import os
import random
from datetime import datetime
from typing import Any

from loguru import logger
from sqlalchemy.orm import Session

from infrastructure.ai.core.openai_client import OpenAIClient
from infrastructure.notify.base import NotifyMessage, NotifyType
from infrastructure.notify.factory import NotifyServiceFactory
from infrastructure.storage.s3_storage import S3StorageService


class TaskFlowService:
    """
    核心任务流服务类, 提供标准化的任务处理流水线.
    """

    def __init__(self, db: Session):
        """
        初始化任务流服务.

        参数:
            db (Session): 数据库会话.
        """
        self._db = db
        self._s3 = S3StorageService()

    async def process_and_notify(
        self,
        task_id: str,
        user_id: str,
        username: str,
        local_file_path: str | None,
        s3_prefix: str,
        record_model_class: Any,
        task_data: dict[str, Any],
        notify_title: str,
        expert_prompt: str | None = None,
        transcript: str | None = None,
    ) -> str:
        """
        执行标准化的 处理 -> 上传 -> 记录 -> 通知 流程.

        参数:
            task_id (str): 任务 ID.
            user_id (str): 用户 ID.
            username (str): 用户名.
            local_file_path (str): 本地音频/视频文件路径 (可选).
            s3_prefix (str): S3 存储前缀 (如 'audio/asr').
            record_model_class (Any): 数据库模型类.
            task_data (dict): 写入数据库的额外数据.
            notify_title (str): 通知标题.
            expert_prompt (str): 如果提供, 将调用 DeepSeek 生成专家点评.
            transcript (str): 识别出的文本内容 (可选).

        返回值:
            str: 结果访问 URL (S3 预签名地址).
        """
        s3_url = ""
        transcript_url = ""
        object_key = ""
        file_size = 0

        # 1. S3 上传原始文件 (音频/视频)
        if local_file_path and os.path.exists(local_file_path):
            file_ext = os.path.splitext(local_file_path)[1]
            object_key = f"{s3_prefix}/{task_id}{file_ext}"
            file_size = os.path.getsize(local_file_path)

            # 自动识别 Content-Type
            content_type = "application/octet-stream"
            if file_ext.lower() in [".mp4", ".mov"]:
                content_type = "video/mp4"
            elif file_ext.lower() in [".mp3", ".wav"]:
                content_type = "audio/wav" if file_ext.lower() == ".wav" else "audio/mpeg"

            self._s3.upload_file(local_file_path, object_key, content_type=content_type)
            s3_url = self._s3.get_long_term_url(object_key, expires_days=7)
            logger.info(f"Task {task_id} source file uploaded to S3: {object_key}")

        # 2. 如果有转录文本, 上传到 S3 作为文本文件
        if transcript:
            import tempfile

            # 使用 utf-8-sig (带有 BOM) 确保 Windows/浏览器能正确识别编码
            with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8-sig") as tmp:
                tmp.write(transcript)
                tmp_path = tmp.name

            try:
                transcript_key = f"{s3_prefix}/{task_id}_result.txt"
                self._s3.upload_file(tmp_path, transcript_key, content_type="text/plain; charset=utf-8")
                transcript_url = self._s3.get_long_term_url(transcript_key, expires_days=7)
                logger.info(f"Task {task_id} transcript uploaded to S3: {transcript_key}")
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        # 3. 数据库持久化
        record_data = {
            "t_task_id": task_id,
            "t_user_id": user_id,
            "t_username": username,
            "t_status": "completed",
            "t_created_at": datetime.now(),
        }

        # 合并传入的业务数据
        if s3_url:
            if hasattr(record_model_class, "t_s3_url"):
                record_data["t_s3_url"] = s3_url
            if hasattr(record_model_class, "t_s3_key"):
                record_data["t_s3_key"] = object_key
            if hasattr(record_model_class, "t_file_size"):
                record_data["t_file_size"] = file_size
            if hasattr(record_model_class, "t_result_url"):
                # 如果是 ASR 任务, result_url 优先使用 transcript_url
                record_data["t_result_url"] = transcript_url if transcript_url else s3_url
            if hasattr(record_model_class, "t_source_url"):
                record_data["t_source_url"] = s3_url

        record_data.update(task_data)

        # 如果有 transcript_url, 更新 extra_data
        if transcript_url:
            if "t_extra_data" not in record_data:
                record_data["t_extra_data"] = {}
            record_data["t_extra_data"]["transcript_url"] = transcript_url

        # 移除 model 中不存在的 key
        valid_keys = record_model_class.__table__.columns.keys()
        final_data = {k: v for k, v in record_data.items() if k in valid_keys}

        new_record = record_model_class(**final_data)
        self._db.add(new_record)
        self._db.commit()
        logger.info(f"Task {task_id} record saved to database.")

        # 4. 生成专家点评 (DeepSeek)
        expert_msg = ""
        if expert_prompt:
            try:
                ai_client = OpenAIClient(provider="deepseek")

                # 河南 100 个景点知识库
                henan_spots = [
                    "少林寺",
                    "龙门石窟",
                    "清明上河园",
                    "云台山",
                    "老君山",
                    "白马寺",
                    "殷墟",
                    "红旗渠",
                    "万仙山",
                    "重渡沟",
                    "鸡公山",
                    "嵖岈山",
                    "宝泉",
                    "青天河",
                    "神农山",
                    "尧山",
                    "龙潭大峡谷",
                    "黛眉山",
                    "荆紫山",
                    "青龙峡",
                    "峰林峡",
                    "圆融寺",
                    "武家湾",
                    "关林",
                    "白云山",
                    "木札岭",
                    "天河大峡谷",
                    "龙峪湾",
                    "养子沟",
                    "伏牛山",
                    "老界岭",
                    "五朵山",
                    "恐龙遗迹园",
                    "内乡县衙",
                    "宝天曼",
                    "渠首",
                    "丹江大观苑",
                    "坐禅谷",
                    "香严寺",
                    "八里沟",
                    "九莲山",
                    "天界山",
                    "关山",
                    "秋沟",
                    "齐王寨",
                    "黄河小浪底",
                    "王屋山",
                    "五龙口",
                    "黄河三峡",
                    "小沟背",
                    "中岳庙",
                    "嵩阳书院",
                    "少室阙",
                    "启母阙",
                    "太室阙",
                    "法王寺",
                    "永泰寺",
                    "三皇寨",
                    "康百万庄园",
                    "杜甫故里",
                    "伏羲山",
                    "三泉湖",
                    "红石林",
                    "大峡谷",
                    "云上牧场",
                    "银基动物王国",
                    "只有河南·戏剧幻城",
                    "建业电影小镇",
                    "方特旅游度假区",
                    "绿博园",
                    "河南博物院",
                    "黄河博物馆",
                    "二七纪念塔",
                    "大河村遗址",
                    "古荥冶铁遗址",
                    "郑州城隍庙",
                    "文庙",
                    "开封府",
                    "大相国寺",
                    "包公祠",
                    "龙亭",
                    "铁塔",
                    "繁塔",
                    "延庆观",
                    "翰园碑林",
                    "朱仙镇启封故园",
                    "洛阳博物馆",
                    "隋唐洛阳城遗址",
                    "应天门",
                    "明堂天堂",
                    "九洲池",
                    "丽景门",
                    "洛邑古城",
                    "中国国花园",
                    "王城公园",
                    "隋唐城遗址植物园",
                    "安阳博物馆",
                    "中国文字博物馆",
                    "马氏庄园",
                    "袁林",
                ]
                selected_spot = random.choice(henan_spots)

                # 增强提示词，加入当前日期和随机景点
                now = datetime.now()
                weekday_map = {0: "周一", 1: "周二", 2: "周三", 3: "周四", 4: "周五", 5: "周六", 6: "周日"}
                current_date_str = f"{now.strftime('%Y-%m-%d')} {weekday_map[now.weekday()]}"

                full_prompt = (
                    f"今天是 {current_date_str}. 请作为一位'河南地理专家', 针对以下任务给出点评: \n"
                    f"{expert_prompt}\n"
                    f"要求: 口吻专业亲切, 融入{'周五' if now.weekday() == 4 else '工作日'}氛围, 必须推荐景点 '{selected_spot}', 字数 60 字以内."
                )
                ai_res = await ai_client.chat(messages=[{"role": "user", "content": full_prompt}])
                expert_msg = ai_res.get("content", "")
            except Exception as e:
                logger.warning(f"Failed to generate expert msg: {e}")

        # 5. 推送通知
        # 优先使用传入的 transcript
        if not transcript:
            extra_data = task_data.get("t_extra_data", {})
            if isinstance(extra_data, dict):
                transcript = extra_data.get("transcript", "")
            if not transcript:
                transcript = task_data.get("transcript", "")

        self._send_notifications(
            title=notify_title,
            username=username,
            audio_url=s3_url,
            transcript_url=transcript_url,
            expert_msg=expert_msg,
            item_name=task_data.get("t_title", "未命名任务"),
            transcript=transcript,
        )

        return transcript_url if transcript_url else s3_url

    def _send_notifications(
        self,
        title: str,
        username: str,
        audio_url: str,
        transcript_url: str,
        expert_msg: str,
        item_name: str,
        transcript: str = "",
    ) -> None:
        """
        发送多端通知 (飞书 & 企微).

        参数:
            title (str): 通知事项标题.
            username (str): 操作人用户名.
            audio_url (str): 原始音频文件访问地址.
            transcript_url (str): 识别结果文本文件访问地址.
            expert_msg (str): 专家点评内容.
            item_name (str): 目标任务名称.
            transcript (str): 识别出的文本内容.

        返回值:
            None.

        异常:
            无 (内部已捕获并记录日志).
        """
        # 强制重新加载环境变量, 确保在异步线程中也能读取到最新配置
        from run import EnvFileLoader

        EnvFileLoader.load_local_envs()

        enabled = os.getenv("NOTIFY_ENABLED", "false").lower() == "true"
        logger.info(f"Notification status: {enabled}, transcript_len: {len(transcript)}")
        if not enabled:
            return

        # 格式化消息内容
        transcript_content = transcript.strip() if transcript else ""
        if not transcript_content:
            transcript_display = "⚠️ 暂未提取到有效文本内容"
        else:
            # 限制长度并保持原样, 不再强制加块引用
            transcript_display = f"{transcript_content[:800]}{'...' if len(transcript_content) > 800 else ''}"

        now_str = datetime.now().strftime("%Y-%m-%d")

        msg_content = (
            f"# 🧭 河南地理专家核心观测\n\n"
            f"**事项:** {title}\n"
            f"**目标:** {item_name}\n"
            f"**操作人:** {username}\n\n"
            f"--- \n"
            f"**📄 识别文本内容 ({now_str}):**\n"
            f"{transcript_display}\n\n"
            f"**💡 专家点评:**\n"
            f"{expert_msg if expert_msg else '任务已圆满完成, 祝您周五愉快!'}\n\n"
            f"--- \n"
            f"🔗 [音频文件地址]({audio_url})\n"
            f"📄 [识别结果地址]({transcript_url if transcript_url else audio_url})"
        )

        # 飞书
        feishu_enabled = os.getenv("NOTIFY_FEISHU_ENABLED", "false").lower() == "true"
        logger.info(f"Feishu notification enabled: {feishu_enabled}")
        if feishu_enabled:
            webhook = os.getenv("NOTIFY_FEISHU_WEBHOOK")
            if webhook:
                try:
                    NotifyServiceFactory.create_feishu(webhook).send(
                        NotifyMessage(title="TRAI 助手", content=msg_content, msg_type=NotifyType.MARKDOWN)
                    )
                    logger.info("Feishu notification sent successfully.")
                except Exception as e:
                    logger.warning(f"Feishu notify fail: {e}")

        # 企微
        wecom_enabled = os.getenv("NOTIFY_WECOM_ENABLED", "false").lower() == "true"
        logger.info(f"WeCom notification enabled: {wecom_enabled}")
        if wecom_enabled:
            webhook = os.getenv("NOTIFY_WECOM_WEBHOOK")
            if webhook:
                try:
                    NotifyServiceFactory.create_wecom(webhook).send(
                        NotifyMessage(title="TRAI 助手", content=msg_content, msg_type=NotifyType.MARKDOWN)
                    )
                    logger.info("WeCom notification sent successfully.")
                except Exception as e:
                    logger.warning(f"WeCom notify fail: {e}")
