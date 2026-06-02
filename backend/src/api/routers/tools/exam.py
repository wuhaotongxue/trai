#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: exam.py
# 作者: wuhao
# 日期: 2026_06_02_18:25:48
# 描述: Word 试卷解析工具路由, 支持上传 docx 后解析试卷并创建宜搭表单

from __future__ import annotations

import tempfile
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, UploadFile
from loguru import logger
from pydantic import BaseModel, Field

from application.exam_parser_usecases import (
    WordExamCreateYidaFormInput,
    WordExamCreateYidaFormUseCase,
    WordExamParseAndMapInput,
    WordExamParseAndMapUseCase,
)
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
from core.exceptions import FileOperationError, TraiException, ValidationError

router = APIRouter(prefix="/exam", tags=["工具"])


class WordExamParseApiData(BaseModel):
    """
    Word 试卷解析接口数据模型.

    用途:
        对外承载结构化试卷 JSON 与宜搭字段映射结果.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    paper: dict[str, object] = Field(..., description="结构化试卷 JSON 数据")
    yida_fields: list[dict[str, object]] = Field(default_factory=list, description="宜搭字段映射列表")
    question_count: int = Field(..., description="试卷总题数")
    section_count: int = Field(..., description="试卷分组数量")
    warning_messages: list[str] = Field(default_factory=list, description="解析告警列表")


class WordExamParseApiResponse(BaseModel):
    """
    Word 试卷解析统一响应模型.

    用途:
        返回统一格式的业务状态, 消息和结构化数据.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    code: int = Field(..., description="业务状态码")
    msg: str = Field(..., description="响应消息")
    data: WordExamParseApiData | None = Field(default=None, description="响应数据")
    req_id: str = Field(..., description="请求追踪 ID")
    ts: str = Field(..., description="响应时间戳")


class WordExamCreateYidaApiData(BaseModel):
    """
    Word 试卷创建宜搭表单接口数据模型.

    用途:
        对外承载解析结果, 宜搭字段映射, Schema 和最终表单标识.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    paper: dict[str, object] = Field(..., description="结构化试卷 JSON 数据")
    yida_fields: list[dict[str, object]] = Field(default_factory=list, description="宜搭字段映射列表")
    yida_schema: dict[str, object] = Field(..., description="宜搭表单 Schema")
    question_count: int = Field(..., description="试卷总题数")
    form_uuid: str = Field(..., description="新创建的宜搭表单 UUID")
    form_title: str = Field(..., description="新创建的宜搭表单标题")
    app_type: str = Field(..., description="目标宜搭应用 ID")
    warning_messages: list[str] = Field(default_factory=list, description="解析告警列表")


class WordExamCreateYidaApiResponse(BaseModel):
    """
    Word 试卷创建宜搭表单统一响应模型.

    用途:
        返回统一格式的业务状态, 消息和宜搭表单创建结果.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    code: int = Field(..., description="业务状态码")
    msg: str = Field(..., description="响应消息")
    data: WordExamCreateYidaApiData | None = Field(default=None, description="响应数据")
    req_id: str = Field(..., description="请求追踪 ID")
    ts: str = Field(..., description="响应时间戳")


class PublishSharedExamApiData(BaseModel):
    """
    发布分享考试接口数据模型.

    用途:
        承载已发布考试的分享信息和结构化试卷结果.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str = Field(..., description="考试唯一 ID")
    share_token: str = Field(..., description="公开分享令牌")
    share_path: str = Field(..., description="前端分享路径")
    share_url: str = Field(..., description="完整分享链接")
    paper: dict[str, object] = Field(..., description="结构化试卷 JSON 数据")
    question_count: int = Field(..., description="试卷总题数")
    warning_messages: list[str] = Field(default_factory=list, description="解析告警列表")


class PublishSharedExamApiResponse(BaseModel):
    """
    发布分享考试统一响应模型.

    用途:
        返回业务状态, 消息和分享考试创建结果.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    code: int = Field(..., description="业务状态码")
    msg: str = Field(..., description="响应消息")
    data: PublishSharedExamApiData | None = Field(default=None, description="响应数据")
    req_id: str = Field(..., description="请求追踪 ID")
    ts: str = Field(..., description="响应时间戳")


