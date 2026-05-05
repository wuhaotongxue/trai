#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: agent_types.py
# 作者: wuhao
# 日期: 2026_05_04_19:00:00
# 描述: Agent 类型定义和多模态能力 (Skills合规: 类封装)

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable


class AgentType(str, Enum):
    """Agent 类型枚举"""
    
    # 对话类
    CHAT = "chat"                          # 通用对话Agent
    CODE_ASSISTANT = "code_assistant"       # 编程助手
    TRANSLATOR = "translator"              # 翻译专家
    WRITER = "writer"                      # 写作助手
    
    # 视觉类
    VISION = "vision"                      # 图像理解
    IMAGE_GENERATOR = "image_generator"   # 图像生成(文生图)
    IMAGE_EDITOR = "image_editor"         # 图像编辑
    OCR_AGENT = "ocr_agent"               # OCR文字识别
    
    # 音频类
    SPEECH_TO_TEXT = "speech_to_text"      # 语音转文字
    TEXT_TO_SPEECH = "text_to_speech"      # 文字转语音
    AUDIO_ANALYZER = "audio_analyzer"     # 音频分析
    
    # 文档类
    PDF_PARSER = "pdf_parser"             # PDF解析
    DOCUMENT_QA = "document_qa"           # 文档问答
    SUMMARIZER = "summarizer"            # 摘要生成
    
    # 数据类
    DATA_ANALYST = "data_analyst"        # 数据分析师
    CHART_GENERATOR = "chart_generator"  # 图表生成
    EXCEL_PROCESSOR = "excel_processor"  # Excel处理


class ModalityType(str, Enum):
    """模态类型"""
    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    PDF = "pdf"
    DOCUMENT = "document"
    CODE = "code"
    TABLE = "table"


@dataclass
class AgentCapability:
    """Agent 能力描述"""
    input_modalities: list[ModalityType]   # 支持的输入模态
    output_modalities: list[ModalityType]  # 支持的输出模态
    max_input_size_mb: int = 10            # 最大输入大小(MB)
    supported_formats: list[str] = field(default_factory=list)  # 支持的文件格式
    streaming_supported: bool = True       # 是否支持流式输出
    
    def can_handle(self, modality: ModalityType) -> bool:
        """检查是否支持指定模态"""
        return modality in self.input_modalities


@dataclass 
class AgentConfig:
    """Agent 配置"""
    agent_id: str
    name: str
    description: str
    type: AgentType
    capability: AgentCapability
    model: str = "gpt-4o"
    system_prompt: str = ""
    temperature: float = 0.7
    max_tokens: int = 4096
    tools: list[str] = field(default_factory=list)  # 可用工具列表
    metadata: dict[str, Any] = field(default_factory=dict)


