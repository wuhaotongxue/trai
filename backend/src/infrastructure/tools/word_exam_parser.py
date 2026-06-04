#!/usr/bin/env python
# 文件名: word_exam_parser.py
# 作者: wuhao
# 日期: 2026_06_02_17:27:19
# 描述: Word 试卷解析器, 负责将 docx 试卷转换为结构化领域实体

from __future__ import annotations

import re
from pathlib import Path

from docx import Document
from loguru import logger

from core.exceptions import FileOperationError, ValidationError
from domain.exam_entities import (
    ExamPaper,
    ExamQuestion,
    ExamQuestionOption,
    ExamQuestionType,
    ExamSection,
)


class WordExamParser:
    """
    Word 试卷解析器.

    用途:
        读取 docx 试卷, 解析标题, 元信息, 题型分组, 题目选项和答案, 输出结构化试卷实体.
    参数:
        无.
    返回值:
        None.
    异常:
        无. 具体解析异常在 parse 方法中抛出.
    """

    _QUESTION_START_PATTERN = re.compile(r"^\s*(\d+)\.\s*(.+?)\s*$")
    _SECTION_MARKERS: tuple[tuple[str, ExamQuestionType], ...] = (
        ("单项选择题", ExamQuestionType.SINGLE_CHOICE),
        ("单选题", ExamQuestionType.SINGLE_CHOICE),
        ("多项选择题", ExamQuestionType.MULTIPLE_CHOICE),
        ("多选题", ExamQuestionType.MULTIPLE_CHOICE),
        ("判断题", ExamQuestionType.JUDGE),
        ("简答题", ExamQuestionType.SHORT_ANSWER),
    )
    _ANSWER_MARKERS: tuple[tuple[str, ExamQuestionType], ...] = (
        ("一、单选题", ExamQuestionType.SINGLE_CHOICE),
        ("一、单项选择题", ExamQuestionType.SINGLE_CHOICE),
        ("二、多选题", ExamQuestionType.MULTIPLE_CHOICE),
        ("二、多项选择题", ExamQuestionType.MULTIPLE_CHOICE),
        ("三、判断题", ExamQuestionType.JUDGE),
        ("四、简答题", ExamQuestionType.SHORT_ANSWER),
    )
    _JUDGE_OPTIONS: tuple[ExamQuestionOption, ExamQuestionOption] = (
        ExamQuestionOption(key="true", text="正确"),
        ExamQuestionOption(key="false", text="错误"),
    )

    def parse(self, file_path: str | Path) -> ExamPaper:
        """
        解析 Word 试卷文件.

        用途:
            读取指定 docx 文件并转换为标准化试卷实体.
        参数:
            file_path: Word 文件路径.
        返回值:
            ExamPaper: 解析得到的试卷对象.
        异常:
            FileOperationError: 当文件不存在或无法读取时抛出.
            ValidationError: 当文件内容无法识别为有效试卷时抛出.
        """
        resolved_path = Path(file_path).expanduser().resolve()
        self._validate_file(resolved_path)

        try:
            document = Document(str(resolved_path))
        except Exception as error:
            logger.error(f"[Word试卷解析] 文档加载失败 | file_path={resolved_path} | error={error}")
            raise FileOperationError(
                message="Word 文件读取失败",
                details={"file_path": str(resolved_path)},
            ) from error

        lines = self._extract_non_empty_lines(document=document)
        if not lines:
            raise ValidationError(
                message="Word 文件内容为空",
                details={"file_path": str(resolved_path)},
            )

        answer_header_index = self._find_answer_header_index(lines=lines)
        question_lines = lines if answer_header_index < 0 else lines[:answer_header_index]
        answer_lines = [] if answer_header_index < 0 else lines[answer_header_index + 1 :]

        warning_messages: list[str] = []
        answer_lookup = self._build_answer_lookup(answer_lines=answer_lines, warning_messages=warning_messages)
        paper_title = self._extract_paper_title(lines=question_lines, fallback_title=resolved_path.stem)
        position = self._extract_position(lines=question_lines)
        total_score = self._extract_numeric_metadata(lines=question_lines, prefix="满分")
        duration_minutes = self._extract_numeric_metadata(lines=question_lines, prefix="考试时间")
        sections = self._parse_sections(
            question_lines=question_lines, answer_lookup=answer_lookup, warning_messages=warning_messages
        )

        if not sections:
            raise ValidationError(
                message="未识别到任何试题分组",
                details={"file_path": str(resolved_path)},
            )

        return ExamPaper(
            paper_title=paper_title,
            position=position,
            total_score=total_score,
            duration_minutes=duration_minutes,
            sections=sections,
            warning_messages=warning_messages,
        )

    def _validate_file(self, file_path: Path) -> None:
        """
        校验输入文件的合法性.

        用途:
            确认文件存在且后缀为 docx, 及时拦截非法输入.
        参数:
            file_path: 目标文件路径.
        返回值:
            None.
        异常:
            FileOperationError: 当文件不存在时抛出.
            ValidationError: 当文件格式非法时抛出.
        """
        if not file_path.exists():
            raise FileOperationError(
                message="Word 文件不存在",
                details={"file_path": str(file_path)},
            )
        if file_path.suffix.lower() != ".docx":
            raise ValidationError(
                message="仅支持 docx 格式的 Word 文件",
                details={"file_path": str(file_path)},
            )

    def _extract_non_empty_lines(self, document: Document) -> list[str]:
        """
        提取文档中的非空段落文本.

        用途:
            将 Word 段落清洗为按顺序排列的非空文本行.
        参数:
            document: 已加载的 docx 文档对象.
        返回值:
            list[str]: 清洗后的非空文本列表.
        异常:
            无.
        """
        normalized_lines: list[str] = []
        for paragraph in document.paragraphs:
            text = self._normalize_text(paragraph.text)
            if text:
                normalized_lines.append(text)
        return normalized_lines

    def _normalize_text(self, text: str) -> str:
        """
        规范化文本空白字符.

        用途:
            统一空格和换行表现, 减少正则解析难度.
        参数:
            text: 原始文本.
        返回值:
            str: 清洗后的文本.
        异常:
            无.
        """
        compact_text = re.sub(r"\s+", " ", str(text or "").strip())
        return compact_text

    def _find_answer_header_index(self, lines: list[str]) -> int:
        """
        查找参考答案段的起始下标.

        用途:
            将题目正文和参考答案正文拆开处理.
        参数:
            lines: 文档文本行列表.
        返回值:
            int: 参考答案行下标, 未找到时返回 -1.
        异常:
            无.
        """
        for index, line in enumerate(lines):
            if "参考答案" in line and "评分标准" in line:
                return index
        return -1

    def _extract_paper_title(self, lines: list[str], fallback_title: str) -> str:
        """
        提取试卷标题.

        用途:
            优先从正文首行获取试卷名称, 失败时回退到文件名.
        参数:
            lines: 正文文本行.
            fallback_title: 回退标题.
        返回值:
            str: 试卷标题.
        异常:
            无.
        """
        for line in lines:
            if any(marker in line for marker, _ in self._SECTION_MARKERS):
                break
            if "试卷" in line or "考试" in line:
                return line
        return fallback_title

    def _extract_position(self, lines: list[str]) -> str | None:
        """
        提取适用岗位信息.

        用途:
            从元信息行中提取岗位或适用对象描述.
        参数:
            lines: 正文文本行.
        返回值:
            str | None: 岗位文本, 未找到时返回 None.
        异常:
            无.
        """
        position_pattern = re.compile(r"适用岗位[:\uFF1A]\s*(.+)$")
        for line in lines[:8]:
            match = position_pattern.search(line)
            if match:
                return self._normalize_text(match.group(1))
        return None

    def _extract_numeric_metadata(self, lines: list[str], prefix: str) -> int | None:
        """
        提取元信息中的数值字段.

        用途:
            解析总分和考试时间等带数字的元信息.
        参数:
            lines: 正文文本行.
            prefix: 目标字段前缀.
        返回值:
            int | None: 解析出的整数值.
        异常:
            无.
        """
        pattern = re.compile(rf"{re.escape(prefix)}[:\uFF1A]\s*(\d+)")
        for line in lines[:8]:
            match = pattern.search(line)
            if match:
                return int(match.group(1))
        return None

    def _build_answer_lookup(
        self,
        answer_lines: list[str],
        warning_messages: list[str],
    ) -> dict[ExamQuestionType, dict[int, list[str] | str]]:
        """
        构建答案索引映射.

        用途:
            从参考答案章节提取客观题答案和简答题参考答案.
        参数:
            answer_lines: 参考答案文本行.
            warning_messages: 告警信息列表.
        返回值:
            dict[ExamQuestionType, dict[int, list[str] | str]]: 分题型答案映射.
        异常:
            无.
        """
        answer_lookup: dict[ExamQuestionType, dict[int, list[str] | str]] = {
            ExamQuestionType.SINGLE_CHOICE: {},
            ExamQuestionType.MULTIPLE_CHOICE: {},
            ExamQuestionType.JUDGE: {},
            ExamQuestionType.SHORT_ANSWER: {},
        }
        current_section: ExamQuestionType | None = None
        short_answer_lines: list[str] = []

        for line in answer_lines:
            section_type = self._match_answer_section(line=line)
            if section_type is not None:
                current_section = section_type
                continue
            if current_section is None:
                continue
            if current_section is ExamQuestionType.SHORT_ANSWER:
                short_answer_lines.append(line)
                continue
            for question_no, answer_token in re.findall(r"(\d+)\.\s*([A-F]+|[√×])", line):
                normalized_answer = self._normalize_answer_token(
                    answer_token=answer_token,
                    question_type=current_section,
                )
                answer_lookup[current_section][int(question_no)] = normalized_answer

        if short_answer_lines:
            answer_lookup[ExamQuestionType.SHORT_ANSWER][1] = self._normalize_text(" ".join(short_answer_lines))
        elif answer_lines:
            warning_messages.append("未识别到简答题参考答案, 已保留空值.")

        return answer_lookup

    def _match_answer_section(self, line: str) -> ExamQuestionType | None:
        """
        匹配答案段所属题型.

        用途:
            将参考答案正文中的标题映射为标准题型枚举.
        参数:
            line: 当前文本行.
        返回值:
            ExamQuestionType | None: 匹配到的题型, 未匹配时返回 None.
        异常:
            无.
        """
        for marker, section_type in self._ANSWER_MARKERS:
            if marker in line:
                return section_type
        return None

    def _normalize_answer_token(self, answer_token: str, question_type: ExamQuestionType) -> list[str]:
        """
        规范化答案内容.

        用途:
            将答案段中的原始标记统一转换为前后端可直接使用的结构.
        参数:
            answer_token: 原始答案标识.
            question_type: 当前题型.
        返回值:
            list[str]: 标准答案列表.
        异常:
            无.
        """
        cleaned_token = str(answer_token or "").strip().upper()
        if question_type is ExamQuestionType.JUDGE:
            return ["true" if cleaned_token == "√" else "false"]
        return [character for character in cleaned_token if character.isalpha()]

    def _parse_sections(
        self,
        question_lines: list[str],
        answer_lookup: dict[ExamQuestionType, dict[int, list[str] | str]],
        warning_messages: list[str],
    ) -> list[ExamSection]:
        """
        解析试卷分组.

        用途:
            根据题型标题切分正文, 并按不同题型解析题目列表.
        参数:
            question_lines: 正文文本行.
            answer_lookup: 答案映射.
            warning_messages: 告警信息列表.
        返回值:
            list[ExamSection]: 解析得到的分组列表.
        异常:
            无.
        """
        sections: list[ExamSection] = []
        current_section_type: ExamQuestionType | None = None
        current_section_title = ""
        current_section_lines: list[str] = []

        for line in question_lines:
            section_match = self._match_question_section(line=line)
            if section_match is not None:
                if current_section_type is not None:
                    sections.append(
                        self._build_section(
                            section_type=current_section_type,
                            section_title=current_section_title,
                            section_lines=current_section_lines,
                            answer_lookup=answer_lookup,
                            warning_messages=warning_messages,
                        )
                    )
                current_section_title = line
                current_section_type = section_match
                current_section_lines = []
                continue
            if current_section_type is not None:
                current_section_lines.append(line)

        if current_section_type is not None:
            sections.append(
                self._build_section(
                    section_type=current_section_type,
                    section_title=current_section_title,
                    section_lines=current_section_lines,
                    answer_lookup=answer_lookup,
                    warning_messages=warning_messages,
                )
            )

        return sections

    def _match_question_section(self, line: str) -> ExamQuestionType | None:
        """
        匹配正文中的题型分组标题.

        用途:
            将正文里的单选, 多选, 判断, 简答分组映射为标准枚举.
        参数:
            line: 当前文本行.
        返回值:
            ExamQuestionType | None: 匹配到的题型.
        异常:
            无.
        """
        for marker, section_type in self._SECTION_MARKERS:
            if marker in line:
                return section_type
        return None

    def _build_section(
        self,
        section_type: ExamQuestionType,
        section_title: str,
        section_lines: list[str],
        answer_lookup: dict[ExamQuestionType, dict[int, list[str] | str]],
        warning_messages: list[str],
    ) -> ExamSection:
        """
        构建单个分组实体.

        用途:
            解析分组标题中的题量和分值, 并进一步生成题目列表.
        参数:
            section_type: 分组题型.
            section_title: 分组标题.
            section_lines: 分组正文.
            answer_lookup: 答案映射.
            warning_messages: 告警信息列表.
        返回值:
            ExamSection: 构建完成的分组对象.
        异常:
            无.
        """
        question_count = self._extract_number_by_pattern(text=section_title, pattern=r"共\s*(\d+)\s*题")
        score_per_question = self._extract_number_by_pattern(text=section_title, pattern=r"每题\s*(\d+)")
        parsed_questions = self._parse_questions(
            section_type=section_type,
            section_lines=section_lines,
            score_per_question=score_per_question or 0,
            answer_lookup=answer_lookup,
            warning_messages=warning_messages,
        )
        if question_count is not None and question_count != len(parsed_questions):
            warning_messages.append(f"{section_title} 声明题量为 {question_count}, 实际解析为 {len(parsed_questions)}.")
        return ExamSection(
            section_type=section_type,
            section_title=section_title,
            question_count=question_count or len(parsed_questions),
            score_per_question=score_per_question or 0,
            questions=parsed_questions,
        )

    def _extract_number_by_pattern(self, text: str, pattern: str) -> int | None:
        """
        根据正则模式提取整数值.

        用途:
            复用题量和每题分值的解析逻辑.
        参数:
            text: 原始文本.
            pattern: 正则表达式.
        返回值:
            int | None: 提取到的整数值.
        异常:
            无.
        """
        match = re.search(pattern, text)
        if match:
            return int(match.group(1))
        return None

    def _parse_questions(
        self,
        section_type: ExamQuestionType,
        section_lines: list[str],
        score_per_question: int,
        answer_lookup: dict[ExamQuestionType, dict[int, list[str] | str]],
        warning_messages: list[str],
    ) -> list[ExamQuestion]:
        """
        按题型解析题目列表.

        用途:
            为不同题型选择对应的题块解析逻辑.
        参数:
            section_type: 当前题型.
            section_lines: 分组正文.
            score_per_question: 每题分值.
            answer_lookup: 答案映射.
            warning_messages: 告警信息列表.
        返回值:
            list[ExamQuestion]: 题目列表.
        异常:
            无.
        """
        question_blocks = self._split_question_blocks(
            section_type=section_type,
            section_lines=section_lines,
        )
        parsed_questions: list[ExamQuestion] = []
        for index, block in enumerate(question_blocks, start=1):
            if section_type in {ExamQuestionType.SINGLE_CHOICE, ExamQuestionType.MULTIPLE_CHOICE}:
                parsed_questions.append(
                    self._parse_choice_question(
                        section_type=section_type,
                        question_block=block,
                        fallback_question_no=index,
                        score_per_question=score_per_question,
                        answer_lookup=answer_lookup,
                        warning_messages=warning_messages,
                    )
                )
                continue
            if section_type is ExamQuestionType.JUDGE:
                parsed_questions.append(
                    self._parse_judge_question(
                        question_block=block,
                        fallback_question_no=index,
                        score_per_question=score_per_question,
                        answer_lookup=answer_lookup,
                    )
                )
                continue
            parsed_questions.append(
                self._parse_short_answer_question(
                    question_block=block,
                    fallback_question_no=index,
                    score_per_question=score_per_question,
                    answer_lookup=answer_lookup,
                )
            )
        return parsed_questions

    def _split_question_blocks(
        self,
        section_type: ExamQuestionType,
        section_lines: list[str],
    ) -> list[list[str]]:
        """
        按题号切分题块.

        用途:
            将一个分组中的多行文本切分成按题组织的块结构.
        参数:
            section_type: 当前题型.
            section_lines: 分组正文.
        返回值:
            list[list[str]]: 每道题对应的文本块.
        异常:
            无.
        """
        if section_type in {ExamQuestionType.SINGLE_CHOICE, ExamQuestionType.MULTIPLE_CHOICE}:
            return self._split_choice_blocks(section_lines=section_lines)
        if section_type is ExamQuestionType.JUDGE:
            return self._split_judge_blocks(section_lines=section_lines)
        return self._split_short_answer_blocks(section_lines=section_lines)

    def _split_choice_blocks(self, section_lines: list[str]) -> list[list[str]]:
        """
        切分单选题或多选题题块.

        用途:
            兼容题号缺失的 Word 排版, 在选项结束后遇到新题干时自动分块.
        参数:
            section_lines: 选择题分组正文.
        返回值:
            list[list[str]]: 选择题题块列表.
        异常:
            无.
        """
        question_blocks: list[list[str]] = []
        current_block: list[str] = []
        has_option_line = False

        for line in section_lines:
            if self._QUESTION_START_PATTERN.match(line):
                if current_block:
                    question_blocks.append(current_block)
                current_block = [line]
                has_option_line = False
                continue
            if self._should_skip_choice_hint(line=line, current_block=current_block):
                continue
            if not current_block:
                current_block = [line]
                has_option_line = self._is_option_line(line=line)
                continue
            if not self._is_option_line(line=line) and has_option_line:
                question_blocks.append(current_block)
                current_block = [line]
                has_option_line = False
                continue
            current_block.append(line)
            if self._is_option_line(line=line):
                has_option_line = True

        if current_block:
            question_blocks.append(current_block)
        return question_blocks

    def _split_judge_blocks(self, section_lines: list[str]) -> list[list[str]]:
        """
        切分判断题题块.

        用途:
            将判断题正文按行切分, 并跳过说明性提示文本.
        参数:
            section_lines: 判断题分组正文.
        返回值:
            list[list[str]]: 判断题题块列表.
        异常:
            无.
        """
        question_blocks: list[list[str]] = []
        for line in section_lines:
            if "对的打" in line:
                continue
            if self._normalize_text(line):
                question_blocks.append([line])
        return question_blocks

    def _split_short_answer_blocks(self, section_lines: list[str]) -> list[list[str]]:
        """
        切分简答题题块.

        用途:
            兼容只有一题且题号缺失的简答题格式.
        参数:
            section_lines: 简答题分组正文.
        返回值:
            list[list[str]]: 简答题题块列表.
        异常:
            无.
        """
        question_blocks = self._split_blocks_by_explicit_number(section_lines=section_lines)
        if question_blocks:
            return question_blocks
        normalized_lines = [line for line in section_lines if self._normalize_text(line)]
        return [normalized_lines] if normalized_lines else []

    def _split_blocks_by_explicit_number(self, section_lines: list[str]) -> list[list[str]]:
        """
        按显式题号切分题块.

        用途:
            为带有明确数字题号的场景提供通用切分逻辑.
        参数:
            section_lines: 分组正文.
        返回值:
            list[list[str]]: 按题号切分的题块列表.
        异常:
            无.
        """
        question_blocks: list[list[str]] = []
        current_block: list[str] = []
        found_explicit_number = False

        for line in section_lines:
            if self._QUESTION_START_PATTERN.match(line):
                found_explicit_number = True
                if current_block:
                    question_blocks.append(current_block)
                current_block = [line]
                continue
            if current_block:
                current_block.append(line)

        if current_block:
            question_blocks.append(current_block)
        return question_blocks if found_explicit_number else []

    def _should_skip_choice_hint(self, line: str, current_block: list[str]) -> bool:
        """
        判断是否跳过选择题说明文本.

        用途:
            过滤多选题说明行等非题目内容, 避免误判为题干.
        参数:
            line: 当前文本行.
            current_block: 当前正在构建的题块.
        返回值:
            bool: True 表示应跳过, False 表示应参与解析.
        异常:
            无.
        """
        if current_block:
            return False
        return "不得分" in line

    def _is_option_line(self, line: str) -> bool:
        """
        判断当前文本行是否为选项行.

        用途:
            识别以 A-F 选项起始的正文行.
        参数:
            line: 当前文本行.
        返回值:
            bool: True 表示为选项行.
        异常:
            无.
        """
        return bool(re.search(r"[A-F]\.\s*", line))

    def _parse_choice_question(
        self,
        section_type: ExamQuestionType,
        question_block: list[str],
        fallback_question_no: int,
        score_per_question: int,
        answer_lookup: dict[ExamQuestionType, dict[int, list[str] | str]],
        warning_messages: list[str],
    ) -> ExamQuestion:
        """
        解析单选题或多选题.

        用途:
            识别题号, 题干, 选项和标准答案.
        参数:
            section_type: 当前题型.
            question_block: 当前题块.
            fallback_question_no: 题号缺失时的顺序补号.
            score_per_question: 每题分值.
            answer_lookup: 答案映射.
            warning_messages: 告警信息列表.
        返回值:
            ExamQuestion: 解析后的题目实体.
        异常:
            ValidationError: 当题块起始格式非法时抛出.
        """
        question_no, first_line_body = self._extract_question_start(
            question_line=question_block[0],
            fallback_question_no=fallback_question_no,
        )
        stem_lines: list[str] = [first_line_body]
        option_lines: list[str] = []
        options_started = False

        for line in question_block[1:]:
            if re.search(r"[A-F]\.\s*", line):
                options_started = True
            if options_started:
                option_lines.append(line)
            else:
                stem_lines.append(line)

        normalized_stem = self._clean_stem(" ".join(stem_lines))
        options = self._parse_options(option_text=" ".join(option_lines))
        if not options:
            warning_messages.append(f"第 {question_no} 题未识别到选项.")

        answer_value = answer_lookup.get(section_type, {}).get(question_no, [])
        answer = answer_value if isinstance(answer_value, list) else []

        return ExamQuestion(
            question_no=question_no,
            question_type=section_type,
            stem=normalized_stem,
            score=score_per_question,
            options=options,
            answer=answer,
        )

    def _extract_question_start(
        self,
        question_line: str,
        fallback_question_no: int,
    ) -> tuple[int, str]:
        """
        提取题号和题干首行.

        用途:
            从题块首行中拆出题号和题干正文, 若缺失题号则按顺序补号.
        参数:
            question_line: 题块首行.
            fallback_question_no: 题号缺失时的顺序编号.
        返回值:
            tuple[int, str]: 题号和题干首行.
        异常:
            无.
        """
        match = self._QUESTION_START_PATTERN.match(question_line)
        if not match:
            return fallback_question_no, self._normalize_text(question_line)
        return int(match.group(1)), self._normalize_text(match.group(2))

    def _clean_stem(self, stem: str) -> str:
        """
        清洗题干中的答案痕迹.

        用途:
            去掉题干尾部可能残留的标准答案括号, 保留可展示文本.
        参数:
            stem: 原始题干.
        返回值:
            str: 清洗后的题干.
        异常:
            无.
        """
        cleaned_stem = self._normalize_text(stem)
        cleaned_stem = re.sub(r"[\(\uFF08]\s*[A-F√×]{0,8}\s*[\)\uFF09]?\s*$", "", cleaned_stem)
        return self._normalize_text(cleaned_stem)

    def _parse_options(self, option_text: str) -> list[ExamQuestionOption]:
        """
        解析选择题选项.

        用途:
            从合并后的选项文本中拆分出 A-F 选项列表.
        参数:
            option_text: 选项拼接文本.
        返回值:
            list[ExamQuestionOption]: 解析出的选项列表.
        异常:
            无.
        """
        normalized_option_text = self._normalize_text(option_text)
        if not normalized_option_text:
            return []

        options: list[ExamQuestionOption] = []
        for option_key, option_value in re.findall(r"([A-F])\.\s*(.*?)(?=(?:\s*[A-F]\.\s*)|$)", normalized_option_text):
            options.append(
                ExamQuestionOption(
                    key=option_key,
                    text=self._normalize_text(option_value),
                )
            )
        return options

    def _parse_judge_question(
        self,
        question_block: list[str],
        fallback_question_no: int,
        score_per_question: int,
        answer_lookup: dict[ExamQuestionType, dict[int, list[str] | str]],
    ) -> ExamQuestion:
        """
        解析判断题.

        用途:
            将判断题统一映射为 true 和 false 两个选项.
        参数:
            question_block: 当前题块.
            fallback_question_no: 题号缺失时的顺序补号.
            score_per_question: 每题分值.
            answer_lookup: 答案映射.
        返回值:
            ExamQuestion: 解析后的判断题实体.
        异常:
            ValidationError: 当题块起始格式非法时抛出.
        """
        question_no, first_line_body = self._extract_question_start(
            question_line=question_block[0],
            fallback_question_no=fallback_question_no,
        )
        stem = self._clean_stem(" ".join([first_line_body, *question_block[1:]]))
        answer_value = answer_lookup.get(ExamQuestionType.JUDGE, {}).get(question_no, [])
        answer = answer_value if isinstance(answer_value, list) else []

        return ExamQuestion(
            question_no=question_no,
            question_type=ExamQuestionType.JUDGE,
            stem=stem,
            score=score_per_question,
            options=[*self._JUDGE_OPTIONS],
            answer=answer,
        )

    def _parse_short_answer_question(
        self,
        question_block: list[str],
        fallback_question_no: int,
        score_per_question: int,
        answer_lookup: dict[ExamQuestionType, dict[int, list[str] | str]],
    ) -> ExamQuestion:
        """
        解析简答题.

        用途:
            保留题干并尽量关联评分标准或参考答案文本.
        参数:
            question_block: 当前题块.
            fallback_question_no: 题号缺失时的顺序补号.
            score_per_question: 每题分值.
            answer_lookup: 答案映射.
        返回值:
            ExamQuestion: 解析后的简答题实体.
        异常:
            ValidationError: 当题块起始格式非法时抛出.
        """
        question_no, first_line_body = self._extract_question_start(
            question_line=question_block[0],
            fallback_question_no=fallback_question_no,
        )
        reference_answer_value = answer_lookup.get(ExamQuestionType.SHORT_ANSWER, {}).get(question_no)
        reference_answer = reference_answer_value if isinstance(reference_answer_value, str) else None

        return ExamQuestion(
            question_no=question_no,
            question_type=ExamQuestionType.SHORT_ANSWER,
            stem=self._normalize_text(" ".join([first_line_body, *question_block[1:]])),
            score=score_per_question,
            reference_answer=reference_answer,
        )


__all__ = ["WordExamParser"]