class SharedExamDetailRequest(BaseModel):
    """
    获取公开试卷请求模型.

    用途:
        承载公开分享页查询所需的分享令牌.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    share_token: str = Field(..., min_length=1, description="公开分享令牌")


class SharedExamDetailApiData(BaseModel):
    """
    获取公开试卷接口数据模型.

    用途:
        返回公开作答页所需的脱敏试卷结构和基础元信息.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str = Field(..., description="考试唯一 ID")
    share_token: str = Field(..., description="公开分享令牌")
    paper: dict[str, object] = Field(..., description="公开试卷 JSON 数据")
    question_count: int = Field(..., description="试卷总题数")
    section_count: int = Field(..., description="试卷分组数量")
    share_url: str = Field(..., description="完整分享链接")


class SharedExamDetailApiResponse(BaseModel):
    """
    获取公开试卷统一响应模型.

    用途:
        返回业务状态, 消息和公开作答试卷数据.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    code: int = Field(..., description="业务状态码")
    msg: str = Field(..., description="响应消息")
    data: SharedExamDetailApiData | None = Field(default=None, description="响应数据")
    req_id: str = Field(..., description="请求追踪 ID")
    ts: str = Field(..., description="响应时间戳")


class SharedExamAnswerRequest(BaseModel):
    """
    单题答案请求模型.

    用途:
        承载答题页单道题的作答内容.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    question_no: int = Field(..., ge=1, description="题号")
    values: list[str] = Field(default_factory=list, description="客观题作答选项列表")
    text_answer: str | None = Field(default=None, description="主观题文本答案")


class SubmitSharedExamRequest(BaseModel):
    """
    提交答卷请求模型.

    用途:
        承载分享令牌, 作答人信息和答案列表.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    share_token: str = Field(..., min_length=1, description="公开分享令牌")
    candidate_name: str = Field(..., min_length=1, max_length=100, description="作答人姓名")
    candidate_department: str = Field(..., min_length=1, max_length=100, description="作答人部门")
    answers: list[SharedExamAnswerRequest] = Field(..., min_length=1, description="答案列表")


class SubmitSharedExamApiData(BaseModel):
    """
    提交答卷接口数据模型.

    用途:
        返回答卷 ID, 自动得分和 AI 表格同步状态.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    submission_id: str = Field(..., description="答卷唯一 ID")
    exam_id: str = Field(..., description="考试唯一 ID")
    score: int = Field(..., description="当前自动得分")
    total_score: int = Field(..., description="试卷总分")
    requires_manual_review: bool = Field(..., description="是否仍需人工复核")
    sync_result: dict[str, object] = Field(..., description="AI 表格同步结果")


class SubmitSharedExamApiResponse(BaseModel):
    """
    提交答卷统一响应模型.

    用途:
        返回业务状态, 消息和自动评分结果.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    code: int = Field(..., description="业务状态码")
    msg: str = Field(..., description="响应消息")
    data: SubmitSharedExamApiData | None = Field(default=None, description="响应数据")
    req_id: str = Field(..., description="请求追踪 ID")
    ts: str = Field(..., description="响应时间戳")


class PublishedExamListItemApiData(BaseModel):
    """
    已发布考试列表项接口数据模型.

    用途:
        承载后台考试管理页展示的一条考试摘要记录.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str = Field(..., description="考试唯一 ID")
    share_token: str = Field(..., description="公开分享令牌")
    share_url: str = Field(..., description="完整分享链接")
    paper_title: str = Field(..., description="试卷标题")
    position: str | None = Field(default=None, description="适用岗位")
    question_count: int = Field(..., description="试卷总题数")
    submission_count: int = Field(..., description="已提交答卷数量")
    latest_submission_at: str | None = Field(default=None, description="最近一次提交时间")
    created_at: str = Field(..., description="考试发布时间")
    updated_at: str = Field(..., description="考试更新时间")


class PublishedExamListApiData(BaseModel):
    """
    已发布考试列表接口数据模型.

    用途:
        承载后台发布记录列表所需的考试摘要集合和总数.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    items: list[PublishedExamListItemApiData] = Field(default_factory=list, description="已发布考试列表")
    total: int = Field(..., description="记录总数")


class PublishedExamListApiResponse(BaseModel):
    """
    已发布考试列表统一响应模型.

    用途:
        返回业务状态, 消息和后台考试管理列表数据.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    code: int = Field(..., description="业务状态码")
    msg: str = Field(..., description="响应消息")
    data: PublishedExamListApiData | None = Field(default=None, description="响应数据")
    req_id: str = Field(..., description="请求追踪 ID")
    ts: str = Field(..., description="响应时间戳")


