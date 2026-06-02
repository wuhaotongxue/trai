#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: test_word_exam_api_http.py
# 作者: wuhao
# 日期: 2026_06_02_17:44:46
# 描述: Word 试卷上传解析 HTTP 联调测试, 验证运行中的后端服务可返回结构化试卷结果

from __future__ import annotations

import unittest
from pathlib import Path

import requests


class WordExamApiHttpTestCase(unittest.TestCase):
    """
    Word 试卷上传解析 HTTP 联调测试集.

    用途:
        面向已启动的本地后端服务执行真实 multipart 上传请求, 验证接口联调结果.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(self, methodName: str = "runTest") -> None:
        """
        初始化 HTTP 联调测试实例.

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
        self._base_url = "http://127.0.0.1:5666"
        self._file_path = Path(__file__).resolve().parents[2] / "7-CAP产品知识测试B卷.docx"

    def test_parse_word_endpoint_on_running_backend(self) -> None:
        """
        测试运行中后端的 Word 上传解析接口.

        用途:
            对真实后端进程发送上传请求, 验证结构化试卷与宜搭字段映射均可返回.
        参数:
            无.
        返回值:
            None.
        异常:
            requests.RequestException: 当本地服务不可达时抛出.
        """
        with self._file_path.open("rb") as file_obj:
            response = requests.post(
                f"{self._base_url}/api_trai/v1/tools/exam/parse_word",
                data={"include_yida_fields": "true"},
                files={
                    "file": (
                        self._file_path.name,
                        file_obj,
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    )
                },
                timeout=60,
            )

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["msg"], "OK")
        self.assertEqual(payload["data"]["section_count"], 4)
        self.assertEqual(payload["data"]["question_count"], 41)
        self.assertEqual(payload["data"]["paper"]["paper_title"], "痰热清注射液销售代表专业考核试卷")
        self.assertEqual(payload["data"]["yida_fields"][0]["field_key"], "candidate_name")


if __name__ == "__main__":
    unittest.main()
