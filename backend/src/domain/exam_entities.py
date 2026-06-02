#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: exam_entities.py
# 作者: wuhao
# 日期: 2026_06_02_17:27:19
# 描述: 考试试卷领域实体定义, 用于承载 Word 解析后的结构化题库数据

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum


class ExamQuestionType(StrEnum):
    """
    考试题型枚举.

    用途:
        统一描述单选题, 多选题, 判断题和简答题的类型标识.
    参数:
        无.
    返回值:
        无.
    异常:
        无.
    """

    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    JUDGE = "judge"
    SHORT_ANSWER = "short_answer"


@dataclass(slots=True)
class ExamQuestionOption:
    """
    题目选项实体.

    用途:
        描述选择题或判断题中的单个可选项.
    参数:
        key: 选项唯一标识, 如 A 或 true.
        text: 选项展示文本.
    返回值:
        None.
    异常:
        无.
    """

    key: str
    text: str


@dataclass(slots=True)
class ExamQuestion:
    """
    试卷题目实体.

    用途:
        承载单道题目的题干, 选项, 标准答案和分值信息.
    参数:
        question_no: 题号.
        question_type: 题型.
        stem: 题干.
        score: 该题分值.
        options: 可选项列表.
        answer: 客观题标准答案列表.
        reference_answer: 主观题参考答案.
    返回值:
        None.
    异常:
        无.
    """

    question_no: int
    question_type: ExamQuestionType
    stem: str
    score: int
    options: list[ExamQuestionOption] = field(default_factory=list)
    answer: list[str] = field(default_factory=list)
    reference_answer: str | None = None


@dataclass(slots=True)
class ExamSection:
    """
    试卷分组实体.

    用途:
        承载单选, 多选, 判断, 简答等题型分组及其题目列表.
    参数:
        section_type: 分组题型.
        section_title: 分组标题.
        question_count: 题目数量.
        score_per_question: 每题分值.
        questions: 当前分组下的题目集合.
    返回值:
        None.
    异常:
        无.
    """

    section_type: ExamQuestionType
    section_title: str
    question_count: int
    score_per_question: int
    questions: list[ExamQuestion] = field(default_factory=list)


@dataclass(slots=True)
class ExamPaper:
    """
    试卷实体.

    用途:
        承载整份 Word 试卷的基础信息, 题型分组和解析告警.
    参数:
        paper_title: 试卷标题.
        position: 适用岗位.
        total_score: 总分.
        duration_minutes: 考试时长, 单位分钟.
        sections: 题型分组列表.
        warning_messages: 解析过程中产生的告警消息.
    返回值:
        None.
    异常:
        无.
    """

    paper_title: str
    position: str | None
    total_score: int | None
    duration_minutes: int | None
    sections: list[ExamSection] = field(default_factory=list)
    warning_messages: list[str] = field(default_factory=list)


@dataclass(slots=True)
class ExamPublishedPaper:
    """
    已发布考试实体.

    用途:
        承载可分享考试的唯一标识, 分享令牌, 结构化试卷数据与分享链接信息.
    参数:
        exam_id: 考试唯一 ID.
        share_token: 公开作答分享令牌.
        share_path: 前端分享路径.
        share_url: 完整分享链接.
        paper_data: 结构化试卷 JSON 数据.
        question_count: 总题数.
        warning_messages: 解析告警列表.
        created_at: 创建时间.
        updated_at: 更新时间.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str
    share_token: str
    share_path: str
    share_url: str
    paper_data: dict[str, object]
    question_count: int
    warning_messages: list[str] = field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""


@dataclass(slots=True)
class ExamSubmissionAnswer:
    """
    答卷单题作答实体.

    用途:
        描述考生对某一道题的答案内容, 兼容客观题和主观题.
    参数:
        question_no: 题号.
        values: 客观题作答选项列表.
        text_answer: 主观题文本答案.
    返回值:
        None.
    异常:
        无.
    """

    question_no: int
    values: list[str] = field(default_factory=list)
    text_answer: str | None = None


@dataclass(slots=True)
class ExamSubmissionRecord:
    """
    考试答卷实体.

    用途:
        承载考生身份信息, 作答答案, 自动判分结果和同步状态.
    参数:
        submission_id: 答卷唯一 ID.
        exam_id: 所属考试 ID.
        candidate_name: 作答人姓名.
        candidate_department: 作答人部门.
        answers: 作答明细列表.
        score: 当前自动评分结果.
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
    exam_id: str
    candidate_name: str
    candidate_department: str
    answers: list[ExamSubmissionAnswer] = field(default_factory=list)
    score: int = 0
    total_score: int = 0
    requires_manual_review: bool = False
    sync_status: str = "pending"
    submitted_at: str = ""


__all__ = [
    "ExamPaper",
    "ExamPublishedPaper",
    "ExamQuestion",
    "ExamQuestionOption",
    "ExamQuestionType",
    "ExamSection",
    "ExamSubmissionAnswer",
    "ExamSubmissionRecord",
]