class PublishedExamDetailRequest(BaseModel):
    """
    已发布考试详情请求模型.

    用途:
        承载后台详情页查询所需的分享令牌.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    share_token: str = Field(..., min_length=1, description="公开分享令牌")


class PublishedExamSubmissionItemApiData(BaseModel):
    """
    已发布考试答卷列表项接口数据模型.

    用途:
        承载后台详情页中的单条答卷摘要信息.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    submission_id: str = Field(..., description="答卷唯一 ID")
    candidate_name: str = Field(..., description="作答人姓名")
    candidate_department: str = Field(..., description="作答人部门")
    score: int = Field(..., description="自动得分")
    total_score: int = Field(..., description="试卷总分")
    requires_manual_review: bool = Field(..., description="是否仍需人工复核")
    sync_status: str = Field(..., description="AI 表格同步状态")
    submitted_at: str = Field(..., description="提交时间")


class PublishedExamDetailApiData(BaseModel):
    """
    已发布考试详情接口数据模型.

    用途:
        承载后台详情页展示的考试信息和答卷列表.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str = Field(..., description="考试唯一 ID")
    share_token: str = Field(..., description="公开分享令牌")
    share_url: str = Field(..., description="完整分享链接")
    share_path: str = Field(..., description="前端分享路径")
    paper_title: str = Field(..., description="试卷标题")
    position: str | None = Field(default=None, description="适用岗位")
    question_count: int = Field(..., description="试卷总题数")
    total_score: int | None = Field(default=None, description="试卷总分")
    duration_minutes: int | None = Field(default=None, description="考试时长, 单位分钟")
    warning_messages: list[str] = Field(default_factory=list, description="解析告警列表")
    created_at: str = Field(..., description="发布时间")
    updated_at: str = Field(..., description="更新时间")
    submission_count: int = Field(..., description="已提交答卷数量")
    submissions: list[PublishedExamSubmissionItemApiData] = Field(
        default_factory=list, description="答卷摘要列表"
    )


class PublishedExamDetailApiResponse(BaseModel):
    """
    已发布考试详情统一响应模型.

    用途:
        返回业务状态, 消息和后台详情页数据.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    code: int = Field(..., description="业务状态码")
    msg: str = Field(..., description="响应消息")
    data: PublishedExamDetailApiData | None = Field(default=None, description="响应数据")
    req_id: str = Field(..., description="请求追踪 ID")
    ts: str = Field(..., description="响应时间戳")


class PublishedSubmissionDetailRequest(BaseModel):
    """
    已发布答卷详情请求模型.

    用途:
        承载后台答卷详情页查询所需的分享令牌和答卷 ID.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    share_token: str = Field(..., min_length=1, description="公开分享令牌")
    submission_id: str = Field(..., min_length=1, description="答卷唯一 ID")


class PublishedSubmissionQuestionDetailApiData(BaseModel):
    """
    已发布答卷逐题详情接口数据模型.

    用途:
        承载后台答卷详情页中的单题标准答案, 考生答案和评分状态.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    question_no: int = Field(..., description="题号")
    question_type: str = Field(..., description="题型")
    section_title: str = Field(..., description="所属分组标题")
    stem: str = Field(..., description="题干")
    max_score: int = Field(..., description="本题满分")
    awarded_score: int | None = Field(default=None, description="本题自动得分, 主观题为空")
    is_correct: bool | None = Field(default=None, description="是否自动判定正确, 主观题为空")
    requires_manual_review: bool = Field(..., description="本题是否需人工复核")
    standard_answer: list[str] = Field(default_factory=list, description="标准答案列表")
    reference_answer: str | None = Field(default=None, description="主观题参考答案")
    candidate_values: list[str] = Field(default_factory=list, description="考生客观题作答选项")
    candidate_text: str | None = Field(default=None, description="考生主观题文本答案")
    evaluation_status: str = Field(..., description="评分状态, 如 correct, incorrect, manual_review")


