#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: agent_orchestrator.py
# 作者: wuhao
# 日期: 2026_05_04_19:30:00
# 描述: Agent编排器 - 多Agent路由和协作 (Skills合规: 类封装)

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable

from loguru import logger

from infrastructure.agent.types.agent_types import (
    AgentType,
    AgentConfig,
    ModalityType,
    get_agent_template,
    get_all_agent_types,
)


class TaskType(str, Enum):
    """任务类型枚举"""
    CHAT = "chat"                    # 普通对话
    CODE = "code"                    # 编程相关
    TRANSLATE = "translate"          # 翻译
    WRITE = "write"                  # 写作
    IMAGE_ANALYSIS = "image_analysis"  # 图像分析
    IMAGE_GENERATE = "image_generate"  # 图像生成
    AUDIO_TRANSCRIBE = "audio_transcribe"  # 语音转文字
    AUDIO_SYNTHESIZE = "audio_synthesize"  # 文字转语音
    PDF_PARSE = "pdf_parse"          # PDF解析
    DOCUMENT_QA = "document_qa"      # 文档问答
    SUMMARIZE = "summarize"          # 摘要
    DATA_ANALYSIS = "data_analysis"  # 数据分析
    EXCEL_PROCESS = "excel_process"  # Excel处理


@dataclass
class RoutingResult:
    """路由结果数据结构"""
    task_type: TaskType
    agent_type: AgentType
    confidence: float               # 路由置信度(0-1)
    reasoning: str                  # 路由原因
    fallback_agents: list[AgentType] = field(default_factory=list)  # 备选Agent


@dataclass 
class OrchestratedTask:
    """编排后的任务数据结构"""
    task_id: str
    task_type: TaskType
    primary_agent: AgentConfig      # 主Agent配置
    sub_tasks: list[Any] = field(default_factory=list)  # 子任务列表
    context: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


