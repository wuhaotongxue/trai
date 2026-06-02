#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: exam_parser_usecases.py
# 作者: wuhao
# 日期: 2026_06_02_18:25:48
# 描述: Word 试卷解析与宜搭表单创建用例, 负责输出结构化 JSON 和宜搭创建结果

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path

from loguru import logger

from application.common.base_usecase import UseCase
from core.exceptions import ValidationError
from domain.exam_entities import ExamPaper
from infrastructure.tools.yida_form_client import YidaCreateFormResult, YidaFormClient
from infrastructure.tools.word_exam_parser import WordExamParser
from infrastructure.tools.yida_exam_field_mapper import YidaExamFieldMapper
from infrastructure.tools.yida_form_schema_builder import YidaFormSchemaBuilder


@dataclass(slots=True)
class WordExamParseInput:
    """
    Word 试卷解析输入模型.

    用途:
        承载试卷文件路径, 供用例统一校验和解析.
    参数:
        file_path: 待解析 Word 文件路径.
    返回值:
        None.
    异常:
        无.
    """

    file_path: str


@dataclass(slots=True)
class WordExamParseOutput:
    """
    Word 试卷解析输出模型.

    用途:
        对外提供领域实体, 可序列化字典和解析告警列表.
    参数:
        paper: 解析后的试卷实体.
        paper_data: 试卷实体的字典表示.
        warning_messages: 解析告警列表.
    返回值:
        None.
    异常:
        无.
    """

    paper: ExamPaper
    paper_data: dict[str, object]
    warning_messages: list[str]


@dataclass(slots=True)
class WordExamParseAndMapInput:
    """
    Word 试卷解析并映射输入模型.

    用途:
        承载试卷路径和是否输出宜搭字段的配置.
    参数:
        file_path: 待解析 Word 文件路径.
        include_yida_fields: 是否返回宜搭字段映射结果.
    返回值:
        None.
    异常:
        无.
    """

    file_path: str
    include_yida_fields: bool = True


@dataclass(slots=True)
class WordExamParseAndMapOutput:
    """
    Word 试卷解析并映射输出模型.

    用途:
        同时返回结构化试卷和宜搭字段映射结果, 供 API 直接使用.
    参数:
        paper: 解析后的试卷实体.
        paper_data: 试卷实体字典表示.
        warning_messages: 解析告警列表.
        yida_fields: 宜搭字段映射列表.
        question_count: 题目总数.
    返回值:
        None.
    异常:
        无.
    """

    paper: ExamPaper
    paper_data: dict[str, object]
    warning_messages: list[str]
    yida_fields: list[dict[str, object]]
    question_count: int


@dataclass(slots=True)
class WordExamCreateYidaFormInput:
    """
    Word 试卷创建宜搭表单输入模型.

    用途:
        承载试卷路径, 宜搭应用 ID 和表单标题等创建参数.
    参数:
        file_path: 待解析 Word 文件路径.
        app_type: 宜搭应用 ID.
        form_title: 自定义表单标题, 为空时默认使用试卷标题.
        form_description: 自定义表单描述.
    返回值:
        None.
    异常:
        无.
    """

    file_path: str
    app_type: str
    form_title: str | None = None
    form_description: str | None = None


@dataclass(slots=True)
class WordExamCreateYidaFormOutput:
    """
    Word 试卷创建宜搭表单输出模型.

    用途:
        同时返回解析后的试卷数据, 宜搭字段映射, Schema 和创建结果.
    参数:
        paper: 解析后的试卷实体.
        paper_data: 试卷字典表示.
        warning_messages: 解析告警列表.
        yida_fields: 宜搭字段映射列表.
        yida_schema: 宜搭表单 Schema.
        question_count: 总题数.
        create_result: 宜搭创建结果.
    返回值:
        None.
    异常:
        无.
    """

    paper: ExamPaper
    paper_data: dict[str, object]
    warning_messages: list[str]
    yida_fields: list[dict[str, object]]
    yida_schema: dict[str, object]
    question_count: int
    create_result: YidaCreateFormResult


