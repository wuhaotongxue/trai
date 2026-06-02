#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: exam_share_usecases.py
# 作者: wuhao
# 日期: 2026_06_02_18:48:39
# 描述: 考试分享用例, 负责发布考试, 获取公开试卷和提交答卷

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any
from uuid import uuid4

from loguru import logger

from application.common.base_usecase import UseCase
from application.exam_parser_usecases import WordExamParseInput, WordExamParseUseCase
from core.exceptions import ValidationError
from domain.exam_entities import ExamSubmissionAnswer, ExamSubmissionRecord
from infrastructure.tools.dingtalk_ai_table_sync import DingTalkAiTableSyncService
from infrastructure.tools.exam_share_repository import ExamShareFileRepository


@dataclass(slots=True)
class PublishSharedExamInput:
    """
    发布分享考试输入模型.

    用途:
        承载 Word 文件路径和分享链接基地址.
    参数:
        file_path: Word 试卷路径.
        share_base_url: 分享链接基地址, 如 https://example.com.
    返回值:
        None.
    异常:
        无.
    """

    file_path: str
    share_base_url: str | None = None


@dataclass(slots=True)
class PublishSharedExamOutput:
    """
    发布分享考试输出模型.

    用途:
        返回考试 ID, 分享令牌, 分享链接和结构化试卷元信息.
    参数:
        exam_id: 考试唯一 ID.
        share_token: 分享令牌.
        share_path: 前端分享路径.
        share_url: 完整分享链接.
        paper: 原始试卷结构化 JSON.
        question_count: 总题数.
        warning_messages: 解析告警列表.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str
    share_token: str
    share_path: str
    share_url: str
    paper: dict[str, object]
    question_count: int
    warning_messages: list[str]


@dataclass(slots=True)
class GetSharedExamInput:
    """
    获取公开试卷输入模型.

    用途:
        承载公开分享令牌.
    参数:
        share_token: 分享令牌.
    返回值:
        None.
    异常:
        无.
    """

    share_token: str


@dataclass(slots=True)
class GetSharedExamOutput:
    """
    获取公开试卷输出模型.

    用途:
        返回脱敏后的公开试卷和考试基础信息.
    参数:
        exam_id: 考试 ID.
        share_token: 分享令牌.
        paper: 对外公开试卷数据.
        question_count: 总题数.
        section_count: 分组数量.
        share_url: 分享链接.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str
    share_token: str
    paper: dict[str, object]
    question_count: int
    section_count: int
    share_url: str


@dataclass(slots=True)
class SubmitSharedExamInput:
    """
    提交答卷输入模型.

    用途:
        承载分享令牌, 作答人信息和答案明细.
    参数:
        share_token: 分享令牌.
        candidate_name: 作答人姓名.
        candidate_department: 作答人部门.
        answers: 答案字典列表.
    返回值:
        None.
    异常:
        无.
    """

    share_token: str
    candidate_name: str
    candidate_department: str
    answers: list[dict[str, object]]


@dataclass(slots=True)
class SubmitSharedExamOutput:
    """
    提交答卷输出模型.

    用途:
        返回评分结果, 答卷 ID 和 AI 表格同步状态.
    参数:
        submission_id: 答卷 ID.
        exam_id: 考试 ID.
        score: 当前自动得分.
        total_score: 试卷总分.
        requires_manual_review: 是否仍需人工复核.
        sync_result: AI 表格同步结果.
    返回值:
        None.
    异常:
        无.
    """

    submission_id: str
    exam_id: str
    score: int
    total_score: int
    requires_manual_review: bool
    sync_result: dict[str, object]


@dataclass(slots=True)
class ListPublishedExamItem:
    """
    已发布考试列表项模型.

    用途:
        承载后台发布记录列表中展示的一条考试摘要信息.
    参数:
        exam_id: 考试唯一 ID.
        share_token: 公开分享令牌.
        share_url: 完整分享链接.
        paper_title: 试卷标题.
        position: 适用岗位.
        question_count: 总题数.
        submission_count: 已提交答卷数量.
        latest_submission_at: 最近一次提交时间.
        created_at: 发布时间.
        updated_at: 更新时间.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str
    share_token: str
    share_url: str
    paper_title: str
    position: str | None
    question_count: int
    submission_count: int
    latest_submission_at: str | None
    created_at: str
    updated_at: str


@dataclass(slots=True)
class ListPublishedExamsOutput:
    """
    已发布考试列表输出模型.

    用途:
        返回后台考试管理页所需的考试列表和总数信息.
    参数:
        items: 考试摘要列表.
        total: 记录总数.
    返回值:
        None.
    异常:
        无.
    """

    items: list[ListPublishedExamItem]
    total: int


@dataclass(slots=True)
class GetPublishedExamDetailInput:
    """
    已发布考试详情输入模型.

    用途:
        承载后台详情页查询所需的分享令牌.
    参数:
        share_token: 公开分享令牌.
    返回值:
        None.
    异常:
        无.
    """

    share_token: str


@dataclass(slots=True)
class PublishedExamSubmissionItem:
    """
    已发布考试答卷列表项模型.

    用途:
        承载后台详情页展示的一条答卷摘要记录.
    参数:
        submission_id: 答卷唯一 ID.
        candidate_name: 作答人姓名.
        candidate_department: 作答人部门.
        score: 自动得分.
        total_score: 试卷总分.
        requires_manual_review: 是否仍需人工复核.
        sync_status: AI 表格同步状态.
        submitted_at: 提交时间.
    返回值:
        None.
    异常:
        无.
    """

    submission_id: str
    candidate_name: str
    candidate_department: str
    score: int
    total_score: int
    requires_manual_review: bool
    sync_status: str
    submitted_at: str


@dataclass(slots=True)
class GetPublishedExamDetailOutput:
    """
    已发布考试详情输出模型.

    用途:
        返回后台详情页所需的考试信息, 试卷摘要与答卷列表.
    参数:
        exam_id: 考试唯一 ID.
        share_token: 公开分享令牌.
        share_url: 完整分享链接.
        share_path: 前端分享路径.
        paper_title: 试卷标题.
        position: 适用岗位.
        question_count: 总题数.
        total_score: 试卷总分.
        duration_minutes: 考试时长.
        warning_messages: 解析告警列表.
        created_at: 发布时间.
        updated_at: 更新时间.
        submission_count: 已提交答卷数.
        submissions: 答卷摘要列表.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str
    share_token: str
    share_url: str
    share_path: str
    paper_title: str
    position: str | None
    question_count: int
    total_score: int | None
    duration_minutes: int | None
    warning_messages: list[str]
    created_at: str
    updated_at: str
    submission_count: int
    submissions: list[PublishedExamSubmissionItem]