class AgentOrchestrator:
    """
    Agent编排器类 (Skills 规范: 强制类封装)
    
    功能:
    - 智能任务路由(根据用户输入自动选择最佳Agent)
    - 多Agent协作(复杂任务分解为子任务)
    - 任务优先级管理
    - 执行结果聚合
    - 回退机制(主Agent失败时切换备选)
    
    使用示例:
        orchestrator = AgentOrchestrator()
        
        # 自动路由
        result = await orchestrator.route("帮我翻译这段英文")
        
        # 手动指定Agent类型
        task = orchestrator.create_task(AgentType.CODE_ASSISTANT, user_input)
    """
    
    # 关键词路由规则 (简单但有效的启发式方法)
    ROUTING_RULES: dict[TaskType, list[str]] = {
        TaskType.CODE: [
            r'\b(code|代码|编程|program|function|函数|class|类|bug|debug|调试|'
            r'api|接口|database|数据库|sql|python|java|javascript|react|vue|'
            r'algorithm|算法|数据结构|git|docker|部署|deploy)\b',
            r'(写|实现|创建|修复|优化|重构|解释|调试).*?(代码|程序|功能)',
            r'how\s+to\s+(code|implement|build|fix|debug)',
            r'error|exception|报错|错误',
        ],
        TaskType.TRANSLATE: [
            r'\b(translate|翻译|把.*?翻译成|将.*?译为|中译英|英译中)\b',
            r'translate\s+(to|into|from)',
            r'(翻译|译文|英文|中文|日文|韩文|法文|德文)',
        ],
        TaskType.WRITE: [
            r'\b(write|写作|写一篇|撰写|起草|生成|create|draft|compose)\b',
            r'(文章|报告|邮件|文案|博客|论文|总结|周报|计划书)',
            r'(help me write|write a|draft an)',
        ],
        TaskType.IMAGE_ANALYSIS: [
            r'\b(describe|描述|分析|识别|看下|看看|这是什么|what is this|'
            r'analyze image|图片|照片|截图|图像)\b',
            r'(这张图|图中|图片里|in the picture|the image)',
        ],
        TaskType.IMAGE_GENERATE: [
            r'\b(generate|生成|画|draw|create|design|设计|绘制|创作)\b',
            r'(一张图|一幅画|image|picture|illustration|logo|图标)',
            r'(生成图片|画一个|create an image|generate a picture)',
        ],
        TaskType.AUDIO_TRANSCRIBE: [
            r'\b(transcribe|转录|转文字|语音转文本|speech to text|识别语音)\b',
            r'(录音|音频|audio file|voice message)',
        ],
        TaskType.PDF_PARSE: [
            r'\b(parse|解析|提取|read pdf|pdf文件|PDF文档)\b',
            r'\.pdf\b',
            r'(读取|打开|分析).*?(pdf|PDF)',
        ],
        TaskType.DOCUMENT_QA: [
            r'\b(document qa|文档问答|基于文档|according to|based on the document)\b',
            r'(关于这个文档|文档中的|in the document)',
        ],
        TaskType.SUMMARIZE: [
            r'\b(summarize|摘要|总结|概括|概述|sum up|brief|condense)\b',
            r'(做一个总结|简要说明|give me a summary)',
        ],
        TaskType.DATA_ANALYSIS: [
            r'\b(analyze data|数据分析|统计|图表|chart|graph|plot|可视化)\b',
            r'(数据集|dataset|csv|excel|表格|table)',
            r'(分析|analyze|统计|calculate|计算)',
        ],
        TaskType.EXCEL_PROCESS: [
            r'\b(excel|spreadsheet|表格处理|数据处理|pivot table|透视表)\b',
            r'\.(xlsx?|csv)\b',
            r'(处理.*?excel|操作.*?表格)',
        ],
    }
    
    def __init__(self):
        """初始化编排器"""
        self._custom_routers: list[Callable] = []  # 自定义路由器
        
        # Agent类型到任务的映射
        self._agent_task_map: dict[AgentType, TaskType] = {
            AgentType.CHAT: TaskType.CHAT,
            AgentType.CODE_ASSISTANT: TaskType.CODE,
            AgentType.TRANSLATOR: TaskType.TRANSLATE,
            AgentType.WRITER: TaskType.WRITE,
            AgentType.VISION: TaskType.IMAGE_ANALYSIS,
            AgentType.IMAGE_GENERATOR: TaskType.IMAGE_GENERATE,
            AgentType.SPEECH_TO_TEXT: TaskType.AUDIO_TRANSCRIBE,
            AgentType.TEXT_TO_SPEECH: TaskType.AUDIO_SYNTHESIZE,
            AgentType.PDF_PARSER: TaskType.PDF_PARSE,
            AgentType.DOCUMENT_QA: TaskType.DOCUMENT_QA,
            AgentType.SUMMARIZER: TaskType.SUMMARIZE,
            AgentType.DATA_ANALYST: TaskType.DATA_ANALYSIS,
            AgentType.EXCEL_PROCESSOR: TaskType.EXCEL_PROCESS,
        }
        
        logger.info("AgentOrchestrator initialized")
    
    async def route(
        self,
        user_input: str,
        attachments: list[str] | None = None,
        **kwargs,
    ) -> RoutingResult:
        """
        智能任务路由
        
        Args:
            user_input: 用户输入文本
            attachments: 附件类型列表(image/pdf/audio等)
            
        Returns:
            RoutingResult: 路由结果(包含推荐的Agent)
        """
        import uuid
        
        best_match = None
        best_confidence = 0.0
        matches = []
        
        input_lower = user_input.lower()
        
        # 1. 基于关键词的规则匹配
        for task_type, patterns in self.ROUTING_RULES.items():
            for pattern in patterns:
                if re.search(pattern, input_lower, re.IGNORECASE):
                    confidence = self._calculate_pattern_confidence(pattern, input_lower)
                    matches.append((task_type, confidence))
                    
                    if confidence > best_confidence:
                        best_confidence = confidence
                        best_match = task_type
        
        # 2. 基于附件类型的判断
        if attachments:
            for attachment_type in attachments:
                if attachment_type == "image":
                    if not best_match or best_confidence < 0.7:
                        # 判断是图像分析还是OCR
                        if any(kw in input_lower for kw in ["ocr", "文字", "text", "识别"]):
                            best_match = TaskType.IMAGE_ANALYSIS
                            best_confidence = 0.85
                        else:
                            best_match = TaskType.IMAGE_ANALYSIS
                            best_confidence = 0.8
                
                elif attachment_type == "pdf":
                    best_match = TaskType.PDF_PARSE
                    best_confidence = 0.9
                    
                elif attachment_type == "audio":
                    best_match = TaskType.AUDIO_TRANSCRIBE
                    best_confidence = 0.9
        
        # 3. 默认回退到通用聊天
        if not best_match or best_confidence < 0.3:
            best_match = TaskType.CHAT
            best_confidence = 0.5
            logger.info(f"No clear match, defaulting to CHAT | input={user_input[:50]}...")
        
        # 4. 获取对应的Agent类型
        agent_type = self._task_to_agent(best_match)
        agent_config = get_agent_template(agent_type)
        
        # 5. 生成备选Agent列表
        fallbacks = self._get_fallback_agents(agent_type)
        
        routing_result = RoutingResult(
            task_type=best_match,
            agent_type=agent_type,
            confidence=best_confidence,
            reasoning=self._generate_routing_reasoning(best_match, user_input),
            fallback_agents=fallbacks,
        )
        
        logger.info(
            f"Task routed | type={best_match.value} | "
            f"agent={agent_type.value} | confidence={best_confidence:.2f}"
        )
        
        return routing_result
    
    def create_task(
        self,
        agent_type: AgentType,
        user_input: str,
        context: dict[str, Any] | None = None,
        **kwargs,
    ) -> OrchestratedTask:
        """
        创建编排任务(手动指定Agent)
        
        Args:
            agent_type: Agent类型
            user_input: 用户输入
            context: 额外上下文
            
        Returns:
            OrchestratedTask: 编排后的任务对象
        """
        import uuid
        
        agent_config = get_agent_template(agent_type)
        if not agent_config:
            raise ValueError(f"Unknown agent type: {agent_type}")
        
        task = OrchestratedTask(
            task_id=str(uuid.uuid4())[:12],
            task_type=self._agent_task_map.get(agent_type, TaskType.CHAT),
            primary_agent=agent_config,
            context=context or {},
        )
        
        logger.info(f"Task created | id={task.task_id} | agent={agent_type.value}")
        
        return task
    
    async def decompose_complex_task(
        self,
        user_input: str,
        max_subtasks: int = 5,
    ) -> list[OrchestratedTask]:
        """
        分解复杂任务为多个子任务(异步版本)
        
        Args:
            user_input: 用户输入(可能包含多个需求)
            max_subtasks: 最大子任务数
            
        Returns:
            子任务列表
        """
        subtasks = []
        
        # 简单的任务分解逻辑(基于分隔符和关键词)
        segments = re.split(r'[;;,,.\n]+', user_input)
        
        for segment in segments[:max_subtasks]:
            segment = segment.strip()
            if len(segment) < 3:  # 忽略太短的片段
                continue
            
            try:
                routing = await self.route(segment)
                
                subtask = self.create_task(
                    agent_type=routing.agent_type,
                    user_input=segment,
                    context={"original_input": user_input},
                )
                
                subtasks.append(subtask)
                
            except Exception as e:
                logger.warning(f"Failed to route subtask: {segment[:30]}... | error={e}")
        
        if len(subtasks) > 1:
            logger.info(f"Complex task decomposed into {len(subtasks)} subtasks")
        
        return subtasks
    
    def _calculate_pattern_confidence(self, pattern: str, text: str) -> float:
        """
        计算模式匹配的置信度
        
        Args:
            pattern: 正则表达式模式
            text: 输入文本
            
        Returns:
            置信度分数(0-1)
        """
        try:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # 匹配位置越靠前, 置信度越高
                position_factor = 1.0 - (match.start() / max(len(text), 1)) * 0.3
                # 匹配长度越长, 置信度越高
                length_factor = min(len(match.group()) / 10, 1.0) * 0.2 + 0.8
                
                return min(position_factor * length_factor, 1.0)
        except Exception:
            pass
        
        return 0.5
    
    def _task_to_agent(self, task_type: TaskType) -> AgentType:
        """将任务类型转换为Agent类型"""
        
        mapping = {v: k for k, v in self._agent_task_map.items()}
        return mapping.get(task_type, AgentType.CHAT)
    
    def _get_fallback_agents(self, primary: AgentType) -> list[AgentType]:
        """获取备选Agent列表"""
        fallback_map = {
            AgentType.VISION: [AgentType.OCR_AGENT],
            AgentType.CODE_ASSISTANT: [AgentType.CHAT, AgentType.DATA_ANALYST],
            AgentType.PDF_PARSER: [AgentType.VISION, AgentType.DOCUMENT_QA],
            AgentType.DATA_ANALYST: [AgentType.CHAT, AgentType.EXCEL_PROCESSOR],
        }
        
        return fallback_map.get(primary, [AgentType.CHAT])
    
    def _generate_routing_reasoning(self, task_type: TaskType, input_text: str) -> str:
        """生成路由原因说明"""
        reasons = {
            TaskType.CODE: "检测到编程/代码相关的关键词",
            TaskType.TRANSLATE: "检测到翻译请求",
            TaskType.WRITE: "检测到内容创作需求",
            TaskType.IMAGE_ANALYSIS: "检测到图像分析需求或附件",
            TaskType.IMAGE_GENERATE: "检测到图像生成请求",
            TaskType.AUDIO_TRANSCRIBE: "检测到音频/语音处理需求",
            TaskType.PDF_PARSE: "检测到PDF文件",
            TaskType.DOCUMENT_QA: "检测到文档问答需求",
            TaskType.SUMMARIZE: "检测到摘要/总结需求",
            TaskType.DATA_ANALYSIS: "检测到数据分析需求",
            TaskType.EXCEL_PROCESS: "检测到Excel/表格处理需求",
            TaskType.CHAT: "默认使用通用对话助手",
        }
        
        base_reason = reasons.get(task_type, "自动路由")
        
        return f"{base_reason} | 输入预览: {input_text[:50]}..."
    
    def register_custom_router(self, router_func: Callable) -> None:
        """
        注册自定义路由器
        
        Args:
            router_func: 路由函数(接受user_input, 返回RoutingResult或None)
        """
        self._custom_routers.append(router_func)
        logger.info("Custom router registered")


# 全局单例实例
agent_orchestrator = AgentOrchestrator()


__all__ = [
    "AgentOrchestrator", "RoutingResult", "OrchestratedTask",
    "TaskType", "agent_orchestrator",
]