class WordExamParseUseCase(UseCase[WordExamParseInput, WordExamParseOutput]):
    """
    Word 试卷解析用例.

    用途:
        统一处理文件路径校验, 调用基础设施解析器, 并输出便于 API 使用的结构化数据.
    参数:
        parser: Word 试卷解析器实例.
    返回值:
        None.
    异常:
        无. 具体异常由 execute 方法抛出.
    """

    def __init__(self, parser: WordExamParser | None = None) -> None:
        """
        初始化 Word 试卷解析用例.

        用途:
            支持注入自定义解析器, 便于后续测试替身和实现替换.
        参数:
            parser: 可选的解析器实例.
        返回值:
            None.
        异常:
            无.
        """
        self._parser = parser or WordExamParser()

    async def execute(self, input_data: WordExamParseInput) -> WordExamParseOutput:
        """
        执行 Word 试卷解析.

        用途:
            校验输入路径并输出结构化 JSON 结果.
        参数:
            input_data: 解析输入对象.
        返回值:
            WordExamParseOutput: 解析结果对象.
        异常:
            ValidationError: 当输入路径为空时抛出.
        """
        self._validate_input(input_data=input_data)
        paper = self._parser.parse(file_path=input_data.file_path)
        logger.info(
            "[Word试卷解析] 解析完成 | "
            f"file_path={input_data.file_path} | "
            f"section_count={len(paper.sections)} | "
            f"warning_count={len(paper.warning_messages)}"
        )
        return WordExamParseOutput(
            paper=paper,
            paper_data=self._serialize_paper(paper=paper),
            warning_messages=[*paper.warning_messages],
        )

    def _validate_input(self, input_data: WordExamParseInput) -> None:
        """
        校验用例输入.

        用途:
            拦截空文件路径和非文件类型输入.
        参数:
            input_data: 解析输入对象.
        返回值:
            None.
        异常:
            ValidationError: 当输入不满足要求时抛出.
        """
        if not str(input_data.file_path or "").strip():
            raise ValidationError(message="Word 文件路径不能为空")
        candidate_path = Path(str(input_data.file_path).strip())
        if candidate_path.name in {".", ".."}:
            raise ValidationError(message="Word 文件路径不合法")

    def _serialize_paper(self, paper: ExamPaper) -> dict[str, object]:
        """
        序列化试卷实体.

        用途:
            将领域实体转换为适合接口返回或后续落库的字典结构.
        参数:
            paper: 解析后的试卷实体.
        返回值:
            dict[str, object]: 试卷字典数据.
        异常:
            无.
        """
        return asdict(paper)


