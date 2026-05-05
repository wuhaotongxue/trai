/**
 * chat_panel.tsx
 * 作者: wuhao
 * 日期: 2026-04-23
 * 描述: Agent 对话主面板 - 三栏式布局
 */

"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useAgentStore } from "@/stores/agent.store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";
import { Bot, Image as ImageIcon, Send, Square, Trash2, X, Copy, Check, ArrowUp, Sparkles, Video, Music, ExternalLink, Plus, MessageSquare, ChevronRight, ChevronLeft, PanelLeft, PanelRight, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { type Message as AgentMessage } from "@/stores/agent.store";
import { MultimodalUpload, type UploadedFileInfo } from "./multimodal_upload";
import { AgentTypeSelector } from "./agent_type_selector";

type TabId = "chat" | "image" | "video" | "music";

interface ChatSession {
  id: string;
  name: string;
  createdAt: number;
  messages: AgentMessage[];
}

interface InitialChatState {
  sessions: ChatSession[];
  currentSessionId: string;
}

function getInitialChatState(): InitialChatState {
  const defaultSession = {
    id: `session_${Date.now()}`,
    name: '新对话',
    createdAt: Date.now(),
    messages: [] as AgentMessage[]
  };

  if (typeof window === "undefined") {
    return { sessions: [defaultSession], currentSessionId: defaultSession.id };
  }

  const saved = localStorage.getItem('chat_sessions');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.sessions && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
        return {
          sessions: parsed.sessions,
          currentSessionId: parsed.currentSessionId || parsed.sessions[0].id
        };
      }
    } catch {
      // ignore parse errors
    }
  }

  return { sessions: [defaultSession], currentSessionId: defaultSession.id };
}

