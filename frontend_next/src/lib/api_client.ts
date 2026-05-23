import Cookies from "js-cookie";
/**
 * api_client.ts
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: TRAI API 客户端 - 与后端所有接口通信
 */

/** 默认 API 基础 URL */
const DEFAULT_API_BASE = "http://localhost:5666/api_trai/v1";

/**
 * 获取 API 基础 URL
 * @returns API 基础 URL
 */
function getApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE;
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    // 假设在同一个域名下部署, 但后端跑在 5666 端口
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // If accessed via HTTPS, might be Nginx proxy, use /api_trai/v1 as base path
    if (protocol === "https:") {
      return `${protocol}//${hostname}/api_trai/v1`;
    }
    
    return `${protocol}//${hostname}:5666/api_trai/v1`;
  }

  return DEFAULT_API_BASE;
}

/** API 选项接口
 * @property headers - 自定义请求头
 */
interface ApiOptions {
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 是否为重试请求 */
  _retry?: boolean;
  /** AbortSignal，可用于取消请求 */
  signal?: AbortSignal;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * 执行 Token 刷新
 */
async function refreshToken(): Promise<string | null> {
  if (isRefreshing) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const rt = Cookies.get("refresh_token");
      if (!rt) return null;

      const res = await fetch(`${getApiBase()}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });

      if (!res.ok) {
        Cookies.remove("token");
        Cookies.remove("refresh_token");
        window.location.href = "/login";
        return null;
      }

      const data = await res.json();
      if (data && data.access_token) {
        Cookies.set("token", data.access_token);
        if (data.refresh_token) {
          Cookies.set("refresh_token", data.refresh_token);
        }
        return data.access_token;
      }
      return null;
    } catch {
      Cookies.remove("token");
      Cookies.remove("refresh_token");
      window.location.href = "/login";
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * 发送请求
 * @param path - 请求路径
 * @param options - 请求选项
 * @returns 响应数据
 */
export async function request<T>(
  path: string,
  options: RequestInit & ApiOptions = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? Cookies.get("token") : null;
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;

  let res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // 处理 401 无感知刷新
  if (
    res.status === 401 &&
    !options._retry &&
    !path.includes("/auth/refresh") &&
    !path.includes("/auth/login") &&
    typeof window !== "undefined"
  ) {
    const newToken = await refreshToken();
    if (newToken) {
      options._retry = true;
      res = await fetch(`${getApiBase()}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
      });
    }
  }

  if (!res.ok) {
    // 处理 4008 请求限流
    if (res.status === 429 || res.status === 4008) {
      throw new Error("Request too frequent, please try again later (4008)");
    }

    const error = await res.json().catch(() => ({ message: res.statusText }));
    const errorMessage = error.detail?.message || error.message || `HTTP ${res.status}: ${res.statusText}`;
    if (res.status === 422) {
      console.error("[API 422]", error);
    }

    // 游客免费额度用完特殊处理
    if (res.status === 401 && errorMessage.includes("免费额度")) {
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=quota_exceeded";
      }
    }

    const err = new Error(errorMessage);
    (err as unknown as { status: number }).status = res.status;
    throw err;
  }

  return res.json();
}

// ============================================================
// 认证
// ============================================================

/**
 * 登录请求接口
 * @property username - 用户名
 * @property password - 密码
 */
export interface LoginRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

/**
 * 登录响应接口
 * @property access_token - 访问令牌
 * @property refresh_token - 刷新令牌
 * @property token_type - 令牌类型
 * @property expires_in - 过期时间
 * @property user - 用户信息
 */
export interface LoginResponse {
  /** 访问令牌 */
  access_token: string;
  /** 刷新令牌 */
  refresh_token: string;
  /** 令牌类型 */
  token_type: string;
  /** 过期时间 */
  expires_in: number;
  /** 用户信息 */
  user: UserInfo;
}

/**
 * 用户信息接口
 * @property user_id - 用户 ID
 * @property username - 用户名
 * @property display_name - 显示名称
 * @property email - 邮箱
 * @property role - 角色
 * @property avatar_url - 头像 URL
 */
export interface UserInfo {
  /** 用户 ID */
  user_id: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  display_name: string;
  /** 邮箱 */
  email: string;
  /** 角色 */
  role: string;
  /** 用户状态 */
  status?: string;
  /** 租户 ID */
  tenant_id?: string;
  /** 创建时间 */
  created_at?: string;
  /** 企业微信 ID */
  wecom_user_id?: string;
  /** 最后登录 IP */
  last_login_ip?: string;
  /** 最后登录地址 */
  last_login_location?: string;
  /** 头像 URL */
  avatar_url?: string;
}

export interface MeResponse {
  user: UserInfo;
  permissions: string[];
}