class WordExamParseAndMapUseCase(UseCase[WordExamParseAndMapInput, WordExamParseAndMapOutput]):
    """
    Word 试卷解析并映射用例.

    用途:
        在解析试卷的同时输出宜搭字段映射, 方便后续直接生成表单.
    参数:
        parse_use_case: Word 试卷解析用例.
        mapper: 宜搭字段映射器.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(
        self,
        parse_use_case: WordExamParseUseCase | None = None,
        mapper: YidaExamFieldMapper | None = None,
    ) -> None:
        """
        初始化解析并映射用例.

        用途:
            支持依赖注入解析用例和字段映射器, 便于测试和扩展.
        参数:
            parse_use_case: 可选解析用例实例.
            mapper: 可选宜搭字段映射器实例.
        返回值:
            None.
        异常:
            无.
        """
        self._parse_use_case = parse_use_case or WordExamParseUseCase()
        self._mapper = mapper or YidaExamFieldMapper()

    async def execute(self, input_data: WordExamParseAndMapInput) -> WordExamParseAndMapOutput:
        """
        执行试卷解析并输出宜搭字段映射.

        用途:
            复用解析结果, 并按需补充宜搭字段映射和题目总数统计.
        参数:
            input_data: 解析并映射输入对象.
        返回值:
            WordExamParseAndMapOutput: 结构化试卷与字段映射结果.
        异常:
            无.
        """
        parsed_output = await self._parse_use_case.execute(
            WordExamParseInput(file_path=input_data.file_path)
        )
        yida_fields = self._mapper.map_paper_to_fields(parsed_output.paper) if input_data.include_yida_fields else []
        return WordExamParseAndMapOutput(
            paper=parsed_output.paper,
            paper_data=parsed_output.paper_data,
            warning_messages=parsed_output.warning_messages,
            yida_fields=yida_fields,
            question_count=self._count_questions(parsed_output.paper),
        )

    def _count_questions(self, paper: ExamPaper) -> int:
        """
        统计试卷总题数.

        用途:
            为接口响应补充总题数, 便于前端或管理端展示.
        参数:
            paper: 解析后的试卷实体.
        返回值:
            int: 总题数.
        异常:
            无.
        """
        return sum(len(section.questions) for section in paper.sections)


class WordExamCreateYidaFormUseCase(UseCase[WordExamCreateYidaFormInput, WordExamCreateYidaFormOutput]):
    """
    Word 试卷创建宜搭表单用例.

    用途:
        串联 Word 解析, 宜搭字段映射, Schema 构建与宜搭表单创建流程.
    参数:
        parse_and_map_use_case: 解析并映射用例.
        schema_builder: 宜搭表单 Schema 构建器.
        client: 宜搭表单创建客户端.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(
        self,
        parse_and_map_use_case: WordExamParseAndMapUseCase | None = None,
        schema_builder: YidaFormSchemaBuilder | None = None,
        client: YidaFormClient | None = None,
    ) -> None:
        """
        初始化 Word 试卷创建宜搭表单用例.

        用途:
            支持注入解析映射用例, Schema 构建器和宜搭客户端, 便于测试和替换实现.
        参数:
            parse_and_map_use_case: 可选解析映射用例实例.
            schema_builder: 可选 Schema 构建器实例.
            client: 可选宜搭客户端实例.
        返回值:
            None.
        异常:
            无.
        """
        self._parse_and_map_use_case = parse_and_map_use_case or WordExamParseAndMapUseCase()
        self._schema_builder = schema_builder or YidaFormSchemaBuilder()
        self._client = client or YidaFormClient()

    async def execute(self, input_data: WordExamCreateYidaFormInput) -> WordExamCreateYidaFormOutput:
        """
        执行 Word 试卷到宜搭表单创建流程.

        用途:
            在解析试卷并生成宜搭字段后, 构建 Schema 并调用宜搭接口创建表单.
        参数:
            input_data: 创建宜搭表单输入对象.
        返回值:
            WordExamCreateYidaFormOutput: 完整创建结果对象.
        异常:
            ValidationError: 当 app_type 或 file_path 不合法时抛出.
        """
        self._validate_create_input(input_data=input_data)
        parsed_output = await self._parse_and_map_use_case.execute(
            WordExamParseAndMapInput(
                file_path=input_data.file_path,
                include_yida_fields=True,
            )
        )
        resolved_form_title = self._resolve_form_title(input_data=input_data, paper=parsed_output.paper)
        yida_schema = self._schema_builder.build_schema(
            form_title=resolved_form_title,
            fields=parsed_output.yida_fields,
            description=input_data.form_description,
        )
        create_result = await self._client.create_form(
            app_type=input_data.app_type,
            form_title=resolved_form_title,
            schema=yida_schema,
        )
        logger.info(
            "[Word试卷创建宜搭表单] 创建完成 | "
            f"app_type={input_data.app_type} | "
            f"form_uuid={create_result.form_uuid} | "
            f"question_count={parsed_output.question_count}"
        )
        return WordExamCreateYidaFormOutput(
            paper=parsed_output.paper,
            paper_data=parsed_output.paper_data,
            warning_messages=parsed_output.warning_messages,
            yida_fields=parsed_output.yida_fields,
            yida_schema=yida_schema,
            question_count=parsed_output.question_count,
            create_result=create_result,
        )

    def _validate_create_input(self, input_data: WordExamCreateYidaFormInput) -> None:
        """
        校验宜搭表单创建输入.

        用途:
            拦截缺失的应用 ID 和不合法的文件路径, 避免无效外部调用.
        参数:
            input_data: 创建宜搭表单输入对象.
        返回值:
            None.
        异常:
            ValidationError: 当输入参数不满足要求时抛出.
        """
        if not str(input_data.app_type or "").strip():
            raise ValidationError(message="宜搭 app_type 不能为空")
        if not str(input_data.file_path or "").strip():
            raise ValidationError(message="Word 文件路径不能为空")

    def _resolve_form_title(self, input_data: WordExamCreateYidaFormInput, paper: ExamPaper) -> str:
        """
        解析最终表单标题.

        用途:
            优先使用外部传入的表单标题, 未传时回退到试卷标题.
        参数:
            input_data: 创建宜搭表单输入对象.
            paper: 解析后的试卷实体.
        返回值:
            str: 最终表单标题.
        异常:
            无.
        """
        if str(input_data.form_title or "").strip():
            return str(input_data.form_title).strip()
        return str(paper.paper_title).strip()


__all__ = [
    "WordExamParseInput",
    "WordExamParseOutput",
    "WordExamParseUseCase",
    "WordExamParseAndMapInput",
    "WordExamParseAndMapOutput",
    "WordExamParseAndMapUseCase",
    "WordExamCreateYidaFormInput",
    "WordExamCreateYidaFormOutput",
    "WordExamCreateYidaFormUseCase",
]
