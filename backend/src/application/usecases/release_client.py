#!/usr/bin/env python
# 文件名: release_client.py
# 作者: wuhao
# 日期: 2026_04_22_11:00:00
# 描述: 客户端发布用例,支持 S3 上传及通知推送

import os
from datetime import datetime
from typing import Any

import requests
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.logger import get_logger
from infrastructure.database.database import SessionLocal
from infrastructure.database.models import AgentRoleModel
from infrastructure.storage.s3_storage import S3StorageService

logger = get_logger()

# 飞书发布通知 Webhook, 从环境变量读取, 优先使用已有的 NOTIFY_FEISHU_WEBHOOK
FEISHU_RELEASE_WEBHOOK = os.getenv("NOTIFY_FEISHU_WEBHOOK", "")
# 企微通知 Webhook 列表（支持多个群）
WECOM_WEBHOOKS = {
    "wuhao": os.getenv("NOTIFY_WECOM_WUHAO_WEBHOOK", ""),  # wuhao 群
    "wudu": os.getenv("NOTIFY_WECOM_WUDU_WEBHOOK", ""),  # wudu 群
}


class ReleaseClientUseCase:
    """客户端发布用例"""

    def __init__(self) -> None:
        self._storage = S3StorageService()

    @staticmethod
    def _get_role_comment_map() -> dict[str, str]:
        """从数据库获取角色评论映射表.

        Returns:
            dict[str, str]: 角色名 -> 评论文本 的映射
        """
        try:
            with Session(SessionLocal) as db:
                stmt = select(AgentRoleModel).where(AgentRoleModel.t_is_active == True)
                roles = db.execute(stmt).scalars().all()
                return {r.t_role_name: r.t_role_comment for r in roles}
        except Exception as e:
            logger.warning(f"Failed to load agent roles from DB, using fallback: {e}")
            # 降级：返回硬编码的默认映射
            return {
                "爆炸分身": "本来不想写的呜……啊呀终于发完了！",
                "小甜心": "辛苦啦～小甜心觉得超棒的呢！",
                "御姐": "嗯，做得还行，御姐准了。",
                "软萌宝": "呜...人家觉得好厉害呀！",
                "知心姐姐": "乖，辛苦了，这周做得很好呢。",
                "开心果": "哈！搞定啦！开心果出击！",
                "小泪包": "呜呜...好累呀...但是完成了呢！",
                "审查官": "咳咳，检查通过，勉强合格。",
                "地理专家": "说到版本发布呀～这条消息已成功抵达群聊坐标！",
            }

    async def execute(
        self,
        file_path: str,
        version: str,
        changelog: str,
        agent_role: str | None = None,
        wecom_groups: list[str] | None = None,
    ) -> dict[str, Any]:
        """执行发布流程, 包括上传文件到 S3 并发送通知.

        Args:
            file_path: 待上传的文件本地路径
            version: 发布的版本号
            changelog: 更新日志内容
            agent_role: AI 角色名称
            wecom_groups: 企微群列表，支持 ["wuhao", "wudu"]

        Returns:
            dict[str, Any]: 包含执行状态,版本号及下载 URL 的字典
        """
        filename = os.path.basename(file_path)
        s3_key = f"releases/desktop/{version}/{filename}"

        try:
            logger.info(f"Uploading release to S3: {filename} (v{version})")
            with open(file_path, "rb") as f:
                self._storage.upload_file(file_path, s3_key)

            # 生成下载链接 (优先使用 get_file_url 以配合 Nginx 静态代理)
            download_url = self._storage.get_file_url(s3_key)

            # 推送通知
            self._send_notifications(version, download_url, changelog, agent_role=agent_role, wecom_groups=wecom_groups)

            return {"status": "success", "version": version, "url": download_url}

        except Exception as e:
            logger.error(f"Release failed: {e}")
            return {"status": "failed", "error": str(e)}

    def _send_notifications(
        self,
        version: str,
        url: str,
        changelog: str,
        publisher: str | None = None,
        publisher_role: str | None = None,
        agent_role: str | None = None,
        wecom_groups: list[str] | None = None,
    ) -> None:
        """发送发布通知 (飞书富文本卡片 + 企微 Markdown).

        Args:
            version: 版本号
            url: 下载地址
            changelog: 更新日志
            publisher: 发布者用户名
            publisher_role: 发布者角色
            agent_role: AI 角色名称
            wecom_groups: 企微群列表，支持 ["wuhao", "wudu"]，为空则默认发送 wuhao 群
        """
        
        # 角色专属评论映射表（从数据库加载）
        role_comments = self._get_role_comment_map()
        role_comment = role_comments.get(agent_role, "") if agent_role else ""
        
        publisher_info = ""
        if publisher:
            role_text = f"({publisher_role})" if publisher_role else ""
            publisher_info = f"**发布者:** {publisher} {role_text}\n"
        
        agent_info = ""
        if agent_role:
            agent_info = f"**AI 角色:** {agent_role}\n"

        # 飞书富文本卡片格式
        feishu_card = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": f"TRAI Desktop v{version} 正式发布"},
                    "template": "blue",
                },
                "elements": [
                    {
                        "tag": "div",
                        "text": {"tag": "lark_md", "content": f"**版本号:** v{version}\n"
                               f"**发布时间:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
                               f"{publisher_info}"
                               f"{agent_info}"},
                    },
                    {"tag": "hr"},
                    {
                        "tag": "div",
                        "text": {"tag": "lark_md", "content": f"**更新内容:**\n{changelog}"},
                    },
                    {
                        "tag": "action",
                        "actions": [
                            {
                                "tag": "button",
                                "text": {"tag": "plain_text", "content": "立即下载 (EXE)"},
                                "url": url,
                                "type": "primary",
                            },
                            {
                                "tag": "button",
                                "text": {"tag": "plain_text", "content": "查看更新日志"},
                                "url": "https://ai.tuoren.com/changelog",
                                "type": "default",
                            },
                        ],
                    },
                    {
                        "tag": "note",
                        "elements": [{"tag": "plain_text", "content": "提示: 如果下载缓慢, 请检查内网代理设置"}],
                    },
                ],
            },
        }

        # 如果有角色评论，添加到 elements 末尾
        if role_comment:
            feishu_card["card"]["elements"].append({
                "tag": "div",
                "text": {"tag": "lark_md", "content": f"> {role_comment}"},
            })

        # 飞书发送 (仅当 Webhook 配置了才发送)
        if FEISHU_RELEASE_WEBHOOK:
            try:
                res = requests.post(FEISHU_RELEASE_WEBHOOK, json=feishu_card, timeout=10)
                logger.info(f"Feishu notification sent: {res.status_code}")
            except Exception as e:
                logger.error(f"Failed to send Feishu notification: {e}")

        # 企微 Markdown - 支持多群发送
        # 确定要发送的群列表，默认 wuhao 群
        if wecom_groups:
            groups_to_send = [g for g in wecom_groups if g in WECOM_WEBHOOKS and WECOM_WEBHOOKS[g]]
        else:
            # 默认发送 wuhao 群
            groups_to_send = ["wuhao"] if WECOM_WEBHOOKS.get("wuhao") else []

        for group_name in groups_to_send:
            wecom_url = WECOM_WEBHOOKS[group_name]
            publisher_line = ""
            if publisher:
                role_text = f"({publisher_role})" if publisher_role else ""
                publisher_line = f"**发布者:** {publisher} {role_text}\n"
            agent_line = ""
            if agent_role:
                agent_line = f"**AI 角色:** {agent_role}\n"
            wecom_msg = {
                "msgtype": "markdown",
                "markdown": {
                    "content": f"🆕 **TRAI 客户端新版本发布 (v{version})**\n\n"
                               f"{publisher_line}"
                               f"{agent_line}"
                               f"> **更新日志:**\n>{changelog.replace(chr(92) + 'n', chr(92) + 'n>')}\n\n"
                               f"**下载地址:** [点击下载 EXE]({url})\n\n"
                               f"> {role_comment}" if role_comment else f"**下载地址:** [点击下载 EXE]({url})"
                }
            }
            try:
                requests.post(wecom_url, json=wecom_msg, timeout=10)
                logger.info(f"WeCom notification sent to {group_name}: {wecom_url}")
            except Exception as e:
                logger.error(f"Failed to send WeCom notification to {group_name}: {e}")
