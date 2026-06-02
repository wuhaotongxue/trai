#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: test_exam_share_api_http.py
# 作者: wuhao
# 日期: 2026_06_02_19:16:00
# 描述: 分享考试 HTTP 联调测试, 验证运行中的后端服务可完成真实发布, 查询和提交流程

from __future__ import annotations

import unittest
from pathlib import Path

import requests
from loguru import logger


class ExamShareApiHttpTestCase(unittest.TestCase):
    """
    分享考试真实 HTTP 联调测试集.

    用途:
        面向已启动的本地后端和前端服务执行完整分享考试链路验证.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(self, methodName: str = "runTest") -> None:
        """
        初始化联调测试实例.

        用途:
            预置本地服务地址和真实试卷文件路径.
        参数:
            methodName: unittest 测试方法名.
        返回值:
            None.
        异常:
            无.
        """
        super().__init__(methodName)
        self._api_base_url = "http://127.0.0.1:5666"
        self._frontend_base_url = "http://127.0.0.1:3000"
        self._file_path = Path(__file__).resolve().parents[2] / "7-CAP产品知识测试B卷.docx"

    def test_publish_share_detail_submit_and_open_frontend_page(self) -> None:
        """
        测试分享考试完整联调链路.

        用途:
            真实调用发布, 获取详情, 提交答卷, 并输出可用于前端预览的分享链接.
        参数:
            无.
        返回值:
            None.
        异常:
            requests.RequestException: 当本地服务不可达时抛出.
        """
        with self._file_path.open("rb") as file_obj:
            publish_response = requests.post(
                f"{self._api_base_url}/api_trai/v1/tools/exam/publish_share",
                data={"share_base_url": self._frontend_base_url},
                files={
                    "file": (
                        self._file_path.name,
                        file_obj,
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    )
                },
                timeout=120,
            )

        publish_payload = publish_response.json()
        self.assertEqual(publish_response.status_code, 200)
        self.assertEqual(publish_payload["code"], 200)
        self.assertIsNotNone(publish_payload["data"])
        share_token = str(publish_payload["data"]["share_token"])
        share_url = str(publish_payload["data"]["share_url"])
        self.assertTrue(share_token.startswith("share_"))
        self.assertTrue(share_url.startswith(self._frontend_base_url))

        detail_response = requests.post(
            f"{self._api_base_url}/api_trai/v1/tools/exam/share_detail",
            json={"share_token": share_token},
            timeout=60,
        )
        detail_payload = detail_response.json()
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_payload["code"], 200)
        self.assertEqual(detail_payload["data"]["share_token"], share_token)
        self.assertEqual(detail_payload["data"]["question_count"], 41)

        submit_response = requests.post(
            f"{self._api_base_url}/api_trai/v1/tools/exam/submit_answers",
            json={
                "share_token": share_token,
                "candidate_name": "联调测试用户",
                "candidate_department": "测试部",
                "answers": [
                    {"question_no": 1, "values": ["A"], "text_answer": None},
                    {"question_no": 2, "values": ["C"], "text_answer": None},
                    {"question_no": 3, "values": ["B"], "text_answer": None},
                    {"question_no": 4, "values": ["B"], "text_answer": None},
                    {"question_no": 5, "values": ["A"], "text_answer": None},
                    {"question_no": 6, "values": ["C"], "text_answer": None},
                    {"question_no": 7, "values": ["B"], "text_answer": None},
                    {"question_no": 8, "values": ["C"], "text_answer": None},
                    {"question_no": 9, "values": ["C"], "text_answer": None},
                    {"question_no": 10, "values": ["A"], "text_answer": None},
                    {"question_no": 11, "values": ["A", "B", "C", "D", "E"], "text_answer": None},
                    {"question_no": 12, "values": ["A", "B", "C", "D"], "text_answer": None},
                    {"question_no": 13, "values": ["A", "B", "C", "D"], "text_answer": None},
                    {"question_no": 14, "values": ["A", "B", "C", "D", "E"], "text_answer": None},
                    {"question_no": 15, "values": ["A", "B", "C"], "text_answer": None},
                    {"question_no": 16, "values": ["A", "B", "C", "D"], "text_answer": None},
                    {"question_no": 17, "values": ["A", "B", "C", "D"], "text_answer": None},
                    {"question_no": 18, "values": ["A", "B", "C"], "text_answer": None},
                    {"question_no": 19, "values": ["A", "B", "C"], "text_answer": None},
                    {"question_no": 20, "values": ["A", "B", "D"], "text_answer": None},
                    {"question_no": 21, "values": ["A", "B", "C", "D"], "text_answer": None},
                    {"question_no": 22, "values": ["A", "B", "C", "E"], "text_answer": None},
                    {"question_no": 23, "values": ["A", "B", "C", "D"], "text_answer": None},
                    {"question_no": 24, "values": ["A", "B", "C", "D"], "text_answer": None},
                    {"question_no": 25, "values": ["A", "B", "C"], "text_answer": None},
                    {"question_no": 26, "values": ["true"], "text_answer": None},
                    {"question_no": 27, "values": ["false"], "text_answer": None},
                    {"question_no": 28, "values": ["false"], "text_answer": None},
                    {"question_no": 29, "values": ["true"], "text_answer": None},
                    {"question_no": 30, "values": ["true"], "text_answer": None},
                    {"question_no": 31, "values": ["true"], "text_answer": None},
                    {"question_no": 32, "values": ["true"], "text_answer": None},
                    {"question_no": 33, "values": ["true"], "text_answer": None},
                    {"question_no": 34, "values": ["false"], "text_answer": None},
                    {"question_no": 35, "values": ["false"], "text_answer": None},
                    {"question_no": 36, "values": ["true"], "text_answer": None},
                    {"question_no": 37, "values": ["true"], "text_answer": None},
                    {"question_no": 38, "values": ["true"], "text_answer": None},
                    {"question_no": 39, "values": ["true"], "text_answer": None},
                    {"question_no": 40, "values": ["false"], "text_answer": None},
                    {
                        "question_no": 41,
                        "values": [],
                        "text_answer": "联调用简答题答案, 用于验证主观题提交流程.",
                    },
                ],
            },
            timeout=120,
        )
        submit_payload = submit_response.json()
        self.assertEqual(submit_response.status_code, 200)
        self.assertEqual(submit_payload["code"], 200)
        self.assertIsNotNone(submit_payload["data"])
        self.assertTrue(bool(submit_payload["data"]["requires_manual_review"]))

        logger.info(f"REAL_SHARE_URL={share_url}")
        logger.info(
            "REAL_SHARE_RESULT="
            f"score={submit_payload['data']['score']}/{submit_payload['data']['total_score']}, "
            f"sync_status={submit_payload['data']['sync_result'].get('status')}"
        )


if __name__ == "__main__":
    unittest.main()
