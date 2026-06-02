#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: test_exam_share_usecases.py
# 作者: wuhao
# 日期: 2026_06_02_20:05:00
# 描述: Exam share use case tests for publish, public detail and submission grading flows

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
BACKEND_SRC = BACKEND_ROOT / "src"
if str(BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(BACKEND_SRC))

from application.exam_share_usecases import (
    GetPublishedExamDetailInput,
    GetPublishedExamDetailUseCase,
    GetPublishedSubmissionDetailInput,
    GetPublishedSubmissionDetailUseCase,
    GetSharedExamInput,
    GetSharedExamUseCase,
    ListPublishedExamsUseCase,
    PublishSharedExamInput,
    PublishSharedExamUseCase,
    SubmitSharedExamInput,
    SubmitSharedExamUseCase,
)
from infrastructure.tools.exam_share_repository import ExamShareFileRepository


class _FakeParseOutput:
    """
    Stable parser output used by publish tests.
    """

    def __init__(self) -> None:
        self.paper_data = {
            "paper_title": "CAP Product Exam",
            "position": "Sales",
            "total_score": 30,
            "duration_minutes": 20,
            "warning_messages": ["parser warning"],
            "sections": [
                {
                    "section_type": "single_choice",
                    "section_title": "Single Choice",
                    "question_count": 1,
                    "score_per_question": 5,
                    "questions": [
                        {
                            "question_no": 1,
                            "question_type": "single_choice",
                            "stem": "Question 1",
                            "score": 5,
                            "answer": ["A"],
                            "options": [
                                {"key": "A", "text": "Option A"},
                                {"key": "B", "text": "Option B"},
                            ],
                        }
                    ],
                },
                {
                    "section_type": "multiple_choice",
                    "section_title": "Multiple Choice",
                    "question_count": 1,
                    "score_per_question": 10,
                    "questions": [
                        {
                            "question_no": 2,
                            "question_type": "multiple_choice",
                            "stem": "Question 2",
                            "score": 10,
                            "answer": ["B", "C"],
                            "options": [
                                {"key": "A", "text": "Option A"},
                                {"key": "B", "text": "Option B"},
                                {"key": "C", "text": "Option C"},
                            ],
                        }
                    ],
                },
                {
                    "section_type": "short_answer",
                    "section_title": "Short Answer",
                    "question_count": 1,
                    "score_per_question": 15,
                    "questions": [
                        {
                            "question_no": 3,
                            "question_type": "short_answer",
                            "stem": "Question 3",
                            "score": 15,
                            "reference_answer": "Reference answer",
                            "options": [],
                        }
                    ],
                },
            ],
        }
        self.warning_messages = ["parser warning"]


class _FakeParseUseCase:
    """
    Fake parser use case for publish flow tests.
    """

    async def execute(self, input_data: object) -> _FakeParseOutput:
        _ = input_data
        return _FakeParseOutput()


class _FakeSyncService:
    """
    Fake AI table sync service for submission tests.
    """

    def __init__(self) -> None:
        self.last_exam_data: dict[str, Any] | None = None
        self.last_submission_data: dict[str, Any] | None = None

    async def sync_submission(
        self,
        exam_data: dict[str, Any],
        submission_data: dict[str, Any],
    ) -> dict[str, Any]:
        self.last_exam_data = exam_data
        self.last_submission_data = submission_data
        return {
            "enabled": False,
            "status": "skipped",
            "message": "AI table sync disabled",
        }


