import os
from datetime import datetime

import requests
from loguru import logger

from core.festivals import FestivalManager
from core.paths import ProjectPaths
from infrastructure.ai.core.openai_client import OpenAIClient


class MediaNotifier:
    """媒体通知工具类"""

    def __init__(self):
        self.WECOM_WEBHOOK = os.getenv(
            "NOTIFY_WECOM_WEBHOOK",
            "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=688936ed-0ea7-4f3f-8aa8-4476f638718a",
        )
        self.FEISHU_WEBHOOK = os.getenv("NOTIFY_FEISHU_WEBHOOK", "")
        self._llm = OpenAIClient(provider="agnes")

    async def _generate_dynamic_festival_text(self, festival_name: str, type_name: str, prompt: str) -> dict:
        """调用 DeepSeek 动态生成节日祝福文案"""
        is_childrens_day = festival_name == "儿童节"

        system_prompt = (
            f"你是一位{'超级可爱、充满童心且幽默的六一儿童节特使' if is_childrens_day else '充满童心且幽默的创意官'}。今天是【{festival_name}】，用户刚刚用 AI 生成了一个【{type_name}】作品。\n"
            f"请根据节日氛围和作品内容，写一段独特的祝福语（约60-80字）。\n"
            "要求：\n"
            f"1. 语气要{'极其欢快、奶气、可爱，多用语气助词（如：哒、呀、嗷），像在给小朋友送糖果' if is_childrens_day else '欢快、可爱，像在跟好朋友分享礼物'}。\n"
            "2. 必须包含对作品的简短赞美。\n"
            "3. 每次生成的侧重点要不同，避免机械重复。\n"
            '4. 输出格式必须为 JSON: {"title": "...", "message": "...", "footer": "..."}\n'
            "5. 不要输出任何 JSON 以外的内容。"
        )

        user_content = f"节日: {festival_name}\n作品类型: {type_name}\n用户提示词: {prompt}"

        try:
            resp = await self._llm.chat(
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_content}],
                temperature=0.9,  # 调高温度增加多样性
            )
            import json

            content = resp.get("content", "").strip()
            # 移除可能的 markdown 标记
            if content.startswith("```json"):
                content = content[7:-3].strip()
            return json.loads(content)
        except Exception as e:
            logger.warning(f"动态节日文案生成失败: {e}")
            return None

    def _generate_geography_expert_text(self, type_name: str, prompt: str, duration: float) -> str:
        """调用 DeepSeek 动态生成地理专家文案"""
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            # 优先使用 ProjectPaths 计算路径
            env_path = str(ProjectPaths.get_backend_root() / "env/llm.env")
            if os.path.exists(env_path):
                from dotenv import dotenv_values

                env_dict = dotenv_values(env_path)
                api_key = env_dict.get("DEEPSEEK_API_KEY")

        if not api_key:
            logger.warning("未找到 DEEPSEEK_API_KEY，使用默认播报文案")
            return self._fallback_geography_expert(type_name, prompt, duration)

        try:
            import random

            import requests

            # 为了防止重复，随机选一个欧洲国家作为引子
            countries = [
                "冰岛",
                "挪威",
                "瑞典",
                "芬兰",
                "丹麦",
                "英国",
                "爱尔兰",
                "荷兰",
                "比利时",
                "德国",
                "法国",
                "瑞士",
                "奥地利",
                "意大利",
                "西班牙",
                "葡萄牙",
                "希腊",
                "克罗地亚",
                "捷克",
                "匈牙利",
                "波兰",
            ]
            country = random.choice(countries)

            system_prompt = (
                "你是一位幽默且知识渊博的地理专家。你需要为用户的 AI 生成作品写一段简短的通知文案（约80字）。\n"
                f"请以欧洲的【{country}】的一个著名自然景观或城市风貌作为比喻，来赞美这个新生成的【{type_name}】作品。\n"
                "语气要充满探索发现的惊喜感。开头不要打招呼，直接进入正文。直接输出生成的文本，不要包含任何多余解释。"
            )

            resp = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"作品类型: {type_name}\n耗时: {duration:.1f}秒\n提示词: {prompt}"},
                    ],
                    "temperature": 0.8,
                    "max_tokens": 150,
                },
                timeout=10,
            )

            if resp.status_code == 200:
                ai_text = resp.json()["choices"][0]["message"]["content"].strip()
                return (
                    f"## 🌍 地理专家观测报告：发现新的{type_name}地貌！\n\n"
                    f"> **观测坐标 (Prompt):** `{prompt}`\n"
                    f"> **形成耗时:** `{duration:.1f} 秒`\n\n"
                    f"{ai_text}\n\n"
                )
            else:
                logger.warning(f"DeepSeek 动态生成文案失败，状态码: {resp.status_code}, 内容: {resp.text}")
        except Exception as e:
            logger.warning(f"DeepSeek 动态生成文案异常: {e}")

        return self._fallback_geography_expert(type_name, prompt, duration)

    def _build_henan_geography_text(self, type_name: str, prompt: str, duration: float) -> str:
        """构建河南地理专家风格的通知头部."""
        return (
            f"## 🏞️ 河南地理专家观测报告: 中原新{type_name}地貌\n\n"
            f"> **观测坐标 (Prompt):** `{prompt}`\n"
            f"> **形成耗时:** `{duration:.1f} 秒`\n\n"
            "作为河南地理专家, 我刚刚观测到这件新作品像嵩山山势一样层次分明, "
            "又像黄河流经河南时那样有力量与方向感, 请查收这一份来自中原地貌带的数字成果。\n\n"
        )

    def _fallback_geography_expert(self, type_name: str, prompt: str, duration: float) -> str:
        """兜底的地理专家文案"""
        return (
            f"## 🌍 地理专家观测报告：发现新的{type_name}地貌！\n\n"
            f"> **观测坐标 (Prompt):** `{prompt}`\n"
            f"> **形成耗时:** `{duration:.1f} 秒`\n\n"
            f"作为地理专家，我刚刚观测到了这一全新生成的数字奇观。它的板块构造非常完美，宛如巴哈马首都**拿骚** (Nassau) 那般充满着加勒比海的活力与宁静，请您查收这片新大陆的勘探结果：\n\n"
        )

    async def _build_markdown(
        self,
        media_type: str,
        prompt: str,
        file_url: str,
        duration: float = 0.0,
        persona: str = "地理专家",
        lyrics: str | None = None,
    ) -> str:
        """构建 Markdown 通知内容"""

        type_name = {
            "image": "创意绘图",
            "video": "视频生成",
            "music": "音乐创作",
        }.get(media_type, media_type)

        # 歌词预览逻辑
        lyrics_display = ""
        if lyrics:
            # 只取前几行
            lines = lyrics.split("\n")
            preview_lines = []
            for line in lines[:8]:
                # 移除时间戳展示在通知中更美观
                import re

                clean_line = re.sub(r"\[\d{2}:\d{2}\.\d{2,3}\]", "", line).strip()
                if clean_line:
                    preview_lines.append(clean_line)

            if preview_lines:
                lyrics_text = "\n".join([f"> {line_text}" for line_text in preview_lines])
                lyrics_display = f"\n\n**📜 灵感歌词预览:**\n{lyrics_text}\n"
                if len(lines) > 8:
                    lyrics_display += "> ... (更多内容请在应用中查看)\n"

        # 1. 优先检查今天是否有节日
        festival = FestivalManager.get_today_festival()
        if festival:
            # 尝试动态生成
            dynamic = await self._generate_dynamic_festival_text(festival["name"], type_name, prompt)
            title = dynamic["title"] if dynamic else festival["title"]
            message = dynamic["message"] if dynamic else festival["message"]
            footer = dynamic["footer"] if dynamic else festival["footer"]

            return (
                f"## {title}\n\n"
                f"> **观测坐标 (Prompt):** `{prompt}`\n"
                f"> **魔法耗时:** `{duration:.1f} 秒`\n\n"
                f"{message}\n"
                f"{lyrics_display}\n"
                f"👉 **[点击查看生成结果]({file_url})**\n\n"
                f"*{footer}*"
            )

        # 2. 处理特定角色
        if persona == "儿童节使者":
            return (
                f"## 🎈 儿童节快乐！魔法音乐盒开启 🍭\n\n"
                f"> **探险坐标:** `{prompt}`\n"
                f"> **施法耗时:** `{duration:.1f} 秒`\n\n"
                f"嘿！大朋友！在这个充满童心的日子里, 我为你准备了一个奇妙的礼物！\n"
                f"快听, 这是属于你的童话旋律！愿你永远保持好奇心, 像孩子一样快乐！✨\n"
                f"{lyrics_display}\n"
                f"👉 **[点击查看魔法作品]({file_url})**\n\n"
                f"*“愿你永远被这个世界温柔以待, 六一快乐！”*"
            )

        if persona == "小甜心":
            content = (
                f"## 💖 小甜心 Agent 生成播报\n\n"
                f"> **指令描述 (Prompt):** `{prompt}`\n"
                f"> **施法耗时:** `{duration:.1f} 秒`\n\n"
                f"主人，您心心念念的{type_name}已经生成好啦！快来看看这美妙的作品吧，小甜心为你自豪哦~ (❁´◡`❁)\n"
                f"{lyrics_display}\n"
                f"👉 **[点击查看生成结果]({file_url})**\n\n"
                f"*“代码和灵感的交织，就是最棒的魔法！”*"
            )
        elif persona == "河南地理专家":
            header = self._build_henan_geography_text(type_name, prompt, duration)
            content = (
                f"{header}"
                f"{lyrics_display}\n"
                f"👉 **[点击查看生成结果]({file_url})**\n\n"
                f"*“中原地势讲究起伏有序, AI 作品也讲究结构、力量与气韵。”*"
            )
        else:
            # 默认：地理专家 (动态调用 DeepSeek)
            header = self._generate_geography_expert_text(type_name, prompt, duration)
            content = (
                f"{header}"
                f"{lyrics_display}\n"
                f"👉 **[点击查看生成结果]({file_url})**\n\n"
                f"*“地质的运动造就了山川，而 AI 的算力造就了这绝妙的作品。”*"
            )

        return content

    def _upload_image_to_feishu(self, image_url: str) -> str:
        """下载图片并上传到飞书，获取 image_key"""
        if not image_url or not image_url.startswith("http"):
            return ""

        try:
            # 1. 下载图片
            resp = requests.get(image_url, timeout=10)
            if resp.status_code != 200:
                return ""

            # 2. 获取飞书 tenant_access_token (这里简化处理，如果 webhook 是机器人，可能需要 app_id)
            # 实际上飞书 Webhook 不支持直接上传图片，必须通过应用 API。
            # 这里我们退而求其次，在通知中使用 a 标签链接封面图，
            # 或者如果以后有 app_id/app_secret，再实现真正的图片嵌入。
            # 目前我们先通过 rich text 的 img 标签尝试（如果飞书支持 URL 的话）
            return image_url
        except Exception as e:
            logger.warning(f"上传图片到飞书失败: {e}")
            return ""

    async def notify(
        self,
        media_type: str,
        prompt: str,
        file_url: str,
        duration: float = 0.0,
        persona: str = "地理专家",
        lyrics: str | None = None,
        pic_url: str | None = None,
    ) -> bool:
        """发送通知"""
        # 针对儿童节强制切换 persona
        if datetime.now().strftime("%m-%d") == "06-01":
            persona = "儿童节使者"

        content = await self._build_markdown(media_type, prompt, file_url, duration, persona, lyrics)
        success = False

        # 获取封面图
        final_pic_url = pic_url or ""
        if not final_pic_url and media_type in ["image", "video", "music"]:
            final_pic_url = file_url if media_type == "image" else ""

            # 优先从数据库查找封面
            try:
                from infrastructure.database import get_session
                from infrastructure.database.models import MusicRecordModel

                with get_session() as db:
                    # 查找最近的一个记录
                    record = (
                        db.query(MusicRecordModel.t_cover_url)
                        .filter(MusicRecordModel.t_prompt == prompt)
                        .order_by(MusicRecordModel.t_id.desc())
                        .first()
                    )

                    if record and record[0]:
                        final_pic_url = record[0]
                        logger.info(f"[Notify] 从数据库获取到封面: {final_pic_url}")
            except Exception as e:
                logger.warning(f"[Notify] 数据库查找封面失败: {e}")

        # 1. 企微通知 (优先使用 news 类型展示图片)
        if self.WECOM_WEBHOOK:
            try:
                # 如果有图片，使用 news 类型展示缩略图
                if final_pic_url:
                    # 针对儿童节定制标题
                    is_childrens_day = datetime.now().strftime("%m-%d") == "06-01"
                    title = (
                        f"🍭 儿童节快乐！{media_type.upper()} 魔法礼物已送达！"
                        if is_childrens_day
                        else f"🎉 {media_type.upper()} 生成成功！"
                    )

                    # 企微 news 类型不支持 markdown，需要纯文本描述
                    clean_description = (
                        content.replace("## ", "").replace("**", "").replace(">", "").replace("👉", "").strip()
                    )
                    # 移除链接标记
                    import re

                    clean_description = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1", clean_description)
                    # 截断描述，防止过长
                    if len(clean_description) > 300:
                        clean_description = clean_description[:300] + "..."

                    payload = {
                        "msgtype": "news",
                        "news": {
                            "articles": [
                                {
                                    "title": title,
                                    "description": clean_description,
                                    "url": file_url,
                                    "picurl": final_pic_url,
                                }
                            ]
                        },
                    }
                else:
                    payload = {"msgtype": "markdown", "markdown": {"content": content}}

                resp = requests.post(self.WECOM_WEBHOOK, json=payload, timeout=5)
                if resp.json().get("errcode") == 0:
                    logger.info(f"企微媒体通知发送成功 ({media_type})")
                    success = True
            except Exception as e:
                logger.error(f"企微媒体通知异常: {e}")

        # 2. 飞书通知 (优先使用卡片消息)
        if self.FEISHU_WEBHOOK and "xxxx" not in self.FEISHU_WEBHOOK:
            try:
                # 尝试上传图片到飞书以获取 image_key (如果配置了 APP_ID/SECRET)
                image_key = ""
                # 这里简单判断一下是否有相关的环境变量
                if os.getenv("FEISHU_APP_ID") and final_pic_url:
                    from infrastructure.notify.feishu_ai_notify import FeishuAINotifyService

                    service = FeishuAINotifyService(self.FEISHU_WEBHOOK)
                    image_bytes = service._download_image(final_pic_url)
                    if image_bytes:
                        image_key = service._upload_image_to_feishu(image_bytes)

                if image_key:
                    # 使用交互式卡片 (interactive)
                    card_elements = [
                        {"tag": "div", "text": {"tag": "lark_md", "content": content}},
                        {
                            "tag": "img",
                            "img_key": image_key,
                            "alt": {"tag": "plain_text", "content": "AI 生成预览"},
                            "width": 300,
                        },
                        {
                            "tag": "action",
                            "actions": [
                                {
                                    "tag": "button",
                                    "text": {"tag": "plain_text", "content": "点击查看完整作品"},
                                    "type": "primary",
                                    "url": file_url,
                                }
                            ],
                        },
                    ]
                    payload = {
                        "msg_type": "interactive",
                        "card": {
                            "config": {"wide_screen_mode": True},
                            "header": {
                                "title": {
                                    "tag": "plain_text",
                                    "content": f"✨ TRAI AI {media_type.capitalize()} Report",
                                },
                                "template": "cyan",
                            },
                            "elements": card_elements,
                        },
                    }
                else:
                    # 退而求其次使用富文本 (post)
                    post_elements = []
                    for line in content.split("\n"):
                        if not line.strip():
                            continue
                        import re

                        link_match = re.search(r"\[(.*?)\]\((.*?)\)", line)
                        if link_match:
                            text_before = line[: link_match.start()].strip()
                            if text_before:
                                post_elements.append([{"tag": "text", "text": text_before}])
                            post_elements.append(
                                [{"tag": "a", "text": link_match.group(1), "href": link_match.group(2)}]
                            )
                        else:
                            post_elements.append([{"tag": "text", "text": line.strip()}])

                    if final_pic_url:
                        post_elements.append([{"tag": "text", "text": "\n📸 艺术封面预览 (点击查看):"}])
                        post_elements.append([{"tag": "a", "text": "点击预览封面图", "href": final_pic_url}])

                    payload = {
                        "msg_type": "post",
                        "content": {
                            "post": {
                                "zh_cn": {
                                    "title": f"✨ TRAI AI {media_type.capitalize()} Report",
                                    "content": post_elements,
                                }
                            }
                        },
                    }

                resp = requests.post(self.FEISHU_WEBHOOK, json=payload, timeout=5)
                if resp.json().get("code") == 0 or resp.json().get("errcode") == 0:
                    logger.info(f"飞书媒体通知发送成功 ({media_type})")
                    success = True
                else:
                    logger.warning(f"飞书通知返回错误: {resp.text}")
            except Exception as e:
                logger.error(f"飞书媒体通知异常: {e}")

        return success


media_notifier = MediaNotifier()
