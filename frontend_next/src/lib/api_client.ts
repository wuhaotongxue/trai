/**
 * api_client.ts
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: TRAI API 客户端 - 与后端所有接口通信
 */

const DEFAULT_API_BASE = "http://localhost:5666/api";

function getApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE;
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5666/api`;
  }

  return DEFAULT_API_BASE;
}

interface ApiOptions {
  headers?: Record<string, string>;
}

async function request<T>(
  path: string,
  options: RequestInit & ApiOptions = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.detail?.message || error.message || "请求失败");
  }

  return res.json();
}

// ============================================================
// 认证
// ============================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
}

export interface UserInfo {
  user_id: string;
  username: string;
  display_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  register: (data: { username: string; password: string; email: string }) =>
    request<UserInfo>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  me: () => request<UserInfo>("/auth/me"),

  refresh: (token: string) =>
    request<LoginResponse>("/auth/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// ============================================================
// 会话
// ============================================================

export interface Session {
  session_id: string;
  title: string | null;
  model: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_call_id?: string;
}

export interface SendMessageRequest {
  content: string;
  role?: string;
}

export const sessionApi = {
  list: (params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ total: number; sessions: Session[] }>(`/sessions${qs ? `?${qs}` : ""}`);
  },

  create: (data: { title?: string; model?: string }) =>
    request<Session>("/sessions", { method: "POST", body: JSON.stringify(data) }),

  get: (sessionId: string) =>
    request<Session & { messages: Message[] }>(`/sessions/${sessionId}`),

  delete: (sessionId: string) =>
    request<{ message: string }>(`/sessions/${sessionId}`, { method: "DELETE" }),

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

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { description: string; type: string; enum?: string[] }>;
      required: string[];
    };
  };
}

export interface AgentStep {
  turn: number;
  assistant_message: string;
  tool_calls: Array<{ id: string; function: string }>;
  tool_results: Array<{
    tool_id: string;
    success: boolean;
    output?: string;
    error?: string;
    duration_ms: number;
  }>;
  duration_ms: number;
}

export interface AgentChatRequest {
  session_id: string;
  message: string;
  role?: string;
}

export interface AgentChatResponse {
  session_id: string;
  content: string;
  steps: AgentStep[];
  total_turns: number;
  total_tokens: number;
  total_duration_ms: number;
  trace_id: string;
}

export const agentApi = {
  chat: (data: { session_id: string; message: string; role?: string }) =>
    request<AgentChatResponse>("/agent/chat", { method: "POST", body: JSON.stringify(data) }),

  listTools: () => request<{ tools: ToolDefinition[] }>("/agent/tools"),

  callTool: (data: { tool_id: string; params: Record<string, unknown> }) =>
    request<{ tool_id: string; success: boolean; output?: string; error?: string }>(
      "/agent/tools/call",
      { method: "POST", body: JSON.stringify(data) }
    ),

  getQuota: () => request<{ user_id: string; role: string; quotas: QuotaStatus[] }>("/agent/quota"),
};

// ============================================================
// 流式 SSE 客户端
// ============================================================

export type StreamEventType =
  | "token"
  | "tool_call_end"
  | "usage"
  | "done"
  | "error"
  | "abort";

export interface StreamTokenEvent {
  event: "token";
  data: string;
}

export interface StreamToolCallEndEvent {
  event: "tool_call_end";
  data: {
    tool_call_id: string;
    tool_name: string;
    arguments: string;
  };
}

export interface StreamUsageEvent {
  event: "usage";
  data: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamErrorEvent {
  event: "error";
  data: string;
}

export type StreamEvent =
  | StreamTokenEvent
  | StreamToolCallEndEvent
  | StreamUsageEvent
  | StreamErrorEvent
  | { event: "done"; data: "" };

export function createStreamClient(
  sessionId: string,
  message: string,
  callbacks: {
    onToken?: (token: string) => void;
    onToolCallEnd?: (tool: { tool_call_id: string; tool_name: string; arguments: string }) => void;
    onUsage?: (usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) => void;
    onError?: (error: string) => void;
    onDone?: () => void;
  }
) {
  const es = new EventSource(
    `${API_BASE}/sessions/${sessionId}/messages/stream` +
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
      fetch(`${API_BASE}/sessions/${sessionId}/messages/stream`, { method: "DELETE" });
      es.close();
    },
  };
}

export interface QuotaStatus {
  quota_type: string;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  billing_month: string;
}

// ============================================================
// 管理后台
// ============================================================

export interface DashboardStats {
  total_users: number;
  active_users_today: number;
  total_sessions: number;
  total_messages: number;
  total_image_generations: number;
  total_uploads: number;
  total_agent_tool_calls: number;
  vip_users: number;
  new_users_this_month: number;
}

export interface DailyTrendItem {
  date: string;
  users: number;
  sessions: number;
  messages: number;
  agent_calls: number;
}

export interface ModelUsage {
  model: string;
  call_count: number;
  total_tokens: number;
}

export interface DashboardData {
  stats: DashboardStats;
  trends: DailyTrendItem[];
  top_models: ModelUsage[];
}

export interface QuotaPlanItem {
  id: number;
  plan_name: string;
  user_role: string;
  image_generation_limit: number;
  audio_synthesis_limit: number;
  transcription_minutes_limit: number;
  meeting_summary_limit: number;
  ai_translation_limit: number;
  ai_summarization_limit: number;
  agent_tool_call_limit: number;
}

export interface UsageByTypeItem {
  quota_type: string;
  total_used: number;
  user_count: number;
}

export interface TopUserItem {
  user_id: string;
  username: string;
  role: string;
  total_calls: number;
  total_tokens: number;
}

export interface AnalyticsData {
  quota_plans: QuotaPlanItem[];
  usage_by_type: UsageByTypeItem[];
  top_users: TopUserItem[];
}

export const adminApi = {
  getDashboard: () => request<DashboardData>("/admin/dashboard"),
  getAnalytics: () => request<AnalyticsData>("/admin/analytics"),
  listQuotaPlans: () => request<QuotaPlanItem[]>("/admin/quota-plans"),
  updateQuotaPlan: (role: string, data: Partial<QuotaPlanItem>) =>
    request<QuotaPlanItem>(`/admin/quota-plans/${role}`, { method: "PUT", body: JSON.stringify(data) }),
  createQuotaPlan: (data: QuotaPlanItem) =>
    request<QuotaPlanItem>("/admin/quota-plans", { method: "POST", body: JSON.stringify(data) }),
};

export const api = { auth: authApi, session: sessionApi, agent: agentApi, admin: adminApi };
export default api;
