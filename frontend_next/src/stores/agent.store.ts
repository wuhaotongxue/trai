import Cookies from "js-cookie";
/**
 * agent.store.ts
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: Agent 对话状态管理
 */

import { create } from "zustand";
import { api, type AgentTypeValue, type MediaHistoryItem, type QuotaStatus, type StreamUsageEvent, type VideoGenerationTaskStatus } from "@/lib/api_client";
import { globalToast } from "@/components/toast/toast";
import { toastMessages } from "@/components/toast/use_toast";

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
  /** 思考过程 */
  thinking?: string;
  /** 引用来源 */
  sources?: { title: string; link: string; snippet: string }[];
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
  /** 本地缓存：第一条用户消息 */
  firstUserMessage?: string;
}

/**
 * 画廊媒体项接口.
 */
export interface GalleryMediaItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  task_id?: string;
  public_url?: string | null;
  status?: string;
  meta?: Record<string, unknown>;
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
  /** 图片生成进度(0-100) */
  imageGenerateProgress: number;
  /** 图片生成阶段 */
  imageGenerateStage: "idle" | "generating" | "done" | "error";
  /** 图片生成进度定时器 */
  imageGenerateTimer: number | null;
  /** 图片廊 - 历史生成的图片 */
  imageGallery: GalleryMediaItem[];
  /** 是否正在生成视频 */
  isGeneratingVideo: boolean;
  /** 生成的视频 URL */
  generatedVideoUrl: string | null;
  /** 视频生成错误信息 */
  videoGenerateError: string | null;
  /** 视频生成任务 ID */
  videoGenerateTaskId: string | null;
  /** 视频生成阶段 */
  videoGenerateStage: string | null;
  /** 视频生成进度描述 */
  videoGenerateProgress: string | null;
  /** 视频生成当前步骤 */
  videoGenerateCurrentStep: number | null;
  /** 视频生成总步骤 */
  videoGenerateTotalSteps: number | null;
  /** 视频生成帧数 */
  videoGenerateFrames: number | null;
  /** 视频生成分辨率 */
  videoGenerateResolution: string | null;
  /** 视频生成耗时 */
  videoGenerateElapsedSeconds: number | null;
  /** 视频廊 - 历史生成的视频 */
  videoGallery: GalleryMediaItem[];
  /** 是否正在生成音乐 */
  isGeneratingMusic: boolean;
  /** 音乐生成进度 */
  musicGenerateProgress: string | null;
  /** 音乐生成任务 ID */
  musicGenerateTaskId: string | null;
  /** 生成的音乐 URL */
  generatedMusicUrl: string | null;
  /** 音乐生成错误信息 */
  musicGenerateError: string | null;
  /** 音乐廊 - 历史生成的音乐 */
  musicGallery: GalleryMediaItem[];
  /** 是否正在编辑图片 */
  isEditingImage: boolean;
  /** 编辑后的图片 URL */
  editedImageUrl: string | null;
  /** 图片编辑错误信息 */
  imageEditError: string | null;
  /** 当前编辑的原图 base64 */
  editingSourceImage: string | null;
  /** 图片编辑 AbortController */
  editAbortController: AbortController | null;

  /** 开始会话 */
  startSession: () => Promise<void>;
  /** 发送消息 */
  sendMessage: (content: string, images?: string[], options?: { agentType?: AgentTypeValue | null }) => Promise<void>;
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
  /** 编辑图片（单图/双图联动） */
  editImage: (sourceImage: string, editPrompt: string, sourceImage2?: string | null) => Promise<void>;
  /** 清除编辑结果 */
  clearEditedImage: () => void;
  /** 取消图片编辑 */
  cancelEditImage: () => void;
  /** 添加图片到图片廊 */
  addToImageGallery: (url: string, prompt: string, taskId?: string, publicUrl?: string | null) => void;
  /** 从图片廊删除图片 */
  removeFromImageGallery: (id: string) => void;
  /** 清空图片廊 */
  clearImageGallery: () => void;
  /** 生成视频 */
  generateVideo: (prompt: string, model?: string, duration?: number, resolution?: string) => Promise<void>;
  /** 清除生成的视频 */
  clearGeneratedVideo: () => void;
  /** 添加视频到视频廊 */
  addToVideoGallery: (url: string, prompt: string, taskId?: string, publicUrl?: string | null) => void;
  /** 从视频廊删除视频 */
  removeFromVideoGallery: (id: string) => void;
  /** 清空视频廊 */
  clearVideoGallery: () => void;
  /** 生成音乐 */
  generateMusic: (prompt: string, duration?: number, steps?: number, guidance_scale?: number) => Promise<void>;
  /** 取消音乐生成 */
  cancelGenerateMusic: () => Promise<void>;
  /** 清除生成的音乐 */
  clearGeneratedMusic: () => void;
  /** 添加音乐到音乐廊 */
  addToMusicGallery: (url: string, prompt: string, taskId?: string, publicUrl?: string | null) => void;
  /** 从音乐廊删除音乐 */
  removeFromMusicGallery: (id: string) => void;
  /** 清空音乐廊 */
  clearMusicGallery: () => void;
  /** 从 localStorage 恢复 gallery 数据（仅客户端调用） */
  hydrateGalleries: () => void;
  /** 从后端加载媒体历史 */
  loadMediaHistory: () => Promise<void>;
  /** 删除单条媒体历史 */
  deleteMediaHistoryItem: (mediaType: "image" | "music" | "video", taskId: string) => Promise<void>;
  /** 批量删除媒体历史 */
  batchDeleteMediaHistoryItems: (mediaType: "image" | "music" | "video", taskIds: string[]) => Promise<void>;
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
 * 异步等待指定毫秒数.
 * @param ms 等待毫秒数
 * @returns Promise<void>
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 将后端媒体历史项转换为前端画廊项.
 * @param item 后端媒体历史项
 * @returns 画廊媒体项
 */
