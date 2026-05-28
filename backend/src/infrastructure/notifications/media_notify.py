import os

import requests
from loguru import logger


class MediaNotifier:
    """媒体生成结果推送通知器 (飞书/企微)"""

    def __init__(self):
        self.WECOM_WEBHOOK = os.getenv(
            "NOTIFY_WECOM_WEBHOOK",
            "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=688936ed-0ea7-4f3f-8aa8-4476f638718a",
        )
        self.FEISHU_WEBHOOK = os.getenv("NOTIFY_FEISHU_WEBHOOK", "")

    def _generate_geography_expert_text(self, type_name: str, prompt: str, duration: float) -> str:
        """调用 DeepSeek 动态生成地理专家文案"""
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            # 尝试从 llm.env 中直接读取，以防环境变量未正确加载
            env_path = "/home/qyjgylc_whf/code/trai/backend/env/llm.env"
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

    def _fallback_geography_expert(self, type_name: str, prompt: str, duration: float) -> str:
        """兜底的地理专家文案"""
        return (
            f"## 🌍 地理专家观测报告：发现新的{type_name}地貌！\n\n"
            f"> **观测坐标 (Prompt):** `{prompt}`\n"
            f"> **形成耗时:** `{duration:.1f} 秒`\n\n"
            f"作为地理专家，我刚刚观测到了这一全新生成的数字奇观。它的板块构造非常完美，宛如巴哈马首都**拿骚** (Nassau) 那般充满着加勒比海的活力与宁静，请您查收这片新大陆的勘探结果：\n\n"
        )

    def _build_markdown(
        self, media_type: str, prompt: str, file_url: str, duration: float = 0.0, persona: str = "地理专家"
    ) -> str:
        """构建 Markdown 通知内容"""

        type_name = {
            "image": "创意绘图",
            "video": "视频生成",
            "music": "音乐创作",
        }.get(media_type, media_type)

        if persona == "小甜心":
            content = (
                f"## 💖 小甜心 Agent 生成播报\n\n"
                f"> **指令描述 (Prompt):** `{prompt}`\n"
                f"> **施法耗时:** `{duration:.1f} 秒`\n\n"
                f"主人，您心心念念的{type_name}已经生成好啦！快来看看这美妙的作品吧，小甜心为你自豪哦~ (❁´◡`❁)\n\n"
                f"👉 **[点击查看生成结果]({file_url})**\n\n"
                f"*“代码和灵感的交织，就是最棒的魔法！”*"
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

    def notify(
        self, media_type: str, prompt: str, file_url: str, duration: float = 0.0, persona: str = "地理专家"
    ) -> bool:
        """发送通知"""
        content = self._build_markdown(media_type, prompt, file_url, duration, persona)
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
