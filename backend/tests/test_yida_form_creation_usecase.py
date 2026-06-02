#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: test_yida_form_creation_usecase.py
# 作者: wuhao
# 日期: 2026_06_02_18:25:48
# 描述: Word 试卷创建宜搭表单用例测试, 验证 Schema 构建与创建结果编排

from __future__ import annotations

import sys
import unittest
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent
BACKEND_SRC = BACKEND_ROOT / "src"
if str(BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(BACKEND_SRC))

from application.exam_parser_usecases import WordExamCreateYidaFormInput, WordExamCreateYidaFormUseCase
from core.exceptions import ValidationError
from infrastructure.tools.yida_form_client import YidaCreateFormResult


class FakeYidaFormClient:
    """
    宜搭表单客户端测试替身.

    用途:
        模拟宜搭表单创建成功结果, 避免单元测试依赖真实外部平台.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    async def create_form(
        self,
        app_type: str,
        form_title: str,
        schema: dict[str, object],
    ) -> YidaCreateFormResult:
        """
        模拟创建宜搭表单.

        用途:
            返回固定的表单 UUID, 供用例层验证编排结果.
        参数:
            app_type: 宜搭应用 ID.
            form_title: 表单标题.
            schema: 宜搭 Schema.
        返回值:
            YidaCreateFormResult: 模拟创建结果.
        异常:
            无.
        """
        if str(schema.get("schemaType", "")).strip() != "superform":
            raise AssertionError("schemaType 不符合预期")
        return YidaCreateFormResult(
            app_type=app_type,
            form_uuid="FORM_FAKE_001",
            form_title=form_title,
            version=1,
            base_url="https://www.aliwork.com",
        )


class WordExamCreateYidaFormUseCaseTestCase(unittest.IsolatedAsyncioTestCase):
    """
    Word 试卷创建宜搭表单用例测试集.

    用途:
        验证真实 CAP 试卷可被解析, 构建 Schema 并产出宜搭创建结果.
    参数:
        无.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(self, methodName: str = "runTest") -> None:
        """
        初始化测试实例.

        用途:
            预置待测试卷路径和带假客户端的用例实例.
        参数:
            methodName: unittest 测试方法名.
        返回值:
            None.
        异常:
            无.
        """
        super().__init__(methodName)
        self._use_case = WordExamCreateYidaFormUseCase(client=FakeYidaFormClient())
        self._file_path = PROJECT_ROOT / "7-CAP产品知识测试B卷.docx"

    async def test_execute_creates_yida_schema_and_returns_form_result(self) -> None:
        """
        测试用例成功返回宜搭 Schema 和创建结果.

        用途:
            验证 Word 试卷到宜搭表单创建输出链路已经打通.
        参数:
            无.
        返回值:
            None.
        异常:
            无.
        """
        result = await self._use_case.execute(
            WordExamCreateYidaFormInput(
                file_path=str(self._file_path),
                app_type="APP_FAKE_001",
            )
        )
        self.assertEqual(result.question_count, 41)
        self.assertEqual(result.create_result.form_uuid, "FORM_FAKE_001")
        self.assertEqual(result.create_result.app_type, "APP_FAKE_001")
        self.assertEqual(result.yida_schema["schemaType"], "superform")
        self.assertEqual(result.yida_schema["schemaVersion"], "5.0")
        self.assertEqual(result.yida_fields[0]["field_key"], "candidate_name")

    async def test_execute_rejects_empty_app_type(self) -> None:
        """
        测试用例拒绝空的宜搭应用 ID.

        用途:
            验证外部调用前会先拦截明显无效的宜搭创建参数.
        参数:
            无.
        返回值:
            None.
        异常:
            无.
        """
        with self.assertRaises(ValidationError):
            await self._use_case.execute(
                WordExamCreateYidaFormInput(
                    file_path=str(self._file_path),
                    app_type="",
                )
            )


if __name__ == "__main__":
    unittest.main()
