import Cookies from "js-cookie";
/**
 * api_client.ts
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: TRAI API 客户端 - 与后端所有接口通信
 */

/** 默认 API 基础 URL */
const DEFAULT_API_BASE = "http://192.168.98.72:5666/api_trai/v1";

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
    
    // 如果是通过 HTTPS 访问，可能是 Nginx 代理，直接用 /api_trai/v1 作为基础路径
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

  let res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
      });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    const errorMessage = error.detail?.message || error.message || "请求失败";

    // 游客免费额度用完特殊处理
    if (res.status === 401 && errorMessage.includes("免费额度")) {
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=quota_exceeded";
      }
    }

    throw new Error(errorMessage);
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
 * @property role - 角色
 * @property content - 内容
 * @property tool_call_id - 工具调用 ID
 */
export interface Message {
  /** 角色 */
  role: "user" | "assistant" | "system" | "tool";
  /** 内容 */
  content: string;
  /** 工具调用 ID */
  tool_call_id?: string;
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
  listQuotaPlans: () => request<QuotaPlanItem[]>("/admin/quota-plans"),
  /** 更新配额计划 */
  updateQuotaPlan: (role: string, data: Partial<QuotaPlanItem>) =>
    request<QuotaPlanItem>(`/admin/quota-plans/${role}`, { method: "PUT", body: JSON.stringify(data) }),
  /** 创建配额计划 */
  createQuotaPlan: (data: QuotaPlanItem) =>
    request<QuotaPlanItem>("/admin/quota-plans", { method: "POST", body: JSON.stringify(data) }),
};

/** API 客户端 */
export const api = { auth: authApi, session: sessionApi, agent: agentApi, admin: adminApi };
export default api;