@dataclass(slots=True)
class GetPublishedSubmissionDetailInput:
    """
    已发布答卷详情输入模型.

    用途:
        承载后台答卷详情页查询所需的分享令牌和答卷 ID.
    参数:
        share_token: 公开分享令牌.
        submission_id: 答卷唯一 ID.
    返回值:
        None.
    异常:
        无.
    """

    share_token: str
    submission_id: str


@dataclass(slots=True)
class PublishedSubmissionQuestionDetailItem:
    """
    已发布答卷逐题详情模型.

    用途:
        承载后台答卷详情页展示的单题作答, 标准答案和评分结果.
    参数:
        question_no: 题号.
        question_type: 题型.
        section_title: 所属分组标题.
        stem: 题干.
        max_score: 本题满分.
        awarded_score: 本题自动得分, 主观题为 None.
        is_correct: 是否自动判定正确, 主观题为 None.
        requires_manual_review: 本题是否需人工复核.
        standard_answer: 标准答案列表.
        reference_answer: 主观题参考答案.
        candidate_values: 客观题作答选项列表.
        candidate_text: 主观题文本答案.
        evaluation_status: 评分状态标记.
    返回值:
        None.
    异常:
        无.
    """

    question_no: int
    question_type: str
    section_title: str
    stem: str
    max_score: int
    awarded_score: int | None
    is_correct: bool | None
    requires_manual_review: bool
    standard_answer: list[str]
    reference_answer: str | None
    candidate_values: list[str]
    candidate_text: str | None
    evaluation_status: str


@dataclass(slots=True)
class GetPublishedSubmissionDetailOutput:
    """
    已发布答卷详情输出模型.

    用途:
        返回后台答卷详情页所需的考试信息, 考生信息, 同步结果和逐题评分明细.
    参数:
        exam_id: 考试唯一 ID.
        submission_id: 答卷唯一 ID.
        share_token: 分享令牌.
        paper_title: 试卷标题.
        candidate_name: 作答人姓名.
        candidate_department: 作答人部门.
        score: 自动得分.
        total_score: 试卷总分.
        requires_manual_review: 是否仍需人工复核.
        sync_status: AI 表格同步状态.
        sync_result: AI 表格同步结果详情.
        submitted_at: 提交时间.
        question_details: 逐题评分明细.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str
    submission_id: str
    share_token: str
    paper_title: str
    candidate_name: str
    candidate_department: str
    score: int
    total_score: int
    requires_manual_review: bool
    sync_status: str
    sync_result: dict[str, Any]
    submitted_at: str
    question_details: list[PublishedSubmissionQuestionDetailItem]


class ExamPaperSanitizer:
    """
    公开试卷脱敏器.

    用途:
        将试卷结构中的标准答案和参考答案移除, 仅保留作答页需要的题目信息.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    def build_public_paper(self, paper_data: dict[str, Any]) -> dict[str, Any]:
        """
        构建公开试卷数据.

        用途:
            深拷贝试卷结构并删除标准答案相关字段.
        参数:
            paper_data: 原始试卷 JSON.
        返回值:
            dict[str, Any]: 对外公开试卷 JSON.
        异常:
            无.
        """
        public_paper: dict[str, Any] = {
            "paper_title": paper_data.get("paper_title"),
            "position": paper_data.get("position"),
            "total_score": paper_data.get("total_score"),
            "duration_minutes": paper_data.get("duration_minutes"),
            "warning_messages": list(paper_data.get("warning_messages", [])),
            "sections": [],
        }
        for section in list(paper_data.get("sections", [])):
            public_section = {
                "section_type": section.get("section_type"),
                "section_title": section.get("section_title"),
                "question_count": section.get("question_count"),
                "score_per_question": section.get("score_per_question"),
                "questions": [],
            }
            for question in list(section.get("questions", [])):
                public_section["questions"].append(
                    {
                        "question_no": question.get("question_no"),
                        "question_type": question.get("question_type"),
                        "stem": question.get("stem"),
                        "score": question.get("score"),
                        "options": list(question.get("options", [])),
                    }
                )
            public_paper["sections"].append(public_section)
        return public_paper


