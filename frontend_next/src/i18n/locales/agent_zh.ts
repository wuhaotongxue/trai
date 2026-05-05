/**
 * agent_zh.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Chinese translations for Agent components
 */

export const agentZhTranslations = {
  // Tabs
  tabs: {
    chat: "对话",
    image: "绘图",
    video: "视频",
    music: "音乐",
  },

  // Chat Panel
  chatPanel: {
    newConversation: "新对话",
    unnamedConversation: "未命名对话",
    historyTitle: "历史对话",
    newChat: "新建对话",
    hideHistory: "隐藏历史",
    showHistory: "显示历史",
    hideGallery: "隐藏图片廊",
    showGallery: "显示图片廊",
    inputPlaceholder: "输入消息...",
    imagePlaceholder: "描述你想要的画面...",
    videoPlaceholder: "描述你想要的视频...",
    musicPlaceholder: "描述你想要的音乐...",
    sendButton: "发送",
    stopButton: "停止响应",
    abortResponse: "中断响应",

    // Image Generation
    imageGenTitle: "AI 创意绘图",
    imageGenDesc: "输入画面描述, AI 创作精美图像",
    tryPrompts: "试试这些提示词",
    promptPortrait: "一位精致的亚洲女性, 柔和自然光, 超高分辨率, 8K 画质",
    promptLandscape: "壮丽山脉日出, 云海翻涌, 航拍视角, HDR 电影感",
    promptCyberpunk: "霓虹灯街道, 雨夜, 反射光影, 赛博朋克风格, 电影级",
    promptAnime: "樱花树下少女, 宫崎骏风格, 温暖色调, 手绘质感",
    generateImage: "生成图像",
    generating: "生成中...",

    // Video Generation
    videoGenTitle: "AI 视频合成",
    videoGenDesc: "描述场景, AI 生成电影级视频",
    generateVideo: "生成视频",
    generatingVideo: "正在创作视频...",

    // Music Generation
    musicGenTitle: "AI 音乐创作",
    musicGenDesc: "描述风格, AI 创作原创音乐",
    generateMusic: "生成音乐",
    generatingMusic: "正在创作音乐...",
    completed: "生成完成",
    clickToPlay: "点击播放",
    aiCreatedMusic: "AI 创作音乐",
    copyLink: "复制链接",
    download: "下载",
    composingMelody: "AI 正在谱写旋律",

    // Tab Descriptions
    tabDescriptions: {
      chat: "输入消息与 AI 助手对话, 支持上传图片和调用工具.",
      image: "描述你想要的画面, AI 将为你生成精美的图像.",
      video: "提供视频描述或参考图, 开启电影级 AI 视频创作.",
      music: "输入歌词或风格描述, 创作属于你的 AI 音乐.",
    },

    // Tips
    tips: {
      streaming: "已启用流式输出",
      markdownSupported: "支持 Markdown 格式",
      dragFiles: "拖拽文件到此处, 或点击选择",
      selectAgent: "选择 Agent 类型",
      errorOccurred: "发生错误",
      dismissError: "关闭错误提示",
    },
  },

  // Agent Type Selector
  agentTypes: {
    title: "Agent 类型",
    autoDetect: "自动检测",
    loadingAgents: "加载中...",
    categories: {
      chat: "对话与助手",
      vision: "视觉与图像",
      audio: "音频与语音",
      document: "文档与PDF",
      data: "数据与分析",
    },
    agents: {
      chat: {
        name: "通用对话",
        desc: "多轮对话助手",
      },
      code_assistant: {
        name: "代码助手",
        desc: "编程与调试辅助",
      },
      translator: {
        name: "翻译官",
        desc: "多语言翻译专家",
      },
      writer: {
        name: "写作助手",
        desc: "内容创作辅助",
      },
      vision: {
        name: "视觉分析",
        desc: "图像理解与分析",
      },
      image_generator: {
        name: "图像生成",
        desc: "AI 图像创作 (DALL-E)",
      },
      ocr_agent: {
        name: "OCR 扫描",
        desc: "图片文字提取",
      },
      speech_to_text: {
        name: "语音转文字",
        desc: "语音识别 (Whisper)",
      },
      text_to_speech: {
        name: "文字转语音",
        desc: "自然语音合成",
      },
      pdf_parser: {
        name: "PDF 解析",
        desc: "文档文本提取",
      },
      document_qa: {
        name: "文档问答",
        desc: "文档智能问答",
      },
      summarizer: {
        name: "内容总结",
        desc: "智能摘要生成",
      },
      data_analyst: {
        name: "数据分析师",
        desc: "数据分析与洞察",
      },
      chart_generator: {
        name: "图表生成",
        desc: "可视化图表创建",
      },
      excel_processor: {
        name: "Excel 处理",
        desc: "电子表格数据处理",
      },
      audio_analyzer: {
        name: "音频分析",
        desc: "音频特征分析",
      },
      image_editor: {
        name: "图像编辑",
        desc: "图片编辑与增强",
      },
      web_searcher: {
        name: "网络搜索",
        desc: "实时网络搜索",
      },
    },
  },

  // Multimodal Upload
  upload: {
    dropzoneText: "拖拽文件到此处, 或点击选择",
    supportedFormats: "支持格式:",
    maxSize: "最大 {size}MB/个",
    filesSelected: "已选择 {count} 个文件",
    clearAll: "清空全部",
    removeFile: "移除文件",
    dismissError: "关闭错误",
    invalidFileType: "不支持的文件类型",
    fileSizeExceeded: "文件大小超出限制",
    types: {
      image: "图片",
      audio: "音频",
      pdf: "PDF",
    },
  },

  // WebSocket Status
  websocket: {
    connecting: "连接中...",
    connected: "已连接",
    disconnected: "已断开",
    error: "错误",
    reconnecting: "重连中...",
    reconnect: "重新连接",
    disconnect: "断开连接",
  },

  // Errors
  errors: {
    sendFailed: "发送消息失败",
    requestFailed: "请求失败",
    rateLimited: "请求过于频繁, 请稍后再试",
    networkError: "网络连接失败",
    serverError: "服务器发生错误",
    unauthorized: "需要身份验证",
    quotaExceeded: "免费额度已用完",
  },
};

export type AgentZhTranslationKeys = keyof typeof agentZhTranslations;