# 预定义的 Agent 模板库
AGENT_TEMPLATES: dict[AgentType, AgentConfig] = {
    
    # ========== 对话类 Agent ==========
    AgentType.CHAT: AgentConfig(
        agent_id="chat_general",
        name="通用对话助手",
        description="通用AI助手,可回答各类问题,支持多轮对话",
        type=AgentType.CHAT,
        capability=AgentCapability(
            input_modalities=[ModalityType.TEXT],
            output_modalities=[ModalityType.TEXT],
            streaming_supported=True,
        ),
        model="gpt-4o",
        system_prompt="你是一个友好,专业的AI助手.请用清晰,准确的语言回答用户的问题.",
        temperature=0.7,
    ),
    
    AgentType.CODE_ASSISTANT: AgentConfig(
        agent_id="code_assistant",
        name="编程助手",
        description="专业编程助手,支持代码编写,调试,解释,优化",
        type=AgentType.CODE_ASSISTANT,
        capability=AgentCapability(
            input_modalities=[ModalityType.TEXT, ModalityType.CODE],
            output_modalities=[ModalityType.TEXT, ModalityType.CODE],
            streaming_supported=True,
        ),
        model="gpt-4o",
        system_prompt="""你是一个资深软件工程师,擅长:
1. 编写高质量,可维护的代码
2. 调试和修复bug
3. 代码审查和优化建议
4. 解释复杂的技术概念
5. 架构设计和最佳实践

请使用代码块格式输出代码,并添加必要的注释.""",
        temperature=0.3,  # 编程任务需要更精确
        tools=["code_executor", "search"],
    ),
    
    AgentType.TRANSLATOR: AgentConfig(
        agent_id="translator",
        name="翻译专家",
        description="多语言翻译专家,支持100+种语言的互译",
        type=AgentType.TRANSLATOR,
        capability=AgentCapability(
            input_modalities=[ModalityType.TEXT],
            output_modalities=[ModalityType.TEXT],
            streaming_supported=True,
        ),
        model="gpt-4o",
        system_prompt="""你是一个专业翻译专家,精通100+种语言.

翻译原则:
1. 准确传达原文含义,不遗漏或添加信息
2. 符合目标语言的表达习惯和文化背景
3. 保持原文的语气和风格
4. 专业术语翻译要准确一致
5. 对于无法确定的内容,提供备选翻译

格式要求:
- 原文: [原文内容]
- 翻译: [译文内容]
- 注释: [如有特殊说明]""",
        temperature=0.4,
        tools=["translate_tool", "dictionary"],
    ),
    
    AgentType.WRITER: AgentConfig(
        agent_id="writer",
        name="写作助手",
        description="专业写作助手,支持文章,邮件,报告等多种文体创作",
        type=AgentType.WRITER,
        capability=AgentCapability(
            input_modalities=[ModalityType.TEXT],
            output_modalities=[ModalityType.TEXT],
            streaming_supported=True,
        ),
        model="gpt-4o",
        system_prompt="""你是一位专业作家,擅长各种文体创作:
- 商务邮件,公文报告
- 技术文档,产品说明
- 创意文案,营销内容
- 学术论文,研究摘要
- 社交媒体内容

写作原则:
1. 明确写作目的和受众
2. 结构清晰,逻辑严谨
3. 语言精炼,表达准确
4. 符合文体规范和格式要求
5. 可根据用户需求调整风格""",
        temperature=0.8,
    ),
    
    # ========== 视觉类 Agent ==========
    AgentType.VISION: AgentConfig(
        agent_id="vision",
        name="图像理解助手",
        description="图像理解和分析,支持图片描述,OCR,物体识别等",
        type=AgentType.VISION,
        capability=AgentCapability(
            input_modalities=[ModalityType.IMAGE, ModalityType.TEXT],
            output_modalities=[ModalityType.TEXT],
            max_input_size_mb=20,
            supported_formats=["jpg", "jpeg", "png", "gif", "webp", "bmp"],
            streaming_supported=False,
        ),
        model="gpt-4o-vision-preview",
        system_prompt="""你是一个视觉AI助手,能够理解和分析图像.

能力范围:
1. 详细描述图像内容和场景
2. 识别图像中的文字(OCR)
3. 分析物体,人物,场景
4. 解读图表和数据可视化
5. 回答关于图像的问题

回答要求:
- 描述准确,详细但不冗余
- 如有不确定之处,明确指出
- 使用结构化方式组织信息""",
        temperature=0.4,
    ),
    
    AgentType.IMAGE_GENERATOR: AgentConfig(
        agent_id="image_generator",
        name="AI绘图师",
        description="根据文字描述生成图像,支持多种艺术风格",
        type=AgentType.IMAGE_GENERATOR,
        capability=AgentCapability(
            input_modalities=[ModalityType.TEXT],
            output_modalities=[ModalityType.IMAGE],
            streaming_supported=False,
        ),
        model="dall-e-3",
        system_prompt="你是AI图像生成助手,将用户的文字描述转化为精美的图像.",
        temperature=1.0,  # 创意性任务
    ),
    
    AgentType.IMAGE_EDITOR: AgentConfig(
        agent_id="image_editor",
        name="图像编辑器",
        description="智能图像编辑,支持局部修改,风格转换,滤镜效果等",
        type=AgentType.IMAGE_EDITOR,
        capability=AgentCapability(
            input_modalities=[ModalityType.IMAGE, ModalityType.TEXT],
            output_modalities=[ModalityType.IMAGE],
            max_input_size_mb=20,
            supported_formats=["jpg", "jpeg", "png", "webp"],
            streaming_supported=False,
        ),
        model="gpt-4o-vision-preview",
        system_prompt="你是图像编辑专家,能根据用户指令智能修改图像.",
    ),
    
    AgentType.OCR_AGENT: AgentConfig(
        agent_id="ocr_agent",
        name="OCR识别引擎",
        description="高精度文字识别,支持扫描件,手写体,多语言文本",
        type=AgentType.OCR_AGENT,
        capability=AgentCapability(
            input_modalities=[ModalityType.IMAGE],
            output_modalities=[ModalityType.TEXT, ModalityType.DOCUMENT],
            max_input_size_mb=20,
            supported_formats=["jpg", "jpeg", "png", "pdf", "tiff", "bmp"],
            streaming_supported=False,
        ),
        model="gpt-4o-vision-preview",
        system_prompt="""你是高精度OCR引擎,专门用于从图像中提取文字.

提取规则:
1. 尽可能准确地识别所有可见文字
2. 保持原有的排版结构和格式
3. 标注不确定或模糊的文字
4. 识别表格时保持行列关系
5. 输出Markdown或纯文本格式""",
        temperature=0.1,  # OCR需要高精度
    ),
    
    # ========== 音频类 Agent ==========
    AgentType.SPEECH_TO_TEXT: AgentConfig(
        agent_id="stt",
        name="语音转文字",
        description="语音识别,支持多种语言和方言",
        type=AgentType.SPEECH_TO_TEXT,
        capability=AgentCapability(
            input_modalities=[ModalityType.AUDIO],
            output_modalities=[ModalityType.TEXT],
            max_input_size_mb=25,
            supported_formats=["mp3", "wav", "m4a", "flac", "ogg", "webm"],
            streaming_supported=True,
        ),
        model="whisper-1",
        system_prompt="将语音转换为准确的文字记录.",
    ),
    
    AgentType.TEXT_TO_SPEECH: AgentConfig(
        agent_id="tts",
        name="文字转语音",
        description="自然语音合成,支持多种音色和语速调节",
        type=AgentType.TEXT_TO_SPEECH,
        capability=AgentCapability(
            input_modalities=[ModalityType.TEXT],
            output_modalities=[ModalityType.AUDIO],
            streaming_supported=True,
        ),
        model="tts-1",
        system_prompt="将文字转换为自然流畅的语音.",
    ),
    
    AgentType.AUDIO_ANALYZER: AgentConfig(
        agent_id="audio_analyzer",
        name="音频分析器",
        description="音频内容分析,包括音乐识别,情感分析,声音分类",
        type=AgentType.AUDIO_ANALYZER,
        capability=AgentCapability(
            input_modalities=[ModalityType.AUDIO],
            output_modalities=[ModalityType.TEXT],
            max_input_size_mb=25,
            supported_formats=["mp3", "wav", "flac", "aac"],
            streaming_supported=False,
        ),
        model="whisper-1",
        system_prompt="""你是音频分析专家,能够分析音频内容:
1. 音乐识别(歌曲名称,歌手,专辑)
2. 语音情感分析(情绪,语气)
3. 声音事件检测(环境音,乐器等)
4. 音质评估和建议""",
    ),
    
    # ========== 文档类 Agent ==========
    AgentType.PDF_PARSER: AgentConfig(
        agent_id="pdf_parser",
        name="PDF解析器",
        description="PDF文档解析,提取文本,表格,图片等内容",
        type=AgentType.PDF_PARSER,
        capability=AgentCapability(
            input_modalities=[ModalityType.PDF],
            output_modalities=[ModalityType.TEXT, ModalityType.TABLE, ModalityType.IMAGE],
            max_input_size_mb=50,
            supported_formats=["pdf"],
            streaming_supported=False,
        ),
        model="gpt-4o",
        system_prompt="""你是PDF文档解析专家,能够准确提取PDF中的所有内容:
1. 文本内容(保留格式和层级)
2. 表格数据(转换为结构化格式)
3. 图片和图表(描述和分析)
4. 元数据(标题,作者,日期等)
5. 目录和书签结构

输出为结构化的Markdown格式.""",
    ),
    
    AgentType.DOCUMENT_QA: AgentConfig(
        agent_id="document_qa",
        name="文档问答助手",
        description="基于文档内容的智能问答,支持长文档理解",
        type=AgentType.DOCUMENT_QA,
        capability=AgentCapability(
            input_modalities=[ModalityType.DOCUMENT, ModalityType.PDF, ModalityType.TEXT],
            output_modalities=[ModalityType.TEXT],
            max_input_size_mb=50,
            supported_formats=["pdf", "docx", "txt", "md"],
            streaming_supported=True,
        ),
        model="gpt-4o-turbo",
        system_prompt="""你是文档问答助手,基于提供的文档内容回答问题.

回答原则:
1. 仅基于文档内容回答,不编造信息
2. 引用文档中的具体位置(页码/段落)
3. 如果文档中没有相关信息,明确说明
4. 总结关键信息时保持准确性
5. 可以跨章节综合多个信息点""",
        temperature=0.3,
    ),
    
    AgentType.SUMMARIZER: AgentConfig(
        agent_id="summarizer",
        name="智能摘要生成",
        description="长文本/文档摘要,支持多种摘要风格",
        type=AgentType.SUMMARIZER,
        capability=AgentCapability(
            input_modalities=[ModalityType.TEXT, ModalityType.DOCUMENT],
            output_modalities=[ModalityType.TEXT],
            streaming_supported=True,
        ),
        model="gpt-4o",
        system_prompt="""你是摘要生成专家,能够创建高质量的文档摘要.

摘要类型:
1. 一句话摘要(核心要点)
2. 要点列表式摘要(3-5个关键点)
3. 详细摘要(保留主要论据)
4. 技术摘要(面向专业人士)
5. 非技术摘要(面向普通读者)

摘要原则:
- 准确反映原文核心观点
- 保持客观中立的立场
- 信息密度高,避免冗余
- 符合指定的长度限制""",
        temperature=0.5,
    ),
    
    # ========== 数据类 Agent ==========
    AgentType.DATA_ANALYST: AgentConfig(
        agent_id="data_analyst",
        name="数据分析师",
        description="数据分析专家,支持统计分析和洞察发现",
        type=AgentType.DATA_ANALYST,
        capability=AgentCapability(
            input_modalities=[ModalityType.TABLE, ModalityType.TEXT, ModalityType.CODE],
            output_modalities=[ModalityType.TEXT, ModalityType.TABLE, ModalityType.CHART],
            streaming_supported=True,
        ),
        model="gpt-4o",
        system_prompt="""你是资深数据分析师,擅长:
1. 统计分析和假设检验
2. 趋势分析和预测建模
3. 数据可视化和报表制作
4. 异常检测和根因分析
5. 业务洞察和建议

分析方法:
- 描述性统计(均值,中位数,标准差等)
- 相关性和回归分析
- 时间序列分析
- A/B测试结果解读

输出要求:
- 使用清晰的数据表格
- 提供可操作的洞察
- 说明分析方法和局限性""",
        temperature=0.4,
        tools=["calculator", "python_executor"],
    ),
    
    AgentType.CHART_GENERATOR: AgentConfig(
        agent_id="chart_generator",
        name="图表生成器",
        description="根据数据自动生成各类图表(柱状图/折线图/饼图等)",
        type=AgentType.CHART_GENERATOR,
        capability=AgentCapability(
            input_modalities=[ModalityType.TABLE, ModalityType.TEXT],
            output_modalities=[ModalityType.IMAGE, ModalityType.CODE],
            streaming_supported=False,
        ),
        model="gpt-4o",
        system_prompt="你是图表设计专家,能根据数据选择最合适的图表类型并生成.",
        tools=["matplotlib_renderer", "plotly_renderer"],
    ),
    
    AgentType.EXCEL_PROCESSOR: AgentConfig(
        agent_id="excel_processor",
        name="Excel处理器",
        description="Excel文件处理,支持公式计算,数据清洗,格式转换",
        type=AgentType.EXCEL_PROCESSOR,
        capability=AgentCapability(
            input_modalities=[ModalityType.TABLE],
            output_modalities=[ModalityType.TABLE, ModalityType.TEXT, ModalityType.CODE],
            max_input_size_mb=10,
            supported_formats=["xlsx", "xls", "csv"],
            streaming_supported=False,
        ),
        model="gpt-4o",
        system_prompt="""你是Excel处理专家,能够:
1. 解析和理解Excel文件结构
2. 执行公式和计算
3. 数据清洗和转换
4. 创建透视表和图表
5. 自动化重复操作

输出格式可以是Python代码(pandas/openpyxl)或直接的结果数据.""",
        temperature=0.3,
        tools=["pandas_processor", "formula_calculator"],
    ),
}


def get_agent_template(agent_type: AgentType) -> AgentConfig | None:
    """
    获取Agent模板配置
    
    Args:
        agent_type: Agent类型
        
    Returns:
        AgentConfig | None: 配置对象
    """
    return AGENT_TEMPLATES.get(agent_type)


def get_all_agent_types() -> list[dict]:
    """
    获取所有可用Agent类型的简要信息
    
    Returns:
        Agent信息列表
    """
    result = []
    for config in AGENT_TEMPLATES.values():
        result.append({
            "agent_id": config.agent_id,
            "name": config.name,
            "description": config.description,
            "type": config.type.value,
            "model": config.model,
            "input_modalities": [m.value for m in config.capability.input_modalities],
            "output_modalities": [m.value for m in config.capability.output_modalities],
            "streaming": config.capability.streaming_supported,
        })
    return result


__all__ = [
    "AgentType", "ModalityType", "AgentCapability", "AgentConfig",
    "AGENT_TEMPLATES", "get_agent_template", "get_all_agent_types",
]