class ExamSubmissionGrader:
    """
    考试答卷自动评分器.

    用途:
        对客观题进行自动评分, 并标记是否存在主观题需要人工复核.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    def grade(
        self,
        paper_data: dict[str, Any],
        submission_record: ExamSubmissionRecord,
    ) -> ExamSubmissionRecord:
        """
        计算答卷自动得分.

        用途:
            根据题号对齐试卷标准答案与考生答案, 完成客观题评分.
        参数:
            paper_data: 原始试卷 JSON.
            submission_record: 待评分答卷实体.
        返回值:
            ExamSubmissionRecord: 已写入得分和复核标记的答卷实体.
        异常:
            无.
        """
        answer_lookup = self._build_submission_lookup(submission_record=submission_record)
        total_score = 0
        score = 0
        requires_manual_review = False
        for question in self._iterate_questions(paper_data=paper_data):
            total_score += int(question.get("score", 0) or 0)
            question_type = str(question.get("question_type", "")).strip()
            question_no = int(question.get("question_no", 0) or 0)
            submission_answer = answer_lookup.get(question_no)
            if question_type == "short_answer":
                requires_manual_review = True
                continue
            if submission_answer is None:
                continue
            standard_answer = self._normalize_values(values=question.get("answer", []))
            selected_values = self._normalize_values(values=submission_answer.values)
            if standard_answer == selected_values:
                score += int(question.get("score", 0) or 0)
        submission_record.score = score
        submission_record.total_score = total_score
        submission_record.requires_manual_review = requires_manual_review
        return submission_record

    def _build_submission_lookup(
        self,
        submission_record: ExamSubmissionRecord,
    ) -> dict[int, ExamSubmissionAnswer]:
        """
        构建题号到作答明细的索引.

        用途:
            提升评分时按题号查找考生答案的效率.
        参数:
            submission_record: 待评分答卷实体.
        返回值:
            dict[int, ExamSubmissionAnswer]: 题号索引字典.
        异常:
            无.
        """
        return {answer.question_no: answer for answer in submission_record.answers}

    def _iterate_questions(self, paper_data: dict[str, Any]) -> list[dict[str, Any]]:
        """
        展平试卷中的所有题目.

        用途:
            将 section 层级拍平为统一题目列表供评分使用.
        参数:
            paper_data: 原始试卷 JSON.
        返回值:
            list[dict[str, Any]]: 题目列表.
        异常:
            无.
        """
        questions: list[dict[str, Any]] = []
        for section in list(paper_data.get("sections", [])):
            for question in list(section.get("questions", [])):
                questions.append(question)
        return questions

    def _normalize_values(self, values: Any) -> list[str]:
        """
        规范化选项值列表.

        用途:
            去除空值并按字母序排序, 便于多选题集合比较.
        参数:
            values: 任意原始值列表.
        返回值:
            list[str]: 规范化后的选项值列表.
        异常:
            无.
        """
        normalized = [str(value).strip() for value in list(values or []) if str(value).strip()]
        return sorted(normalized)

    def normalize_values_for_detail(self, values: Any) -> list[str]:
        """
        对外暴露答卷详情所需的标准答案规范化能力.

        用途:
            复用内部选项规范化逻辑, 供后台答卷详情生成逐题评分明细.
        参数:
            values: 任意原始值列表.
        返回值:
            list[str]: 规范化后的选项值列表.
        异常:
            无.
        """
        return self._normalize_values(values=values)


class PublishSharedExamUseCase(UseCase[PublishSharedExamInput, PublishSharedExamOutput]):
    """
    发布分享考试用例.

    用途:
        将 Word 试卷解析为结构化考试, 保存到仓储并返回可分享链接.
    参数:
        parse_use_case: Word 解析用例.
        repository: 考试分享仓储.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(
        self,
        parse_use_case: WordExamParseUseCase | None = None,
        repository: ExamShareFileRepository | None = None,
    ) -> None:
        """
        初始化发布分享考试用例.

        用途:
            支持外部注入解析用例和仓储, 便于测试和替换实现.
        参数:
            parse_use_case: 可选 Word 解析用例.
            repository: 可选考试分享仓储.
        返回值:
            None.
        异常:
            无.
        """
        self._parse_use_case = parse_use_case or WordExamParseUseCase()
        self._repository = repository or ExamShareFileRepository()

    async def execute(self, input_data: PublishSharedExamInput) -> PublishSharedExamOutput:
        """
        执行发布分享考试流程.

        用途:
            解析 Word 试卷, 生成分享令牌并持久化考试数据.
        参数:
            input_data: 发布分享考试输入对象.
        返回值:
            PublishSharedExamOutput: 发布结果对象.
        异常:
            ValidationError: 当输入参数不合法时抛出.
        """
        self._validate_publish_input(input_data=input_data)
        parsed_output = await self._parse_use_case.execute(
            WordExamParseInput(file_path=input_data.file_path)
        )
        exam_id = f"exam_{uuid4().hex}"
        share_token = f"share_{uuid4().hex}"
        share_path = f"/exam/{share_token}"
        share_url = self._build_share_url(share_base_url=input_data.share_base_url, share_path=share_path)
        current_time = datetime.now().isoformat()
        exam_data = {
            "exam_id": exam_id,
            "share_token": share_token,
            "share_path": share_path,
            "share_url": share_url,
            "paper": parsed_output.paper_data,
            "question_count": self._count_questions(parsed_output.paper_data),
            "warning_messages": parsed_output.warning_messages,
            "created_at": current_time,
            "updated_at": current_time,
        }
        self._repository.save_published_exam(exam_data=exam_data)
        logger.info(
            "[考试分享发布] 发布成功 | "
            f"exam_id={exam_id} | share_token={share_token} | question_count={exam_data['question_count']}"
        )
        return PublishSharedExamOutput(
            exam_id=exam_id,
            share_token=share_token,
            share_path=share_path,
            share_url=share_url,
            paper=parsed_output.paper_data,
            question_count=int(exam_data["question_count"]),
            warning_messages=parsed_output.warning_messages,
        )

    def _validate_publish_input(self, input_data: PublishSharedExamInput) -> None:
        """
        校验发布输入.

        用途:
            拦截空文件路径等无效发布请求.
        参数:
            input_data: 发布分享考试输入对象.
        返回值:
            None.
        异常:
            ValidationError: 当文件路径为空时抛出.
        """
        if not str(input_data.file_path or "").strip():
            raise ValidationError(message="Word 文件路径不能为空")

    def _build_share_url(self, share_base_url: str | None, share_path: str) -> str:
        """
        构建完整分享链接.

        用途:
            优先使用显式传入的 share_base_url, 未提供时回退为相对路径.
        参数:
            share_base_url: 外部传入的分享域名.
            share_path: 分享路径.
        返回值:
            str: 完整分享链接或相对路径.
        异常:
            无.
        """
        if not str(share_base_url or "").strip():
            return share_path
        return f"{str(share_base_url).rstrip('/')}{share_path}"

    def _count_questions(self, paper_data: dict[str, Any]) -> int:
        """
        统计试卷总题数.

        用途:
            遍历分组并累加题目数量.
        参数:
            paper_data: 结构化试卷 JSON.
        返回值:
            int: 总题数.
        异常:
            无.
        """
        count = 0
        for section in list(paper_data.get("sections", [])):
            count += len(list(section.get("questions", [])))
        return count


