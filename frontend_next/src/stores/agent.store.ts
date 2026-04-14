/**
 * agent.store.ts
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: Agent 对话状态管理
 */

import { create } from "zustand";
import { api, type AgentChatResponse, type QuotaStatus, type StreamUsageEvent } from "@/lib/api-client";

export interface ImageContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  images?: string[];
  toolCallId?: string;
  toolName?: string;
  toolSuccess?: boolean;
  timestamp: number;
}

export interface ToolCallActive {
  id: string;
  name: string;
  arguments: string;
}

interface AgentState {
  sessionId: string | null;
  messages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  totalTokens: number;
  completionTokens: number;
  promptTokens: number;
  quotas: QuotaStatus[];
  activeToolCall: ToolCallActive | null;
  streamClient: { abort: () => void } | null;

  startSession: () => Promise<void>;
  sendMessage: (content: string, images?: string[]) => Promise<void>;
  abortStream: () => void;
  clearMessages: () => void;
  loadQuotas: () => Promise<void>;
  deleteSession: () => Promise<void>;
}

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
      const res = await api.session.create({ model: "gpt-4o" });
      set({ sessionId: res.session_id, messages: [], isLoading: false });
    } catch (e) {
      set({ error: "会话创建失败，请检查网络后重试", isLoading: false });
    }
  },

  sendMessage: async (content, images) => {
    const { sessionId, messages } = get();

    if (!sessionId) {
      await get().startSession();
      return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
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

    // 构造多模态消息（Vision）
    const msgContent: string | ImageContent[] =
      images && images.length > 0
        ? [
            { type: "text" as const, text: content },
            ...images.map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ]
        : content;

    const client = api.agent;
    const streamClient = new EventSource(
      `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api"}/sessions/${sessionId}/messages/stream`
    );

    const assistantMsgId = crypto.randomUUID();
    let assistantContent = "";
    let lastUsage: StreamUsageEvent["data"] | null = null;

    set((state) => ({
      messages: [
        ...state.messages,
        { id: assistantMsgId, role: "assistant", content: "", timestamp: Date.now() },
      ],
    }));

    // SSE POST 需要用 fetch，EventSource 不支持 POST，改用 fetch + ReadableStream
    const token = localStorage.getItem("token");
    let aborted = false;

    const abortFn = () => {
      aborted = true;
      set({ isStreaming: false });
    };

    set({ streamClient: { abort: abortFn }, activeToolCall: null });

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api"}/sessions/${sessionId}/messages/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content, role: "user" }),
        }
      );

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
                id: crypto.randomUUID(),
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
    } catch (e) {
      set({ error: "消息发送失败，请检查网络后重试" });
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
