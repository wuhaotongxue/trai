#!/usr/bin/env python
# 文件名: git_push_notify.py
# 作者: wuhao
# 日期: 2026_05_26_21:53:21
# 描述: Git 推送后自动向企微群发送代码提交通知, 由 git_submit 技能在 push 后自动调用

from __future__ import annotations

import os
import subprocess
import sys

import requests
from loguru import logger


class GitPushNotifier:
    """Git 推送通知器, 向企微群/飞书群发送代码提交 Markdown 通知."""

    WECOM_WEBHOOK = ""
    FEISHU_WEBHOOK = ""

    def __init__(self) -> None:
        """
        初始化通知器.

        参数:
            无.

        返回值:
            None.

        异常:
            无.
        """
        self._load_webhooks()

    def _load_webhooks(self) -> None:
        """从环境变量加载 webhook 地址."""
        self.WECOM_WEBHOOK = os.getenv(
            "NOTIFY_WECOM_WEBHOOK",
            "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=688936ed-0ea7-4f3f-8aa8-4476f638718a",
        )
        self.FEISHU_WEBHOOK = os.getenv("NOTIFY_FEISHU_WEBHOOK", "")

    def _get_last_commit_info(self) -> tuple[str, str, str]:
        """
        获取最近一次提交的信息.

        返回值:
            tuple[str, str, str]: (hash, message, branch).

        异常:
            RuntimeError: Git 命令执行失败.
        """
        try:
            commit_hash = subprocess.check_output(
                ["git", "log", "-1", "--format=%h"], text=True, timeout=5
            ).strip()
            commit_msg = subprocess.check_output(
                ["git", "log", "-1", "--format=%s"], text=True, timeout=5
            ).strip()
            branch = subprocess.check_output(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"], text=True, timeout=5
            ).strip()
            return commit_hash, commit_msg, branch
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"获取 Git 信息失败: {e}")

    def _get_changed_files_summary(self) -> str:
        """
        获取变更文件摘要.

        返回值:
            str: 文件变更摘要.

        异常:
            无.
        """
        try:
            files = subprocess.check_output(
                ["git", "diff-tree", "--no-commit-id", "--name-status", "-r", "HEAD"],
                text=True,
                timeout=5,
            ).strip()
            if not files:
                return "无文件变更"
            lines = [f.strip() for f in files.split("\n") if f.strip()]
            return "\n".join([f"- {line}" for line in lines[:15]])
        except Exception:
            return "无法获取变更列表"

    def build_markdown(self, commit_hash: str, commit_msg: str, branch: str) -> str:
        """
        构建企微 Markdown 通知内容.
        """
        changed = self._get_changed_files_summary()

        return (
            f"## 🌍 地理专家观测报告：板块运动监测 (Git Push)\n\n"
            f"> **分支断层带:** `{branch}`\n"
            f"> **地质标记点:** `{commit_hash}`\n"
            f"> **勘探者:** wuhao\n\n"
            f"作为地理专家，我刚刚观测到了代码库发生了一次剧烈的板块运动。以下是详细的勘探数据：\n\n"
            f"### 📝 运动成因 (Commit Message)\n"
            f"{commit_msg}\n\n"
            f"### 📂 发生位移的地貌 (Changed Files)\n"
            f"{changed}\n\n"
            f"*“每一次代码的合并，都如同大陆板块的碰撞，塑造出更加宏伟的产品高峰。”*"
        )

    def send_wecom(self, content: str) -> bool:
        """
        向企微群发送 Markdown 通知.

        参数:
            content: str, Markdown 内容.

        返回值:
            bool: 是否发送成功.

        异常:
            无.
        """
        if not self.WECOM_WEBHOOK:
            logger.warning("企微 Webhook 未配置, 跳过")
            return False

        try:
            resp = requests.post(
                self.WECOM_WEBHOOK,
                json={"msgtype": "markdown", "markdown": {"content": content}},
                timeout=15,
            )
            result = resp.json()
            if result.get("errcode") == 0:
                logger.info(f"企微通知发送成功: {result}")
                return True
            else:
                logger.error(f"企微通知发送失败: {result}")
                return False
        except Exception as e:
            logger.error(f"企微通知异常: {e}")
            return False

    def send_feishu(self, content: str) -> bool:
        """
        向飞书群发送通知.

        参数:
            content: str, 文本内容.

        返回值:
            bool: 是否发送成功.

        异常:
            无.
        """
        if not self.FEISHU_WEBHOOK or "xxxx" in self.FEISHU_WEBHOOK:
            logger.warning("飞书 Webhook 未配置或为占位符, 跳过")
            return False

        try:
            resp = requests.post(
                self.FEISHU_WEBHOOK,
                json={"msg_type": "text", "content": {"text": content}},
                timeout=15,
            )
            result = resp.json()
            if result.get("code") == 0:
                logger.info(f"飞书通知发送成功: {result}")
                return True
            else:
                logger.error(f"飞书通知发送失败: {result}")
                return False
        except Exception as e:
            logger.error(f"飞书通知异常: {e}")
            return False

    def notify(self) -> int:
        """
        执行推送通知.

        返回值:
            int: 0 成功, 1 失败.

        异常:
            无.
        """
        try:
            commit_hash, commit_msg, branch = self._get_last_commit_info()
        except RuntimeError as e:
            logger.error(f"无法获取提交信息: {e}")
            return 1

        content = self.build_markdown(commit_hash, commit_msg, branch)

        wecom_ok = self.send_wecom(content)
        feishu_ok = self.send_feishu(content)

        if wecom_ok:
            logger.info("企微通知已发送")
        if not feishu_ok:
            logger.info("飞书通知已跳过 (Webhook 未配置)")

        return 0 if wecom_ok else 1


def main() -> int:
    """入口函数."""
    notifier = GitPushNotifier()
    return notifier.notify()


if __name__ == "__main__":
    sys.exit(main())
