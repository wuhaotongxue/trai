import Cookies from "js-cookie";
/**
 * agent.store.ts
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: Agent 对话状态管理
 */

import { create } from "zustand";
import { api, type QuotaStatus, type StreamUsageEvent } from "@/lib/api_client";

/**
 * 消息接口
 * @property id - 消息 ID
 * @property role - 角色
 * @property content - 内容
 * @property images - 图片数组
 * @property toolCallId - 工具调用 ID
 * @property toolName - 工具名称
 * @property toolSuccess - 工具调用是否成功
 * @property timestamp - 时间戳
 */
export interface Message {
  /** 消息 ID */
  id: string;
  /** 角色 */
  role: "user" | "assistant" | "system" | "tool";
  /** 内容 */
  content: string;
  /** 图片数组 */
  images?: string[];
  /** 工具调用 ID */
  toolCallId?: string;
  /** 工具名称 */
  toolName?: string;
  /** 工具调用是否成功 */
  toolSuccess?: boolean;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 活动工具调用接口
 * @property id - 工具调用 ID
 * @property name - 工具名称
 * @property arguments - 参数
 */
export interface ToolCallActive {
  /** 工具调用 ID */
  id: string;
  /** 工具名称 */
  name: string;
  /** 参数 */
  arguments: string;
}

/**
 * Agent 状态管理接口
 * @property sessionId - 会话 ID
 * @property messages - 消息列表
 * @property isStreaming - 是否正在流式传输
 * @property isLoading - 是否正在加载
 * @property error - 错误信息
 * @property totalTokens - 总 Token 数
 * @property completionTokens - 完成 Token 数
 * @property promptTokens - 提示 Token 数
 * @property quotas - 配额列表
 * @property activeToolCall - 活动工具调用
 * @property streamClient - 流客户端
 */
interface AgentState {
  /** 会话 ID */
  sessionId: string | null;
  /** 消息列表 */
  messages: Message[];
  /** 是否正在流式传输 */
  isStreaming: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 总 Token 数 */
  totalTokens: number;
  /** 完成 Token 数 */
  completionTokens: number;
  /** 提示 Token 数 */
  promptTokens: number;
  /** 配额列表 */
  quotas: QuotaStatus[];
  /** 活动工具调用 */
  activeToolCall: ToolCallActive | null;
  /** 流客户端 */
  streamClient: { abort: () => void } | null;

  /** 开始会话 */
  startSession: () => Promise<void>;
  /** 发送消息 */
  sendMessage: (content: string, images?: string[]) => Promise<void>;
  /** 中止流 */
  abortStream: () => void;
  /** 清空消息 */
  clearMessages: () => void;
  /** 加载配额 */
  loadQuotas: () => Promise<void>;
  /** 删除会话 */
  deleteSession: () => Promise<void>;
}

// 兼容非安全环境的 UUID 生成
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Agent 状态管理 Hook
 * @returns Agent 状态管理对象
 */
export const useAgentStore = create<AgentState>((set, get) => ({
  sessionId: null,
  messages: [],
  isStreaming: false,
  isLoading: false,
  error: null,
  totalTokens: 0,
  completionTokens: 0,
  promptTokens: 0,
  quotas: [],
  activeToolCall: null,
  streamClient: null,

  startSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.session.create({ model: "deepseek" });
      set({ sessionId: res.session_id, messages: [], isLoading: false });
    } catch {
      set({ error: "会话创建失败, 请检查网络后重试", isLoading: false });
    }
  },

  sendMessage: async (content, images) => {
    let { sessionId } = get();

    if (!sessionId) {
      await get().startSession();
      sessionId = get().sessionId;
      if (!sessionId) return; // 创建会话失败
    }

    const userMsg: Message = {
      id: generateUUID(),
      role: "user",
      content,
      images,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isStreaming: true,
      isLoading: false,
      error: null,
      totalTokens: 0,
      completionTokens: 0,
      promptTokens: 0,
    }));

    const assistantMsgId = generateUUID();
    let assistantContent = "";
    let lastUsage: StreamUsageEvent["data"] | null = null;

    set((state) => ({
      messages: [
        ...state.messages,
        { id: assistantMsgId, role: "assistant", content: "", timestamp: Date.now() },
      ],
    }));

    // SSE POST 需要用 fetch, EventSource 不支持 POST, 改用 fetch + ReadableStream
    const token = Cookies.get("token");
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE ||
      `${window.location.protocol}//${window.location.hostname}:5666/api`;
    let aborted = false;

    const abortFn = () => {
      aborted = true;
      set({ isStreaming: false });
    };

    set({ streamClient: { abort: abortFn }, activeToolCall: null });

    try {
      const res = await fetch(
        `${apiBase}/sessions/${sessionId}/messages/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content, role: "user", images }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = res.statusText;
        try {
          const errJson = JSON.parse(errorText);
          errorMessage = errJson.detail?.message || errJson.message || errorMessage;
        } catch {
          // ignore
        }

        if (res.status === 401 && errorMessage.includes("免费额度")) {
          if (typeof window !== "undefined") {
            window.location.href = "/login?reason=quota_exceeded";
            return;
          }
        }

        throw new Error(errorMessage);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.event === "token") {
              assistantContent += parsed.data;
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: assistantContent } : m
                ),
              }));
            } else if (parsed.event === "tool_call_end") {
              const toolMsg: Message = {
                id: generateUUID(),
                role: "tool",
                content: parsed.data.arguments,
                toolCallId: parsed.data.tool_call_id,
                toolName: parsed.data.tool_name,
                toolSuccess: true,
                timestamp: Date.now(),
              };
              set((state) => ({ messages: [...state.messages, toolMsg] }));
            } else if (parsed.event === "usage") {
              lastUsage = parsed.data;
              set({
                promptTokens: parsed.data.prompt_tokens,
                completionTokens: parsed.data.completion_tokens,
                totalTokens: parsed.data.total_tokens,
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }

      if (lastUsage) {
        set({
          promptTokens: lastUsage.prompt_tokens,
          completionTokens: lastUsage.completion_tokens,
          totalTokens: lastUsage.total_tokens,
        });
      }
    } catch (e: any) {
      set({ error: e.message || "消息发送失败, 请检查网络后重试" });
    } finally {
      set({ isStreaming: false, streamClient: null, activeToolCall: null });
    }
  },

  abortStream: () => {
    const { streamClient } = get();
    if (streamClient) {
      streamClient.abort();
      set({ isStreaming: false, streamClient: null });
    }
  },

  clearMessages: () => {
    set({ messages: [], totalTokens: 0, completionTokens: 0, promptTokens: 0, error: null });
  },

  loadQuotas: async () => {
    try {
      const res = await api.agent.getQuota();
      set({ quotas: res.quotas });
    } catch {
      // ignore
    }
  },

  deleteSession: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    try {
      await api.session.delete(sessionId);
    } catch {
      // ignore
    }
    set({ sessionId: null, messages: [] });
  },
}));