class ExamShareUseCaseTestCase(unittest.IsolatedAsyncioTestCase):
    """
    Covers the publish, detail and submit MVP flow.
    """

    async def test_publish_shared_exam_persists_exam_and_share_url(self) -> None:
        """
        Publish flow should create a stored exam and share URL.
        """
        with TemporaryDirectory() as temporary_directory:
            repository = ExamShareFileRepository(storage_root=temporary_directory)
            use_case = PublishSharedExamUseCase(
                parse_use_case=_FakeParseUseCase(),
                repository=repository,
            )

            result = await use_case.execute(
                PublishSharedExamInput(
                    file_path="/tmp/mock_exam.docx",
                    share_base_url="https://exam.example.com",
                )
            )

            stored_exam = repository.get_published_exam(share_token=result.share_token)
            self.assertTrue(result.exam_id.startswith("exam_"))
            self.assertTrue(result.share_token.startswith("share_"))
            self.assertEqual(result.share_url, f"https://exam.example.com{result.share_path}")
            self.assertEqual(result.question_count, 3)
            self.assertEqual(stored_exam["paper"]["paper_title"], "CAP Product Exam")
            self.assertEqual(stored_exam["question_count"], 3)

    async def test_get_shared_exam_hides_answers_for_public_page(self) -> None:
        """
        Public detail flow should remove answer fields from payload.
        """
        with TemporaryDirectory() as temporary_directory:
            repository = ExamShareFileRepository(storage_root=temporary_directory)
            publish_use_case = PublishSharedExamUseCase(
                parse_use_case=_FakeParseUseCase(),
                repository=repository,
            )
            publish_result = await publish_use_case.execute(
                PublishSharedExamInput(file_path="/tmp/mock_exam.docx")
            )

            detail_use_case = GetSharedExamUseCase(repository=repository)
            detail_result = await detail_use_case.execute(
                GetSharedExamInput(share_token=publish_result.share_token)
            )

            first_question = detail_result.paper["sections"][0]["questions"][0]
            short_question = detail_result.paper["sections"][2]["questions"][0]
            self.assertEqual(detail_result.question_count, 3)
            self.assertEqual(detail_result.section_count, 3)
            self.assertNotIn("answer", first_question)
            self.assertNotIn("reference_answer", short_question)

    async def test_list_published_exams_returns_latest_first_with_submission_stats(self) -> None:
        """
        Published list flow should expose history items and submission counts.
        """
        with TemporaryDirectory() as temporary_directory:
            repository = ExamShareFileRepository(storage_root=temporary_directory)
            publish_use_case = PublishSharedExamUseCase(
                parse_use_case=_FakeParseUseCase(),
                repository=repository,
            )
            first_publish = await publish_use_case.execute(
                PublishSharedExamInput(file_path="/tmp/mock_exam_1.docx")
            )
            second_publish = await publish_use_case.execute(
                PublishSharedExamInput(file_path="/tmp/mock_exam_2.docx")
            )
            submit_use_case = SubmitSharedExamUseCase(
                repository=repository,
                sync_service=_FakeSyncService(),
            )
            await submit_use_case.execute(
                SubmitSharedExamInput(
                    share_token=second_publish.share_token,
                    candidate_name="Alice",
                    candidate_department="Training",
                    answers=[
                        {"question_no": 1, "values": ["A"]},
                        {"question_no": 2, "values": ["B", "C"]},
                        {"question_no": 3, "text_answer": "My summary"},
                    ],
                )
            )

            list_use_case = ListPublishedExamsUseCase(repository=repository)
            list_result = await list_use_case.execute()

            self.assertEqual(list_result.total, 2)
            self.assertEqual(list_result.items[0].exam_id, second_publish.exam_id)
            self.assertEqual(list_result.items[0].submission_count, 1)
            self.assertTrue(bool(list_result.items[0].latest_submission_at))
            self.assertEqual(list_result.items[1].exam_id, first_publish.exam_id)
            self.assertEqual(list_result.items[1].submission_count, 0)

    async def test_get_published_exam_detail_returns_submission_list(self) -> None:
        """
        Published detail flow should return exam summary and submission rows.
        """
        with TemporaryDirectory() as temporary_directory:
            repository = ExamShareFileRepository(storage_root=temporary_directory)
            publish_use_case = PublishSharedExamUseCase(
                parse_use_case=_FakeParseUseCase(),
                repository=repository,
            )
            publish_result = await publish_use_case.execute(
                PublishSharedExamInput(file_path="/tmp/mock_exam.docx")
            )
            submit_use_case = SubmitSharedExamUseCase(
                repository=repository,
                sync_service=_FakeSyncService(),
            )
            await submit_use_case.execute(
                SubmitSharedExamInput(
                    share_token=publish_result.share_token,
                    candidate_name="Alice",
                    candidate_department="Training",
                    answers=[
                        {"question_no": 1, "values": ["A"]},
                        {"question_no": 2, "values": ["B", "C"]},
                        {"question_no": 3, "text_answer": "My summary"},
                    ],
                )
            )

            detail_use_case = GetPublishedExamDetailUseCase(repository=repository)
            detail_result = await detail_use_case.execute(
                GetPublishedExamDetailInput(share_token=publish_result.share_token)
            )

            self.assertEqual(detail_result.exam_id, publish_result.exam_id)
            self.assertEqual(detail_result.share_token, publish_result.share_token)
            self.assertEqual(detail_result.paper_title, "CAP Product Exam")
            self.assertEqual(detail_result.submission_count, 1)
            self.assertEqual(detail_result.submissions[0].candidate_name, "Alice")
            self.assertEqual(detail_result.submissions[0].score, 15)

    async def test_get_published_submission_detail_returns_answer_and_grading_details(self) -> None:
        """
        Submission detail flow should return sync result and per-question grading details.
        """
        with TemporaryDirectory() as temporary_directory:
            repository = ExamShareFileRepository(storage_root=temporary_directory)
            publish_use_case = PublishSharedExamUseCase(
                parse_use_case=_FakeParseUseCase(),
                repository=repository,
            )
            publish_result = await publish_use_case.execute(
                PublishSharedExamInput(file_path="/tmp/mock_exam.docx")
            )
            submit_use_case = SubmitSharedExamUseCase(
                repository=repository,
                sync_service=_FakeSyncService(),
            )
            submit_result = await submit_use_case.execute(
                SubmitSharedExamInput(
                    share_token=publish_result.share_token,
                    candidate_name="Alice",
                    candidate_department="Training",
                    answers=[
                        {"question_no": 1, "values": ["A"]},
                        {"question_no": 2, "values": ["A"]},
                        {"question_no": 3, "text_answer": "My summary"},
                    ],
                )
            )

            detail_use_case = GetPublishedSubmissionDetailUseCase(repository=repository)
            detail_result = await detail_use_case.execute(
                GetPublishedSubmissionDetailInput(
                    share_token=publish_result.share_token,
                    submission_id=submit_result.submission_id,
                )
            )

            self.assertEqual(detail_result.submission_id, submit_result.submission_id)
            self.assertEqual(detail_result.sync_status, "skipped")
            self.assertEqual(detail_result.sync_result["status"], "skipped")
            self.assertEqual(len(detail_result.question_details), 3)
            self.assertEqual(detail_result.question_details[0].evaluation_status, "correct")
            self.assertEqual(detail_result.question_details[1].evaluation_status, "incorrect")
            self.assertEqual(detail_result.question_details[2].evaluation_status, "manual_review")
            self.assertEqual(detail_result.question_details[2].candidate_text, "My summary")

    async def test_submit_shared_exam_grades_objective_questions_and_marks_manual_review(self) -> None:
        """
        Submit flow should score objective questions and flag short answer review.
        """
        with TemporaryDirectory() as temporary_directory:
            repository = ExamShareFileRepository(storage_root=temporary_directory)
            publish_use_case = PublishSharedExamUseCase(
                parse_use_case=_FakeParseUseCase(),
                repository=repository,
            )
            publish_result = await publish_use_case.execute(
                PublishSharedExamInput(file_path="/tmp/mock_exam.docx")
            )
            sync_service = _FakeSyncService()
            submit_use_case = SubmitSharedExamUseCase(
                repository=repository,
                sync_service=sync_service,
            )

            submit_result = await submit_use_case.execute(
                SubmitSharedExamInput(
                    share_token=publish_result.share_token,
                    candidate_name="Alice",
                    candidate_department="Training",
                    answers=[
                        {"question_no": 1, "values": ["A"]},
                        {"question_no": 2, "values": ["B", "C"]},
                        {"question_no": 3, "text_answer": "My summary"},
                    ],
                )
            )

            submissions = repository.list_submissions_by_exam(exam_id=publish_result.exam_id)
            self.assertTrue(submit_result.submission_id.startswith("submission_"))
            self.assertEqual(submit_result.exam_id, publish_result.exam_id)
            self.assertEqual(submit_result.score, 15)
            self.assertEqual(submit_result.total_score, 30)
            self.assertTrue(submit_result.requires_manual_review)
            self.assertEqual(submit_result.sync_result["status"], "skipped")
            self.assertEqual(len(submissions), 1)
            self.assertEqual(submissions[0]["candidate_name"], "Alice")
            self.assertEqual(submissions[0]["sync_status"], "skipped")
            self.assertEqual(submissions[0]["sync_result"]["status"], "skipped")
            self.assertIsNotNone(sync_service.last_submission_data)


if __name__ == "__main__":
    unittest.main()