class GetSharedExamUseCase(UseCase[GetSharedExamInput, GetSharedExamOutput]):
    """
    获取公开试卷用例.

    用途:
        根据分享令牌返回脱敏后的公开作答试卷数据.
    参数:
        repository: 考试分享仓储.
        sanitizer: 公开试卷脱敏器.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(
        self,
        repository: ExamShareFileRepository | None = None,
        sanitizer: ExamPaperSanitizer | None = None,
    ) -> None:
        """
        初始化获取公开试卷用例.

        用途:
            支持外部注入仓储和脱敏器, 便于测试与替换实现.
        参数:
            repository: 可选考试分享仓储.
            sanitizer: 可选公开试卷脱敏器.
        返回值:
            None.
        异常:
            无.
        """
        self._repository = repository or ExamShareFileRepository()
        self._sanitizer = sanitizer or ExamPaperSanitizer()

    async def execute(self, input_data: GetSharedExamInput) -> GetSharedExamOutput:
        """
        获取公开试卷详情.

        用途:
            从仓储读取考试数据并返回脱敏后的公开试卷结构.
        参数:
            input_data: 获取公开试卷输入对象.
        返回值:
            GetSharedExamOutput: 公开试卷输出对象.
        异常:
            ValidationError: 当分享令牌为空时抛出.
        """
        self._validate_get_input(input_data=input_data)
        exam_data = self._repository.get_published_exam(share_token=input_data.share_token)
        public_paper = self._sanitizer.build_public_paper(
            paper_data=dict(exam_data.get("paper", {}))
        )
        return GetSharedExamOutput(
            exam_id=str(exam_data.get("exam_id", "")),
            share_token=str(exam_data.get("share_token", "")),
            paper=public_paper,
            question_count=int(exam_data.get("question_count", 0) or 0),
            section_count=len(list(public_paper.get("sections", []))),
            share_url=str(exam_data.get("share_url", "")),
        )

    def _validate_get_input(self, input_data: GetSharedExamInput) -> None:
        """
        校验公开试卷查询输入.

        用途:
            拦截空分享令牌请求.
        参数:
            input_data: 获取公开试卷输入对象.
        返回值:
            None.
        异常:
            ValidationError: 当分享令牌为空时抛出.
        """
        if not str(input_data.share_token or "").strip():
            raise ValidationError(message="分享令牌不能为空")


class SubmitSharedExamUseCase(UseCase[SubmitSharedExamInput, SubmitSharedExamOutput]):
    """
    提交答卷用例.

    用途:
        接收考生答案, 自动评分, 保存答卷并按配置同步到 AI 表格.
    参数:
        repository: 考试分享仓储.
        grader: 自动评分器.
        sync_service: AI 表格同步服务.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(
        self,
        repository: ExamShareFileRepository | None = None,
        grader: ExamSubmissionGrader | None = None,
        sync_service: DingTalkAiTableSyncService | None = None,
    ) -> None:
        """
        初始化提交答卷用例.

        用途:
            支持注入仓储, 评分器和同步服务.
        参数:
            repository: 可选考试分享仓储.
            grader: 可选自动评分器.
            sync_service: 可选 AI 表格同步服务.
        返回值:
            None.
        异常:
            无.
        """
        self._repository = repository or ExamShareFileRepository()
        self._grader = grader or ExamSubmissionGrader()
        self._sync_service = sync_service or DingTalkAiTableSyncService()

    async def execute(self, input_data: SubmitSharedExamInput) -> SubmitSharedExamOutput:
        """
        提交答卷并自动评分.

        用途:
            校验输入, 读取考试, 自动评分, 保存答卷并尝试同步到 AI 表格.
        参数:
            input_data: 提交答卷输入对象.
        返回值:
            SubmitSharedExamOutput: 提交结果对象.
        异常:
            ValidationError: 当提交参数不满足要求时抛出.
        """
        self._validate_submit_input(input_data=input_data)
        exam_data = self._repository.get_published_exam(share_token=input_data.share_token)
        submission_record = self._build_submission_record(
            exam_id=str(exam_data.get("exam_id", "")),
            candidate_name=input_data.candidate_name,
            candidate_department=input_data.candidate_department,
            answers=input_data.answers,
        )
        graded_record = self._grader.grade(
            paper_data=dict(exam_data.get("paper", {})),
            submission_record=submission_record,
        )
        submission_dict = self._serialize_submission_record(submission_record=graded_record)
        sync_result = await self._sync_service.sync_submission(
            exam_data=exam_data,
            submission_data=submission_dict,
        )
        submission_dict["sync_status"] = str(sync_result.get("status", "pending"))
        submission_dict["sync_result"] = dict(sync_result)
        self._repository.save_submission(submission_data=submission_dict)
        logger.info(
            "[考试答卷提交] 提交成功 | "
            f"exam_id={graded_record.exam_id} | "
            f"submission_id={graded_record.submission_id} | "
            f"score={graded_record.score}"
        )
        return SubmitSharedExamOutput(
            submission_id=graded_record.submission_id,
            exam_id=graded_record.exam_id,
            score=graded_record.score,
            total_score=graded_record.total_score,
            requires_manual_review=graded_record.requires_manual_review,
            sync_result=sync_result,
        )

    def _validate_submit_input(self, input_data: SubmitSharedExamInput) -> None:
        """
        校验提交答卷输入.

        用途:
            拦截空分享令牌, 空姓名和空答案列表.
        参数:
            input_data: 提交答卷输入对象.
        返回值:
            None.
        异常:
            ValidationError: 当关键输入缺失时抛出.
        """
        if not str(input_data.share_token or "").strip():
            raise ValidationError(message="分享令牌不能为空")
        if not str(input_data.candidate_name or "").strip():
            raise ValidationError(message="作答人姓名不能为空")
        if not str(input_data.candidate_department or "").strip():
            raise ValidationError(message="作答人部门不能为空")
        if not list(input_data.answers or []):
            raise ValidationError(message="答卷不能为空")

    def _build_submission_record(
        self,
        exam_id: str,
        candidate_name: str,
        candidate_department: str,
        answers: list[dict[str, object]],
    ) -> ExamSubmissionRecord:
        """
        构建答卷实体.

        用途:
            将路由传入的答案字典转换为领域答卷实体.
        参数:
            exam_id: 考试 ID.
            candidate_name: 作答人姓名.
            candidate_department: 作答人部门.
            answers: 路由层答案字典列表.
        返回值:
            ExamSubmissionRecord: 答卷实体.
        异常:
            ValidationError: 当答案题号非法时抛出.
        """
        submission_answers: list[ExamSubmissionAnswer] = []
        for answer in answers:
            question_no = int(answer.get("question_no", 0) or 0)
            if question_no <= 0:
                raise ValidationError(message="答案题号不合法")
            submission_answers.append(
                ExamSubmissionAnswer(
                    question_no=question_no,
                    values=[str(value).strip() for value in list(answer.get("values", [])) if str(value).strip()],
                    text_answer=self._normalize_optional_text(value=answer.get("text_answer")),
                )
            )
        return ExamSubmissionRecord(
            submission_id=f"submission_{uuid4().hex}",
            exam_id=exam_id,
            candidate_name=str(candidate_name).strip(),
            candidate_department=str(candidate_department).strip(),
            answers=submission_answers,
            submitted_at=datetime.now().isoformat(),
        )

    def _serialize_submission_record(
        self,
        submission_record: ExamSubmissionRecord,
    ) -> dict[str, object]:
        """
        序列化答卷实体.

        用途:
            将领域答卷实体转换为 JSON 可存储字典.
        参数:
            submission_record: 答卷实体.
        返回值:
            dict[str, object]: 可落盘答卷字典.
        异常:
            无.
        """
        serialized_answers = [
            {
                "question_no": answer.question_no,
                "values": list(answer.values),
                "text_answer": answer.text_answer,
            }
            for answer in submission_record.answers
        ]
        return {
            "submission_id": submission_record.submission_id,
            "exam_id": submission_record.exam_id,
            "candidate_name": submission_record.candidate_name,
            "candidate_department": submission_record.candidate_department,
            "answers": serialized_answers,
            "score": submission_record.score,
            "total_score": submission_record.total_score,
            "requires_manual_review": submission_record.requires_manual_review,
            "sync_status": submission_record.sync_status,
            "sync_result": {},
            "submitted_at": submission_record.submitted_at,
        }

    def _normalize_optional_text(self, value: object) -> str | None:
        """
        规范化可选文本字段.

        用途:
            兼容 None 值, 避免被错误序列化为字符串 None.
        参数:
            value: 任意原始文本值.
        返回值:
            str | None: 清洗后的文本结果.
        异常:
            无.
        """
        if value is None:
            return None
        normalized_text = str(value).strip()
        if not normalized_text or normalized_text.lower() == "none":
            return None
        return normalized_text


