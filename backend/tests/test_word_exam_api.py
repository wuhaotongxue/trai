#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: test_word_exam_api.py
# 作者: wuhao
# 日期: 2026_06_02_17:42:32
# 描述: Word 试卷上传解析接口测试, 验证上传解析与宜搭字段映射返回结构

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent
BACKEND_SRC = BACKEND_ROOT / "src"
if str(BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(BACKEND_SRC))

from api.routers.tools.exam import router as exam_router


class WordExamApiTestCase(unittest.TestCase):
    """
    Word 试卷上传解析接口测试集.

    用途:
        验证上传 docx 后可返回结构化试卷 JSON 与宜搭字段映射结果.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(self, methodName: str = "runTest") -> None:
        """
        初始化接口测试实例.

        用途:
            构建轻量 FastAPI 测试应用并预置真实试卷文件路径.
        参数:
            methodName: unittest 测试方法名.
        返回值:
            None.
        异常:
            无.
        """
        super().__init__(methodName)
        self._file_path = PROJECT_ROOT / "7-CAP产品知识测试B卷.docx"
        self._app = FastAPI()
        self._app.include_router(exam_router, prefix="/api_trai/v1/tools", tags=["工具"])
        self._client = TestClient(self._app)

    class _FakeCreateResult:
        """
        宜搭创建结果测试替身.

        用途:
            为 API 测试提供稳定的表单创建结果对象.
        参数:
            无.
        返回值:
            None.
        异常:
            无.
        """

        def __init__(self) -> None:
            """
            初始化宜搭创建结果测试替身.

            用途:
                预置 API 断言所需的 form_uuid, form_title 和 app_type.
            参数:
                无.
            返回值:
                None.
            异常:
                无.
            """
            self.form_uuid = "FORM_API_FAKE_001"
            self.form_title = "CAP 考试表单"
            self.app_type = "APP_FAKE_001"

    class _FakeCreateOutput:
        """
        宜搭创建输出测试替身.

        用途:
            为 API 测试模拟应用层成功返回的完整创建结果.
        参数:
            无.
        返回值:
            None.
        异常:
            无.
        """

        def __init__(self) -> None:
            """
            初始化宜搭创建输出测试替身.

            用途:
                预置路由层序列化所需的 paper, yida_fields, yida_schema 和 create_result.
            参数:
                无.
            返回值:
                None.
            异常:
                无.
            """
            self.paper_data = {"paper_title": "痰热清注射液销售代表专业考核试卷"}
            self.yida_fields = [{"field_key": "candidate_name"}]
            self.yida_schema = {"schemaType": "superform", "schemaVersion": "5.0"}
            self.question_count = 41
            self.warning_messages = []
            self.create_result = WordExamApiTestCase._FakeCreateResult()

    class _FakePublishOutput:
        """
        Share publish output used by route tests.
        """

        def __init__(self) -> None:
            self.exam_id = "exam_fake_001"
            self.share_token = "share_fake_001"
            self.share_path = "/exam/share_fake_001"
            self.share_url = "https://exam.example.com/exam/share_fake_001"
            self.paper = {"paper_title": "CAP Share Exam"}
            self.question_count = 12
            self.warning_messages = ["share warning"]

    class _FakeDetailOutput:
        """
        Public exam detail output used by route tests.
        """

        def __init__(self) -> None:
            self.exam_id = "exam_fake_001"
            self.share_token = "share_fake_001"
            self.paper = {
                "paper_title": "CAP Share Exam",
                "sections": [
                    {
                        "section_title": "Single Choice",
                        "questions": [{"question_no": 1, "stem": "Question 1"}],
                    }
                ],
            }
            self.question_count = 12
            self.section_count = 1
            self.share_url = "https://exam.example.com/exam/share_fake_001"

    class _FakeSubmitOutput:
        """
        Submission output used by route tests.
        """

        def __init__(self) -> None:
            self.submission_id = "submission_fake_001"
            self.exam_id = "exam_fake_001"
            self.score = 18
            self.total_score = 20
            self.requires_manual_review = True
            self.sync_result = {"enabled": False, "status": "skipped"}

    class _FakePublishedListItem:
        """
        Published list item output used by route tests.
        """

        def __init__(self) -> None:
            self.exam_id = "exam_fake_001"
            self.share_token = "share_fake_001"
            self.share_url = "https://exam.example.com/exam/share_fake_001"
            self.paper_title = "CAP Share Exam"
            self.position = "Sales"
            self.question_count = 12
            self.submission_count = 3
            self.latest_submission_at = "2026-06-02T19:30:00"
            self.created_at = "2026-06-02T19:00:00"
            self.updated_at = "2026-06-02T19:10:00"

    class _FakePublishedListOutput:
        """
        Published list output used by route tests.
        """

        def __init__(self) -> None:
            self.items = [WordExamApiTestCase._FakePublishedListItem()]
            self.total = 1

    class _FakePublishedDetailSubmissionItem:
        """
        Published detail submission item used by route tests.
        """

        def __init__(self) -> None:
            self.submission_id = "submission_fake_001"
            self.candidate_name = "Alice"
            self.candidate_department = "Training"
            self.score = 18
            self.total_score = 20
            self.requires_manual_review = True
            self.sync_status = "skipped"
            self.submitted_at = "2026-06-02T19:30:00"

    class _FakePublishedDetailOutput:
        """
        Published detail output used by route tests.
        """

        def __init__(self) -> None:
            self.exam_id = "exam_fake_001"
            self.share_token = "share_fake_001"
            self.share_url = "https://exam.example.com/exam/share_fake_001"
            self.share_path = "/exam/share_fake_001"
            self.paper_title = "CAP Share Exam"
            self.position = "Sales"
            self.question_count = 12
            self.total_score = 100
            self.duration_minutes = 30
            self.warning_messages = ["share warning"]
            self.created_at = "2026-06-02T19:00:00"
            self.updated_at = "2026-06-02T19:10:00"
            self.submission_count = 1
            self.submissions = [WordExamApiTestCase._FakePublishedDetailSubmissionItem()]

    class _FakeSubmissionQuestionDetailItem:
        """
        Submission question detail item used by route tests.
        """

        def __init__(self) -> None:
            self.question_no = 1
            self.question_type = "single_choice"
            self.section_title = "Single Choice"
            self.stem = "Question 1"
            self.max_score = 5
            self.awarded_score = 5
            self.is_correct = True
            self.requires_manual_review = False
            self.standard_answer = ["A"]
            self.reference_answer = None
            self.candidate_values = ["A"]
            self.candidate_text = None
            self.evaluation_status = "correct"

    class _FakeSubmissionDetailOutput:
        """
        Submission detail output used by route tests.
        """

        def __init__(self) -> None:
            self.exam_id = "exam_fake_001"
            self.submission_id = "submission_fake_001"
            self.share_token = "share_fake_001"
            self.paper_title = "CAP Share Exam"
            self.candidate_name = "Alice"
            self.candidate_department = "Training"
            self.score = 18
            self.total_score = 20
            self.requires_manual_review = True
            self.sync_status = "skipped"
            self.sync_result = {"enabled": False, "status": "skipped", "message": "AI table sync disabled"}
            self.submitted_at = "2026-06-02T19:30:00"
            self.question_details = [WordExamApiTestCase._FakeSubmissionQuestionDetailItem()]

    def test_parse_word_endpoint_returns_structured_exam_and_yida_fields(self) -> None:
        """
        测试上传解析接口成功返回试卷与宜搭字段.

        用途:
            使用真实 CAP 试卷验证接口返回码, 题量和宜搭字段结构.
        参数:
            无.
        返回值:
            None.
        异常:
            无.
        """
        with self._file_path.open("rb") as file_obj:
            response = self._client.post(
                "/api_trai/v1/tools/exam/parse_word",
                data={"include_yida_fields": "true"},
                files={
                    "file": (
                        self._file_path.name,
                        file_obj,
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    )
                },
            )

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["msg"], "OK")
        self.assertEqual(payload["data"]["question_count"], 41)
        self.assertEqual(payload["data"]["section_count"], 4)
        self.assertEqual(payload["data"]["paper"]["paper_title"], "痰热清注射液销售代表专业考核试卷")
        self.assertEqual(payload["data"]["yida_fields"][0]["field_key"], "candidate_name")
        self.assertEqual(payload["data"]["yida_fields"][2]["type"], "RadioField")

    def test_parse_word_endpoint_rejects_invalid_content_type(self) -> None:
        """
        测试上传解析接口拒绝非法 Content-Type.

        用途:
            确认接口会同时校验扩展名和 Content-Type, 避免非标准文件误入解析流程.
        参数:
            无.
        返回值:
            None.
        异常:
            无.
        """
        with self._file_path.open("rb") as file_obj:
            response = self._client.post(
                "/api_trai/v1/tools/exam/parse_word",
                data={"include_yida_fields": "true"},
                files={
                    "file": (
                        self._file_path.name,
                        file_obj,
                        "application/octet-stream",
                    )
                },
            )

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["code"], 400)
        self.assertEqual(payload["msg"], "上传文件 Content-Type 非法, 仅支持标准 docx 文件")

    def test_create_yida_form_endpoint_returns_created_form_data(self) -> None:
        """
        测试创建宜搭表单接口返回创建结果.

        用途:
            使用假用例替身验证路由层可以正确输出 form_uuid 和 yida_schema.
        参数:
            无.
        返回值:
            None.
        异常:
            无.
        """

        class FakeCreateUseCase:
            """
            宜搭创建用例测试替身.

            用途:
                模拟应用层创建成功, 避免接口测试依赖真实宜搭环境.
            参数:
                无.
            返回值:
                None.
            异常:
                无.
            """

            async def execute(self, input_data: object) -> object:
                """
                模拟执行宜搭表单创建.

                用途:
                    返回预置的创建结果对象供路由层序列化.
                参数:
                    input_data: 路由传入的创建输入对象.
                返回值:
                    object: 预置的创建输出对象.
                异常:
                    无.
                """
                _ = input_data
                return WordExamApiTestCase._FakeCreateOutput()

        with self._file_path.open("rb") as file_obj:
            with patch("api.routers.tools.exam.WordExamCreateYidaFormUseCase", return_value=FakeCreateUseCase()):
                response = self._client.post(
                    "/api_trai/v1/tools/exam/create_yida_form",
                    data={
                        "app_type": "APP_FAKE_001",
                        "form_title": "CAP 考试表单",
                        "form_description": "考试自动创建表单",
                    },
                    files={
                        "file": (
                            self._file_path.name,
                            file_obj,
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        )
                    },
                )

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["data"]["form_uuid"], "FORM_API_FAKE_001")
        self.assertEqual(payload["data"]["app_type"], "APP_FAKE_001")
        self.assertEqual(payload["data"]["yida_schema"]["schemaType"], "superform")

    def test_publish_share_endpoint_returns_share_payload(self) -> None:
        """
        Test share publish route serialization.
        """

        class FakePublishUseCase:
            """
            Fake publish use case for route tests.
            """

            async def execute(self, input_data: object) -> object:
                _ = input_data
                return WordExamApiTestCase._FakePublishOutput()

        with self._file_path.open("rb") as file_obj:
            with patch("api.routers.tools.exam.PublishSharedExamUseCase", return_value=FakePublishUseCase()):
                response = self._client.post(
                    "/api_trai/v1/tools/exam/publish_share",
                    data={"share_base_url": "https://exam.example.com"},
                    files={
                        "file": (
                            self._file_path.name,
                            file_obj,
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        )
                    },
                )

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["data"]["exam_id"], "exam_fake_001")
        self.assertEqual(payload["data"]["share_token"], "share_fake_001")
        self.assertEqual(payload["data"]["question_count"], 12)

    def test_share_detail_endpoint_returns_public_exam_payload(self) -> None:
        """
        Test public exam detail route serialization.
        """

        class FakeDetailUseCase:
            """
            Fake detail use case for route tests.
            """

            async def execute(self, input_data: object) -> object:
                _ = input_data
                return WordExamApiTestCase._FakeDetailOutput()

        with patch("api.routers.tools.exam.GetSharedExamUseCase", return_value=FakeDetailUseCase()):
            response = self._client.post(
                "/api_trai/v1/tools/exam/share_detail",
                json={"share_token": "share_fake_001"},
            )

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["data"]["share_token"], "share_fake_001")
        self.assertEqual(payload["data"]["section_count"], 1)
        self.assertEqual(payload["data"]["paper"]["paper_title"], "CAP Share Exam")

    def test_submit_answers_endpoint_returns_score_payload(self) -> None:
        """
        Test submission route serialization.
        """

        class FakeSubmitUseCase:
            """
            Fake submit use case for route tests.
            """

            async def execute(self, input_data: object) -> object:
                _ = input_data
                return WordExamApiTestCase._FakeSubmitOutput()

        with patch("api.routers.tools.exam.SubmitSharedExamUseCase", return_value=FakeSubmitUseCase()):
            response = self._client.post(
                "/api_trai/v1/tools/exam/submit_answers",
                json={
                    "share_token": "share_fake_001",
                    "candidate_name": "Alice",
                    "candidate_department": "Training",
                    "answers": [
                        {"question_no": 1, "values": ["A"], "text_answer": None},
                    ],
                },
            )

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["data"]["submission_id"], "submission_fake_001")
        self.assertEqual(payload["data"]["score"], 18)
        self.assertTrue(payload["data"]["requires_manual_review"])

    def test_published_list_endpoint_returns_history_payload(self) -> None:
        """
        Test published exam history route serialization.
        """

        class FakePublishedListUseCase:
            """
            Fake published list use case for route tests.
            """

            async def execute(self, input_data: object | None = None) -> object:
                _ = input_data
                return WordExamApiTestCase._FakePublishedListOutput()

        with patch("api.routers.tools.exam.ListPublishedExamsUseCase", return_value=FakePublishedListUseCase()):
            response = self._client.post("/api_trai/v1/tools/exam/published_list")

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["data"]["total"], 1)
        self.assertEqual(payload["data"]["items"][0]["exam_id"], "exam_fake_001")
        self.assertEqual(payload["data"]["items"][0]["submission_count"], 3)

    def test_published_detail_endpoint_returns_exam_and_submission_payload(self) -> None:
        """
        Test published exam detail route serialization.
        """

        class FakePublishedDetailUseCase:
            """
            Fake published detail use case for route tests.
            """

            async def execute(self, input_data: object) -> object:
                _ = input_data
                return WordExamApiTestCase._FakePublishedDetailOutput()

        with patch("api.routers.tools.exam.GetPublishedExamDetailUseCase", return_value=FakePublishedDetailUseCase()):
            response = self._client.post(
                "/api_trai/v1/tools/exam/published_detail",
                json={"share_token": "share_fake_001"},
            )

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["data"]["exam_id"], "exam_fake_001")
        self.assertEqual(payload["data"]["submission_count"], 1)
        self.assertEqual(payload["data"]["submissions"][0]["candidate_name"], "Alice")

    def test_submission_detail_endpoint_returns_grading_payload(self) -> None:
        """
        Test submission detail route serialization.
        """

        class FakeSubmissionDetailUseCase:
            """
            Fake submission detail use case for route tests.
            """

            async def execute(self, input_data: object) -> object:
                _ = input_data
                return WordExamApiTestCase._FakeSubmissionDetailOutput()

        with patch("api.routers.tools.exam.GetPublishedSubmissionDetailUseCase", return_value=FakeSubmissionDetailUseCase()):
            response = self._client.post(
                "/api_trai/v1/tools/exam/submission_detail",
                json={
                    "share_token": "share_fake_001",
                    "submission_id": "submission_fake_001",
                },
            )

        payload = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["code"], 200)
        self.assertEqual(payload["data"]["submission_id"], "submission_fake_001")
        self.assertEqual(payload["data"]["sync_result"]["status"], "skipped")
        self.assertEqual(payload["data"]["question_details"][0]["evaluation_status"], "correct")


if __name__ == "__main__":
    unittest.main()
