#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: yida_exam_field_mapper.py
# 作者: wuhao
# 日期: 2026_06_02_17:27:19
# 描述: 宜搭考试字段映射器, 负责将结构化试卷实体转换为宜搭字段映射数据

from __future__ import annotations

from domain.exam_entities import ExamPaper, ExamQuestion, ExamQuestionOption, ExamQuestionType


class YidaExamFieldMapper:
    """
    宜搭考试字段映射器.

    用途:
        将结构化试卷实体转换为适合后续生成宜搭表单字段的映射数据.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    def map_paper_to_fields(self, paper: ExamPaper) -> list[dict[str, object]]:
        """
        将整份试卷映射为宜搭字段列表.

        用途:
            为基本信息和所有题目生成稳定的宜搭字段映射结构.
        参数:
            paper: 结构化试卷实体.
        返回值:
            list[dict[str, object]]: 宜搭字段映射列表.
        异常:
            无.
        """
        fields: list[dict[str, object]] = []
        fields.extend(self._build_basic_info_fields())
        for section in paper.sections:
            fields.extend(self._build_section_fields(section.questions))
        return fields

    def _build_basic_info_fields(self) -> list[dict[str, object]]:
        """
        生成考试基本信息字段.

        用途:
            为姓名和部门等考试基础信息创建表单字段.
        参数:
            无.
        返回值:
            list[dict[str, object]]: 基础字段列表.
        异常:
            无.
        """
        return [
            {
                "type": "TextField",
                "label": "姓名",
                "field_key": "candidate_name",
                "required": True,
                "placeholder": "请输入姓名",
            },
            {
                "type": "TextField",
                "label": "部门",
                "field_key": "candidate_department",
                "required": True,
                "placeholder": "请输入部门",
            },
        ]

    def _build_section_fields(self, questions: list[ExamQuestion]) -> list[dict[str, object]]:
        """
        生成分组题目字段.

        用途:
            将题目列表依次转换为宜搭字段映射结构.
        参数:
            questions: 题目实体列表.
        返回值:
            list[dict[str, object]]: 题目字段映射列表.
        异常:
            无.
        """
        return [self._build_question_field(question) for question in questions]

    def _build_question_field(self, question: ExamQuestion) -> dict[str, object]:
        """
        生成单道题目的宜搭字段.

        用途:
            按题型为题目选择合适的宜搭组件映射.
        参数:
            question: 题目实体.
        返回值:
            dict[str, object]: 单题映射结果.
        异常:
            无.
        """
        if question.question_type is ExamQuestionType.SHORT_ANSWER:
            return self._build_short_answer_field(question)
        if question.question_type is ExamQuestionType.JUDGE:
            return self._build_choice_field(question, component_type="RadioField")
        if question.question_type is ExamQuestionType.SINGLE_CHOICE:
            return self._build_choice_field(question, component_type="RadioField")
        return self._build_choice_field(question, component_type="CheckboxField")

    def _build_short_answer_field(self, question: ExamQuestion) -> dict[str, object]:
        """
        生成简答题字段映射.

        用途:
            将简答题映射为宜搭多行文本组件.
        参数:
            question: 简答题实体.
        返回值:
            dict[str, object]: 简答题字段映射.
        异常:
            无.
        """
        return {
            "type": "TextareaField",
            "label": self._build_question_label(question),
            "field_key": f"question_{question.question_no}",
            "required": True,
            "question_type": question.question_type.value,
            "score": question.score,
            "placeholder": "请输入你的答案",
            "reference_answer": question.reference_answer,
        }

    def _build_choice_field(self, question: ExamQuestion, component_type: str) -> dict[str, object]:
        """
        生成选择题或判断题字段映射.

        用途:
            将客观题映射为带自定义数据源的宜搭选项组件.
        参数:
            question: 客观题实体.
            component_type: 目标宜搭组件类型.
        返回值:
            dict[str, object]: 客观题字段映射.
        异常:
            无.
        """
        options = [self._build_option_mapping(option) for option in question.options]
        return {
            "type": component_type,
            "label": self._build_question_label(question),
            "field_key": f"question_{question.question_no}",
            "required": True,
            "question_type": question.question_type.value,
            "score": question.score,
            "data_source": {
                "mode": "custom",
                "options": options,
            },
            "options": options,
            "answer": question.answer,
        }

    def _build_option_mapping(self, option: ExamQuestionOption) -> dict[str, str]:
        """
        生成单个选项映射.

        用途:
            为宜搭字段提供标准化选项对象.
        参数:
            option: 题目选项实体.
        返回值:
            dict[str, str]: 选项映射对象.
        异常:
            无.
        """
        return {
            "label": f"{option.key}. {option.text}",
            "value": option.key,
        }

    def _build_question_label(self, question: ExamQuestion) -> str:
        """
        生成题目展示标签.

        用途:
            为宜搭字段拼装题号和题干文本.
        参数:
            question: 题目实体.
        返回值:
            str: 字段展示名称.
        异常:
            无.
        """
        return f"{question.question_no}. {question.stem}"


__all__ = ["YidaExamFieldMapper"]