class PublishedSubmissionDetailApiData(BaseModel):
    """
    已发布答卷详情接口数据模型.

    用途:
        承载后台答卷详情页展示的答卷摘要, 同步结果和逐题评分明细.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    exam_id: str = Field(..., description="考试唯一 ID")
    submission_id: str = Field(..., description="答卷唯一 ID")
    share_token: str = Field(..., description="公开分享令牌")
    paper_title: str = Field(..., description="试卷标题")
    candidate_name: str = Field(..., description="作答人姓名")
    candidate_department: str = Field(..., description="作答人部门")
    score: int = Field(..., description="自动得分")
    total_score: int = Field(..., description="试卷总分")
    requires_manual_review: bool = Field(..., description="是否仍需人工复核")
    sync_status: str = Field(..., description="AI 表格同步状态")
    sync_result: dict[str, object] = Field(default_factory=dict, description="AI 表格同步结果详情")
    submitted_at: str = Field(..., description="提交时间")
    question_details: list[PublishedSubmissionQuestionDetailApiData] = Field(
        default_factory=list, description="逐题评分明细"
    )


class PublishedSubmissionDetailApiResponse(BaseModel):
    """
    已发布答卷详情统一响应模型.

    用途:
        返回业务状态, 消息和后台答卷详情页数据.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    code: int = Field(..., description="业务状态码")
    msg: str = Field(..., description="响应消息")
    data: PublishedSubmissionDetailApiData | None = Field(default=None, description="响应数据")
    req_id: str = Field(..., description="请求追踪 ID")
    ts: str = Field(..., description="响应时间戳")