const mapHistoryItemToGalleryItem = (item: MediaHistoryItem): GalleryMediaItem | null => {
  if (!item.url) {
    return null;
  }
  return {
    id: item.task_id,
    task_id: item.task_id,
    url: item.url,
    public_url: item.public_url,
    prompt: item.prompt,
    status: item.status,
    meta: item.meta,
    timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
  };
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
  imageGenerateProgress: 0,
  imageGenerateStage: "idle",
  imageGenerateTimer: null,
  imageGallery: [],
  isGeneratingVideo: false,
  generatedVideoUrl: null,
  videoGenerateError: null,
  videoGenerateTaskId: null,
  videoGenerateStage: null,
  videoGenerateProgress: null,
  videoGenerateCurrentStep: null,
  videoGenerateTotalSteps: null,
  videoGenerateFrames: null,
  videoGenerateResolution: null,
  videoGenerateElapsedSeconds: null,
  videoGallery: [],
  isGeneratingMusic: false,
  musicGenerateProgress: null,
  musicGenerateTaskId: null,
  generatedMusicUrl: null,
  musicGenerateError: null,
  musicGallery: [],

  isEditingImage: false,
  editedImageUrl: null,
  imageEditError: null,
  editingSourceImage: null,
  editAbortController: null,

  /** 从 localStorage 恢复 gallery 数据（仅客户端调用） */
  hydrateGalleries: () => {
    if (Cookies.get("token")) {
      void get().loadMediaHistory();
      return;
    }
    try {
      const storedImageGallery = localStorage.getItem('imageGallery');
      if (storedImageGallery) {
        set({ imageGallery: JSON.parse(storedImageGallery) });
      }
      const storedVideoGallery = localStorage.getItem('videoGallery');
      if (storedVideoGallery) {
        set({ videoGallery: JSON.parse(storedVideoGallery) });
      }
      const storedMusicGallery = localStorage.getItem('musicGallery');
      if (storedMusicGallery) {
        set({ musicGallery: JSON.parse(storedMusicGallery) });
      }
    } catch {
      // 忽略解析错误
    }
  },

  loadMediaHistory: async () => {
    try {
      const history = await api.agent.listMediaHistory({ limit: 100 });
      const imageGallery = history.images.map(mapHistoryItemToGalleryItem).filter((item): item is GalleryMediaItem => item !== null);
      const videoGallery = history.videos.map(mapHistoryItemToGalleryItem).filter((item): item is GalleryMediaItem => item !== null);
      const musicGallery = history.music.map(mapHistoryItemToGalleryItem).filter((item): item is GalleryMediaItem => item !== null);
      set({ imageGallery, videoGallery, musicGallery });
    } catch {
      // 保持当前本地状态
    }
  },

  deleteMediaHistoryItem: async (mediaType, taskId) => {
    await api.agent.deleteMediaHistory({ media_type: mediaType, task_id: taskId });
    if (mediaType === "image") {
      set((state) => ({ imageGallery: state.imageGallery.filter((item) => item.task_id !== taskId && item.id !== taskId) }));
      return;
    }
    if (mediaType === "video") {
      set((state) => ({ videoGallery: state.videoGallery.filter((item) => item.task_id !== taskId && item.id !== taskId) }));
      return;
    }
    set((state) => ({ musicGallery: state.musicGallery.filter((item) => item.task_id !== taskId && item.id !== taskId) }));
  },

  batchDeleteMediaHistoryItems: async (mediaType, taskIds) => {
    await api.agent.batchDeleteMediaHistory({ media_type: mediaType, task_ids: taskIds });
    if (mediaType === "image") {
      set((state) => ({ imageGallery: state.imageGallery.filter((item) => !taskIds.includes(item.task_id || item.id)) }));
      return;
    }
    if (mediaType === "video") {
      set((state) => ({ videoGallery: state.videoGallery.filter((item) => !taskIds.includes(item.task_id || item.id)) }));
      return;
    }
    set((state) => ({ musicGallery: state.musicGallery.filter((item) => !taskIds.includes(item.task_id || item.id)) }));
  },

  startSession: async () => {
    const existingEmpty = get().sessions.find((s) => s.message_count === 0);
    if (existingEmpty) {
      await get().switchSession(existingEmpty.session_id);
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const res = await api.session.create({ model: "deepseek-v4-flash" });
      if (!res.session_id) throw new Error("创建会话返回异常");
      set({ sessionId: res.session_id, messages: [], isLoading: false });
      await get().loadSessions();
    } catch (e) {
      console.error("会话创建失败:", e);
      set({ error: "会话创建失败, 请检查网络后重试", isLoading: false });
    }
  },

  sendMessage: async (content: string, images?: string[], options?: { agentType?: AgentTypeValue | null }) => {
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
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "/api_trai/v1";
    let aborted = false;

    const abortFn = () => {
      aborted = true;
      set({ isStreaming: false });
    };

    set({ streamClient: { abort: abortFn }, activeToolCall: null });

    try {
      const agentType = options?.agentType ?? null;
      const agentId =
        agentType === "chat"
          ? "agent-default"
          : agentType === "code_assistant"
            ? "agent-001"
            : agentType === "image_generator"
              ? "agent-002"
              : null;

      const res = await fetch(
        `${apiBase}/agent/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            session_id: sessionId,
            message: content,
            role: "user",
            stream: true,
            agent_id: agentId || undefined,
          }),
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
          // 跳过 event: 行，只处理 data: 行
          if (line.startsWith("event: ")) continue;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.event === "token") {
              assistantContent += parsed.data;
              // 立即更新状态，确保打字机效果
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: assistantContent } : m
                ),
              }));
            } else if (parsed.event === "reasoning") {
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, thinking: (m.thinking || "") + parsed.data } : m
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
            } else if (parsed.type === "sources") {
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, sources: parsed.sources } : m
                ),
              }));
            } else if (parsed.type === "error") {
              const errMsg = typeof parsed.content === "string" && parsed.content ? parsed.content : "服务返回错误";
              set({ error: errMsg });
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
    // 缓存第一条用户消息到会话列表，供会话标题展示
    if (sessionId && content) {
      set((state) => {
        const updated = state.sessions.map((s) =>
          s.session_id === sessionId && !s.firstUserMessage
            ? { ...s, firstUserMessage: content }
            : s
        );
        // 同步到 localStorage
        try {
          const stored = JSON.parse(localStorage.getItem("sessionFirstMessages") || "{}");
          stored[sessionId] = content;
          localStorage.setItem("sessionFirstMessages", JSON.stringify(stored));
        } catch {}
        return { sessions: updated };
      });
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
      // 延迟 1 秒后提示，让用户看到删除效果
      setTimeout(() => {
        globalToast({ message: toastMessages.deleted, variant: "success" });
      }, 1000);
      if (targetId === get().sessionId) {
        set({ sessionId: null, messages: [] });
      }
      // 从会话列表中移除已删除的会话，避免 404
      set((state) => ({
        sessions: state.sessions.filter((s) => s.session_id !== targetId),
      }));
      await get().loadSessions();
    } catch (e) {
      // 删除失败时也移除本地会话（乐观更新），避免 UI 与后端不一致
      set((state) => ({
        sessions: state.sessions.filter((s) => s.session_id !== targetId),
      }));
      console.warn("删除会话失败:", e);
    }
  },

  setFloatingChatOpen: (open: boolean) => {
    set({ isFloatingChatOpen: open });
  },

  loadSessions: async () => {
    try {
      const res = await api.session.list();
      // 从 localStorage 恢复第一条消息缓存
      let storedFirstMsgs: Record<string, string> = {};
      try {
        storedFirstMsgs = JSON.parse(localStorage.getItem("sessionFirstMessages") || "{}");
      } catch {}
      // 合并更新：API 返回的标题优先，避免竞态导致旧数据覆盖新标题
      set((state) => {
        const freshIds = new Set(res.sessions.map((s: { session_id: string }) => s.session_id));
        const freshSessions = res.sessions as unknown as Array<{ session_id: string; title: string | null | undefined }>;
        const merged = freshSessions.map((fresh) => {
          const local = state.sessions.find((s) => s.session_id === fresh.session_id);
          // API 返回的标题为准；null 说明后端尚未更新（旧缓存），保留本地已知标题
          return {
            ...local,
            ...fresh,
            title: (fresh.title ?? local?.title) as string | null,
            firstUserMessage: local?.firstUserMessage ?? storedFirstMsgs[fresh.session_id] ?? undefined,
          } as SessionItem;
        });
        // 保留 API 未返回的会话（正常情况下不应出现）
        const others = state.sessions.filter((s) => !freshIds.has(s.session_id));
        return { sessions: [...merged, ...others] };
      });
    } catch {
      // ignore
    }
  },

  switchSession: async (sessionId: string) => {
    // 如果已经是当前会话，不重复切换
    if (sessionId === get().sessionId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await api.session.get(sessionId);
      set({
        sessionId: res.session_id,
        messages: res.messages,
        isLoading: false,
      });
    } catch (e) {
      // 会话不存在（404）时，静默从列表移除，避免反复报错
      const errorMsg = e instanceof Error ? e.message : String(e);
      const is404 = errorMsg.includes("不存在") || errorMsg.includes("404") || errorMsg.includes("会话");

      set({ isLoading: false });
      set((state) => ({
        sessions: state.sessions.filter((s) => s.session_id !== sessionId),
        sessionId: state.sessionId === sessionId ? null : state.sessionId,
      }));

      if (!is404) {
        console.warn("切换会话失败:", sessionId, e);
      }
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
    const current = get().generatedImageUrl;
    if (current && current.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(current);
      } catch {
      }
    }
    const existingTimer = get().imageGenerateTimer;
    if (existingTimer) {
      try {
        window.clearInterval(existingTimer);
      } catch {
      }
    }

    const timer =
      typeof window !== "undefined"
        ? window.setInterval(() => {
            set((state) => {
              if (state.imageGenerateStage !== "generating") return state;
              const next = Math.min(92, state.imageGenerateProgress + Math.max(1, Math.round(Math.random() * 4)));
              return { ...state, imageGenerateProgress: next };
            });
          }, 450)
        : null;

    set({
      isGeneratingImage: true,
      imageGenerateError: null,
      generatedImageUrl: null,
      imageGenerateProgress: 8,
      imageGenerateStage: "generating",
      imageGenerateTimer: timer,
    });
    try {
      const res = await api.agent.generateImage({ prompt, model, width, height, steps: 4, seed: -1 });
      if (res.image_url) {
        if (timer) {
          try {
            window.clearInterval(timer);
          } catch {
          }
        }
        set({
          generatedImageUrl: res.image_url,
          isGeneratingImage: false,
          imageGenerateProgress: 100,
          imageGenerateStage: "done",
          imageGenerateTimer: null,
          imageGenerateError: res.error || null,
        });
        // 将生成的图片添加到图片廊
        get().addToImageGallery(res.image_url, prompt, res.task_id);
      } else if (res.image_base64) {
        const byteString = atob(res.image_base64);
        const bytes = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          bytes[i] = byteString.charCodeAt(i);
        }
        const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
        if (timer) {
          try {
            window.clearInterval(timer);
          } catch {
          }
        }
        set({
          generatedImageUrl: blobUrl,
          isGeneratingImage: false,
          imageGenerateProgress: 100,
          imageGenerateStage: "done",
          imageGenerateTimer: null,
          imageGenerateError: res.error || null,
        });
        get().addToImageGallery(blobUrl, prompt);
      } else {
        if (timer) {
          try {
            window.clearInterval(timer);
          } catch {
          }
        }
        set({
          imageGenerateError: res.error || "图片生成失败",
          isGeneratingImage: false,
          imageGenerateStage: "error",
          imageGenerateTimer: null,
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "图片生成失败";
      if (timer) {
        try {
          window.clearInterval(timer);
        } catch {
        }
      }
      set({
        imageGenerateError: msg,
        isGeneratingImage: false,
        imageGenerateStage: "error",
        imageGenerateTimer: null,
      });
    }
  },

  clearGeneratedImage: () => {
    const current = get().generatedImageUrl;
    if (current && current.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(current);
      } catch {
      }
    }
    const existingTimer = get().imageGenerateTimer;
    if (existingTimer) {
      try {
        window.clearInterval(existingTimer);
      } catch {
      }
    }
    set({
      generatedImageUrl: null,
      imageGenerateError: null,
      imageGenerateProgress: 0,
      imageGenerateStage: "idle",
      imageGenerateTimer: null,
    });
  },

  editImage: async (sourceImage: string, editPrompt: string, sourceImage2?: string | null) => {
    const abortCtrl = new AbortController();
    set({ isEditingImage: true, imageEditError: null, editedImageUrl: null, editingSourceImage: sourceImage, editAbortController: abortCtrl });
    try {
      // 压缩图片：base64 图片压缩到 5M 以内（避免超过后端 10M 限制）
      let imageToSend = sourceImage;
      if (sourceImage.startsWith("data:image/")) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const base64 = sourceImage.split(",", 2)[1] || sourceImage;
        if (base64.length > maxSize) {
          const img = new Image();
          img.src = sourceImage;
          await new Promise((resolve) => { img.onload = resolve; });
          const canvas = document.createElement("canvas");
          const scale = Math.sqrt(maxSize / base64.length);
          canvas.width = Math.floor(img.width * scale * 0.8);
          canvas.height = Math.floor(img.height * scale * 0.8);
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          imageToSend = canvas.toDataURL("image/jpeg", 0.85);
        }
      }

      // 压缩第二张图（如有）
      let image2ToSend: string | undefined;
      if (sourceImage2) {
        image2ToSend = sourceImage2;
        if (sourceImage2.startsWith("data:image/")) {
          const base64_2 = sourceImage2.split(",", 2)[1] || sourceImage2;
          if (base64_2.length > 5 * 1024 * 1024) {
            const img2 = new Image();
            img2.src = sourceImage2;
            await new Promise((resolve) => { img2.onload = resolve; });
            const canvas2 = document.createElement("canvas");
            const scale2 = Math.sqrt((5 * 1024 * 1024) / base64_2.length);
            canvas2.width = Math.floor(img2.width * scale2 * 0.8);
            canvas2.height = Math.floor(img2.height * scale2 * 0.8);
            const ctx2 = canvas2.getContext("2d")!;
            ctx2.drawImage(img2, 0, 0, canvas2.width, canvas2.height);
            image2ToSend = canvas2.toDataURL("image/jpeg", 0.85);
          }
        }
      }

      const res = await api.agent.editImage({
        image_url: imageToSend,
        prompt: editPrompt,
        steps: 25,
        seed: -1,
        signal: abortCtrl.signal,
        ...(image2ToSend ? { image_url_2: image2ToSend } : {}),
      });
      set({ isEditingImage: false, editAbortController: null });
      if (res.image_url) {
        set({ editedImageUrl: res.image_url });
        get().addToImageGallery(res.image_url, editPrompt, res.task_id);
      } else if (res.image_base64) {
        const byteString = atob(res.image_base64);
        const bytes = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          bytes[i] = byteString.charCodeAt(i);
        }
        const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
        set({ editedImageUrl: blobUrl });
        get().addToImageGallery(blobUrl, editPrompt);
      } else {
        set({ imageEditError: res.error || "图片编辑失败" });
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        set({ isEditingImage: false, editAbortController: null });
        return;
      }
      const msg = e instanceof Error ? e.message : "图片编辑失败";
      set({ imageEditError: msg, isEditingImage: false, editAbortController: null });
    }
  },

  clearEditedImage: () => {
    const current = get().editedImageUrl;
    if (current && current.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(current);
      } catch {
      }
    }
    set({ editedImageUrl: null, imageEditError: null, editingSourceImage: null });
  },

  cancelEditImage: () => {
    const { editAbortController } = get();
    if (editAbortController) {
      editAbortController.abort();
    }
    set({ isEditingImage: false, imageEditError: null, editAbortController: null });
  },

  addToImageGallery: (url: string, prompt: string, taskId?: string, publicUrl?: string | null) => {
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      return;
    }
    const newImage = {
      id: taskId || generateUUID(),
      task_id: taskId,
      url,
      public_url: publicUrl || url,
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
    const target = get().imageGallery.find((item) => item.id === id || item.task_id === id);
    if (target?.task_id && Cookies.get("token")) {
      void get().deleteMediaHistoryItem("image", target.task_id);
      return;
    }
    set((state) => {
      const updatedGallery = state.imageGallery.filter((img) => img.id !== id);
      try {
        localStorage.setItem('imageGallery', JSON.stringify(updatedGallery));
      } catch {
      }
      return { imageGallery: updatedGallery };
    });
  },

  clearImageGallery: () => {
    const taskIds = get().imageGallery.map((item) => item.task_id).filter((item): item is string => Boolean(item));
    if (taskIds.length > 0 && Cookies.get("token")) {
      void get().batchDeleteMediaHistoryItems("image", taskIds);
      return;
    }
    set({ imageGallery: [] });
    try {
      localStorage.removeItem('imageGallery');
    } catch {
    }
  },

  generateVideo: async (prompt: string, model?: string, duration?: number, resolution?: string) => {
    const applyVideoTaskStatus = (status: VideoGenerationTaskStatus) => {
      set({
        videoGenerateTaskId: status.task_id ?? null,
        videoGenerateStage: status.stage ?? status.status ?? null,
        videoGenerateProgress: status.progress_message ?? null,
        videoGenerateCurrentStep: status.current_step ?? null,
        videoGenerateTotalSteps: status.total_steps ?? null,
        videoGenerateFrames: status.frames ?? duration ?? null,
        videoGenerateResolution: status.resolution ?? resolution ?? null,
        videoGenerateElapsedSeconds: status.total_time_seconds ?? null,
      });
    };

    set({
      isGeneratingVideo: true,
      videoGenerateError: null,
      generatedVideoUrl: null,
      videoGenerateTaskId: null,
      videoGenerateStage: "queued",
      videoGenerateProgress: "正在提交视频任务...",
      videoGenerateCurrentStep: 0,
      videoGenerateTotalSteps: 9,
      videoGenerateFrames: duration ?? 81,
      videoGenerateResolution: resolution ?? "1280x720",
      videoGenerateElapsedSeconds: null,
    });
    try {
      const res = await api.agent.generateVideo({ prompt, model, frames: duration, resolution });
      applyVideoTaskStatus(res);

      if (!res.task_id) {
        set({ videoGenerateError: res.error || "视频任务创建失败", isGeneratingVideo: false });
        return;
      }

      for (let attempt = 0; attempt < 900; attempt += 1) {
        const currentStatus = attempt === 0 ? res : await api.agent.getVideoStatus(res.task_id);
        applyVideoTaskStatus(currentStatus);

        if (currentStatus.status === "completed" && currentStatus.video_url) {
          set({
            generatedVideoUrl: currentStatus.video_url,
            isGeneratingVideo: false,
            videoGenerateError: null,
          });
          get().addToVideoGallery(currentStatus.video_url, prompt, currentStatus.task_id, currentStatus.public_url);
          return;
        }

        if (currentStatus.status === "failed") {
          set({
            videoGenerateError: currentStatus.error || "视频生成失败",
            isGeneratingVideo: false,
          });
          return;
        }

        await sleep(2000);
      }

      set({
        videoGenerateError: "视频生成超时, 请稍后重试",
        isGeneratingVideo: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "视频生成失败";
      set({ videoGenerateError: msg, isGeneratingVideo: false });
    }
  },

  clearGeneratedVideo: () => {
    set({
      generatedVideoUrl: null,
      videoGenerateError: null,
      videoGenerateTaskId: null,
      videoGenerateStage: null,
      videoGenerateProgress: null,
      videoGenerateCurrentStep: null,
      videoGenerateTotalSteps: null,
      videoGenerateFrames: null,
      videoGenerateResolution: null,
      videoGenerateElapsedSeconds: null,
    });
  },

  addToVideoGallery: (url: string, prompt: string, taskId?: string, publicUrl?: string | null) => {
    const newVideo = {
      id: taskId || generateUUID(),
      task_id: taskId,
      url,
      public_url: publicUrl || url,
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
    const target = get().videoGallery.find((item) => item.id === id || item.task_id === id);
    if (target?.task_id && Cookies.get("token")) {
      void get().deleteMediaHistoryItem("video", target.task_id);
      return;
    }
    set((state) => {
      const updatedGallery = state.videoGallery.filter((video) => video.id !== id);
      try {
        localStorage.setItem('videoGallery', JSON.stringify(updatedGallery));
      } catch {
      }
      return { videoGallery: updatedGallery };
    });
  },

  clearVideoGallery: () => {
    const taskIds = get().videoGallery.map((item) => item.task_id).filter((item): item is string => Boolean(item));
    if (taskIds.length > 0 && Cookies.get("token")) {
      void get().batchDeleteMediaHistoryItems("video", taskIds);
      return;
    }
    set({ videoGallery: [] });
    try {
      localStorage.removeItem('videoGallery');
    } catch {
    }
  },

  generateMusic: async (prompt: string, duration?: number, steps?: number, guidance_scale?: number) => {
    set({ isGeneratingMusic: true, musicGenerateError: null, generatedMusicUrl: null, musicGenerateProgress: "正在提交任务...", musicGenerateTaskId: null });
    try {
      const res = await api.agent.generateMusic({ prompt, duration, steps, guidance_scale });
      if (res.success && res.task_id) {
        set({ musicGenerateTaskId: res.task_id });
        
        // 开始轮询检查状态
        const checkStatus = async () => {
          // 如果任务已经被清空或不再是生成中，停止轮询
          if (!get().isGeneratingMusic || get().musicGenerateTaskId !== res.task_id) {
            return;
          }
          
          try {
            const statusRes = await api.agent.getMusicStatus(res.task_id);
            
            // 更新进度
            if (statusRes.status === "queued" && statusRes.queue_position) {
              set({ musicGenerateProgress: `排队中... 前面还有 ${statusRes.queue_position - 1} 人等待` });
            } else if (statusRes.progress) {
              set({ musicGenerateProgress: statusRes.progress });
            }

            if (statusRes.status === "completed" && statusRes.music_url) {
              set({ generatedMusicUrl: statusRes.music_url, isGeneratingMusic: false, musicGenerateProgress: "生成完毕", musicGenerateTaskId: null });
              get().addToMusicGallery(statusRes.music_url, prompt, res.task_id, statusRes.music_url);
            } else if (statusRes.status === "failed") {
              set({ musicGenerateError: statusRes.error || "音乐生成失败", isGeneratingMusic: false, musicGenerateProgress: null, musicGenerateTaskId: null });
            } else if (statusRes.status === "cancelled") {
              set({ isGeneratingMusic: false, musicGenerateProgress: "已取消", musicGenerateTaskId: null });
            } else {
              // 还在队列或处理中，继续轮询
              setTimeout(checkStatus, 3000); // 改为每 3 秒查一次，进度更新更及时
            }
          } catch (e: unknown) {
            set({ musicGenerateError: "查询状态失败", isGeneratingMusic: false, musicGenerateTaskId: null });
          }
        };
        checkStatus();
      } else {
        set({ musicGenerateError: res.error || res.message || "音乐生成任务提交失败", isGeneratingMusic: false, musicGenerateTaskId: null });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "音乐生成失败";
      set({ musicGenerateError: msg, isGeneratingMusic: false, musicGenerateTaskId: null });
    }
  },

  cancelGenerateMusic: async () => {
    const taskId = get().musicGenerateTaskId;
    if (!taskId) return;
    
    set({ musicGenerateProgress: "正在取消..." });
    try {
      await api.agent.cancelMusicGeneration(taskId);
      set({ isGeneratingMusic: false, musicGenerateProgress: "已取消", musicGenerateTaskId: null });
    } catch (e) {
      // 忽略取消失败
      set({ isGeneratingMusic: false, musicGenerateTaskId: null });
    }
  },

  clearGeneratedMusic: () => {
    set({ generatedMusicUrl: null, musicGenerateError: null, musicGenerateProgress: null, musicGenerateTaskId: null });
  },

  addToMusicGallery: (url: string, prompt: string, taskId?: string, publicUrl?: string | null) => {
    const newMusic = {
      id: taskId || generateUUID(),
      task_id: taskId,
      url,
      public_url: publicUrl || url,
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
    const target = get().musicGallery.find((item) => item.id === id || item.task_id === id);
    if (target?.task_id && Cookies.get("token")) {
      void get().deleteMediaHistoryItem("music", target.task_id);
      return;
    }
    set((state) => {
      const updatedGallery = state.musicGallery.filter((music) => music.id !== id);
      try {
        localStorage.setItem('musicGallery', JSON.stringify(updatedGallery));
      } catch {
      }
      return { musicGallery: updatedGallery };
    });
  },

  clearMusicGallery: () => {
    const taskIds = get().musicGallery.map((item) => item.task_id).filter((item): item is string => Boolean(item));
    if (taskIds.length > 0 && Cookies.get("token")) {
      void get().batchDeleteMediaHistoryItems("music", taskIds);
      return;
    }
    set({ musicGallery: [] });
    try {
      localStorage.removeItem('musicGallery');
    } catch {
    }
  },
}));