class ListPublishedExamsUseCase(UseCase[None, ListPublishedExamsOutput]):
    """
    列出已发布考试用例.

    用途:
        为后台管理页面提供发布记录列表, 并汇总每场考试的答卷统计信息.
    参数:
        repository: 考试分享仓储.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(self, repository: ExamShareFileRepository | None = None) -> None:
        """
        初始化列出已发布考试用例.

        用途:
            支持注入考试分享仓储, 便于测试和实现替换.
        参数:
            repository: 可选考试分享仓储.
        返回值:
            None.
        异常:
            无.
        """
        self._repository = repository or ExamShareFileRepository()

    async def execute(self, input_data: None = None) -> ListPublishedExamsOutput:
        """
        获取已发布考试列表.

        用途:
            读取所有已发布考试, 汇总答卷数量和最近提交时间并返回给后台页面.
        参数:
            input_data: 预留输入参数, 当前未使用.
        返回值:
            ListPublishedExamsOutput: 已发布考试列表输出对象.
        异常:
            无.
        """
        _ = input_data
        published_exams = self._repository.list_published_exams()
        items: list[ListPublishedExamItem] = []
        for exam_data in published_exams:
            exam_id = str(exam_data.get("exam_id", "")).strip()
            paper_data = dict(exam_data.get("paper", {}) or {})
            submissions = self._repository.list_submissions_by_exam(exam_id=exam_id)
            latest_submission_at = self._build_latest_submission_at(submissions=submissions)
            items.append(
                ListPublishedExamItem(
                    exam_id=exam_id,
                    share_token=str(exam_data.get("share_token", "")),
                    share_url=str(exam_data.get("share_url", "")),
                    paper_title=str(paper_data.get("paper_title", "")).strip(),
                    position=str(paper_data.get("position", "")).strip() or None,
                    question_count=int(exam_data.get("question_count", 0) or 0),
                    submission_count=len(submissions),
                    latest_submission_at=latest_submission_at,
                    created_at=str(exam_data.get("created_at", "")),
                    updated_at=str(exam_data.get("updated_at", "")),
                )
            )
        return ListPublishedExamsOutput(items=items, total=len(items))

    def _build_latest_submission_at(self, submissions: list[dict[str, Any]]) -> str | None:
        """
        计算最近提交时间.

        用途:
            从某场考试的答卷列表中提取最近一次提交时间, 供后台页面展示.
        参数:
            submissions: 某场考试的答卷字典列表.
        返回值:
            str | None: 最近一次提交时间, 若无答卷则返回 None.
        异常:
            无.
        """
        submitted_times = [
            str(item.get("submitted_at", "")).strip()
            for item in submissions
            if str(item.get("submitted_at", "")).strip()
        ]
        if not submitted_times:
            return None
        submitted_times.sort(reverse=True)
        return submitted_times[0]


class GetPublishedExamDetailUseCase(
    UseCase[GetPublishedExamDetailInput, GetPublishedExamDetailOutput]
):
    """
    获取已发布考试详情用例.

    用途:
        为后台详情页返回考试基本信息, 分享信息和答卷列表.
    参数:
        repository: 考试分享仓储.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(self, repository: ExamShareFileRepository | None = None) -> None:
        """
        初始化已发布考试详情用例.

        用途:
            支持注入考试分享仓储, 便于测试和实现替换.
        参数:
            repository: 可选考试分享仓储.
        返回值:
            None.
        异常:
            无.
        """
        self._repository = repository or ExamShareFileRepository()

    async def execute(
        self,
        input_data: GetPublishedExamDetailInput,
    ) -> GetPublishedExamDetailOutput:
        """
        获取已发布考试详情.

        用途:
            根据分享令牌读取考试和答卷数据, 并组装后台详情页展示结果.
        参数:
            input_data: 已发布考试详情输入对象.
        返回值:
            GetPublishedExamDetailOutput: 已发布考试详情输出对象.
        异常:
            ValidationError: 当分享令牌为空时抛出.
        """
        self._validate_input(input_data=input_data)
        exam_data = self._repository.get_published_exam(share_token=input_data.share_token)
        exam_id = str(exam_data.get("exam_id", "")).strip()
        paper_data = dict(exam_data.get("paper", {}) or {})
        submissions = self._repository.list_submissions_by_exam(exam_id=exam_id)
        submission_items = [
            PublishedExamSubmissionItem(
                submission_id=str(item.get("submission_id", "")),
                candidate_name=str(item.get("candidate_name", "")),
                candidate_department=str(item.get("candidate_department", "")),
                score=int(item.get("score", 0) or 0),
                total_score=int(item.get("total_score", 0) or 0),
                requires_manual_review=bool(item.get("requires_manual_review", False)),
                sync_status=str(item.get("sync_status", "pending")),
                submitted_at=str(item.get("submitted_at", "")),
            )
            for item in submissions
        ]
        submission_items.sort(key=lambda item: item.submitted_at, reverse=True)
        return GetPublishedExamDetailOutput(
            exam_id=exam_id,
            share_token=str(exam_data.get("share_token", "")),
            share_url=str(exam_data.get("share_url", "")),
            share_path=str(exam_data.get("share_path", "")),
            paper_title=str(paper_data.get("paper_title", "")).strip(),
            position=str(paper_data.get("position", "")).strip() or None,
            question_count=int(exam_data.get("question_count", 0) or 0),
            total_score=int(paper_data.get("total_score", 0) or 0)
            if paper_data.get("total_score") is not None
            else None,
            duration_minutes=int(paper_data.get("duration_minutes", 0) or 0)
            if paper_data.get("duration_minutes") is not None
            else None,
            warning_messages=list(exam_data.get("warning_messages", [])),
            created_at=str(exam_data.get("created_at", "")),
            updated_at=str(exam_data.get("updated_at", "")),
            submission_count=len(submission_items),
            submissions=submission_items,
        )

    def _validate_input(self, input_data: GetPublishedExamDetailInput) -> None:
        """
        校验已发布考试详情输入.

        用途:
            拦截空分享令牌请求.
        参数:
            input_data: 已发布考试详情输入对象.
        返回值:
            None.
        异常:
            ValidationError: 当分享令牌为空时抛出.
        """
        if not str(input_data.share_token or "").strip():
            raise ValidationError(message="分享令牌不能为空")


