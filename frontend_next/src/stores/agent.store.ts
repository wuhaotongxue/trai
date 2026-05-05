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
 * 会话项接口
 */
export interface SessionItem {
  session_id: string;
  title: string | null;
  model: string;
  message_count: number;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Agent 状态管理接口
 * @property sessionId - 会话 ID
 * @property messages - 消息列表
 * @property sessions - 会话列表
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
  /** 会话列表 */
  sessions: SessionItem[];
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
  /** 悬浮聊天框是否开启 */
  isFloatingChatOpen: boolean;
  /** 是否正在生成图片 */
  isGeneratingImage: boolean;
  /** 生成的图片 URL */
  generatedImageUrl: string | null;
  /** 图片生成错误信息 */
  imageGenerateError: string | null;
  /** 图片廊 - 历史生成的图片 */
  imageGallery: Array<{
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
  }>;
  /** 是否正在生成视频 */
  isGeneratingVideo: boolean;
  /** 生成的视频 URL */
  generatedVideoUrl: string | null;
  /** 视频生成错误信息 */
  videoGenerateError: string | null;
  /** 视频廊 - 历史生成的视频 */
  videoGallery: Array<{
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
  }>;
  /** 是否正在生成音乐 */
  isGeneratingMusic: boolean;
  /** 生成的音乐 URL */
  generatedMusicUrl: string | null;
  /** 音乐生成错误信息 */
  musicGenerateError: string | null;
  /** 音乐廊 - 历史生成的音乐 */
  musicGallery: Array<{
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
  }>;

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
  deleteSession: (sessionId?: string) => Promise<void>;
  /** 设置悬浮聊天框开启状态 */
  setFloatingChatOpen: (open: boolean) => void;
  /** 加载会话列表 */
  loadSessions: () => Promise<void>;
  /** 切换会话 */
  switchSession: (sessionId: string) => Promise<void>;
  /** 重命名会话 */
  renameSession: (sessionId: string, title: string) => Promise<void>;
  /** 生成图片 */
  generateImage: (prompt: string, model?: string, width?: number, height?: number) => Promise<void>;
  /** 清除生成的图片 */
  clearGeneratedImage: () => void;
  /** 添加图片到图片廊 */
  addToImageGallery: (url: string, prompt: string) => void;
  /** 从图片廊删除图片 */
  removeFromImageGallery: (id: string) => void;
  /** 清空图片廊 */
  clearImageGallery: () => void;
  /** 生成视频 */
  generateVideo: (prompt: string, model?: string, duration?: number, resolution?: string) => Promise<void>;
  /** 清除生成的视频 */
  clearGeneratedVideo: () => void;
  /** 添加视频到视频廊 */
  addToVideoGallery: (url: string, prompt: string) => void;
  /** 从视频廊删除视频 */
  removeFromVideoGallery: (id: string) => void;
  /** 清空视频廊 */
  clearVideoGallery: () => void;
  /** 生成音乐 */
  generateMusic: (prompt: string, model?: string, duration?: number, style?: string) => Promise<void>;
  /** 清除生成的音乐 */
  clearGeneratedMusic: () => void;
  /** 添加音乐到音乐廊 */
  addToMusicGallery: (url: string, prompt: string) => void;
  /** 从音乐廊删除音乐 */
  removeFromMusicGallery: (id: string) => void;
  /** 清空音乐廊 */
  clearMusicGallery: () => void;
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
  sessions: [],
  isStreaming: false,
  isLoading: false,
  error: null,
  totalTokens: 0,
  completionTokens: 0,
  promptTokens: 0,
  quotas: [],
  activeToolCall: null,
  streamClient: null,
  isFloatingChatOpen: false,
  isGeneratingImage: false,
  generatedImageUrl: null,
  imageGenerateError: null,
  imageGallery: [],
  isGeneratingVideo: false,
  generatedVideoUrl: null,
  videoGenerateError: null,
  videoGallery: [],
  isGeneratingMusic: false,
  generatedMusicUrl: null,
  musicGenerateError: null,
  musicGallery: [],

  // 从本地存储加载图片廊,视频廊,音乐廊
  ...(() => {
    const result: Partial<AgentState> = {};
    try {
      const storedImageGallery = localStorage.getItem('imageGallery');
      if (storedImageGallery) {
        result.imageGallery = JSON.parse(storedImageGallery);
      }
      const storedVideoGallery = localStorage.getItem('videoGallery');
      if (storedVideoGallery) {
        result.videoGallery = JSON.parse(storedVideoGallery);
      }
      const storedMusicGallery = localStorage.getItem('musicGallery');
      if (storedMusicGallery) {
        result.musicGallery = JSON.parse(storedMusicGallery);
      }
    } catch {
      // 忽略解析错误
    }
    return result;
  })(),

  startSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.session.create({ model: "deepseek-chat" });
      set({ sessionId: res.session_id, messages: [], isLoading: false });
      await get().loadSessions();
    } catch {
      set({ error: "会话创建失败, 请检查网络后重试", isLoading: false });
    }
  },

  sendMessage: async (content: string, images?: string[]) => {
    let { sessionId } = get();

    // Optimistic UI update: Immediately add user message and placeholder assistant message
    const userMsg: Message = {
      id: generateUUID(),
      role: "user",
      content,
      images,
      timestamp: Date.now(),
    };

    const assistantMsgId = generateUUID();

    set((state) => ({
      messages: [
        ...state.messages, 
        userMsg,
        { id: assistantMsgId, role: "assistant", content: "", timestamp: Date.now() + 1 }
      ],
      isStreaming: true,
      isLoading: false,
      error: null,
      totalTokens: 0,
      completionTokens: 0,
      promptTokens: 0,
    }));

    // Start session if none exists (now happening in background while UI is updated)
    if (!sessionId) {
      await get().startSession();
      sessionId = get().sessionId;
      if (!sessionId) {
        set({ isStreaming: false, error: "会话创建失败" });
        return;
      }
    }

    let assistantContent = "";
    let lastUsage: StreamUsageEvent["data"] | null = null;

    // SSE POST 需要用 fetch, EventSource 不支持 POST, 改用 fetch + ReadableStream
    const token = Cookies.get("token");
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE ||
      (window.location.protocol === "https:"
        ? `${window.location.protocol}//${window.location.hostname}/api_trai/v1`
        : `${window.location.protocol}//${window.location.hostname}:5666/api_trai/v1`);
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "消息发送失败, 请检查网络后重试";
      set({ error: message });
    } finally {
      set({ isStreaming: false, streamClient: null, activeToolCall: null });
    }
    await get().loadSessions();
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

  deleteSession: async (id?: string) => {
    const targetId = id || get().sessionId;
    if (!targetId) return;
    try {
      await api.session.delete(targetId);
      if (targetId === get().sessionId) {
        set({ sessionId: null, messages: [] });
      }
      await get().loadSessions();
    } catch {
      // ignore
    }
  },

  setFloatingChatOpen: (open: boolean) => {
    set({ isFloatingChatOpen: open });
  },

  loadSessions: async () => {
    try {
      const res = await api.session.list();
      set({ sessions: res.sessions });
    } catch {
      // ignore
    }
  },

  switchSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.session.get(sessionId);
      set({
        sessionId: res.session_id,
        messages: res.messages,
        isLoading: false,
      });
    } catch {
      set({ error: "切换会话失败", isLoading: false });
    }
  },

  renameSession: async (sessionId: string, title: string) => {
    try {
      await api.session.rename(sessionId, title);
      await get().loadSessions();
    } catch {
      // ignore
    }
  },

  generateImage: async (prompt: string, model?: string, width?: number, height?: number) => {
    set({ isGeneratingImage: true, imageGenerateError: null, generatedImageUrl: null });
    try {
      const res = await api.agent.generateImage({ prompt, model, width, height });
      if (res.image_url) {
        set({ generatedImageUrl: res.image_url, isGeneratingImage: false });
        // 将生成的图片添加到图片廊
        get().addToImageGallery(res.image_url, prompt);
      } else {
        set({ imageGenerateError: res.error || "图片生成失败", isGeneratingImage: false });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "图片生成失败";
      set({ imageGenerateError: msg, isGeneratingImage: false });
    }
  },

  clearGeneratedImage: () => {
    set({ generatedImageUrl: null, imageGenerateError: null });
  },

  addToImageGallery: (url: string, prompt: string) => {
    const newImage = {
      id: generateUUID(),
      url,
      prompt,
      timestamp: Date.now(),
    };
    set((state) => {
      const updatedGallery = [newImage, ...state.imageGallery].slice(0, 20); // 只保留最近20张图片
      // 保存到本地存储
      try {
        localStorage.setItem('imageGallery', JSON.stringify(updatedGallery));
      } catch {
        // 忽略存储错误
      }
      return { imageGallery: updatedGallery };
    });
  },

  removeFromImageGallery: (id: string) => {
    set((state) => {
      const updatedGallery = state.imageGallery.filter((img) => img.id !== id);
      // 保存到本地存储
      try {
        localStorage.setItem('imageGallery', JSON.stringify(updatedGallery));
      } catch {
        // 忽略存储错误
      }
      return { imageGallery: updatedGallery };
    });
  },

  clearImageGallery: () => {
    set({ imageGallery: [] });
    // 清空本地存储
    try {
      localStorage.removeItem('imageGallery');
    } catch {
      // 忽略存储错误
    }
  },

  generateVideo: async (prompt: string, model?: string, duration?: number, resolution?: string) => {
    set({ isGeneratingVideo: true, videoGenerateError: null, generatedVideoUrl: null });
    try {
      const res = await api.agent.generateVideo({ prompt, model, duration, resolution });
      if (res.video_url) {
        set({ generatedVideoUrl: res.video_url, isGeneratingVideo: false });
        // 将生成的视频添加到视频廊
        get().addToVideoGallery(res.video_url, prompt);
      } else {
        set({ videoGenerateError: res.error || "视频生成失败", isGeneratingVideo: false });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "视频生成失败";
      set({ videoGenerateError: msg, isGeneratingVideo: false });
    }
  },

  clearGeneratedVideo: () => {
    set({ generatedVideoUrl: null, videoGenerateError: null });
  },

  addToVideoGallery: (url: string, prompt: string) => {
    const newVideo = {
      id: generateUUID(),
      url,
      prompt,
      timestamp: Date.now(),
    };
    set((state) => {
      const updatedGallery = [newVideo, ...state.videoGallery].slice(0, 20); // 只保留最近20个视频
      // 保存到本地存储
      try {
        localStorage.setItem('videoGallery', JSON.stringify(updatedGallery));
      } catch {
        // 忽略存储错误
      }
      return { videoGallery: updatedGallery };
    });
  },

  removeFromVideoGallery: (id: string) => {
    set((state) => {
      const updatedGallery = state.videoGallery.filter((video) => video.id !== id);
      // 保存到本地存储
      try {
        localStorage.setItem('videoGallery', JSON.stringify(updatedGallery));
      } catch {
        // 忽略存储错误
      }
      return { videoGallery: updatedGallery };
    });
  },

  clearVideoGallery: () => {
    set({ videoGallery: [] });
    // 清空本地存储
    try {
      localStorage.removeItem('videoGallery');
    } catch {
      // 忽略存储错误
    }
  },

  generateMusic: async (prompt: string, model?: string, duration?: number, style?: string) => {
    set({ isGeneratingMusic: true, musicGenerateError: null, generatedMusicUrl: null });
    try {
      const res = await api.agent.generateMusic({ prompt, model, duration, style });
      if (res.music_url) {
        set({ generatedMusicUrl: res.music_url, isGeneratingMusic: false });
        // 将生成的音乐添加到音乐廊
        get().addToMusicGallery(res.music_url, prompt);
      } else {
        set({ musicGenerateError: res.error || "音乐生成失败", isGeneratingMusic: false });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "音乐生成失败";
      set({ musicGenerateError: msg, isGeneratingMusic: false });
    }
  },

  clearGeneratedMusic: () => {
    set({ generatedMusicUrl: null, musicGenerateError: null });
  },

  addToMusicGallery: (url: string, prompt: string) => {
    const newMusic = {
      id: generateUUID(),
      url,
      prompt,
      timestamp: Date.now(),
    };
    set((state) => {
      const updatedGallery = [newMusic, ...state.musicGallery].slice(0, 20); // 只保留最近20首音乐
      // 保存到本地存储
      try {
        localStorage.setItem('musicGallery', JSON.stringify(updatedGallery));
      } catch {
        // 忽略存储错误
      }
      return { musicGallery: updatedGallery };
    });
  },

  removeFromMusicGallery: (id: string) => {
    set((state) => {
      const updatedGallery = state.musicGallery.filter((music) => music.id !== id);
      // 保存到本地存储
      try {
        localStorage.setItem('musicGallery', JSON.stringify(updatedGallery));
      } catch {
        // 忽略存储错误
      }
      return { musicGallery: updatedGallery };
    });
  },

  clearMusicGallery: () => {
    set({ musicGallery: [] });
    // 清空本地存储
    try {
      localStorage.removeItem('musicGallery');
    } catch {
      // 忽略存储错误
    }
  },
}));
