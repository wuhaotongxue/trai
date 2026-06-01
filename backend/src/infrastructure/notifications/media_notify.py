import os

import requests
from loguru import logger

from core.paths import ProjectPaths
from core.festivals import FestivalManager
from infrastructure.ai.core.openai_client import OpenAIClient


class MediaNotifier:
    """媒体通知工具类"""

    def __init__(self):
        self.WECOM_WEBHOOK = os.getenv(
            "NOTIFY_WECOM_WEBHOOK",
            "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=688936ed-0ea7-4f3f-8aa8-4476f638718a",
        )
        self.FEISHU_WEBHOOK = os.getenv("NOTIFY_FEISHU_WEBHOOK", "")
        self._llm = OpenAIClient(provider="deepseek")

    async def _generate_dynamic_festival_text(self, festival_name: str, type_name: str, prompt: str) -> dict:
        """调用 DeepSeek 动态生成节日祝福文案"""
        system_prompt = (
            f"你是一位充满童心且幽默的创意官。今天是【{festival_name}】，用户刚刚用 AI 生成了一个【{type_name}】作品。\n"
            f"请根据节日氛围和作品内容，写一段独特的祝福语（约60-80字）。\n"
            "要求：\n"
            "1. 语气要欢快、可爱，像在跟好朋友分享礼物。\n"
            "2. 必须包含对作品的简短赞美。\n"
            "3. 每次生成的侧重点要不同，避免机械重复。\n"
            "4. 输出格式必须为 JSON: {\"title\": \"...\", \"message\": \"...\", \"footer\": \"...\"}\n"
            "5. 不要输出任何 JSON 以外的内容。"
        )
        
        user_content = f"节日: {festival_name}\n作品类型: {type_name}\n用户提示词: {prompt}"
        
        try:
            resp = await self._llm.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.9, # 调高温度增加多样性
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
        self, media_type: str, prompt: str, file_url: str, duration: float = 0.0, persona: str = "地理专家"
    ) -> str:
        """构建 Markdown 通知内容"""

        type_name = {
            "image": "创意绘图",
            "video": "视频生成",
            "music": "音乐创作",
        }.get(media_type, media_type)

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
                f"{message}\n\n"
                f"👉 **[点击查看生成结果]({file_url})**\n\n"
                f"*{footer}*"
            )

        # 2. 如果没有节日，按原逻辑执行
        if persona == "小甜心":
            content = (
                f"## 💖 小甜心 Agent 生成播报\n\n"
                f"> **指令描述 (Prompt):** `{prompt}`\n"
                f"> **施法耗时:** `{duration:.1f} 秒`\n\n"
                f"主人，您心心念念的{type_name}已经生成好啦！快来看看这美妙的作品吧，小甜心为你自豪哦~ (❁´◡`❁)\n\n"
                f"👉 **[点击查看生成结果]({file_url})**\n\n"
                f"*“代码和灵感的交织，就是最棒的魔法！”*"
            )
        elif persona == "河南地理专家":
            header = self._build_henan_geography_text(type_name, prompt, duration)
            content = (
                f"{header}"
                f"👉 **[点击查看生成结果]({file_url})**\n\n"
                f"*“中原地势讲究起伏有序, AI 作品也讲究结构、力量与气韵。”*"
            )
        else:
            # 默认：地理专家 (动态调用 DeepSeek)
            header = self._generate_geography_expert_text(type_name, prompt, duration)
            content = (
                f"{header}"
                f"👉 **[点击查看生成结果]({file_url})**\n\n"
                f"*“地质的运动造就了山川，而 AI 的算力造就了这绝妙的作品。”*"
            )

        return content

    async def notify(
        self, media_type: str, prompt: str, file_url: str, duration: float = 0.0, persona: str = "地理专家"
    ) -> bool:
        """发送通知"""
        content = await self._build_markdown(media_type, prompt, file_url, duration, persona)
        success = False

        # 企微
        if self.WECOM_WEBHOOK:
            try:
                resp = requests.post(
                    self.WECOM_WEBHOOK,
                    json={"msgtype": "markdown", "markdown": {"content": content}},
                    timeout=5,
                )
                if resp.json().get("errcode") == 0:
                    logger.info(f"企微媒体通知发送成功 ({media_type})")
                    success = True
            except Exception as e:
                logger.error(f"企微媒体通知异常: {e}")

        # 飞书
        if self.FEISHU_WEBHOOK and "xxxx" not in self.FEISHU_WEBHOOK:
            try:
                # 飞书不支持 markdown，转为 text 或飞书特定的 rich text
                text_content = content.replace("##", "").replace("**", "").replace(">", "").replace("`", "")
                resp = requests.post(
                    self.FEISHU_WEBHOOK,
                    json={"msg_type": "text", "content": {"text": text_content}},
                    timeout=5,
                )
                if resp.json().get("code") == 0:
                    logger.info(f"飞书媒体通知发送成功 ({media_type})")
                    success = True
            except Exception as e:
                logger.error(f"飞书媒体通知异常: {e}")

        return success


media_notifier = MediaNotifier()