/** 认证 API */
export const authApi = {
  /** 登录 */
  login: (data: LoginRequest) =>
    request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  /** 注册 */
  register: (data: { username: string; password: string; email: string }) =>
    request<UserInfo>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  /** 获取当前用户信息 */
  me: () => request<MeResponse>("/auth/me"),

  /** 刷新令牌 */
  refresh: (token: string) =>
    request<LoginResponse>("/auth/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// ============================================================
// 会话
// ============================================================

/**
 * 会话接口
 * @property session_id - 会话 ID
 * @property title - 标题
 * @property model - 模型
 * @property message_count - 消息数量
 * @property created_at - 创建时间
 * @property updated_at - 更新时间
 */
export interface Session {
  /** 会话 ID */
  session_id: string;
  /** 标题 */
  title: string | null;
  /** 模型 */
  model: string;
  /** 消息数量 */
  message_count: number;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 消息接口
 * @property id - 消息 ID
 * @property role - 角色
 * @property content - 内容
 * @property tool_call_id - 工具调用 ID
 * @property timestamp - 时间戳
 */
export interface Message {
  /** 消息 ID */
  id: string;
  /** 角色 */
  role: "user" | "assistant" | "system" | "tool";
  /** 内容 */
  content: string;
  /** 工具调用 ID */
  tool_call_id?: string;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 发送消息请求接口
 * @property content - 内容
 * @property role - 角色
 */
export interface SendMessageRequest {
  /** 内容 */
  content: string;
  /** 角色 */
  role?: string;
}

/** 会话 API */
export const sessionApi = {
  /** 获取会话列表 */
  list: (params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ total: number; sessions: Session[] }>(`/sessions${qs ? `?${qs}` : ""}`);
  },

  /** 创建会话 */
  create: (data: { title?: string; model?: string }) =>
    request<Session>("/sessions", { method: "POST", body: JSON.stringify(data) }),

  /** 获取会话详情 */
  get: (sessionId: string) =>
    request<Session & { messages: Message[] }>(`/sessions/${sessionId}`),

  /** 删除会话 */
  delete: (sessionId: string) =>
    request<{ message: string }>(`/sessions/${sessionId}`, { method: "DELETE" }),

  /** 重命名会话 */
  rename: (sessionId: string, title: string) =>
    request<Session>(`/sessions/${sessionId}/rename`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  /** 发送消息 */
  sendMessage: (sessionId: string, data: SendMessageRequest) =>
    request<{
      session_id: string;
      user_message: Message;
      assistant_message: Message;
    }>(`/sessions/${sessionId}/messages`, { method: "POST", body: JSON.stringify(data) }),
};

// ============================================================
// Agent
// ============================================================

/**
 * 工具定义接口
 * @property type - 类型
 * @property function - 函数定义
 */
export interface ToolDefinition {
  /** 类型 */
  type: "function";
  /** 函数定义 */
  function: {
    /** 名称 */
    name: string;
    /** 描述 */
    description: string;
    /** 参数 */
    parameters: {
      /** 类型 */
      type: "object";
      /** 属性 */
      properties: Record<string, { description: string; type: string; enum?: string[] }>;
      /** 必填属性 */
      required: string[];
    };
  };
}

/**
 * Agent 步骤接口
 * @property turn - 轮次
 * @property assistant_message - 助手消息
 * @property tool_calls - 工具调用列表
 * @property tool_results - 工具结果列表
 * @property duration_ms - 持续时间
 */
export interface AgentStep {
  /** 轮次 */
  turn: number;
  /** 助手消息 */
  assistant_message: string;
  /** 工具调用列表 */
  tool_calls: Array<{ id: string; function: string }>;
  /** 工具结果列表 */
  tool_results: Array<{
    /** 工具 ID */
    tool_id: string;
    /** 是否成功 */
    success: boolean;
    /** 输出 */
    output?: string;
    /** 错误 */
    error?: string;
    /** 持续时间 */
    duration_ms: number;
  }>;
  /** 持续时间 */
  duration_ms: number;
}

/**
 * Agent 聊天请求接口
 * @property session_id - 会话 ID
 * @property message - 消息
 * @property role - 角色
 */
export interface AgentChatRequest {
  /** 会话 ID */
  session_id: string;
  /** 消息 */
  message: string;
  /** 角色 */
  role?: string;
}

/**
 * Agent 聊天响应接口
 * @property session_id - 会话 ID
 * @property content - 内容
 * @property steps - 步骤列表
 * @property total_turns - 总轮次
 * @property total_tokens - 总 Token 数
 * @property total_duration_ms - 总持续时间
 * @property trace_id - 追踪 ID
 */
export interface AgentChatResponse {
  /** 会话 ID */
  session_id: string;
  /** 内容 */
  content: string;
  /** 步骤列表 */
  steps: AgentStep[];
  /** 总轮次 */
  total_turns: number;
  /** 总 Token 数 */
  total_tokens: number;
  /** 总持续时间 */
  total_duration_ms: number;
  /** 追踪 ID */
  trace_id: string;
}

/** Agent API */
export const agentApi = {
  /** Agent 聊天 */
  chat: (data: { session_id: string; message: string; role?: string }) =>
    request<AgentChatResponse>("/agent/chat", { method: "POST", body: JSON.stringify(data) }),

  /** 获取工具列表 */
  listTools: () => request<{ tools: ToolDefinition[] }>("/agent/tools"),

  /** 调用工具 */
  callTool: (data: { tool_id: string; params: Record<string, unknown> }) =>
    request<{ tool_id: string; success: boolean; output?: string; error?: string }>(
      "/agent/tools/call",
      { method: "POST", body: JSON.stringify(data) }
    ),

  /** 获取配额信息 */
  getQuota: () => request<{ user_id: string; role: string; quotas: QuotaStatus[] }>("/agent/quota"),

  /** 文生图 */
  generateImage: (data: { prompt: string; model?: string; width?: number; height?: number; steps?: number; seed?: number }) =>
    request<{ task_id: string; status: string; image_url?: string; image_base64?: string; error?: string }>("/ai/image", { method: "POST", body: JSON.stringify(data) }),

  /** 图生图 / 图片编辑 */
  editImage: (data: { image_url: string; prompt: string; mask?: string; width?: number; height?: number; steps?: number; seed?: number; signal?: AbortSignal; image_url_2?: string }) =>
    request<{ task_id: string; status: string; image_url?: string; image_base64?: string; error?: string }>("/ai/image/edit", { method: "POST", body: JSON.stringify(data), signal: data.signal }),

  /** 文生视频 (Wan2.1-T2V-1.3B) */
  generateVideo: (data: { prompt: string; model?: string; frames?: number; resolution?: string }) =>
    request<{ task_id: string; status: string; video_url?: string; video_base64?: string; object_key?: string; public_url?: string; error?: string }>("/ai/video/generate", { method: "POST", body: JSON.stringify(data) }),

  /** 文生音乐 (ACE-Step) */
  generateMusic: (data: { prompt: string; duration?: number; steps?: number; guidance_scale?: number }) =>
    request<{
      success: boolean;
      task_id: string;
      message: string;
      music_url?: string;
      file_path?: string;
      duration?: number;
      error?: string;
    }>("/ai/music/generate", { method: "POST", body: JSON.stringify(data) }),
};

// ============================================================
// 多模态 Agent API (Multimodal Agent Routes)
// ============================================================

/**
 * Agent 类型枚举
 */
export type AgentTypeValue =
  | "chat"
  | "code_assistant"
  | "translator"
  | "writer"
  | "vision"
  | "image_generator"
  | "image_editor"
  | "ocr_agent"
  | "speech_to_text"
  | "text_to_speech"
  | "audio_analyzer"
  | "pdf_parser"
  | "document_qa"
  | "summarizer"
  | "data_analyst"
  | "chart_generator"
  | "excel_processor";

/**
 * Agent 模态类型
 */
export type ModalityType = "text" | "image" | "audio" | "video" | "document" | "data" | "chart";

/**
 * Agent 能力接口
 * @property input_modalities - 支持的输入模态
 * @property output_modalities - 支持的输出模态
 * @property max_input_size_mb - 最大输入大小(MB)
 * @property supported_formats - 支持的文件格式
 * @property streaming_supported - 是否支持流式输出
 */
export interface AgentCapability {
  /** 支持的输入模态 */
  input_modalities: ModalityType[];
  /** 支持的输出模态 */
  output_modalities: ModalityType[];
  /** 最大输入大小(MB) */
  max_input_size_mb: number;
  /** 支持的文件格式 */
  supported_formats: string[];
  /** 是否支持流式输出 */
  streaming_supported: boolean;
}

/**
 * Agent 配置接口
 * @property agent_id - Agent ID
 * @property name - 名称
 * @property description - 描述
 * @property type - 类型
 * @property model - 模型
 * @property system_prompt - 系统提示词
 * @property temperature - 温度
 * @property max_tokens - 最大Token数
 * @property capability - 能力
 * @property tools - 工具列表
 */
export interface AgentConfig {
  /** Agent ID */
  agent_id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 类型 */
  type: AgentTypeValue;
  /** 模型 */
  model: string;
  /** 系统提示词(截断版) */
  system_prompt: string;
  /** 温度 */
  temperature: number;
  /** 最大Token数 */
  max_tokens: number;
  /** 能力 */
  capability: AgentCapability;
  /** 工具列表 */
  tools: string[];
}

/**
 * Agent 列表项接口(简化版)
 */
export interface AgentListItem {
  /** Agent ID */
  agent_id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 类型 */
  type: AgentTypeValue;
  /** 分类 */
  category: "chat" | "vision" | "audio" | "document" | "data";
  /** 输入模态 */
  input_modalities: ModalityType[];
  /** 输出模态 */
  output_modalities: ModalityType[];
  /** 是否支持流式 */
  streaming_supported: boolean;
  /** 图标名称(可选) */
  icon?: string;
}

/**
 * 路由结果接口
 * @property task_type - 任务类型
 * @property agent_type - Agent类型
 * @property confidence - 置信度
 * @property reasoning - 推理说明
 * @property fallback_agents - 备选Agent列表
 */
export interface RoutingResult {
  /** 任务类型 */
  task_type: string;
  /** Agent类型 */
  agent_type: AgentTypeValue;
  /** 置信度 */
  confidence: number;
  /** 推理说明 */
  reasoning: string;
  /** 备选Agent列表 */
  fallback_agents: AgentTypeValue[];
}

/**
 * 子任务接口
 * @property task_id - 任务ID
 * @property task_type - 任务类型
 * @property primary_agent - 主Agent配置
 * @property context - 上下文
 */
export interface SubTaskItem {
  /** 任务ID */
  task_id: string;
  /** 任务类型 */
  task_type: string;
  /** 主Agent配置 */
  primary_agent: AgentConfig;
  /** 上下文 */
  context?: Record<string, unknown>;
}

/**
 * 多模态处理响应接口
 * @property success - 是否成功
 * @property output_type - 输出类型
 * @property data - 数据
 * @property processing_time_ms - 处理时间(ms)
 * @property tokens_used - Token使用量
 */
export interface MultimodalResponse<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 输出类型 */
  output_type: string;
  /** 数据 */
  data: T;
  /** 处理时间(ms) */
  processing_time_ms: number;
  /** Token使用量 */
  tokens_used?: number;
}

/** 多模态 API */
export const multimodalApi = {
  /**
   * 获取所有可用Agent类型
   * @returns Agent列表和总数
   */
  listAgents: () =>
    request<{ agents: AgentListItem[]; total: number }>("/agent/multimodal/agents"),

  /**
   * 获取Agent详细信息
   * @param agentType - Agent类型
   * @returns Agent完整配置
   */
  getAgentDetail: (agentType: string) =>
    request<AgentConfig>(`/agent/multimodal/agents/${agentType}`),

  /**
   * 智能任务路由
   * @param message - 用户消息
   * @param attachmentType - 附件类型(可选)
   * @returns 路由结果
   */
  smartRoute: (message: string, attachmentType?: string) =>
    request<RoutingResult>("/agent/multimodal/route", {
      method: "POST",
      body: JSON.stringify({
        message,
        attachment_type: attachmentType,
      } as Record<string, unknown>),
    }),

  /**
   * 分解复杂任务
   * @param complexInput - 复杂任务描述
   * @param maxSubtasks - 最大子任务数
   * @returns 子任务列表
   */
  decomposeTask: (complexInput: string, maxSubtasks?: number) =>
    request<{
      original_input: string;
      subtask_count: number;
      subtasks: SubTaskItem[];
    }>("/agent/multimodal/decompose", {
      method: "POST",
      body: JSON.stringify({
        complex_input: complexInput,
        max_subtasks: maxSubtasks || 5,
      }),
    }),

  /**
   * 图像分析/理解(Vision API)
   * @param file - 图片文件
   * @param prompt - 分析提示词
   * @param detail - 精度(auto/low/high)
   * @returns 分析结果
   */
  analyzeImage: async (
    file: File,
    prompt?: string,
    detail?: string
  ): Promise<MultimodalResponse<string>> => {
    const formData = new FormData();
    formData.append("file", file);
    if (prompt) formData.append("prompt", prompt);
    formData.append("detail", detail || "auto");

    const token =
      typeof window !== "undefined"
        ? Cookies.get("token")
        : null;

    const res = await fetch(`${getApiBase()}/agent/multimodal/vision/analyze`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.detail?.message || error.message || "Image analysis failed");
    }

    return res.json();
  },

  /**
   * AI图像生成(DALL-E 3)
   * @param prompt - 图像描述
   * @param size - 尺寸
   * @param quality - 质量
   * @param style - 风格
   * @param n - 生成数量
   * @returns 生成结果
   */
  generateImage: (
    prompt: string,
    size?: string,
    quality?: string,
    style?: string,
    n?: number
  ) =>
    request<MultimodalResponse<Record<string, unknown>>>(
      "/agent/multimodal/vision/generate",
      {
        method: "POST",
        body: JSON.stringify({
          prompt,
          size: size || "1024x1024",
          quality: quality || "standard",
          style: style || "vivid",
          n: n || 1,
        }),
      }
    ),

  /**
   * 语音转文字(STT / Whisper)
   * @param file - 音频文件
   * @param language - 语言代码(可选)
   * @returns 转录文本
   */
  speechToText: async (
    file: File,
    language?: string
  ): Promise<MultimodalResponse<Record<string, unknown>>> => {
    const formData = new FormData();
    formData.append("file", file);
    if (language) formData.append("language", language);

    const token =
      typeof window !== "undefined"
        ? Cookies.get("token")
        : null;

    const res = await fetch(
      `${getApiBase()}/agent/multimodal/audio/transcribe`,
      {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.detail?.message || error.message || "Transcription failed");
    }

    return res.json();
  },

  /**
   * 文字转语音(TTS)
   * @param text - 要转换的文本
   * @param voice - 音色
   * @param responseFormat - 音频格式
   * @param speed - 语速
   * @returns Blob音频数据
   */
  textToSpeech: async (
    text: string,
    voice?: string,
    responseFormat?: string,
    speed?: number
  ): Promise<Blob> => {
    const token =
      typeof window !== "undefined"
        ? Cookies.get("token")
        : null;

    const res = await fetch(
      `${getApiBase()}/agent/multimodal/audio/synthesize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          voice: voice || "alloy",
          response_format: responseFormat || "mp3",
          speed: speed || 1.0,
        }),
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.detail?.message || error.message || "TTS failed");
    }

    return res.blob();
  },

  /**
   * PDF文档解析
   * @param file - PDF文件
   * @param extractTables - 是否提取表格
   * @param extractImages - 是否提取图片描述
   * @returns 解析结果
   */
  parsePdf: async (
    file: File,
    extractTables?: boolean,
    extractImages?: boolean
  ): Promise<MultimodalResponse<Record<string, unknown>>> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("extract_tables", String(extractTables ?? true));
    formData.append("extract_images", String(extractImages ?? false));

    const token =
      typeof window !== "undefined"
        ? Cookies.get("token")
        : null;

    const res = await fetch(
      `${getApiBase()}/agent/multimodal/document/pdf/parse`,
      {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.detail?.message || error.message || "PDF parse failed");
    }

    return res.json();
  },

  /**
   * OCR文字识别
   * @param file - 包含文字的图片
   * @returns 识别结果
   */
  ocrRecognize: async (file: File): Promise<MultimodalResponse<string>> => {
    const formData = new FormData();
    formData.append("file", file);

    const token =
      typeof window !== "undefined"
        ? Cookies.get("token")
        : null;

    const res = await fetch(
      `${getApiBase()}/agent/multimodal/document/ocr`,
      {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.detail?.message || error.message || "OCR failed");
    }

    return res.json();
  },
};

// ============================================================
// 流式 SSE 客户端
// ============================================================

/**
 * 流事件类型
 */
export type StreamEventType =
  | "token"
  | "tool_call_end"
  | "usage"
  | "done"
  | "error"
  | "abort";

/**
 * 流 Token 事件接口
 * @property event - 事件类型
 * @property data - 数据
 */
export interface StreamTokenEvent {
  /** 事件类型 */
  event: "token";
  /** 数据 */
  data: string;
}

/**
 * 流工具调用结束事件接口
 * @property event - 事件类型
 * @property data - 数据
 */
export interface StreamToolCallEndEvent {
  /** 事件类型 */
  event: "tool_call_end";
  /** 数据 */
  data: {
    /** 工具调用 ID */
    tool_call_id: string;
    /** 工具名称 */
    tool_name: string;
    /** 参数 */
    arguments: string;
  };
}

/**
 * 流使用事件接口
 * @property event - 事件类型
 * @property data - 数据
 */
export interface StreamUsageEvent {
  /** 事件类型 */
  event: "usage";
  /** 数据 */
  data: {
    /** 提示 Token 数 */
    prompt_tokens: number;
    /** 完成 Token 数 */
    completion_tokens: number;
    /** 总 Token 数 */
    total_tokens: number;
  };
}

/**
 * 流错误事件接口
 * @property event - 事件类型
 * @property data - 数据
 */
export interface StreamErrorEvent {
  /** 事件类型 */
  event: "error";
  /** 数据 */
  data: string;
}

/**
 * 流事件类型
 */
export type StreamEvent =
  | StreamTokenEvent
  | StreamToolCallEndEvent
  | StreamUsageEvent
  | StreamErrorEvent
  | { event: "done"; data: "" };

/**
 * 创建流客户端
 * @param sessionId - 会话 ID
 * @param message - 消息
 * @param callbacks - 回调函数
 * @returns 流客户端
 */
export function createStreamClient(
  sessionId: string,
  message: string,
  callbacks: {
    /** Token 回调 */
    onToken?: (token: string) => void;
    /** 工具调用结束回调 */
    onToolCallEnd?: (tool: { tool_call_id: string; tool_name: string; arguments: string }) => void;
    /** 使用回调 */
    onUsage?: (usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) => void;
    /** 错误回调 */
    onError?: (error: string) => void;
    /** 完成回调 */
    onDone?: () => void;
  }
) {
  const apiBase = getApiBase();
  const es = new EventSource(
    `${apiBase}/sessions/${sessionId}/messages/stream` +
      `?${new URLSearchParams({
        content: message,
        role: "user",
      })}`
  );

  es.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data) as StreamEvent;

      if (parsed.event === "token") {
        callbacks.onToken?.(parsed.data);
      } else if (parsed.event === "tool_call_end") {
        callbacks.onToolCallEnd?.(parsed.data);
      } else if (parsed.event === "usage") {
        callbacks.onUsage?.(parsed.data);
      } else if (parsed.event === "error") {
        callbacks.onError?.(parsed.data);
      } else if (parsed.event === "done") {
        callbacks.onDone?.();
        es.close();
      }
    } catch {
    }
  };

  es.onerror = () => {
    callbacks.onError?.("SSE 连接异常");
    es.close();
  };

  return {
    abort: () => {
      fetch(`${apiBase}/sessions/${sessionId}/messages/stream`, { method: "DELETE" });
      es.close();
    },
  };
}

/**
 * 配额状态接口
 * @property quota_type - 配额类型
 * @property used - 已使用
 * @property limit - 限制
 * @property remaining - 剩余
 * @property unlimited - 是否无限
 * @property billing_month - 计费月份
 */
export interface QuotaStatus {
  /** 配额类型 */
  quota_type: string;
  /** 已使用 */
  used: number;
  /** 限制 */
  limit: number;
  /** 剩余 */
  remaining: number;
  /** 是否无限 */
  unlimited: boolean;
  /** 计费月份 */
  billing_month: string;
}

// ============================================================
// 管理后台
// ============================================================

/**
 * 仪表板统计接口
 * @property total_users - 总用户数
 * @property active_users_today - 今日活跃用户数
 * @property total_sessions - 总会话数
 * @property total_messages - 总消息数
 * @property total_image_generations - 总图片生成数
 * @property total_uploads - 总上传数
 * @property total_agent_tool_calls - 总 Agent 工具调用数
 * @property vip_users - VIP 用户数
 * @property new_users_this_month - 本月新用户数
 */
export interface DashboardStats {
  /** 总用户数 */
  total_users: number;
  /** 今日活跃用户数 */
  active_users_today: number;
  /** 总会话数 */
  total_sessions: number;
  /** 总消息数 */
  total_messages: number;
  /** 总图片生成数 */
  total_image_generations: number;
  /** 总上传数 */
  total_uploads: number;
  /** 总 Agent 工具调用数 */
  total_agent_tool_calls: number;
  /** VIP 用户数 */
  vip_users: number;
  /** 本月新用户数 */
  new_users_this_month: number;
}

/**
 * 每日趋势项接口
 * @property date - 日期
 * @property users - 用户数
 * @property sessions - 会话数
 * @property messages - 消息数
 * @property agent_calls - Agent 调用数
 */
export interface DailyTrendItem {
  /** 日期 */
  date: string;
  /** 用户数 */
  users: number;
  /** 会话数 */
  sessions: number;
  /** 消息数 */
  messages: number;
  /** Agent 调用数 */
  agent_calls: number;
}

/**
 * 模型使用接口
 * @property model - 模型
 * @property call_count - 调用次数
 * @property total_tokens - 总 Token 数
 */
export interface ModelUsage {
  /** 模型 */
  model: string;
  /** 调用次数 */
  call_count: number;
  /** 总 Token 数 */
  total_tokens: number;
}

/**
 * 仪表板数据接口
 * @property stats - 统计信息
 * @property trends - 趋势信息
 * @property top_models - 热门模型
 */
export interface DashboardData {
  /** 统计信息 */
  stats: DashboardStats;
  /** 趋势信息 */
  trends: DailyTrendItem[];
  /** 热门模型 */
  top_models: ModelUsage[];
}

/**
 * 配额计划项接口
 * @property id - ID
 * @property plan_name - 计划名称
 * @property user_role - 用户角色
 * @property image_generation_limit - 图片生成限制
 * @property audio_synthesis_limit - 音频合成限制
 * @property transcription_minutes_limit - 转录分钟限制
 * @property meeting_summary_limit - 会议摘要限制
 * @property ai_translation_limit - AI 翻译限制
 * @property ai_summarization_limit - AI 摘要限制
 * @property agent_tool_call_limit - Agent 工具调用限制
 */
export interface QuotaPlanItem {
  /** ID */
  id: number;
  /** 计划名称 */
  plan_name: string;
  /** 用户角色 */
  user_role: string;
  /** 图片生成限制 */
  image_generation_limit: number;
  /** 音频合成限制 */
  audio_synthesis_limit: number;
  /** 转录分钟限制 */
  transcription_minutes_limit: number;
  /** 会议摘要限制 */
  meeting_summary_limit: number;
  /** AI 翻译限制 */
  ai_translation_limit: number;
  /** AI 摘要限制 */
  ai_summarization_limit: number;
  /** Agent 工具调用限制 */
  agent_tool_call_limit: number;
}

/**
 * 按类型使用项接口
 * @property quota_type - 配额类型
 * @property total_used - 总使用
 * @property user_count - 用户数
 */
export interface UsageByTypeItem {
  /** 配额类型 */
  quota_type: string;
  /** 总使用 */
  total_used: number;
  /** 用户数 */
  user_count: number;
}

/**
 * 热门用户项接口
 * @property user_id - 用户 ID
 * @property username - 用户名
 * @property role - 角色
 * @property total_calls - 总调用次数
 * @property total_tokens - 总 Token 数
 */
export interface TopUserItem {
  /** 用户 ID */
  user_id: string;
  /** 用户名 */
  username: string;
  /** 角色 */
  role: string;
  /** 总调用次数 */
  total_calls: number;
  /** 总 Token 数 */
  total_tokens: number;
}

/**
 * 分析数据接口
 * @property quota_plans - 配额计划列表
 * @property usage_by_type - 按类型使用情况
 * @property top_users - 热门用户列表
 */
export interface AnalyticsData {
  /** 配额计划列表 */
  quota_plans: QuotaPlanItem[];
  /** 按类型使用情况 */
  usage_by_type: UsageByTypeItem[];
  /** 热门用户列表 */
  top_users: TopUserItem[];
}

/** 部门树节点 */
export interface DepartmentTreeNode {
  dept_id: number;
  name: string;
  parent_id: number;
  order: number;
  user_count: number;
  children: DepartmentTreeNode[];
}

/** 管理后台 API */
export const adminApi = {
  /** 获取用户列表 */
  listUsers: (params?: { limit?: number; offset?: number; role?: string; status?: string; dept_id?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ total: number; users: UserInfo[] }>(`/admin/users${qs ? `?${qs}` : ""}`);
  },
  /** 获取部门树 */
  getDepartmentTree: () => request<DepartmentTreeNode[]>("/admin/tree"),
  /** 获取仪表板数据 */
  getDashboard: () => request<DashboardData>("/admin/dashboard"),
  /** 获取分析数据 */
  getAnalytics: () => request<AnalyticsData>("/admin/analytics"),
  /** 获取配额计划列表 */
  listQuotaPlans: () => request<QuotaPlanItem[]>("/admin/quota_plans"),
  /** 更新配额计划 */
  updateQuotaPlan: (role: string, data: Partial<QuotaPlanItem>) =>
    request<QuotaPlanItem>(`/admin/quota_plans/${role}`, { method: "PUT", body: JSON.stringify(data) }),
  /** 创建配额计划 */
  createQuotaPlan: (data: QuotaPlanItem) =>
    request<QuotaPlanItem>("/admin/quota_plans", { method: "POST", body: JSON.stringify(data) }),
  /** 审核通过用户 */
  approveUser: (userId: string) =>
    request<{ message: string; user_id: string }>(`/admin/users/${userId}/approve`, { method: "POST" }),
  /** 审核拒绝用户 */
  rejectUser: (userId: string) =>
    request<{ message: string; user_id: string }>(`/admin/users/${userId}/reject`, { method: "POST" }),
  /** 更新用户状态(启用/禁用) */
  updateUserStatus: (userId: string, status: "active" | "disabled") =>
    request<{ message: string; user_id: string }>(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  /** 删除用户 */
  deleteUser: (userId: string) =>
    request<{ message: string; user_id: string }>(`/admin/users/${userId}`, { method: "DELETE" }),
  /** 创建用户 */
  createUser: (data: { name: string; email: string; password: string; plan?: string }) =>
    request<{ user_id: string; message: string }>("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  /** 获取翻译列表 */
  listI18n: (params?: { locale?: string; namespace?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{
      total: number;
      items: { locale: string; namespace: string; key: string; value: string; updated_at: string | null }[];
      namespaces: string[];
    }>(`/admin/i18n${qs ? `?${qs}` : ""}`);
  },
  /** Upsert 单条翻译 */
  upsertI18n: (data: { locale: string; namespace: string; key: string; value: string }) =>
    request<{ locale: string; namespace: string; key: string; value: string }>("/admin/i18n", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  /** 批量导入翻译 */
  importI18n: (translations: Record<string, Record<string, string>>, overwrite = true) =>
    request<{ message: string; count: number }>("/admin/i18n/import", {
      method: "POST",
      body: JSON.stringify({ translations, overwrite }),
    }),
  /** 删除翻译 */
  deleteI18n: (locale: string, namespace: string, key: string) =>
    request<{ message: string; count: number }>(
      `/admin/i18n?locale=${encodeURIComponent(locale)}&namespace=${encodeURIComponent(namespace)}&key=${encodeURIComponent(key)}`,
      { method: "DELETE" }
    ),
  /** 获取 AI 角色列表 */
  listAgentRoles: (params?: { is_active?: boolean }) => {
    const qs = params?.is_active !== undefined ? `?is_active=${params.is_active}` : "";
    return request<Array<{
      t_id: number;
      t_role_name: string;
      t_role_comment: string;
      t_role_keyword: string | null;
      t_style_type: string;
      t_priority: number;
      t_is_active: boolean;
      t_remark: string | null;
      t_created_at: string;
      t_updated_at: string;
    }>>(`/admin/agent_roles${qs}`);
  },
  /** 创建 AI 角色 */
  createAgentRole: (data: {
    t_role_name: string;
    t_role_comment: string;
    t_role_keyword?: string | null;
    t_style_type?: string;
    t_priority?: number;
    t_is_active?: boolean;
    t_remark?: string | null;
  }) =>
    request<{ t_id: number }>("/admin/agent_roles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  /** 更新 AI 角色 */
  updateAgentRole: (id: number, data: Partial<{
    t_role_name: string;
    t_role_comment: string;
    t_role_keyword: string | null;
    t_style_type: string;
    t_priority: number;
    t_is_active: boolean;
    t_remark: string | null;
  }>) =>
    request(`/admin/agent_roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  /** 删除 AI 角色 */
  deleteAgentRole: (id: number) =>
    request(`/admin/agent_roles/${id}`, { method: "DELETE" }),
  /** 获取配置列表 */
  listSettings: (category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<{ items: Array<{
      key: string;
      value: string;
      type: string;
      label: string | null;
      description: string | null;
      category: string;
      is_public: boolean;
      sort_order: number;
      updated_at: string | null;
    }> }>(`/admin/settings${qs}`);
  },
  /** 获取单个配置 */
  getSetting: (key: string) =>
    request<{
      key: string;
      value: string;
      type: string;
      label: string | null;
      description: string | null;
      category: string;
      is_public: boolean;
      sort_order: number;
      updated_at: string | null;
    }>(`/admin/settings/${encodeURIComponent(key)}`),
  /** Upsert 配置 */
  upsertSetting: (data: {
    key: string;
    value: string;
    type?: string;
    label?: string;
    description?: string;
    category?: string;
    is_public?: boolean;
    sort_order?: number;
  }) =>
    request<{ message: string; key: string }>("/admin/settings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  /** 删除配置 */
  deleteSetting: (key: string) =>
    request<{ message: string; key: string }>(`/admin/settings/${encodeURIComponent(key)}`, {
      method: "DELETE",
    }),
  /** 获取联系留言列表 */
  getContactMessages: (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    type?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ code: number; data: never[]; total: number }>(
      `/admin/contact_messages${qs ? `?${qs}` : ""}`
    );
  },
  /** 更新留言状态 */
  updateContactMessageStatus: (messageId: number, data: { status: string; reply_note?: string }) =>
    request<{ message: string }>(`/admin/contact_messages/${messageId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  /** 删除留言 */
  deleteContactMessage: (messageId: number) =>
    request<{ message: string }>(`/admin/contact_messages/${messageId}`, { method: "DELETE" }),
  /** 获取邮件配置列表 */
  getEmailConfigs: () =>
    request<{ code: number; data: never[] }>("/admin/email_configs"),
  /** 更新邮件配置 */
  updateEmailConfig: (id: number, data: Record<string, unknown>) =>
    request<{ message: string }>(`/admin/email_configs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  /** 创建邮件配置 */
  createEmailConfig: (data: Record<string, unknown>) =>
    request<{ message: string }>("/admin/email_configs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  /** 删除邮件配置 */
  deleteEmailConfig: (id: number) =>
    request<{ message: string }>(`/admin/email_configs/${id}`, { method: "DELETE" }),
  /** 获取审计日志 */
  getAuditLogs: (params?: {
    page?: number;
    page_size?: number;
    action?: string;
    level?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ code: number; data: never[]; total: number }>(
      `/admin/audit_logs${qs ? `?${qs}` : ""}`
    );
  },
};

/** 公开 API(无需认证) */
export const publicApi = {
  /** 获取指定语言的翻译(用于前端 i18n 初始化) */
  getTranslations: (locale: string) =>
    request<{ translations: Record<string, string>; locale: string }>(`/i18n/${locale}`),
  /** 获取所有公开配置(用于前端配置读取) */
  getPublicSettings: () =>
    request<{ settings: Record<string, string> }>("/settings/public"),
};

/** 统一导出(兼容旧版调用方式 api.session/agent) */
export const api = {
  session: sessionApi,
  agent: agentApi,
  multimodal: multimodalApi,
};
