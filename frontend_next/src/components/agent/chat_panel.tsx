/**
 * chat_panel.tsx
 * 作者: wuhao
 * 日期: 2026-04-23
 * 描述: Agent 对话主面板 - 现代化三栏式布局, 集成创作、工具与 AI 前沿功能
 *       (全新 Neo-Brutalist 设计风格) 
 */

"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAgentStore } from "@/stores/agent.store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";
import { 
  Bot, Image as ImageIcon, Send, Square, Trash2, X, Copy, Check, 
  ArrowUp, Sparkles, Video, Music, ExternalLink, Plus, MessageSquare, 
  ChevronRight, ChevronLeft, PanelLeft, PanelRight, Pencil, Upload, 
  ArrowDownToLine, Loader2, Captions, UserRound, FileText, Clock, 
  Download, Search, LayoutGrid, Type, Globe, ChevronDown, ChevronUp, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { type GalleryMediaItem } from "@/stores/agent.store";
import { type UploadedFileInfo } from "./multimodal_upload";
import { AgentTypeSelector } from "./agent_type_selector";
import type { AgentTypeValue } from "@/lib/api_client";
import { multimodalApi } from "@/lib/api_client";
import { SubtitlePanel } from "./subtitle_panel";
import { MusicPlayer } from "./music_player";
import { DigitalHumanPanel } from "./digital_human_panel";
import { VideoDownloaderPanel } from "./video_downloader_panel";
import { cn } from "@/lib/utils";
import { PANEL_EMPTY_COPY, PANEL_MOTION_TOKENS, PANEL_SUBTITLES } from "./panel_consistency";

type TabId = "chat" | "image" | "video" | "music" | "audio" | "image_edit" | "subtitle" | "digital_human" | "downloader";
type GalleryType = "image" | "video" | "music";

export function ChatPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedAgentType, setSelectedAgentType] = useState<AgentTypeValue>("chat");
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [imageLinkCopied, setImageLinkCopied] = useState(false);
  const [videoLinkCopied, setVideoLinkCopied] = useState(false);
  const [musicLinkCopied, setMusicLinkCopied] = useState(false);
  const [gallerySelectionMode, setGallerySelectionMode] = useState<Record<GalleryType, boolean>>({
    image: false,
    video: false,
    music: false,
  });
  const [selectedGalleryItems, setSelectedGalleryItems] = useState<Record<GalleryType, string[]>>({
    image: [],
    video: [],
    music: [],
  });

  const {
    messages, isStreaming, sendMessage, loadSessions,
    sessions, sessionId: currentSessionId, startSession, switchSession, deleteSession,
    isGeneratingImage, generateImage, generatedImageUrl, clearGeneratedImage, imageGenerateError, imageGenerateProgress, imageGenerateStage, imageGallery, removeFromImageGallery, clearImageGallery,
    isGeneratingVideo, generateVideo, generatedVideoUrl, clearGeneratedVideo, videoGenerateError, videoGallery, removeFromVideoGallery, clearVideoGallery,
    videoGenerateTaskId, videoGenerateStage, videoGenerateProgress, videoGenerateCurrentStep, videoGenerateTotalSteps,
    videoGenerateFrames, videoGenerateResolution, videoGenerateElapsedSeconds,
    isGeneratingMusic, generateMusic, generatedMusicUrl, generatedMusicLyrics, generatedMusicCoverUrl, clearGeneratedMusic, musicGenerateError, musicGenerateProgress, cancelGenerateMusic, musicGallery, removeFromMusicGallery, clearMusicGallery,
    batchDeleteMediaHistoryItems,
    isEditingImage, editImage, editedImageUrl, clearEditedImage, cancelEditImage, imageEditError, imageEditProgress, imageEditStage,
    imageEditProgressMessage,
    editingSourceImage, editingSourceImage2, imageEditPrompt, setEditingSourceImage, setImageEditPrompt,
  } = useAgentStore();

  const [imagePrompt, setImagePrompt] = useState('一只可爱的猫在花园里玩耍');
  const [videoPrompt, setVideoPrompt] = useState('波涛汹涌的大海');
  const [musicPrompt, setMusicPrompt] = useState('轻快的爵士乐');

  // 画廊折叠状态
  const [galleryExpanded, setGalleryExpanded] = useState<Record<string, boolean>>({
    image: true,
    video: true,
    music: true,
  });

  const toggleGallery = (type: string) => {
    setGalleryExpanded(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const clearGallerySelection = (type: GalleryType) => {
    setSelectedGalleryItems((prev) => ({ ...prev, [type]: [] }));
    setGallerySelectionMode((prev) => ({ ...prev, [type]: false }));
  };

  const getGalleryItems = (type: GalleryType): GalleryMediaItem[] => {
    if (type === "image") {
      return imageGallery;
    }
    if (type === "video") {
      return videoGallery;
    }
    return musicGallery;
  };

  const toggleGallerySelectionMode = (type: GalleryType) => {
    setGallerySelectionMode((prev) => {
      const nextEnabled = !prev[type];
      if (!nextEnabled) {
        setSelectedGalleryItems((selection) => ({ ...selection, [type]: [] }));
      }
      return { ...prev, [type]: nextEnabled };
    });
  };

  const toggleGalleryItemSelection = (type: GalleryType, itemId: string) => {
    setSelectedGalleryItems((prev) => {
      const exists = prev[type].includes(itemId);
      return {
        ...prev,
        [type]: exists ? prev[type].filter((id) => id !== itemId) : [...prev[type], itemId],
      };
    });
  };

  const handleSelectAllGalleryItems = (type: GalleryType) => {
    const items = getGalleryItems(type);
    const allIds = items.map((item) => item.id);
    setSelectedGalleryItems((prev) => ({
      ...prev,
      [type]: prev[type].length === allIds.length ? [] : allIds,
    }));
  };

  const openGalleryItem = (type: GalleryType, item: GalleryMediaItem) => {
    if (gallerySelectionMode[type]) {
      toggleGalleryItemSelection(type, item.id);
      return;
    }
    if (type === "image") {
      useAgentStore.setState({ generatedImageUrl: item.url });
      return;
    }
    if (type === "video") {
      useAgentStore.setState({ generatedVideoUrl: item.url });
      return;
    }
    useAgentStore.setState({ 
      generatedMusicUrl: item.url,
      generatedMusicLyrics: item.lyrics,
      generatedMusicCoverUrl: item.cover_url,
      musicPrompt: item.prompt
    });
  };

  const handleBatchDeleteSelected = async (type: GalleryType) => {
    const selectedIds = selectedGalleryItems[type];
    if (selectedIds.length === 0) {
      return;
    }

    const selectedItems = getGalleryItems(type).filter((item) => selectedIds.includes(item.id));
    const taskIds = selectedItems
      .map((item) => item.task_id)
      .filter((taskId): taskId is string => Boolean(taskId));

    if (taskIds.length > 0) {
      await batchDeleteMediaHistoryItems(type, taskIds);
    }

    const localOnlyItems = selectedItems.filter((item) => !item.task_id);
    for (const item of localOnlyItems) {
      if (type === "image") {
        removeFromImageGallery(item.id);
      } else if (type === "video") {
        removeFromVideoGallery(item.id);
      } else {
        removeFromMusicGallery(item.id);
      }
    }

    clearGallerySelection(type);
  };

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSessions(); }, []);

  useLayoutEffect(() => {
    if (messages?.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length, isStreaming]);

  const toggleThinking = (msgId: string) => {
    setExpandedThinking(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const imagePromptPresets: Array<{ label: string; value: string }> = [
    { label: "可爱猫咪", value: "一只可爱的猫在花园里玩耍, 柔和自然光, 高清细节" },
    { label: "城市夜景", value: "城市夜景, 霓虹灯与雨后反光, 电影感, 高对比, 广角" },
    { label: "国风水墨", value: "国风水墨山水, 留白, 远山雾气, 高级质感" },
    { label: "产品海报", value: "极简产品海报, 纯色背景, 强光影, 商业摄影, 高级质感" },
    { label: "科幻机甲", value: "科幻机甲战士, 金属细节, 体积光, 史诗场景, 超清" },
  ];

  const musicPromptPresets: Array<{ label: string; value: string }> = [
    { label: "轻快爵士", value: "轻快的爵士乐, 鼓点清晰, 轻盈钢琴, 适合工作背景" },
    { label: "Lo-fi", value: "Lo-fi chill, 温暖磁带质感, 轻微噪声, 慢节奏" },
    { label: "史诗配乐", value: "史诗电影配乐, 管弦乐, 大气, 渐进式高潮" },
    { label: "电子舞曲", value: "电子舞曲, 强节奏, 合成器主旋律, 俱乐部氛围" },
    { label: "国风旋律", value: "国风旋律, 古筝与笛子, 清雅, 现代混音" },
  ];

  const videoStageLabelMap: Record<string, string> = {
    queued: "排队中",
    preparing: "准备资源",
    initializing: "初始化任务",
    preparing_runtime: "准备运行环境",
    loading_model: "加载模型",
    model_ready: "模型就绪",
    inferencing: "视频推理中",
    assembling_video: "组装视频",
    encoding_video: "编码视频",
    uploading: "上传到 S3",
    notifying: "发送通知",
    completed: "已完成",
    failed: "任务失败",
  };
  const videoProgressPercent = videoGenerateCurrentStep && videoGenerateTotalSteps
    ? Math.min(100, Math.round((videoGenerateCurrentStep / videoGenerateTotalSteps) * 100))
    : 0;
  const imageEditProgressPercent = Math.max(0, Math.min(100, imageEditProgress));
  const imageEditProgressCopy = imageEditProgressMessage || (
    imageEditProgressPercent < 35
      ? "正在分析原图结构和修改区域..."
      : imageEditProgressPercent < 72
        ? "正在重绘细节并融合编辑指令..."
        : "正在整理最终画面并准备输出..."
  );

  const handleCopyImageLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setImageLinkCopied(true);
      window.setTimeout(() => setImageLinkCopied(false), 1200);
    } catch {
      setImageLinkCopied(false);
    }
  };

  const handleCopyVideoLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setVideoLinkCopied(true);
      window.setTimeout(() => setVideoLinkCopied(false), 1200);
    } catch {
      setVideoLinkCopied(false);
    }
  };

  const handleCopyMusicLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMusicLinkCopied(true);
      window.setTimeout(() => setMusicLinkCopied(false), 1200);
    } catch {
      setMusicLinkCopied(false);
    }
  };

  const handleGenerateImage = async () => {
    const p = imagePrompt.trim();
    if (!p) return;
    setImageLinkCopied(false);
    await generateImage(p);
  };

  const handleGenerateVideo = async () => {
    const p = videoPrompt.trim();
    if (!p) return;
    setVideoLinkCopied(false);
    await generateVideo(p);
  };

  const handleGenerateMusic = async () => {
    const p = musicPrompt.trim();
    if (!p) return;
    setMusicLinkCopied(false);
    await generateMusic(p);
  };

  const handlePickEditImage = async (file: File | null, isSecond: boolean = false) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setEditingSourceImage(null, isSecond);
      return;
    }
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      setEditingSourceImage(dataUrl, isSecond);
    } catch {
      setEditingSourceImage(null, isSecond);
    }
  };

  const handleStartEditImage = async () => {
    if (!editingSourceImage || !imageEditPrompt.trim()) return;
    await editImage(editingSourceImage, imageEditPrompt.trim(), editingSourceImage2 || undefined);
  };

  const handleSend = async () => {
    if (!input.trim() && images.length === 0) return;
    if (isStreaming) return;
    const content = input.trim();
    setInput("");
    setImages([]);
    await sendMessage(content, images, { agentType: selectedAgentType });
  };

  const renderCodeBlock = (className: string, children: React.ReactNode) => {
    const language = /language-(\w+)/.exec(className || "")?.[1] || "text";
    return (
      <div className="relative group/code overflow-hidden my-4 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider border-b-2 border-slate-900 dark:border-white">
          <span>{language}</span>
          <button onClick={() => navigator.clipboard.writeText(String(children))} className="hover:text-cyan-600 transition-colors">
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <SyntaxHighlighter style={vscDarkPlus as any} language={language} className="!m-0 text-sm !bg-slate-950 !rounded-none">
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    );
  };

  // Neo-Brutalist styles
  const brutalBorder = "border-2 border-slate-900 dark:border-white";
  const brutalShadow = "shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff]";
  const brutalShadowSm = "shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]";
  const brutalBtnBase = `font-bold uppercase tracking-wide transition-transform active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${brutalBorder} ${brutalShadowSm}`;

  return (
    <div className="flex h-full min-h-0 relative bg-[#fdfdfc] dark:bg-slate-950 text-slate-900 dark:text-slate-100" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      {/* 历史对话侧边栏 */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ width: 0, opacity: 0, x: -20 }}
            animate={{ width: 280, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -20 }}
            className={`flex flex-col min-h-0 overflow-hidden bg-white dark:bg-slate-900 ${brutalBorder} border-l-0 border-t-0 border-b-0 relative z-30`}
          >
            <div className={`p-4 ${brutalBorder} border-l-0 border-t-0 border-r-0 flex items-center justify-between bg-cyan-200 dark:bg-slate-200 text-slate-900 shrink-0`}>
              <span className="font-black text-lg uppercase tracking-tight">历史会话</span>
              <button onClick={() => startSession()} className={`h-8 w-8 bg-white flex items-center justify-center ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}><Plus className="h-4 w-4" /></button>
            </div>
            <ScrollArea className="flex-1 min-h-0 p-4 bg-slate-50 dark:bg-slate-900">
              {sessions.map(s => (
                <div 
                  key={s.session_id}
                  onClick={() => switchSession(s.session_id)}
                  className={cn(
                    `p-3 mb-3 cursor-pointer transition-all text-sm font-bold truncate ${brutalBorder}`,
                    currentSessionId === s.session_id 
                      ? `bg-slate-50 dark:bg-cyan-600 text-slate-900 dark:text-white ${brutalShadowSm}` 
                      : "bg-white dark:bg-slate-800 hover:bg-slate-100 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]"
                  )}
                >
                  {s.title || "新会话"}
                </div>
              ))}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主工作区 */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* 顶部导航 - 更加紧凑 */}
        <div className={`flex items-center gap-2 p-2 sm:p-3 ${brutalBorder} border-t-0 border-l-0 border-r-0 bg-white dark:bg-slate-900 sticky top-0 z-20 shrink-0`}>
          <button onClick={() => setShowHistory(!showHistory)} className={`h-8 w-8 flex items-center justify-center bg-slate-50 dark:bg-cyan-500 text-slate-900 ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all`}>
            {showHistory ? <PanelLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          <ScrollArea className="flex-1 min-h-0">
            <div className="flex items-center gap-2 py-0.5">
              {[
                { id: "chat", label: "对话聊天", icon: Bot, bg: "bg-blue-300 dark:bg-blue-600" },
                { id: "image", label: "创意绘图", icon: ImageIcon, bg: "bg-slate-50 dark:bg-cyan-600" },
                { id: "video", label: "视频生成", icon: Video, bg: "bg-slate-50 dark:bg-orange-600" },
                { id: "music", label: "音乐创作", icon: Music, bg: "bg-slate-50 dark:bg-cyan-600" },
                { id: "image_edit", label: "图像编辑", icon: Pencil, bg: "bg-slate-50 dark:bg-cyan-600" },
                { id: "subtitle", label: "智能字幕", icon: Captions, bg: "bg-slate-50 dark:bg-cyan-600" },
                { id: "downloader", label: "视频下载", icon: Download, bg: "bg-sky-300 dark:bg-sky-600" },
                { id: "digital_human", label: "数字人", icon: UserRound, bg: "bg-teal-300 dark:bg-teal-600" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={cn(
                    `flex items-center gap-1.5 px-3 py-1.5 text-xs font-black transition-all shrink-0 ${brutalBorder}`,
                    activeTab === tab.id 
                      ? `${tab.bg} text-slate-900 dark:text-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] translate-x-[-1px] translate-y-[-1px]` 
                      : "bg-white dark:bg-slate-800 hover:bg-slate-100 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 内容展示区 */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "circOut" }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              { activeTab === "chat" ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className={`p-4 bg-cyan-100 dark:bg-slate-200 ${brutalBorder} border-t-0 border-l-0 border-r-0 flex justify-center text-slate-900 shrink-0`}>
                    <div className="w-full max-w-4xl">
                      <AgentTypeSelector value={selectedAgentType} onChange={setSelectedAgentType} compact />
                    </div>
                  </div>
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="max-w-4xl mx-auto p-6 space-y-8">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 opacity-70">
                          <div className={`w-24 h-24 bg-cyan-200 dark:bg-cyan-600 rounded-none flex items-center justify-center ${brutalBorder} ${brutalShadow}`}>
                            <MessageSquare className="w-12 h-12 text-slate-900 dark:text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black uppercase tracking-widest mb-2">新的会话已就绪</h3>
                            <p className="font-bold text-sm">选择上方的 Agent 类型, 输入你的想法, 随时开始创造!</p>
                          </div>
                        </div>
                      ) : messages.map(msg => (
                        <div key={msg.id} className={cn("flex gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                          <div className={cn(`w-12 h-12 flex items-center justify-center shrink-0 ${brutalBorder} ${brutalShadowSm}`, msg.role === "user" ? "bg-slate-50 dark:bg-slate-200 text-slate-900" : "bg-white dark:bg-slate-800")}>
                            {msg.role === "user" ? <UserRound className="h-6 w-6 font-black" /> : <Bot className="h-6 w-6 font-black" />}
                          </div>
                          <div className={cn("flex flex-col gap-2 max-w-[80%]", msg.role === "user" ? "items-end" : "items-start")}>
                            <div className={cn(`px-5 py-4 text-[15px] ${brutalBorder} ${brutalShadowSm}`, msg.role === "user" ? "bg-cyan-200 dark:bg-slate-100 text-slate-900" : "bg-white dark:bg-slate-800")}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: ({ className, children }) => renderCodeBlock(className || "", children) }}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                            {msg.thinking && (
                              <div className="w-full">
                                <button onClick={() => toggleThinking(msg.id)} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 bg-white dark:bg-slate-900 px-3 py-1 border-2 border-slate-900 dark:border-slate-500 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#64748b]">
                                  <Sparkles className="h-3 w-3" /> 思考过程 {expandedThinking[msg.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </button>
                                {expandedThinking[msg.id] && <div className={`mt-3 p-4 bg-slate-100 dark:bg-slate-900 font-mono text-sm ${brutalBorder} shadow-[4px_4px_0px_0px_#94a3b8]`}>{msg.thinking}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} className="h-10" />
                    </div>
                  </ScrollArea>
                  {/* 输入框 */}
                  <div className={`p-6 bg-white dark:bg-slate-900 ${brutalBorder} border-b-0 border-l-0 border-r-0 shrink-0`}>
                    <div className={`max-w-4xl mx-auto flex items-end gap-3 bg-white dark:bg-slate-800 p-2 ${brutalBorder} ${brutalShadow}`}>
                      <textarea 
                        value={input} 
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="输入你的消息, 按 Enter 发送, Shift + Enter 换行..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-base font-medium p-3 resize-none max-h-40 outline-none"
                      />
                      <button onClick={handleSend} disabled={isStreaming || !input.trim()} className={`h-12 w-14 flex items-center justify-center bg-blue-500 text-white ${brutalBtnBase} disabled:opacity-50 disabled:cursor-not-allowed`}>
                        {isStreaming ? <Loader2 className="h-6 w-6 animate-spin" /> : <ArrowUp className="h-6 w-6" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === "subtitle" ? (
                <div className="flex-1 min-h-0 overflow-hidden p-1 sm:p-2">
                  <div className={`w-full h-full flex flex-col bg-white dark:bg-slate-900 p-1 sm:p-2 ${brutalBorder} ${brutalShadowSm} min-h-0`}>
                    <h2 className="text-sm sm:text-base font-black uppercase mb-1 sm:mb-2 border-b-2 border-slate-900 dark:border-white pb-1 shrink-0 flex items-center gap-2">
                      <Captions className="w-4 h-4" />
                      智能字幕提取
                    </h2>
                    <div className="flex-1 min-h-0">
                      <SubtitlePanel />
                    </div>
                  </div>
                </div>
              ) : activeTab === "digital_human" ? (
                <div className="flex-1 min-h-0 overflow-hidden p-1 sm:p-2">
                  <div className={`w-full h-full flex flex-col bg-white dark:bg-slate-900 p-1 sm:p-2 ${brutalBorder} ${brutalShadowSm} min-h-0`}>
                    <h2 className="text-sm sm:text-base font-black uppercase mb-1 sm:mb-2 border-b-2 border-slate-900 dark:border-white pb-1 shrink-0 flex items-center gap-2">
                      <UserRound className="w-4 h-4" />
                      数字人合成
                    </h2>
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                      <DigitalHumanPanel />
                    </div>
                  </div>
                </div>
              ) : activeTab === "downloader" ? (
                <div className="flex-1 min-h-0 overflow-hidden p-1 sm:p-2">
                  <div className={`w-full h-full flex flex-col bg-white dark:bg-slate-900 p-1 sm:p-2 ${brutalBorder} ${brutalShadowSm} min-h-0`}>
                    <h2 className="text-sm sm:text-base font-black uppercase mb-1 sm:mb-2 border-b-2 border-slate-900 dark:border-white pb-1 shrink-0 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      全网视频下载
                    </h2>
                    <div className="flex-1 min-h-0">
                      <VideoDownloaderPanel />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-hidden p-2">
                  <div className="w-full h-full min-h-0">
                    {activeTab === "image" && (
                      <div className="grid lg:grid-cols-2 gap-4 items-start h-full min-h-0">
                        <div className={`bg-emerald-100 dark:bg-slate-900 p-4 flex flex-col h-full min-h-0 ${brutalBorder} ${brutalShadow}`}>
                          <div className="mb-4 border-b-4 border-slate-900 dark:border-white pb-2 shrink-0">
                            <h2 className="text-2xl font-black uppercase">创意绘图</h2>
                            <div className="text-sm font-bold mt-1">将你的想象力转化为视觉杰作.</div>
                          </div>

                          <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto pr-2">
                            <div className="relative">
                              <textarea
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                onKeyDown={(e) => {
                                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                    e.preventDefault();
                                    void handleGenerateImage();
                                  }
                                }}
                                aria-label="图片描述"
                                title="图片描述"
                                placeholder="例如: 一只可爱的猫在花园里玩耍, 电影级光影..."
                                className={`w-full h-40 p-5 bg-white dark:bg-slate-800 text-lg font-medium resize-none outline-none ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all`}
                              />
                              <div className="absolute bottom-4 right-5 text-xs font-bold">
                                {imagePrompt.trim().length}/2000
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              {imagePromptPresets.map((p) => (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={() => setImagePrompt(p.value)}
                                  className={`px-4 py-2 bg-white dark:bg-slate-800 text-xs font-bold uppercase ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>

                            <div className="space-y-4 pt-4">
                              <button
                                type="button"
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage || !imagePrompt.trim()}
                                className={`w-full h-16 bg-cyan-500 text-slate-900 text-xl flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed ${brutalBtnBase}`}
                              >
                                {isGeneratingImage ? (
                                  <><Loader2 className="h-6 w-6 animate-spin" /> 正在生成</>
                                ) : (
                                  <><Sparkles className="h-6 w-6" /> 开始生成</>
                                )}
                              </button>

                              <AnimatePresence>
                                {imageGenerateStage === "generating" && (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-4 bg-white dark:bg-slate-800 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a]`}>
                                    <div className="flex justify-between font-bold text-sm uppercase mb-2">
                                      <span>生成进度...</span>
                                      <span>{Math.max(0, Math.min(100, imageGenerateProgress))}%</span>
                                    </div>
                                    <div className={`h-4 w-full bg-slate-200 dark:bg-slate-700 ${brutalBorder} p-0.5`}>
                                      <motion.div
                                        className="h-full bg-cyan-500 border-r-2 border-slate-900"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(0, Math.min(100, imageGenerateProgress))}%` }}
                                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                      />
                                    </div>
                                  </motion.div>
                                )}
                                {imageGenerateError && (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-4 bg-red-500 text-white font-bold flex gap-3 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a]`}>
                                    <AlertCircle className="h-6 w-6 shrink-0" />
                                    <span className="break-words">{imageGenerateError}</span>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        <div className={`bg-white dark:bg-slate-900 p-4 h-full flex flex-col ${brutalBorder} ${brutalShadow} overflow-hidden`}>
                            <div className="flex-1 flex items-center justify-center relative min-h-0">
                              <AnimatePresence mode="wait">
                                {generatedImageUrl ? (
                                  <motion.div key="image-result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full group flex items-center justify-center">
                                    <img src={generatedImageUrl} className={`max-w-full max-h-full object-contain ${brutalBorder}`} alt="Generated" />
                                    <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={clearGeneratedImage} className={`px-4 py-2 bg-white text-slate-900 ${brutalBtnBase}`}>清除</button>
                                      <button onClick={() => void handleCopyImageLink(generatedImageUrl)} aria-label="复制链接" className={`px-4 py-2 bg-slate-50 text-slate-900 flex items-center justify-center ${brutalBtnBase}`}>
                                        {imageLinkCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                      </button>
                                      <a href={generatedImageUrl} target="_blank" rel="noopener noreferrer">
                                        <button className={`px-4 py-2 bg-slate-50 text-slate-900 ${brutalBtnBase}`}>打开</button>
                                      </a>
                                    </div>
                                  </motion.div>
                                ) : isGeneratingImage ? (
                                  <motion.div key="image-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center flex-col gap-6">
                                    <div className={`relative w-full max-w-xl aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden ${brutalBorder}`}>
                                      <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: PANEL_MOTION_TOKENS.sweep_duration, repeat: Infinity, ease: "linear" }}
                                      />
                                      <motion.div
                                        className="absolute inset-[12%] border-4 border-dashed border-cyan-500/80"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className={`w-32 h-32 bg-cyan-200 dark:bg-cyan-900 flex items-center justify-center ${brutalBorder} ${brutalShadowSm}`}>
                                          <ImageIcon className="w-16 h-16" />
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`w-full max-w-xl p-5 bg-white dark:bg-slate-950 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a] space-y-4`}>
                                      <div className="flex items-center justify-between gap-4 font-black uppercase">
                                        <div className="flex items-center gap-3 text-xl">
                                          <Loader2 className="animate-spin" />
                                          画幅正在生成
                                        </div>
                                        <div>{Math.max(0, Math.min(100, imageGenerateProgress))}%</div>
                                      </div>
                                      <div className="h-4 bg-slate-200 dark:bg-slate-800 border-2 border-slate-900 dark:border-white overflow-hidden">
                                        <motion.div
                                          className="h-full bg-cyan-500"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${Math.max(0, Math.min(100, imageGenerateProgress))}%` }}
                                          transition={{ type: "spring", stiffness: 90, damping: 18 }}
                                        />
                                      </div>
                                      <div className="text-sm font-bold break-words">
                                        {imageGenerateProgress < 45 ? "正在铺设构图和光影..." : imageGenerateProgress < 80 ? "正在细化细节和纹理..." : "正在输出最终画面..."}
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div key="image-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4 opacity-50 h-full">
                                    <div className={`w-32 h-32 bg-emerald-200 dark:bg-emerald-800 rounded-none flex items-center justify-center ${brutalBorder} ${brutalShadow}`}>
                                      <ImageIcon className="h-16 w-16 text-slate-900 dark:text-white" />
                                    </div>
                                    <div className="font-black uppercase text-2xl tracking-widest">{PANEL_EMPTY_COPY.waiting_input_title}</div>
                                    <p className="font-bold text-sm">{PANEL_EMPTY_COPY.waiting_input_desc}</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* 画廊部分 */}
                            {imageGallery && imageGallery.length > 0 && (
                              <div className="mt-6 pt-4 border-t-4 border-slate-900 dark:border-white shrink-0 flex flex-col transition-all duration-300">
                                <div 
                                  className="flex items-center justify-between cursor-pointer group mb-3"
                                  onClick={() => toggleGallery('image')}
                                >
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-black uppercase shrink-0 group-hover:text-emerald-600 transition-colors">
                                      GALLERY / 历史作品 ({imageGallery.length})
                                    </h3>
                                    <button
                                      type="button"
                                      className={`px-3 py-1 text-xs bg-emerald-200 text-slate-900 ${brutalBtnBase}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGallerySelectionMode("image");
                                      }}
                                    >
                                      {gallerySelectionMode.image ? `已选 ${selectedGalleryItems.image.length}` : "多选"}
                                    </button>
                                    {gallerySelectionMode.image && (
                                      <>
                                        <button
                                          type="button"
                                          className={`px-3 py-1 text-xs bg-white text-slate-900 ${brutalBtnBase}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectAllGalleryItems("image");
                                          }}
                                        >
                                          {selectedGalleryItems.image.length === imageGallery.length ? "取消全选" : "全选"}
                                        </button>
                                        <button
                                          type="button"
                                          className={`px-3 py-1 text-xs bg-red-400 text-slate-900 ${brutalBtnBase}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void handleBatchDeleteSelected("image");
                                          }}
                                        >
                                          删除已选
                                        </button>
                                        <button
                                          type="button"
                                          className={`px-3 py-1 text-xs bg-white text-slate-900 ${brutalBtnBase}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            clearGallerySelection("image");
                                          }}
                                        >
                                          取消
                                        </button>
                                      </>
                                    )}
                                    <button
                                      type="button"
                                      className={`px-3 py-1 text-xs bg-white text-slate-900 ${brutalBtnBase}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearImageGallery();
                                      }}
                                    >
                                      批量清空
                                    </button>
                                  </div>
                                  <div className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    {galleryExpanded.image ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </div>
                                </div>
                                
                                <AnimatePresence>
                                  {galleryExpanded.image && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="h-36 overflow-x-auto flex gap-4 pb-4 snap-x">
                                        {imageGallery.map((item) => (
                                          <div 
                                            key={item.id} 
                                            className={cn(
                                              `shrink-0 w-32 h-32 cursor-pointer ${brutalBorder} hover:-translate-y-1 transition-transform snap-start relative group`,
                                              selectedGalleryItems.image.includes(item.id) && "ring-4 ring-emerald-500 ring-offset-2"
                                            )}
                                            onClick={() => openGalleryItem("image", item)}
                                          >
                                            <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" title={item.prompt} />
                                            {gallerySelectionMode.image && (
                                              <div className="absolute inset-0 bg-slate-900/35 pointer-events-none" />
                                            )}
                                            {(gallerySelectionMode.image || selectedGalleryItems.image.includes(item.id)) && (
                                              <div className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center bg-white text-emerald-600 ${brutalBorder}`}>
                                                <Check className="w-4 h-4" />
                                              </div>
                                            )}
                                            <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button type="button" className={`flex-1 py-1 bg-white text-slate-900 ${brutalBtnBase}`} onClick={(e) => { e.stopPropagation(); void handleCopyImageLink(item.public_url || item.url); }}>
                                                <Copy className="h-4 w-4 mx-auto" />
                                              </button>
                                              <button type="button" className={`flex-1 py-1 bg-white text-slate-900 ${brutalBtnBase}`} onClick={(e) => { e.stopPropagation(); removeFromImageGallery(item.id); }}>
                                                <Trash2 className="h-4 w-4 mx-auto" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                      </div>
                    )}

                    {activeTab === "video" && (
                      <div className="grid lg:grid-cols-2 gap-4 items-start h-full min-h-0">
                        <div className={`bg-orange-100 dark:bg-slate-900 p-4 flex flex-col h-full min-h-0 ${brutalBorder} ${brutalShadow}`}>
                          <div className="mb-4 border-b-4 border-slate-900 dark:border-white pb-2 shrink-0">
                            <h2 className="text-2xl font-black uppercase">视频生成</h2>
                            <div className="text-sm font-bold mt-1">让你的想象力动起来.</div>
                          </div>

                          <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto pr-2">
                            <textarea
                              value={videoPrompt}
                              onChange={(e) => setVideoPrompt(e.target.value)}
                              onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                  e.preventDefault();
                                  void handleGenerateVideo();
                                }
                              }}
                              aria-label="视频描述"
                              title="视频描述"
                              placeholder="例如: 波涛汹涌的大海, 电影感打光..."
                              className={`w-full h-40 p-5 bg-white dark:bg-slate-800 text-lg font-medium resize-none outline-none ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all`}
                            />

                            <button
                              type="button"
                              onClick={handleGenerateVideo}
                              disabled={isGeneratingVideo || !videoPrompt.trim()}
                              className={`w-full h-16 bg-orange-500 text-slate-900 text-xl flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed ${brutalBtnBase}`}
                            >
                              {isGeneratingVideo ? (
                                <><Loader2 className="h-6 w-6 animate-spin" /> 正在合成</>
                              ) : (
                                <><Video className="h-6 w-6" /> 开始合成视频</>
                              )}
                            </button>

                            <AnimatePresence>
                              {videoGenerateError && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-4 bg-red-500 text-white font-bold flex gap-3 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a]`}>
                                  <AlertCircle className="h-6 w-6 shrink-0" />
                                  <span className="break-words">{videoGenerateError}</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className={`bg-white dark:bg-slate-900 p-4 h-full flex flex-col ${brutalBorder} ${brutalShadow} overflow-hidden`}>
                            <div className="flex-1 flex items-center justify-center relative min-h-0">
                              <AnimatePresence mode="wait">
                                {generatedVideoUrl ? (
                                  <motion.div key="video-result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full group flex items-center justify-center">
                                    <video src={generatedVideoUrl} controls className={`max-w-full max-h-full object-contain ${brutalBorder}`} />
                                    <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={clearGeneratedVideo} className={`px-4 py-2 bg-white text-slate-900 ${brutalBtnBase}`}>清除</button>
                                      <button onClick={() => void handleCopyVideoLink(generatedVideoUrl)} aria-label="复制链接" className={`px-4 py-2 bg-slate-50 text-slate-900 flex items-center justify-center ${brutalBtnBase}`}>
                                        {videoLinkCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                      </button>
                                      <a href={generatedVideoUrl} target="_blank" rel="noopener noreferrer">
                                        <button className={`px-4 py-2 bg-slate-50 text-slate-900 ${brutalBtnBase}`}>打开</button>
                                      </a>
                                    </div>
                                  </motion.div>
                                ) : isGeneratingVideo ? (
                                  <motion.div key="video-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center flex-col gap-6">
                                    <div className={`relative w-full max-w-2xl aspect-video bg-slate-900 overflow-hidden ${brutalBorder}`}>
                                      {/* 背景光影 */}
                                      <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                      />
                                      {/* 胶片滚动效果 */}
                                      <div className="absolute left-4 top-0 bottom-0 w-8 flex flex-col justify-around py-4">
                                        {[...Array(6)].map((_, i) => (
                                          <motion.div key={`l-${i}`} className="w-4 h-6 bg-white/20" animate={{ y: [0, -40] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                                        ))}
                                      </div>
                                      <div className="absolute right-4 top-0 bottom-0 w-8 flex flex-col justify-around py-4">
                                        {[...Array(6)].map((_, i) => (
                                          <motion.div key={`r-${i}`} className="w-4 h-6 bg-white/20" animate={{ y: [0, -40] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                                        ))}
                                      </div>
                                      {/* 中心大图标与提示 */}
                                      <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-400 gap-4">
                                        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                                          <Video className="w-20 h-20" />
                                        </motion.div>
                                        <div className="text-xl font-black tracking-widest animate-pulse">4K RENDERING...</div>
                                        <div className="text-sm font-bold text-white/60">☕ 去泡杯咖啡吧，史诗级大片正在洗印中...</div>
                                      </div>
                                    </div>
                                    <div className={`w-full max-w-2xl p-5 bg-slate-50 dark:bg-slate-950 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a] space-y-4`}>
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="font-black uppercase text-xl flex items-center gap-3">
                                          <Loader2 className="animate-spin" />
                                          {videoStageLabelMap[videoGenerateStage || "queued"] || "视频生成中"}
                                        </div>
                                        <div className="text-sm font-black uppercase">
                                          STEP {videoGenerateCurrentStep ?? 0}/{videoGenerateTotalSteps ?? 9}
                                        </div>
                                      </div>
                                      <div className="h-4 bg-slate-200 dark:bg-slate-800 border-2 border-slate-900 dark:border-white overflow-hidden">
                                        <div
                                          className="h-full bg-orange-500 transition-all duration-500"
                                          style={{ width: `${videoProgressPercent}%` }}
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 text-sm font-bold">
                                        <div>TASK ID: {videoGenerateTaskId || "-"}</div>
                                        <div>帧数: {videoGenerateFrames || "-"}</div>
                                        <div>分辨率: {videoGenerateResolution || "-"}</div>
                                        <div>耗时: {videoGenerateElapsedSeconds ? `${videoGenerateElapsedSeconds}s` : "进行中"}</div>
                                      </div>
                                      <div className="text-sm font-bold break-words">
                                        {videoGenerateProgress || PANEL_SUBTITLES.processing_feedback}
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div key="video-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4 opacity-50 h-full">
                                    <div className={`w-32 h-32 bg-orange-200 dark:bg-orange-800 rounded-none flex items-center justify-center ${brutalBorder} ${brutalShadow}`}>
                                      <Video className="h-16 w-16 text-slate-900 dark:text-white" />
                                    </div>
                                    <div className="font-black uppercase text-2xl tracking-widest">{PANEL_EMPTY_COPY.waiting_input_title}</div>
                                    <p className="font-bold text-sm">{PANEL_EMPTY_COPY.waiting_input_desc}</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* 画廊部分 */}
                            {videoGallery && videoGallery.length > 0 && (
                              <div className="mt-6 pt-4 border-t-4 border-slate-900 dark:border-white shrink-0 flex flex-col transition-all duration-300">
                                <div 
                                  className="flex items-center justify-between cursor-pointer group mb-3"
                                  onClick={() => toggleGallery('video')}
                                >
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-black uppercase shrink-0 group-hover:text-orange-500 transition-colors">
                                      GALLERY / 历史作品 ({videoGallery.length})
                                    </h3>
                                    <button
                                      type="button"
                                      className={`px-3 py-1 text-xs bg-orange-200 text-slate-900 ${brutalBtnBase}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGallerySelectionMode("video");
                                      }}
                                    >
                                      {gallerySelectionMode.video ? `已选 ${selectedGalleryItems.video.length}` : "多选"}
                                    </button>
                                    {gallerySelectionMode.video && (
                                      <>
                                        <button
                                          type="button"
                                          className={`px-3 py-1 text-xs bg-white text-slate-900 ${brutalBtnBase}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectAllGalleryItems("video");
                                          }}
                                        >
                                          {selectedGalleryItems.video.length === videoGallery.length ? "取消全选" : "全选"}
                                        </button>
                                        <button
                                          type="button"
                                          className={`px-3 py-1 text-xs bg-red-400 text-slate-900 ${brutalBtnBase}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void handleBatchDeleteSelected("video");
                                          }}
                                        >
                                          删除已选
                                        </button>
                                        <button
                                          type="button"
                                          className={`px-3 py-1 text-xs bg-white text-slate-900 ${brutalBtnBase}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            clearGallerySelection("video");
                                          }}
                                        >
                                          取消
                                        </button>
                                      </>
                                    )}
                                    <button
                                      type="button"
                                      className={`px-3 py-1 text-xs bg-white text-slate-900 ${brutalBtnBase}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearVideoGallery();
                                      }}
                                    >
                                      批量清空
                                    </button>
                                  </div>
                                  <div className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    {galleryExpanded.video ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {galleryExpanded.video && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="h-36 overflow-x-auto flex gap-4 pb-4 snap-x">
                                        {videoGallery.map((item) => (
                                          <div 
                                            key={item.id} 
                                            className={cn(
                                              `shrink-0 w-48 h-32 cursor-pointer ${brutalBorder} hover:-translate-y-1 transition-transform snap-start relative group bg-black flex items-center justify-center`,
                                              selectedGalleryItems.video.includes(item.id) && "ring-4 ring-orange-500 ring-offset-2"
                                            )}
                                            onClick={() => openGalleryItem("video", item)}
                                          >
                                            <video src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" title={item.prompt} />
                                            {gallerySelectionMode.video && (
                                              <div className="absolute inset-0 bg-slate-900/40 pointer-events-none" />
                                            )}
                                            {(gallerySelectionMode.video || selectedGalleryItems.video.includes(item.id)) && (
                                              <div className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center bg-white text-orange-500 ${brutalBorder}`}>
                                                <Check className="w-4 h-4" />
                                              </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/40 transition-colors">
                                                <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-1" />
                                              </div>
                                            </div>
                                            <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button type="button" className={`flex-1 py-1 bg-white text-slate-900 ${brutalBtnBase}`} onClick={(e) => { e.stopPropagation(); void handleCopyVideoLink(item.public_url || item.url); }}>
                                                <Copy className="h-4 w-4 mx-auto" />
                                              </button>
                                              <button type="button" className={`flex-1 py-1 bg-white text-slate-900 ${brutalBtnBase}`} onClick={(e) => { e.stopPropagation(); removeFromVideoGallery(item.id); }}>
                                                <Trash2 className="h-4 w-4 mx-auto" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                      </div>
                    )}

                    {activeTab === "music" && (
                      <div className="grid lg:grid-cols-2 gap-4 items-start h-full min-h-0">
                        <div className={`bg-cyan-100 dark:bg-slate-900 p-4 flex flex-col h-full min-h-0 ${brutalBorder} ${brutalShadow}`}>
                          <div className="mb-4 border-b-4 border-slate-900 dark:border-white pb-2 shrink-0">
                            <h2 className="text-2xl font-black uppercase">音乐创作</h2>
                            <div className="text-sm font-bold mt-1">从文字到旋律的奇妙转化.</div>
                          </div>

                          <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto pr-2">
                            <div className="relative">
                              <textarea
                                value={musicPrompt}
                                onChange={(e) => setMusicPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                    e.preventDefault();
                                    void handleGenerateMusic();
                                  }
                                }}
                                aria-label="音乐描述"
                                title="音乐描述"
                                placeholder="例如: Lo-fi chill, 温暖的磁带质感..."
                                className={`w-full h-40 p-5 bg-white dark:bg-slate-800 text-lg font-medium resize-none outline-none ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all`}
                              />
                              <div className="absolute bottom-4 right-5 text-xs font-bold">
                                {musicPrompt.trim().length}/2000
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              {musicPromptPresets.map((p) => (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={() => setMusicPrompt(p.value)}
                                  className={`px-4 py-2 bg-white dark:bg-slate-800 text-xs font-bold uppercase ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>

                            <div className="flex gap-4">
                                <button
                                  type="button"
                                  onClick={handleGenerateMusic}
                                  disabled={isGeneratingMusic || !musicPrompt.trim()}
                                  className={`flex-1 h-16 bg-cyan-500 text-slate-900 dark:text-white text-xl flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed ${brutalBtnBase}`}
                                >
                                  {isGeneratingMusic ? (
                                    <><Loader2 className="h-6 w-6 animate-spin" /> 正在谱曲</>
                                  ) : (
                                    <><Music className="h-6 w-6" /> 开始创作音乐</>
                                  )}
                                </button>

                                {isGeneratingMusic && (
                                  <button
                                    type="button"
                                    onClick={cancelGenerateMusic}
                                    className={`px-6 h-16 bg-red-500 text-white text-xl flex items-center justify-center gap-2 ${brutalBtnBase}`}
                                  >
                                    <X className="h-6 w-6" /> 取消
                                  </button>
                                )}
                              </div>

                              <AnimatePresence>
                                {isGeneratingMusic && musicGenerateProgress && (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-4 bg-slate-100 dark:bg-slate-800 font-bold flex items-center gap-3 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a]`}>
                                    <Loader2 className="h-5 w-5 animate-spin text-slate-900 dark:text-white" />
                                    <span className="text-slate-900 dark:text-white">{musicGenerateProgress}</span>
                                  </motion.div>
                                )}
                                
                                {musicGenerateError && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-4 bg-red-500 text-white font-bold flex gap-3 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a]`}>
                                  <AlertCircle className="h-6 w-6 shrink-0" />
                                  <span className="break-words whitespace-pre-wrap text-sm">{musicGenerateError}</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className={`bg-white dark:bg-slate-900 p-4 h-full flex flex-col ${brutalBorder} ${brutalShadow} overflow-hidden`}>
                            <div className="flex-1 flex items-center justify-center relative min-h-0">
                              <AnimatePresence mode="wait">
                                {generatedMusicUrl ? (
                                  <motion.div key="music-result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full flex flex-col">
                                    <div className="flex-1 min-h-0 overflow-hidden">
                                      <MusicPlayer 
                                        url={generatedMusicUrl}
                                        title={musicPrompt || "AI 创作音乐"}
                                        coverUrl={generatedMusicCoverUrl}
                                        lyrics={generatedMusicLyrics}
                                        onClose={clearGeneratedMusic}
                                      />
                                    </div>
                                  </motion.div>
                                ) : isGeneratingMusic ? (
                                  <motion.div key="music-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex items-center justify-center flex-col gap-6">
                                    <div className={`w-full max-w-2xl p-6 bg-cyan-50 dark:bg-slate-950 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a] space-y-6`}>
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="font-black uppercase text-xl flex items-center gap-3">
                                          <Loader2 className="animate-spin" />
                                          音轨正在生成
                                        </div>
                                        <div className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                                          MUSIC PIPELINE
                                        </div>
                                      </div>

                                      {/* 动态展示封面和歌词预览 */}
                                      <div className="flex flex-col md:flex-row gap-6">
                                        {/* 封面预览 */}
                                        <div className={cn(
                                          "w-full md:w-48 aspect-square flex items-center justify-center overflow-hidden transition-all",
                                          brutalBorder,
                                          generatedMusicCoverUrl ? "" : "bg-slate-100 animate-pulse"
                                        )}>
                                          {generatedMusicCoverUrl ? (
                                            <img src={generatedMusicCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                          ) : (
                                            <Music className="h-12 w-12 text-slate-300" />
                                          )}
                                        </div>

                                        {/* 歌词预览 */}
                                        <div className={cn(
                                          "flex-1 h-48 overflow-hidden relative p-4",
                                          brutalBorder,
                                          generatedMusicLyrics ? "bg-white" : "bg-slate-50 animate-pulse"
                                        )}>
                                          {generatedMusicLyrics ? (
                                            <div className="text-sm font-medium text-slate-600 line-clamp-6 whitespace-pre-wrap">
                                              {generatedMusicLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "")}
                                            </div>
                                          ) : (
                                            <div className="space-y-2">
                                              <div className="h-4 bg-slate-200 w-3/4" />
                                              <div className="h-4 bg-slate-200 w-1/2" />
                                              <div className="h-4 bg-slate-200 w-2/3" />
                                            </div>
                                          )}
                                          <div className="absolute bottom-2 right-2 bg-cyan-500 text-slate-900 px-2 py-0.5 text-[10px] font-black uppercase">
                                            {generatedMusicLyrics ? "歌词已就绪" : "正在作词..."}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="h-4 bg-slate-200 dark:bg-slate-800 border-2 border-slate-900 dark:border-white overflow-hidden">
                                        <motion.div
                                          className="h-full bg-cyan-500"
                                          initial={{ width: 0 }}
                                          animate={{ width: generatedMusicLyrics ? (generatedMusicCoverUrl ? "60%" : "30%") : "10%" }}
                                          transition={{ duration: 1 }}
                                        />
                                      </div>
                                      <div className="text-sm font-bold break-words">
                                        {musicGenerateProgress || PANEL_SUBTITLES.processing_feedback}
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div key="music-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4 opacity-50 h-full">
                                    <div className={`w-32 h-32 bg-cyan-200 dark:bg-cyan-900 rounded-none flex items-center justify-center ${brutalBorder} ${brutalShadow}`}>
                                      <Music className="h-16 w-16 text-slate-900 dark:text-white" />
                                    </div>
                                    <div className="font-black uppercase text-2xl tracking-widest">{PANEL_EMPTY_COPY.waiting_input_title}</div>
                                    <p className="font-bold text-sm">{PANEL_EMPTY_COPY.waiting_input_desc}</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* 画廊部分 */}
                            {musicGallery && musicGallery.length > 0 && (
                              <div className="mt-6 pt-4 border-t-4 border-slate-900 dark:border-white shrink-0 flex flex-col transition-all duration-300">
                                <div 
                                  className="flex items-center justify-between cursor-pointer group mb-3"
                                  onClick={() => toggleGallery('music')}
                                >
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-black uppercase shrink-0 group-hover:text-cyan-600 transition-colors">
                                      GALLERY / 历史作品 ({musicGallery.length})
                                    </h3>
                                    <button
                                      type="button"
                                      className={`px-3 py-1 text-xs bg-cyan-200 text-slate-900 ${brutalBtnBase}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleGallerySelectionMode("music");
                                      }}
                                    >
                                      {gallerySelectionMode.music ? `已选 ${selectedGalleryItems.music.length}` : "多选"}
                                    </button>
                                    {gallerySelectionMode.music && (
                                      <>
                                        <button
                                          type="button"
                                          className={`px-3 py-1 text-xs bg-white text-slate-900 ${brutalBtnBase}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectAllGalleryItems("music");
                                          }}
                                        >
                                          {selectedGalleryItems.music.length === musicGallery.length ? "取消全选" : "全选"}
                                        </button>
                                        <button
                                          type="button"
                                          className={`px-3 py-1 text-xs bg-red-400 text-slate-900 ${brutalBtnBase}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void handleBatchDeleteSelected("music");
                                          }}
                                        >
                                          删除已选
                                        </button>
                                        <button
                                          type="button"
                                          className={`px-3 py-1 text-xs bg-white text-slate-900 ${brutalBtnBase}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            clearGallerySelection("music");
                                          }}
                                        >
                                          取消
                                        </button>
                                      </>
                                    )}
                                    <button
                                      type="button"
                                      className={`px-3 py-1 text-xs bg-white text-slate-900 ${brutalBtnBase}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearMusicGallery();
                                      }}
                                    >
                                      批量清空
                                    </button>
                                  </div>
                                  <div className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    {galleryExpanded.music ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {galleryExpanded.music && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="h-32 overflow-x-auto flex gap-4 pb-4 snap-x">
                                        {musicGallery.map((item) => (
                                          <div 
                                            key={item.id} 
                                            className={cn(
                                              `shrink-0 w-64 h-24 cursor-pointer ${brutalBorder} hover:-translate-y-1 transition-transform snap-start relative group bg-cyan-50 dark:bg-slate-800 p-4 flex flex-col justify-center gap-2`,
                                              selectedGalleryItems.music.includes(item.id) && "ring-4 ring-cyan-500 ring-offset-2"
                                            )}
                                            onClick={() => openGalleryItem("music", item)}
                                          >
                                            {gallerySelectionMode.music && (
                                              <div className="absolute inset-0 bg-slate-900/15 pointer-events-none" />
                                            )}
                                            {(gallerySelectionMode.music || selectedGalleryItems.music.includes(item.id)) && (
                                              <div className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center bg-white text-cyan-600 ${brutalBorder}`}>
                                                <Check className="w-4 h-4" />
                                              </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white shrink-0">
                                                <Music className="w-5 h-5" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate" title={item.prompt}>{item.prompt}</p>
                                                <p className="text-xs opacity-60">{new Date(item.timestamp).toLocaleTimeString()}</p>
                                              </div>
                                            </div>
                                            <div className="absolute right-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button type="button" className={`px-2 py-1 bg-white text-slate-900 ${brutalBtnBase}`} onClick={(e) => { e.stopPropagation(); void handleCopyMusicLink(item.public_url || item.url); }}>
                                                <Copy className="h-4 w-4" />
                                              </button>
                                              <button type="button" className={`px-2 py-1 bg-white text-slate-900 ${brutalBtnBase}`} onClick={(e) => { e.stopPropagation(); removeFromMusicGallery(item.id); }}>
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                      </div>
                    )}

                    {activeTab === "image_edit" && (
                      <div className="grid lg:grid-cols-2 gap-4 items-start h-full">
                        <div className={`bg-rose-100 dark:bg-slate-900 p-4 flex flex-col h-full ${brutalBorder} ${brutalShadow}`}>
                          <div className="mb-4 border-b-4 border-slate-900 dark:border-white pb-2 shrink-0">
                            <h2 className="text-2xl font-black uppercase">图像编辑</h2>
                            <div className="text-sm font-bold mt-1">上传原图或双图参考, 使用本地图像编辑模型按指令完成修改.</div>
                          </div>

                          <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div className={`p-4 bg-white dark:bg-slate-800 flex flex-col items-center justify-center gap-4 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a]`}>
                                <div className="font-bold uppercase text-sm">源图片 (SOURCE)</div>
                                {editingSourceImage ? (
                                  <div className="relative w-full aspect-square">
                                    <img src={editingSourceImage} className={`w-full h-full object-cover ${brutalBorder}`} alt="Source" />
                                    <button onClick={() => setEditingSourceImage(null)} className={`absolute top-2 right-2 p-1 bg-red-500 text-white ${brutalBorder}`}><X className="h-4 w-4"/></button>
                                  </div>
                                ) : (
                                  <label className={`w-full aspect-square flex flex-col items-center justify-center cursor-pointer bg-slate-100 dark:bg-slate-900 ${brutalBorder} hover:bg-slate-200 transition-colors`}>
                                    <Upload className="h-8 w-8 mb-2" />
                                    <span className="text-xs font-bold uppercase">点击上传</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => void handlePickEditImage(e.target.files?.[0] || null, false)} />
                                  </label>
                                )}
                              </div>
                              <div className={`p-4 bg-white dark:bg-slate-800 flex flex-col items-center justify-center gap-4 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a]`}>
                                <div className="font-bold uppercase text-sm">第二张参考图 (OPTIONAL)</div>
                                {editingSourceImage2 ? (
                                  <div className="relative w-full aspect-square">
                                    <img src={editingSourceImage2} className={`w-full h-full object-cover ${brutalBorder}`} alt="Ref" />
                                    <button onClick={() => setEditingSourceImage(null, true)} className={`absolute top-2 right-2 p-1 bg-red-500 text-white ${brutalBorder}`}><X className="h-4 w-4"/></button>
                                  </div>
                                ) : (
                                  <label className={`w-full aspect-square flex flex-col items-center justify-center cursor-pointer bg-slate-100 dark:bg-slate-900 ${brutalBorder} hover:bg-slate-200 transition-colors`}>
                                    <Upload className="h-8 w-8 mb-2" />
                                    <span className="text-xs font-bold uppercase">点击上传</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => void handlePickEditImage(e.target.files?.[0] || null, true)} />
                                  </label>
                                )}
                              </div>
                            </div>

                            <textarea
                              value={imageEditPrompt}
                              onChange={(e) => setImageEditPrompt(e.target.value)}
                              onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                  e.preventDefault();
                                  void handleStartEditImage();
                                }
                              }}
                              aria-label="编辑指令"
                              title="编辑指令"
                              placeholder="例如: 将背景替换为赛博朋克城市夜景..."
                              className={`w-full h-32 p-5 bg-white dark:bg-slate-800 text-lg font-medium resize-none outline-none ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#0f172a] transition-all`}
                            />

                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={handleStartEditImage}
                                disabled={isEditingImage || !editingSourceImage || !imageEditPrompt.trim()}
                                className={`flex-1 h-16 bg-cyan-500 text-slate-900 text-xl flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed ${brutalBtnBase}`}
                              >
                                {isEditingImage ? (
                                  <><Loader2 className="h-6 w-6 animate-spin" /> 正在处理</>
                                ) : (
                                  <><Pencil className="h-6 w-6" /> 开始编辑</>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditingImage) {
                                    cancelEditImage();
                                    return;
                                  }
                                  setEditingSourceImage(null);
                                  setEditingSourceImage(null, true);
                                  setImageEditPrompt("");
                                  clearEditedImage();
                                }}
                                className={`px-6 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 ${brutalBtnBase}`}
                              >
                                {isEditingImage ? "取消任务" : "重置"}
                              </button>
                            </div>

                            <AnimatePresence>
                              {imageEditError && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-4 bg-red-500 text-white font-bold flex gap-3 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a]`}>
                                  <AlertCircle className="h-6 w-6 shrink-0" />
                                  <span className="break-words">{imageEditError}</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className={`bg-white dark:bg-slate-900 p-4 h-full flex items-center justify-center ${brutalBorder} ${brutalShadow}`}>
                          <AnimatePresence mode="wait">
                            {editedImageUrl ? (
                              <motion.div key="edit-result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full group">
                                <img src={editedImageUrl} className={`w-full h-full object-contain ${brutalBorder}`} alt="Edited" />
                                <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={clearEditedImage} className={`px-4 py-2 bg-white text-slate-900 ${brutalBtnBase}`}>清除</button>
                                  <a href={editedImageUrl} target="_blank" rel="noopener noreferrer">
                                    <button className={`px-4 py-2 bg-slate-50 text-slate-900 ${brutalBtnBase}`}>打开</button>
                                  </a>
                                </div>
                              </motion.div>
                            ) : isEditingImage ? (
                              <motion.div key="edit-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center flex-col gap-6">
                                <div className={`relative w-full max-w-xl aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden ${brutalBorder}`}>
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-300/40 to-transparent"
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{ duration: PANEL_MOTION_TOKENS.sweep_duration, repeat: Infinity, ease: "linear" }}
                                  />
                                  <motion.div
                                    className="absolute inset-[12%] border-4 border-dashed border-rose-500/80"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`w-32 h-32 bg-rose-200 dark:bg-rose-900 flex items-center justify-center ${brutalBorder} ${brutalShadowSm}`}>
                                      <Pencil className="w-16 h-16" />
                                    </div>
                                  </div>
                                </div>
                                <div className={`w-full max-w-xl p-5 bg-white dark:bg-slate-950 ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a] space-y-4`}>
                                  <div className="flex items-center justify-between gap-4 font-black uppercase">
                                    <div className="flex items-center gap-3 text-xl">
                                      <Loader2 className="animate-spin" />
                                      {imageEditStage === "editing" ? "图像正在编辑" : "图像编辑处理中"}
                                    </div>
                                    <div>{imageEditProgressPercent}%</div>
                                  </div>
                                  <div className="h-4 bg-slate-200 dark:bg-slate-800 border-2 border-slate-900 dark:border-white overflow-hidden">
                                    <motion.div
                                      className="h-full bg-rose-500"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${imageEditProgressPercent}%` }}
                                      transition={{ type: "spring", stiffness: 90, damping: 18 }}
                                    />
                                  </div>
                                  <div className="text-sm font-bold break-words">
                                    {imageEditProgressCopy}
                                  </div>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div key="edit-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 opacity-50">
                                <div className={`w-32 h-32 bg-rose-200 dark:bg-rose-800 rounded-none flex items-center justify-center ${brutalBorder} ${brutalShadow}`}>
                                  <Pencil className="h-16 w-16 text-slate-900 dark:text-white" />
                                </div>
                                <div className="font-black uppercase text-2xl tracking-widest">{PANEL_EMPTY_COPY.waiting_input_title}</div>
                                <p className="font-bold text-sm">{PANEL_EMPTY_COPY.waiting_input_desc}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