class GetPublishedSubmissionDetailUseCase(
    UseCase[GetPublishedSubmissionDetailInput, GetPublishedSubmissionDetailOutput]
):
    """
    获取已发布答卷详情用例.

    用途:
        为后台答卷详情页返回考生答案, 自动评分明细和 AI 表格同步结果详情.
    参数:
        repository: 考试分享仓储.
        grader: 自动评分器, 用于复用标准答案规范化逻辑.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(
        self,
        repository: ExamShareFileRepository | None = None,
        grader: ExamSubmissionGrader | None = None,
    ) -> None:
        """
        初始化已发布答卷详情用例.

        用途:
            支持注入仓储和评分器, 便于测试与实现替换.
        参数:
            repository: 可选考试分享仓储.
            grader: 可选自动评分器.
        返回值:
            None.
        异常:
            无.
        """
        self._repository = repository or ExamShareFileRepository()
        self._grader = grader or ExamSubmissionGrader()

    async def execute(
        self,
        input_data: GetPublishedSubmissionDetailInput,
    ) -> GetPublishedSubmissionDetailOutput:
        """
        获取已发布答卷详情.

        用途:
            根据分享令牌和答卷 ID 读取考试与答卷数据, 输出逐题评分明细和同步详情.
        参数:
            input_data: 已发布答卷详情输入对象.
        返回值:
            GetPublishedSubmissionDetailOutput: 已发布答卷详情输出对象.
        异常:
            ValidationError: 当分享令牌或答卷 ID 为空时抛出.
            ValidationError: 当答卷不属于当前考试时抛出.
        """
        self._validate_input(input_data=input_data)
        exam_data = self._repository.get_published_exam(share_token=input_data.share_token)
        submission_data = self._repository.get_submission(submission_id=input_data.submission_id)
        exam_id = str(exam_data.get("exam_id", "")).strip()
        if str(submission_data.get("exam_id", "")).strip() != exam_id:
            raise ValidationError(message="答卷与当前考试不匹配")
        paper_data = dict(exam_data.get("paper", {}) or {})
        question_details = self._build_question_details(
            paper_data=paper_data,
            submission_data=submission_data,
        )
        return GetPublishedSubmissionDetailOutput(
            exam_id=exam_id,
            submission_id=str(submission_data.get("submission_id", "")),
            share_token=str(exam_data.get("share_token", "")),
            paper_title=str(paper_data.get("paper_title", "")).strip(),
            candidate_name=str(submission_data.get("candidate_name", "")),
            candidate_department=str(submission_data.get("candidate_department", "")),
            score=int(submission_data.get("score", 0) or 0),
            total_score=int(submission_data.get("total_score", 0) or 0),
            requires_manual_review=bool(submission_data.get("requires_manual_review", False)),
            sync_status=str(submission_data.get("sync_status", "pending")),
            sync_result=dict(submission_data.get("sync_result", {}) or {}),
            submitted_at=str(submission_data.get("submitted_at", "")),
            question_details=question_details,
        )

    def _validate_input(self, input_data: GetPublishedSubmissionDetailInput) -> None:
        """
        校验已发布答卷详情输入.

        用途:
            拦截空分享令牌和空答卷 ID 请求.
        参数:
            input_data: 已发布答卷详情输入对象.
        返回值:
            None.
        异常:
            ValidationError: 当关键输入为空时抛出.
        """
        if not str(input_data.share_token or "").strip():
            raise ValidationError(message="分享令牌不能为空")
        if not str(input_data.submission_id or "").strip():
            raise ValidationError(message="答卷 ID 不能为空")

    def _build_question_details(
        self,
        paper_data: dict[str, Any],
        submission_data: dict[str, Any],
    ) -> list[PublishedSubmissionQuestionDetailItem]:
        """
        构建逐题评分明细.

        用途:
            结合试卷标准答案与考生答卷, 为后台详情页生成可展示的评分结果.
        参数:
            paper_data: 原始试卷 JSON.
            submission_data: 已保存答卷 JSON.
        返回值:
            list[PublishedSubmissionQuestionDetailItem]: 逐题评分明细列表.
        异常:
            无.
        """
        answer_lookup = self._build_submission_lookup(submission_data=submission_data)
        details: list[PublishedSubmissionQuestionDetailItem] = []
        for section in list(paper_data.get("sections", [])):
            section_title = str(section.get("section_title", "")).strip()
            for question in list(section.get("questions", [])):
                question_no = int(question.get("question_no", 0) or 0)
                question_type = str(question.get("question_type", "")).strip()
                max_score = int(question.get("score", 0) or 0)
                submission_answer = dict(answer_lookup.get(question_no, {}))
                candidate_values = self._grader.normalize_values_for_detail(
                    values=submission_answer.get("values", [])
                )
                candidate_text = self._normalize_text_answer(
                    value=submission_answer.get("text_answer")
                )
                standard_answer = self._grader.normalize_values_for_detail(
                    values=question.get("answer", [])
                )
                reference_answer = self._normalize_text_answer(
                    value=question.get("reference_answer")
                )
                details.append(
                    PublishedSubmissionQuestionDetailItem(
                        question_no=question_no,
                        question_type=question_type,
                        section_title=section_title,
                        stem=str(question.get("stem", "")),
                        max_score=max_score,
                        awarded_score=self._build_awarded_score(
                            question_type=question_type,
                            standard_answer=standard_answer,
                            candidate_values=candidate_values,
                            max_score=max_score,
                        ),
                        is_correct=self._build_is_correct(
                            question_type=question_type,
                            standard_answer=standard_answer,
                            candidate_values=candidate_values,
                        ),
                        requires_manual_review=question_type == "short_answer",
                        standard_answer=standard_answer,
                        reference_answer=reference_answer,
                        candidate_values=candidate_values,
                        candidate_text=candidate_text,
                        evaluation_status=self._build_evaluation_status(
                            question_type=question_type,
                            standard_answer=standard_answer,
                            candidate_values=candidate_values,
                            candidate_text=candidate_text,
                        ),
                    )
                )
        return details

    def _build_submission_lookup(
        self,
        submission_data: dict[str, Any],
    ) -> dict[int, dict[str, Any]]:
        """
        构建题号到答题内容的索引.

        用途:
            提升答卷详情生成时按题号获取考生作答的效率.
        参数:
            submission_data: 已保存答卷 JSON.
        返回值:
            dict[int, dict[str, Any]]: 题号到答题内容的映射.
        异常:
            无.
        """
        lookup: dict[int, dict[str, Any]] = {}
        for answer in list(submission_data.get("answers", [])):
            question_no = int(dict(answer).get("question_no", 0) or 0)
            if question_no > 0:
                lookup[question_no] = dict(answer)
        return lookup

    def _normalize_text_answer(self, value: Any) -> str | None:
        """
        规范化主观题文本答案.

        用途:
            兼容历史数据中被错误写成字符串 None 的空值.
        参数:
            value: 原始主观题文本.
        返回值:
            str | None: 清洗后的文本答案.
        异常:
            无.
        """
        text = str(value).strip() if value is not None else ""
        if not text or text.lower() == "none":
            return None
        return text

    def _build_awarded_score(
        self,
        question_type: str,
        standard_answer: list[str],
        candidate_values: list[str],
        max_score: int,
    ) -> int | None:
        """
        计算单题自动得分.

        用途:
            对客观题返回自动得分, 对主观题返回 None 表示待人工复核.
        参数:
            question_type: 题型.
            standard_answer: 标准答案列表.
            candidate_values: 考生客观题作答列表.
            max_score: 本题满分.
        返回值:
            int | None: 单题自动得分或 None.
        异常:
            无.
        """
        if question_type == "short_answer":
            return None
        if standard_answer and standard_answer == candidate_values:
            return max_score
        return 0

    def _build_is_correct(
        self,
        question_type: str,
        standard_answer: list[str],
        candidate_values: list[str],
    ) -> bool | None:
        """
        计算单题是否判定正确.

        用途:
            对客观题返回是否正确, 对主观题返回 None.
        参数:
            question_type: 题型.
            standard_answer: 标准答案列表.
            candidate_values: 考生客观题作答列表.
        返回值:
            bool | None: 正误结果或 None.
        异常:
            无.
        """
        if question_type == "short_answer":
            return None
        return bool(standard_answer) and standard_answer == candidate_values

    def _build_evaluation_status(
        self,
        question_type: str,
        standard_answer: list[str],
        candidate_values: list[str],
        candidate_text: str | None,
    ) -> str:
        """
        构建单题评分状态.

        用途:
            为前端页面输出统一的状态值, 便于渲染正确, 错误和待复核标签.
        参数:
            question_type: 题型.
            standard_answer: 标准答案列表.
            candidate_values: 考生客观题作答列表.
            candidate_text: 主观题文本答案.
        返回值:
            str: 评分状态字符串.
        异常:
            无.
        """
        if question_type == "short_answer":
            return "manual_review" if candidate_text else "unanswered"
        if not candidate_values:
            return "unanswered"
        return "correct" if standard_answer == candidate_values else "incorrect"


__all__ = [
    "ExamPaperSanitizer",
    "ExamSubmissionGrader",
    "GetPublishedExamDetailInput",
    "GetPublishedExamDetailOutput",
    "GetPublishedExamDetailUseCase",
    "GetPublishedSubmissionDetailInput",
    "GetPublishedSubmissionDetailOutput",
    "GetPublishedSubmissionDetailUseCase",
    "GetSharedExamInput",
    "GetSharedExamOutput",
    "GetSharedExamUseCase",
    "PublishSharedExamInput",
    "PublishSharedExamOutput",
    "PublishSharedExamUseCase",
    "PublishedSubmissionQuestionDetailItem",
    "PublishedExamSubmissionItem",
    "ListPublishedExamItem",
    "ListPublishedExamsOutput",
    "ListPublishedExamsUseCase",
    "SubmitSharedExamInput",
    "SubmitSharedExamOutput",
    "SubmitSharedExamUseCase",
]