export function ChatPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [showGallery, setShowGallery] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>(() => getInitialChatState().sessions);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => getInitialChatState().currentSessionId);

  const {
    messages,
    isStreaming,
    totalTokens,
    completionTokens,
    promptTokens,
    sendMessage,
    abortStream,
    clearMessages,
    isGeneratingImage,
    generatedImageUrl,
    imageGenerateError,
    generateImage,
    clearGeneratedImage,
    imageGallery,
    removeFromImageGallery,
    clearImageGallery,
    isGeneratingVideo,
    generatedVideoUrl,
    videoGenerateError,
    generateVideo,
    clearGeneratedVideo,
    videoGallery,
    removeFromVideoGallery,
    clearVideoGallery,
    isGeneratingMusic,
    generatedMusicUrl,
    musicGenerateError,
    generateMusic,
    clearGeneratedMusic,
    musicGallery,
    removeFromMusicGallery,
    clearMusicGallery,
  } = useAgentStore();

  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imagePrompt, setImagePrompt] = useState('一只可爱的猫在花园里玩耍, 阳光明媚, 花朵盛开');
  const [videoPrompt, setVideoPrompt] = useState('波涛汹涌的大海, 海浪拍打着礁石, 天空中乌云密布');
  const [musicPrompt, setMusicPrompt] = useState('轻快的爵士乐, 钢琴和萨克斯风演奏, 适合下午茶时光');
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const [selectedAgentType, setSelectedAgentType] = useState<string>("chat");
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chat_sessions', JSON.stringify({
        sessions,
        currentSessionId
      }));
    }
  }, [sessions, currentSessionId]);

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-image-${Date.now()}.png`;
    link.click();
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getTabButtonClass = (tab: string) => {
    const base = "px-3 py-1.5 rounded-full ";
    if (tab === "chat") return base + "bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer";
    if (tab === "image") return base + "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer";
    if (tab === "video") return base + "bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors cursor-pointer";
    return base + "bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer";
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && images.length === 0 && uploadedFiles.length === 0) return;
    if (isStreaming) return;

    const content = input.trim();
    const imageList = [...images];
    setInput("");
    setImages([]);
    setApiError(null);

    try {
      await sendMessage(content, imageList);
      inputRef.current?.focus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      setApiError(errorMessage);
      console.error("Send message error:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setImages((prev) => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const preprocessMarkdown = (content: string) => {
    if (!content) return "";
    return content
      .replace(/\\\[/g, "\n$$\n")
      .replace(/\\\]/g, "\n$$\n")
      .replace(/\\\(/g, "$")
      .replace(/\\\)/g, "$");
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      name: '新对话',
      createdAt: Date.now(),
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    clearMessages();
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const startEditSessionName = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingSessionName(session.name);
  };

  const saveSessionName = () => {
    if (editingSessionId) {
      setSessions(prev => prev.map(s =>
        s.id === editingSessionId ? { ...s, name: editingSessionName || '未命名对话' } : s
      ));
      setEditingSessionId(null);
      setEditingSessionName('');
    }
  };

  const deleteSession = (sessionId: string) => {
    if (sessions.length <= 1) return;
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(newSessions[0].id);
    }
  };

  const renderCodeBlock = (className: string, children: React.ReactNode) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = match?.[1] || "text";

    return (
      <div className="relative group/code rounded-md overflow-hidden my-4 w-full">
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/80 text-slate-400 text-xs border-b border-slate-700/50">
          <span className="font-mono">{language}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
            }}
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>复制</span>
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus as unknown as Record<string, CSSProperties>}
          language={language}
          PreTag="div"
          className="!m-0 !rounded-none text-[13px] !bg-slate-900 max-w-full overflow-x-auto"
          showLineNumbers={false}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div className="flex h-full relative">
      {/* 左侧历史对话面板 */}
      <div className={"border-r border-border bg-background transition-all duration-300 ease-in-out " + (showHistory ? 'w-64' : 'w-0 overflow-hidden')}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">历史对话</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={createNewSession} title="新建对话">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={"group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors " + (currentSessionId === session.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground')}
                  onClick={() => switchSession(session.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  {editingSessionId === session.id ? (
                    <input
                      type="text"
                      value={editingSessionName}
                      onChange={(e) => setEditingSessionName(e.target.value)}
                      onBlur={saveSessionName}
                      onKeyDown={(e) => e.key === 'Enter' && saveSessionName()}
                      className="flex-1 min-w-0 text-sm bg-transparent border-none outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 min-w-0 text-sm truncate">{session.name}</span>
                  )}
                  {currentSessionId === session.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditSessionName(session);
                        }}
                        title="修改名称"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      {sessions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          title="删除对话"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 中间主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部标签栏 - 扩大显示 */}
        <div className="flex items-center gap-2 p-2 bg-muted/30 border-b overflow-x-auto no-scrollbar">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? "隐藏历史对话" : "显示历史对话"}
          >
            {showHistory ? <ChevronLeft className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          <div className="h-6 w-px bg-border shrink-0" />
          {[
            { id: "chat" as TabId, label: "对话", icon: Bot, color: "text-blue-500" },
            { id: "image" as TabId, label: "绘图", icon: ImageIcon, color: "text-emerald-500" },
            { id: "video" as TabId, label: "视频", icon: Video, color: "text-orange-500" },
            { id: "music" as TabId, label: "音乐", icon: Music, color: "text-indigo-500" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 " + (activeTab === tab.id ? "bg-white dark:bg-slate-800 shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/50")}
            >
              <tab.icon className={"h-4 w-4 " + tab.color} />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setShowGallery(!showGallery)}
            title={showGallery ? "隐藏图片廊" : "显示图片廊"}
          >
            {showGallery ? <ChevronRight className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Agent Type Selector - Only show in chat mode */}
        {activeTab === "chat" && (
          <div className="px-4 pb-2 border-b border-border">
            <AgentTypeSelector
              value={selectedAgentType}
              onChange={setSelectedAgentType}
              compact={true}
              className="max-w-full"
            />
          </div>
        )}

        {/* 主内容区域 - 绘图 / 视频 / 音乐模式 */}
        {activeTab !== "chat" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div ref={topRef} />
              <div className="w-full max-w-3xl mx-auto px-6 py-8">

                {/* 绘图模式 */}
                {activeTab === "image" && (
                  <div className="space-y-8">
                    {/* 头部 */}
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                        <ImageIcon className="h-7 w-7 text-emerald-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground mt-1">AI 创意绘图</h2>
                        <p className="text-sm text-muted-foreground mt-1">输入画面描述, AI 创作精美图像</p>
                      </div>
                    </div>

                    {/* 提示词示例 */}
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">试试这些提示词</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { tag: "人像", text: "一位精致的亚洲女性, 柔和自然光, 超高分辨率, 8K 画质" },
                          { tag: "风景", text: "壮丽山脉日出, 云海翻涌, 航拍视角, HDR 电影感" },
                          { tag: "赛博", text: "霓虹灯街道, 雨夜, 反射光影, 赛博朋克风格, 电影级" },
                          { tag: "动漫", text: "樱花树下少女, 宫崎骏风格, 温暖色调, 手绘质感" },
                        ].map((item) => (
                          <button
                            key={item.tag}
                            onClick={() => setImagePrompt(item.text)}
                            className="group flex items-start gap-3 p-4 rounded-2xl border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left"
                          >
                            <span className="mt-0.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                              {item.tag}
                            </span>
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">{item.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 错误提示 */}
                    {imageGenerateError && (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-red-500 text-xs font-bold">!</span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">{imageGenerateError}</p>
                      </div>
                    )}

                    {/* 生成结果 */}
                    {generatedImageUrl && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-xs text-muted-foreground font-medium">生成完成</p>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl shadow-black/5">
                          <div className="relative" style={{ aspectRatio: "1/1" }}>
                            <Image
                              src={generatedImageUrl}
                              alt="Generated image"
                              fill
                              unoptimized
                              className="object-contain"
                            />
                          </div>
                          {/* 图片操作栏 */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-center gap-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(generatedImageUrl)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-medium transition-all"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              复制链接
                            </button>
                            <button
                              onClick={() => window.open(generatedImageUrl, "_blank")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-medium transition-all"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              打开
                            </button>
                            <button
                              onClick={() => downloadImage(generatedImageUrl)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-medium transition-all"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              下载
                            </button>
                            <div className="flex-1" />
                            <button
                              onClick={clearGeneratedImage}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-white transition-all text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 加载状态 */}
                    {isGeneratingImage && (
                      <div className="flex flex-col items-center gap-4 py-12">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
                            <ImageIcon className="h-7 w-7 text-emerald-500 animate-pulse" />
                          </div>
                          <div className="absolute -inset-2 rounded-3xl border-2 border-emerald-500/20 animate-ping" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">正在生成图像...</p>
                          <p className="text-xs text-muted-foreground mt-1">AI 正在发挥创造力</p>
                        </div>
                        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 视频模式 */}
                {activeTab === "video" && (
                  <div className="space-y-8">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400/20 to-amber-500/20 border border-orange-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/10">
                        <Video className="h-7 w-7 text-orange-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground mt-1">AI 视频合成</h2>
                        <p className="text-sm text-muted-foreground mt-1">描述场景, AI 生成电影级视频</p>
                      </div>
                    </div>

                    {videoGenerateError && (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-red-500 text-xs font-bold">!</span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">{videoGenerateError}</p>
                      </div>
                    )}

                    {generatedVideoUrl && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <p className="text-xs text-muted-foreground font-medium">生成完成</p>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl shadow-black/5">
                          <video
                            src={generatedVideoUrl}
                            controls
                            className="w-full"
                            style={{ aspectRatio: "16/9" }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-center gap-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(generatedVideoUrl)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-medium transition-all"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              复制链接
                            </button>
                            <button
                              onClick={() => window.open(generatedVideoUrl, "_blank")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-medium transition-all"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              打开
                            </button>
                            <div className="flex-1" />
                            <button
                              onClick={clearGeneratedVideo}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-white transition-all text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {isGeneratingVideo && (
                      <div className="flex flex-col items-center gap-4 py-12">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400/20 to-amber-500/20 border border-orange-500/20 flex items-center justify-center">
                            <Video className="h-7 w-7 text-orange-500 animate-pulse" />
                          </div>
                          <div className="absolute -inset-2 rounded-3xl border-2 border-orange-500/20 animate-ping" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">正在生成视频...</p>
                          <p className="text-xs text-muted-foreground mt-1">预计需要 1-2 分钟</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 音乐模式 */}
                {activeTab === "music" && (
                  <div className="space-y-8">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-cyan-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10">
                        <Music className="h-7 w-7 text-indigo-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground mt-1">AI 音乐创作</h2>
                        <p className="text-sm text-muted-foreground mt-1">描述风格, AI 创作原创音乐</p>
                      </div>
                    </div>

                    {musicGenerateError && (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-red-500 text-xs font-bold">!</span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">{musicGenerateError}</p>
                      </div>
                    )}

                    {generatedMusicUrl && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <p className="text-xs text-muted-foreground font-medium">生成完成</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 p-6 shadow-lg">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                              <Music className="h-6 w-6 text-indigo-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">AI 创作音乐</p>
                              <p className="text-xs text-muted-foreground">点击播放</p>
                            </div>
                          </div>
                          <audio
                            src={generatedMusicUrl}
                            controls
                            className="w-full [&::-webkit-media-controls-panel]:bg-indigo-500/10"
                          />
                          <div className="flex items-center gap-2 mt-4">
                            <button
                              onClick={() => navigator.clipboard.writeText(generatedMusicUrl)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium transition-all"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              复制链接
                            </button>
                            <button
                              onClick={clearGeneratedMusic}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-red-500/10 text-xs text-muted-foreground hover:text-red-500 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              清除
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {isGeneratingMusic && (
                      <div className="flex flex-col items-center gap-4 py-12">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-cyan-500/20 border border-indigo-500/20 flex items-center justify-center">
                            <Music className="h-7 w-7 text-indigo-500 animate-pulse" />
                          </div>
                          <div className="absolute -inset-2 rounded-3xl border-2 border-indigo-500/20 animate-ping" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">正在创作音乐...</p>
                          <p className="text-xs text-muted-foreground mt-1">AI 正在谱写旋律</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
              <div ref={bottomRef} />
            </ScrollArea>
          </div>
        ) : (
          /* 对话模式 - DeepSeek 风格 */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 欢迎页 */}
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {activeTab === "chat" ? "开始对话" :
                   activeTab === "image" ? "AI 创意绘图" :
                   activeTab === "video" ? "AI 视频合成" : "AI 音乐创作"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  {activeTab === "chat" ? "输入消息与 AI 助手对话, 支持上传图片和调用工具." :
                   activeTab === "image" ? "描述你想要的画面, AI 将为你生成精美的图像." :
                   activeTab === "video" ? "提供视频描述或参考图, 开启电影级 AI 视频创作." : "输入歌词或风格描述, 创作属于你的 AI 音乐."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const tips = activeTab === "chat"
                      ? ["北京天气怎么样", "帮我翻译 Hello World", "1+1等于多少", "搜索 AI 发展趋势", "写一首关于春天的诗", "如何学习编程", "今天是什么日期", "推荐一部好看的电影"]
                      : activeTab === "image"
                      ? ["一只可爱的猫在花园里", "赛博朋克风格的城市夜景", "写实风格的山水画", "宇航员在火星漫步", "童话故事里的城堡", "未来科技感的机器人", "美丽的日落海滩", "中国传统水墨画风格"]
                      : activeTab === "video"
                      ? ["波涛汹涌的大海", "宇航员在火星漫步", "城市夜景延时摄影", "森林中阳光透过树叶", "流星划过夜空", "瀑布从悬崖倾泻而下", "城市交通繁忙景象", "雪花飘落的冬季场景"]
                      : ["轻快的爵士乐", "抒情的钢琴曲", "电子舞曲", "古典交响乐", "中国传统古筝曲", "摇滚乐队演出", "ambient 环境音乐", "电影配乐风格"];
                    return tips.map((tip) => (
                      <button
                        key={tip}
                        onClick={() => {
                          if (activeTab === "chat") {
                            setInput(tip);
                          } else if (activeTab === "image") {
                            setImagePrompt(tip);
                          } else if (activeTab === "video") {
                            setVideoPrompt(tip);
                          } else if (activeTab === "music") {
                            setMusicPrompt(tip);
                          }
                        }}
                        className={getTabButtonClass(activeTab)}
                      >
                        {tip}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* 消息列表 - 固定高度,可滚动 */}
            <ScrollArea className="flex-1 px-4 py-4">
              <div ref={messagesStartRef}>
                {/* API Error Display */}
                {apiError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Error</p>
                      <p className="text-xs text-red-500/80 mt-1">{apiError}</p>
                    </div>
                    <button
                      onClick={() => setApiError(null)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      aria-label="Dismiss error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  const isTool = msg.role === "tool";
                  const justifyClass = isUser ? "justify-end" : "justify-start";
                  const bgClass = isUser 
                    ? "bg-primary text-primary-foreground"
                    : isTool
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-sm"
                    : "bg-muted";
                  const toolStatusClass = msg.toolSuccess === false ? "bg-red-400" : "bg-emerald-400";
                  
                  return (
                    <div key={msg.id} className={"flex mb-4 group " + justifyClass}>
                      <div className={"max-w-[80%] rounded-2xl px-4 py-3 relative " + bgClass}>
                        {isTool && msg.toolName && (
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-orange-200/50 dark:border-orange-700/30">
                            <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">T</div>
                            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">工具: {msg.toolName}</span>
                            <div className={"ml-auto w-2 h-2 rounded-full " + toolStatusClass} />
                          </div>
                        )}

                        {(msg.images || []).map((img, i) => (
                          <Image
                            key={i}
                            src={img}
                            alt="uploaded"
                            width={512}
                            height={512}
                            unoptimized
                            className="max-w-full rounded-lg mb-2 max-h-48 object-contain"
                          />
                        ))}

                        <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              code({ className: codeClassName, children: codeChildren }: { className?: string; children?: React.ReactNode }) {
                                const match = /language-(\w+)/.exec(codeClassName || "");
                                if (!match) {
                                  return <code className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-xs mx-0.5">{codeChildren}</code>;
                                }
                                return renderCodeBlock(codeClassName || "", codeChildren);
                              },
                            }}
                          >
                            {preprocessMarkdown(msg.content)}
                          </ReactMarkdown>
                        </div>

                        {msg.role === "assistant" && !isStreaming && msg.content && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className={"absolute -right-10 top-2 p-1.5 rounded-lg border bg-background/50 backdrop-blur-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 " + (copiedId === msg.id ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100")}
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isStreaming && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">正在思考中...</span>
                    </div>
                  </div>
                )}

                {(totalTokens > 0 || isStreaming) && (
                  <div className="flex items-center gap-3 text-xs px-2 py-1.5 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 mb-2">
                    {isStreaming ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium">流式响应中</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-muted-foreground">输出:</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">{completionTokens}</span>
                        </span>
                        <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-muted-foreground">提示:</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">{promptTokens}</span>
                        </span>
                        <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          合计: {totalTokens}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div ref={bottomRef} />
            </ScrollArea>

            {/* 滚动到顶部按钮 */}
            {messages.length > 2 && (
              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[80px] z-10">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full shadow-md opacity-50 hover:opacity-100 transition-opacity"
                  onClick={scrollToTop}
                  title="回到顶部"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 输入区域 - 固定在底部 */}
        {activeTab === "chat" || activeTab === "image" || activeTab === "video" || activeTab === "music" ? (
          <div className="px-4 py-3 border-t border-border bg-background shrink-0">
            {activeTab === "chat" && images.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <Image
                      src={img}
                      alt={"upload-" + i}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-16 w-16 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              {activeTab === "chat" && (
                <>
                  <MultimodalUpload
                    acceptedTypes={["image", "audio", "pdf"]}
                    maxSizeMB={50}
                    maxFiles={5}
                    onFilesChange={setUploadedFiles}
                    value={uploadedFiles}
                    showPreview={true}
                    className="mb-2"
                  />
                </>
              )}

              <textarea
                ref={inputRef}
                value={activeTab === "chat" ? input : 
                       activeTab === "image" ? imagePrompt : 
                       activeTab === "video" ? videoPrompt : musicPrompt}
                onChange={(e) => {
                  if (activeTab === "chat") {
                    setInput(e.target.value);
                  } else if (activeTab === "image") {
                    setImagePrompt(e.target.value);
                  } else if (activeTab === "video") {
                    setVideoPrompt(e.target.value);
                  } else if (activeTab === "music") {
                    setMusicPrompt(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (activeTab === "chat") {
                      handleSend();
                    } else if (activeTab === "image" && imagePrompt.trim()) {
                      generateImage(imagePrompt);
                    } else if (activeTab === "video" && videoPrompt.trim()) {
                      generateVideo(videoPrompt);
                    } else if (activeTab === "music" && musicPrompt.trim()) {
                      generateMusic(musicPrompt);
                    }
                  }
                }}
                placeholder={activeTab === "chat" ? "输入消息..." :
                         activeTab === "image" ? "描述你想要的画面..." :
                         activeTab === "video" ? "描述你想要的视频..." :
                         "描述你想要的音乐..."}
                className="flex-1 min-h-[44px] max-h-32 resize-none rounded-lg border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-tight"
                rows={1}
              />

              {isStreaming ? (
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={abortStream}
                  title="中断响应"
                >
                  <Square className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={() => {
                    if (activeTab === "chat") {
                      handleSend();
                    } else if (activeTab === "image" && imagePrompt.trim()) {
                      generateImage(imagePrompt);
                    } else if (activeTab === "video" && videoPrompt.trim()) {
                      generateVideo(videoPrompt);
                    } else if (activeTab === "music" && musicPrompt.trim()) {
                      generateMusic(musicPrompt);
                    }
                  }}
                  disabled={activeTab === "chat" ? !input.trim() && images.length === 0 :
                          activeTab === "image" ? !imagePrompt.trim() || isGeneratingImage :
                          activeTab === "video" ? !videoPrompt.trim() || isGeneratingVideo :
                          !musicPrompt.trim() || isGeneratingMusic}
                  title={activeTab === "chat" ? "发送消息" :
                         activeTab === "image" ? "生成图片" :
                         activeTab === "video" ? "生成视频" :
                         "生成音乐"}
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}

              {activeTab === "chat" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  title="清空对话"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>

            {activeTab === "chat" && (messages.length > 0 || totalTokens > 0) && (
              <div className="mt-2 px-1 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      输出: {completionTokens}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      提示: {promptTokens}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    合计: {totalTokens}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* 右侧图片廊面板 */}
      <div className={"border-l border-border bg-background transition-all duration-300 ease-in-out " + (showGallery ? 'w-80' : 'w-0 overflow-hidden')}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">图片廊</span>
            {imageGallery.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearImageGallery}
                className="text-xs text-muted-foreground hover:text-red-500 h-7"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                清空
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1">
            {imageGallery.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">还没有生成过图片</p>
                <p className="text-xs text-muted-foreground mt-1">在绘图模式下生成图片</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {imageGallery.map((img) => (
                  <div key={img.id} className="group relative rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all">
                    <div className="aspect-square overflow-hidden">
                      <Image
                        src={img.url}
                        alt="Generated image"
                        width={512}
                        height={512}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-800"
                        onClick={() => downloadImage(img.url)}
                        title="下载图片"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-800"
                        onClick={() => window.open(img.url, "_blank")}
                        title="打开图片"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-slate-800 transition-colors"
                        onClick={() => removeFromImageGallery(img.id)}
                        title="删除图片"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-2 bg-background">
                      <p className="text-xs text-muted-foreground truncate" title={img.prompt}>
                        {img.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