class WordExamToolRouter:
    """
    Word 试卷工具路由类.

    用途:
        封装试卷上传解析接口, 统一处理临时文件存储, 业务调用和错误返回.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    _ALLOWED_CONTENT_TYPES: tuple[str, ...] = (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )

    @staticmethod
    @router.post(
        "/parse_word",
        response_model=WordExamParseApiResponse,
        summary="解析 Word 试卷",
        description="上传 docx 试卷文件, 返回结构化试卷 JSON 与宜搭字段映射结果.",
    )
    async def parse_word_exam(
        file: UploadFile = File(..., description="待解析的 docx 试卷文件"),
        include_yida_fields: bool = Form(True, description="是否同时返回宜搭字段映射"),
    ) -> WordExamParseApiResponse:
        """
        解析上传的 Word 试卷文件.

        用途:
            将上传的 docx 文件保存到临时目录, 调用应用层用例完成结构化解析和字段映射.
        参数:
            file: 上传的 Word 文件.
            include_yida_fields: 是否输出宜搭字段映射结果.
        返回值:
            WordExamParseApiResponse: 统一响应对象.
        异常:
            无. 所有异常都会被转换为统一响应.
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        use_case = WordExamParseAndMapUseCase()
        temp_file_path: Path | None = None

        try:
            WordExamToolRouter._validate_upload_file(file=file)
            temp_file_path = await WordExamToolRouter._save_upload_file(file=file)
            output = await use_case.execute(
                WordExamParseAndMapInput(
                    file_path=str(temp_file_path),
                    include_yida_fields=include_yida_fields,
                )
            )
            return WordExamParseApiResponse(
                code=200,
                msg="OK",
                data=WordExamParseApiData(
                    paper=output.paper_data,
                    yida_fields=output.yida_fields,
                    question_count=output.question_count,
                    section_count=len(output.paper.sections),
                    warning_messages=output.warning_messages,
                ),
                req_id=req_id,
                ts=ts,
            )
        except TraiException as error:
            logger.warning(f"[Word试卷接口] 业务异常 | req_id={req_id} | error={error}")
            return WordExamParseApiResponse(
                code=error.code,
                msg=error.message,
                data=None,
                req_id=req_id,
                ts=ts,
            )
        except Exception as error:
            logger.exception(f"[Word试卷接口] 未知异常 | req_id={req_id} | error={error}")
            return WordExamParseApiResponse(
                code=500,
                msg="Word 试卷解析失败",
                data=None,
                req_id=req_id,
                ts=ts,
            )
        finally:
            WordExamToolRouter._cleanup_temp_file(temp_file_path=temp_file_path)

    @staticmethod
    @router.post(
        "/create_yida_form",
        response_model=WordExamCreateYidaApiResponse,
        summary="创建宜搭考试表单",
        description="上传 docx 试卷文件, 解析后直接调用宜搭接口创建答题表单.",
    )
    async def create_yida_form(
        file: UploadFile = File(..., description="待解析并创建表单的 docx 试卷文件"),
        app_type: str = Form(..., description="目标宜搭应用 ID"),
        form_title: str | None = Form(None, description="自定义宜搭表单标题, 为空时默认使用试卷标题"),
        form_description: str | None = Form(None, description="自定义宜搭表单描述"),
    ) -> WordExamCreateYidaApiResponse:
        """
        解析上传的 Word 试卷并创建宜搭表单.

        用途:
            将上传的 docx 文件保存到临时目录, 调用应用层用例完成解析, Schema 构建和宜搭表单创建.
        参数:
            file: 上传的 Word 文件.
            app_type: 目标宜搭应用 ID.
            form_title: 自定义宜搭表单标题.
            form_description: 自定义宜搭表单描述.
        返回值:
            WordExamCreateYidaApiResponse: 统一响应对象.
        异常:
            无. 所有异常都会被转换为统一响应.
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        use_case = WordExamCreateYidaFormUseCase()
        temp_file_path: Path | None = None

        try:
            WordExamToolRouter._validate_upload_file(file=file)
            temp_file_path = await WordExamToolRouter._save_upload_file(file=file)
            output = await use_case.execute(
                WordExamCreateYidaFormInput(
                    file_path=str(temp_file_path),
                    app_type=app_type,
                    form_title=form_title,
                    form_description=form_description,
                )
            )
            return WordExamCreateYidaApiResponse(
                code=200,
                msg="OK",
                data=WordExamCreateYidaApiData(
                    paper=output.paper_data,
                    yida_fields=output.yida_fields,
                    yida_schema=output.yida_schema,
                    question_count=output.question_count,
                    form_uuid=output.create_result.form_uuid,
                    form_title=output.create_result.form_title,
                    app_type=output.create_result.app_type,
                    warning_messages=output.warning_messages,
                ),
                req_id=req_id,
                ts=ts,
            )
        except TraiException as error:
            logger.warning(f"[Word试卷创建宜搭接口] 业务异常 | req_id={req_id} | error={error}")
            return WordExamCreateYidaApiResponse(
                code=error.code,
                msg=error.message,
                data=None,
                req_id=req_id,
                ts=ts,
            )
        except Exception as error:
            logger.exception(f"[Word试卷创建宜搭接口] 未知异常 | req_id={req_id} | error={error}")
            return WordExamCreateYidaApiResponse(
                code=500,
                msg="宜搭表单创建失败",
                data=None,
                req_id=req_id,
                ts=ts,
            )
        finally:
            WordExamToolRouter._cleanup_temp_file(temp_file_path=temp_file_path)

    @staticmethod
    @router.post(
        "/publish_share",
        response_model=PublishSharedExamApiResponse,
        summary="发布分享考试",
        description="上传 docx 试卷文件, 生成一个可公开访问的答题分享链接.",
    )
    async def publish_shared_exam(
        file: UploadFile = File(..., description="待发布为分享考试的 docx 试卷文件"),
        share_base_url: str | None = Form(None, description="分享链接基地址, 如 https://example.com"),
    ) -> PublishSharedExamApiResponse:
        """
        发布一个可公开作答的分享考试.

        用途:
            解析上传的 Word 试卷, 持久化考试数据并返回分享令牌和分享链接.
        参数:
            file: 上传的 Word 文件.
            share_base_url: 分享链接基地址.
        返回值:
            PublishSharedExamApiResponse: 统一响应对象.
        异常:
            无. 所有异常都会被转换为统一响应.
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        use_case = PublishSharedExamUseCase()
        temp_file_path: Path | None = None

        try:
            WordExamToolRouter._validate_upload_file(file=file)
            temp_file_path = await WordExamToolRouter._save_upload_file(file=file)
            output = await use_case.execute(
                PublishSharedExamInput(
                    file_path=str(temp_file_path),
                    share_base_url=share_base_url,
                )
            )
            return PublishSharedExamApiResponse(
                code=200,
                msg="OK",
                data=PublishSharedExamApiData(
                    exam_id=output.exam_id,
                    share_token=output.share_token,
                    share_path=output.share_path,
                    share_url=output.share_url,
                    paper=output.paper,
                    question_count=output.question_count,
                    warning_messages=output.warning_messages,
                ),
                req_id=req_id,
                ts=ts,
            )
        except TraiException as error:
            logger.warning(f"[考试分享发布接口] 业务异常 | req_id={req_id} | error={error}")
            return PublishSharedExamApiResponse(
                code=error.code,
                msg=error.message,
                data=None,
                req_id=req_id,
                ts=ts,
            )
        except Exception as error:
            logger.exception(f"[考试分享发布接口] 未知异常 | req_id={req_id} | error={error}")
            return PublishSharedExamApiResponse(
                code=500,
                msg="考试分享发布失败",
                data=None,
                req_id=req_id,
                ts=ts,
            )
        finally:
            WordExamToolRouter._cleanup_temp_file(temp_file_path=temp_file_path)

    @staticmethod
    @router.post(
        "/share_detail",
        response_model=SharedExamDetailApiResponse,
        summary="获取公开试卷",
        description="根据分享令牌获取公开作答页所需的脱敏试卷数据.",
    )
    async def get_shared_exam_detail(
        req: SharedExamDetailRequest,
    ) -> SharedExamDetailApiResponse:
        """
        获取公开试卷详情.

        用途:
            根据分享令牌返回公开作答页所需的脱敏试卷结构.
        参数:
            req: 获取公开试卷请求对象.
        返回值:
            SharedExamDetailApiResponse: 统一响应对象.
        异常:
            无. 所有异常都会被转换为统一响应.
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        use_case = GetSharedExamUseCase()

        try:
            output = await use_case.execute(GetSharedExamInput(share_token=req.share_token))
            return SharedExamDetailApiResponse(
                code=200,
                msg="OK",
                data=SharedExamDetailApiData(
                    exam_id=output.exam_id,
                    share_token=output.share_token,
                    paper=output.paper,
                    question_count=output.question_count,
                    section_count=output.section_count,
                    share_url=output.share_url,
                ),
                req_id=req_id,
                ts=ts,
            )
        except TraiException as error:
            logger.warning(f"[考试分享详情接口] 业务异常 | req_id={req_id} | error={error}")
            return SharedExamDetailApiResponse(
                code=error.code,
                msg=error.message,
                data=None,
                req_id=req_id,
                ts=ts,
            )
        except Exception as error:
            logger.exception(f"[考试分享详情接口] 未知异常 | req_id={req_id} | error={error}")
            return SharedExamDetailApiResponse(
                code=500,
                msg="获取公开试卷失败",
                data=None,
                req_id=req_id,
                ts=ts,
            )

    @staticmethod
    @router.post(
        "/submit_answers",
        response_model=SubmitSharedExamApiResponse,
        summary="提交考试答卷",
        description="根据分享令牌提交考生答案, 自动评分并按配置同步到 AI 表格.",
    )
    async def submit_shared_exam_answers(
        req: SubmitSharedExamRequest,
    ) -> SubmitSharedExamApiResponse:
        """
        提交公开考试答卷.

        用途:
            接收公开作答页提交的答案列表, 自动评分并返回得分结果.
        参数:
            req: 提交答卷请求对象.
        返回值:
            SubmitSharedExamApiResponse: 统一响应对象.
        异常:
            无. 所有异常都会被转换为统一响应.
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        use_case = SubmitSharedExamUseCase()

        try:
            output = await use_case.execute(
                SubmitSharedExamInput(
                    share_token=req.share_token,
                    candidate_name=req.candidate_name,
                    candidate_department=req.candidate_department,
                    answers=[answer.model_dump() for answer in req.answers],
                )
            )
            return SubmitSharedExamApiResponse(
                code=200,
                msg="OK",
                data=SubmitSharedExamApiData(
                    submission_id=output.submission_id,
                    exam_id=output.exam_id,
                    score=output.score,
                    total_score=output.total_score,
                    requires_manual_review=output.requires_manual_review,
                    sync_result=output.sync_result,
                ),
                req_id=req_id,
                ts=ts,
            )
        except TraiException as error:
            logger.warning(f"[考试答卷提交接口] 业务异常 | req_id={req_id} | error={error}")
            return SubmitSharedExamApiResponse(
                code=error.code,
                msg=error.message,
                data=None,
                req_id=req_id,
                ts=ts,
            )
        except Exception as error:
            logger.exception(f"[考试答卷提交接口] 未知异常 | req_id={req_id} | error={error}")
            return SubmitSharedExamApiResponse(
                code=500,
                msg="提交考试答卷失败",
                data=None,
                req_id=req_id,
                ts=ts,
            )

    @staticmethod
    @router.post(
        "/published_list",
        response_model=PublishedExamListApiResponse,
        summary="获取已发布考试列表",
        description="返回后台考试发布记录列表, 包含分享链接, 题目数和答卷统计信息.",
    )
    async def list_published_exams() -> PublishedExamListApiResponse:
        """
        获取后台已发布考试列表.

        用途:
            返回考试发布记录, 供后台页面管理历史分享链接和查看提交情况.
        参数:
            无.
        返回值:
            PublishedExamListApiResponse: 统一响应对象.
        异常:
            无. 所有异常都会被转换为统一响应.
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        use_case = ListPublishedExamsUseCase()

        try:
            output = await use_case.execute()
            return PublishedExamListApiResponse(
                code=200,
                msg="OK",
                data=PublishedExamListApiData(
                    items=[
                        PublishedExamListItemApiData(
                            exam_id=item.exam_id,
                            share_token=item.share_token,
                            share_url=item.share_url,
                            paper_title=item.paper_title,
                            position=item.position,
                            question_count=item.question_count,
                            submission_count=item.submission_count,
                            latest_submission_at=item.latest_submission_at,
                            created_at=item.created_at,
                            updated_at=item.updated_at,
                        )
                        for item in output.items
                    ],
                    total=output.total,
                ),
                req_id=req_id,
                ts=ts,
            )
        except TraiException as error:
            logger.warning(f"[考试发布列表接口] 业务异常 | req_id={req_id} | error={error}")
            return PublishedExamListApiResponse(
                code=error.code,
                msg=error.message,
                data=None,
                req_id=req_id,
                ts=ts,
            )
        except Exception as error:
            logger.exception(f"[考试发布列表接口] 未知异常 | req_id={req_id} | error={error}")
            return PublishedExamListApiResponse(
                code=500,
                msg="获取已发布考试列表失败",
                data=None,
                req_id=req_id,
                ts=ts,
            )

    @staticmethod
    @router.post(
        "/published_detail",
        response_model=PublishedExamDetailApiResponse,
        summary="获取已发布考试详情",
        description="返回后台考试详情页数据, 包含考试基本信息, 分享链接和答卷列表.",
    )
    async def get_published_exam_detail(
        req: PublishedExamDetailRequest,
    ) -> PublishedExamDetailApiResponse:
        """
        获取后台已发布考试详情.

        用途:
            根据分享令牌返回考试详情, 分享信息和答卷摘要列表.
        参数:
            req: 已发布考试详情请求对象.
        返回值:
            PublishedExamDetailApiResponse: 统一响应对象.
        异常:
            无. 所有异常都会被转换为统一响应.
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        use_case = GetPublishedExamDetailUseCase()

        try:
            output = await use_case.execute(
                GetPublishedExamDetailInput(share_token=req.share_token)
            )
            return PublishedExamDetailApiResponse(
                code=200,
                msg="OK",
                data=PublishedExamDetailApiData(
                    exam_id=output.exam_id,
                    share_token=output.share_token,
                    share_url=output.share_url,
                    share_path=output.share_path,
                    paper_title=output.paper_title,
                    position=output.position,
                    question_count=output.question_count,
                    total_score=output.total_score,
                    duration_minutes=output.duration_minutes,
                    warning_messages=output.warning_messages,
                    created_at=output.created_at,
                    updated_at=output.updated_at,
                    submission_count=output.submission_count,
                    submissions=[
                        PublishedExamSubmissionItemApiData(
                            submission_id=item.submission_id,
                            candidate_name=item.candidate_name,
                            candidate_department=item.candidate_department,
                            score=item.score,
                            total_score=item.total_score,
                            requires_manual_review=item.requires_manual_review,
                            sync_status=item.sync_status,
                            submitted_at=item.submitted_at,
                        )
                        for item in output.submissions
                    ],
                ),
                req_id=req_id,
                ts=ts,
            )
        except TraiException as error:
            logger.warning(f"[考试发布详情接口] 业务异常 | req_id={req_id} | error={error}")
            return PublishedExamDetailApiResponse(
                code=error.code,
                msg=error.message,
                data=None,
                req_id=req_id,
                ts=ts,
            )
        except Exception as error:
            logger.exception(f"[考试发布详情接口] 未知异常 | req_id={req_id} | error={error}")
            return PublishedExamDetailApiResponse(
                code=500,
                msg="获取已发布考试详情失败",
                data=None,
                req_id=req_id,
                ts=ts,
            )

    @staticmethod
    @router.post(
        "/submission_detail",
        response_model=PublishedSubmissionDetailApiResponse,
        summary="获取已发布答卷详情",
        description="返回后台答卷详情页数据, 包含考生答案, 自动评分明细和 AI 表格同步结果.",
    )
    async def get_published_submission_detail(
        req: PublishedSubmissionDetailRequest,
    ) -> PublishedSubmissionDetailApiResponse:
        """
        获取后台已发布答卷详情.

        用途:
            根据分享令牌和答卷 ID 返回考生答案, 自动评分明细和同步详情.
        参数:
            req: 已发布答卷详情请求对象.
        返回值:
            PublishedSubmissionDetailApiResponse: 统一响应对象.
        异常:
            无. 所有异常都会被转换为统一响应.
        """
        req_id = str(uuid4())
        ts = datetime.now().isoformat()
        use_case = GetPublishedSubmissionDetailUseCase()

        try:
            output = await use_case.execute(
                GetPublishedSubmissionDetailInput(
                    share_token=req.share_token,
                    submission_id=req.submission_id,
                )
            )
            return PublishedSubmissionDetailApiResponse(
                code=200,
                msg="OK",
                data=PublishedSubmissionDetailApiData(
                    exam_id=output.exam_id,
                    submission_id=output.submission_id,
                    share_token=output.share_token,
                    paper_title=output.paper_title,
                    candidate_name=output.candidate_name,
                    candidate_department=output.candidate_department,
                    score=output.score,
                    total_score=output.total_score,
                    requires_manual_review=output.requires_manual_review,
                    sync_status=output.sync_status,
                    sync_result=output.sync_result,
                    submitted_at=output.submitted_at,
                    question_details=[
                        PublishedSubmissionQuestionDetailApiData(
                            question_no=item.question_no,
                            question_type=item.question_type,
                            section_title=item.section_title,
                            stem=item.stem,
                            max_score=item.max_score,
                            awarded_score=item.awarded_score,
                            is_correct=item.is_correct,
                            requires_manual_review=item.requires_manual_review,
                            standard_answer=item.standard_answer,
                            reference_answer=item.reference_answer,
                            candidate_values=item.candidate_values,
                            candidate_text=item.candidate_text,
                            evaluation_status=item.evaluation_status,
                        )
                        for item in output.question_details
                    ],
                ),
                req_id=req_id,
                ts=ts,
            )
        except TraiException as error:
            logger.warning(f"[考试答卷详情接口] 业务异常 | req_id={req_id} | error={error}")
            return PublishedSubmissionDetailApiResponse(
                code=error.code,
                msg=error.message,
                data=None,
                req_id=req_id,
                ts=ts,
            )
        except Exception as error:
            logger.exception(f"[考试答卷详情接口] 未知异常 | req_id={req_id} | error={error}")
            return PublishedSubmissionDetailApiResponse(
                code=500,
                msg="获取已发布答卷详情失败",
                data=None,
                req_id=req_id,
                ts=ts,
            )

    @staticmethod
    def _validate_upload_file(file: UploadFile) -> None:
        """
        校验上传文件合法性.

        用途:
            拦截空文件名和非 docx 文件, 减少无效解析请求.
        参数:
            file: FastAPI 上传文件对象.
        返回值:
            None.
        异常:
            ValidationError: 当文件名为空或格式不合法时抛出.
        """
        file_name = str(file.filename or "").strip()
        if not file_name:
            raise ValidationError(message="上传文件名不能为空")
        if not file_name.lower().endswith(".docx"):
            raise ValidationError(message="仅支持上传 docx 格式的 Word 试卷")
        if str(file.content_type or "").strip() not in WordExamToolRouter._ALLOWED_CONTENT_TYPES:
            raise ValidationError(message="上传文件 Content-Type 非法, 仅支持标准 docx 文件")

    @staticmethod
    async def _save_upload_file(file: UploadFile) -> Path:
        """
        保存上传文件到临时目录.

        用途:
            将上传的 Word 文件落到后端临时路径, 便于解析器按文件路径读取.
        参数:
            file: FastAPI 上传文件对象.
        返回值:
            Path: 临时文件路径.
        异常:
            FileOperationError: 当文件保存失败时抛出.
        """
        try:
            suffix = Path(str(file.filename)).suffix or ".docx"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                file_bytes = await file.read()
                temp_file.write(file_bytes)
                return Path(temp_file.name)
        except Exception as error:
            raise FileOperationError(message="上传文件保存失败") from error
        finally:
            await file.close()

    @staticmethod
    def _cleanup_temp_file(temp_file_path: Path | None) -> None:
        """
        清理临时文件.

        用途:
            在请求结束后删除临时上传文件, 避免临时目录持续膨胀.
        参数:
            temp_file_path: 临时文件路径.
        返回值:
            None.
        异常:
            无.
        """
        if temp_file_path is None:
            return
        if not temp_file_path.exists():
            return
        try:
            temp_file_path.unlink()
        except OSError as error:
            logger.warning(f"[Word试卷接口] 临时文件删除失败 | file_path={temp_file_path} | error={error}")


__all__ = ["router", "WordExamToolRouter"]
