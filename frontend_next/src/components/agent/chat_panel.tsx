/**
 * chat_panel.tsx
 * 作者: wuhao
 * 日期: 2026-04-23
 * 描述: Agent 对话主面板 - 现代化三栏式布局，集成创作、工具与 AI 前沿功能
 */

"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useAgentStore } from "@/stores/agent.store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";
import { 
  Bot, Image as ImageIcon, Send, Square, Trash2, X, Copy, Check, 
  ArrowUp, Sparkles, Video, Music, ExternalLink, Plus, MessageSquare, 
  ChevronRight, ChevronLeft, PanelLeft, PanelRight, Pencil, Upload, 
  ArrowDownToLine, Loader2, Captions, UserRound, FileText, Clock, 
  Download, Search, LayoutGrid, Type, Globe, ChevronDown 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { type Message as AgentMessage } from "@/stores/agent.store";
import { type UploadedFileInfo } from "./multimodal_upload";
import { AgentTypeSelector } from "./agent_type_selector";
import type { AgentTypeValue } from "@/lib/api_client";
import { multimodalApi } from "@/lib/api_client";
import { SubtitlePanel } from "./subtitle_panel";
import { DigitalHumanPanel } from "./digital_human_panel";
import { VideoDownloaderPanel } from "./video_downloader_panel";
import { cn } from "@/lib/utils";

type TabId = "chat" | "image" | "video" | "music" | "audio" | "image_edit" | "subtitle" | "digital_human" | "downloader";

export function ChatPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [showHistory, setShowHistory] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedAgentType, setSelectedAgentType] = useState<AgentTypeValue>("chat");
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});

  const {
    messages, isStreaming, sendMessage, loadSessions,
    sessions, sessionId: currentSessionId, startSession, switchSession, deleteSession,
    isGeneratingImage, generateImage, generatedImageUrl, clearGeneratedImage,
    isGeneratingVideo, generateVideo, generatedVideoUrl, clearGeneratedVideo,
    isGeneratingMusic, generateMusic, generatedMusicUrl, clearGeneratedMusic,
    isEditingImage, editImage, editedImageUrl, cancelEditImage,
  } = useAgentStore();

  const [imagePrompt, setImagePrompt] = useState('一只可爱的猫在花园里玩耍');
  const [videoPrompt, setVideoPrompt] = useState('波涛汹涌的大海');
  const [musicPrompt, setMusicPrompt] = useState('轻快的爵士乐');
  const [editPrompt, setEditPrompt] = useState('将背景替换为城市夜景');
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<React.ElementRef<typeof ScrollArea>>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSessions(); }, []);

  useLayoutEffect(() => {
    if (messages?.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length, isStreaming]);

  const toggleThinking = (msgId: string) => {
    setExpandedThinking(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async () => {
    if (!input.trim() && images.length === 0) return;
    if (isStreaming) return;
    const content = input.trim();
    setInput("");
    setImages([]);
    await sendMessage(content, images);
  };

  const renderCodeBlock = (className: string, children: React.ReactNode) => {
    const language = /language-(\w+)/.exec(className || "")?.[1] || "text";
    return (
      <div className="relative group/code rounded-xl overflow-hidden my-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs">
          <span>{language}</span>
          <button onClick={() => navigator.clipboard.writeText(String(children))} className="hover:text-blue-500 transition-colors">
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <SyntaxHighlighter style={vscDarkPlus as any} language={language} className="!m-0 text-sm !bg-slate-950">
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div className="flex h-full relative bg-white dark:bg-[#0d1220]">
      {/* 历史对话侧边栏 */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm">历史对话</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startSession()}><Plus className="h-4 w-4" /></Button>
            </div>
            <ScrollArea className="flex-1 p-2">
              {sessions.map(s => (
                <div 
                  key={s.session_id}
                  onClick={() => switchSession(s.session_id)}
                  className={cn(
                    "p-3 rounded-xl mb-1 cursor-pointer transition-all text-sm truncate",
                    currentSessionId === s.session_id ? "bg-blue-500/10 text-blue-600 font-medium" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500"
                  )}
                >
                  {s.title || "新对话"}
                </div>
              ))}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主工作区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航 */}
        <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800 backdrop-blur-md sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className="rounded-xl">
            {showHistory ? <PanelLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <ScrollArea className="flex-1" orientation="horizontal">
            <div className="flex items-center gap-2">
              {[
                { id: "chat", label: "对话", icon: Bot, color: "text-blue-500" },
                { id: "image", label: "绘图", icon: ImageIcon, color: "text-emerald-500" },
                { id: "video", label: "视频", icon: Video, color: "text-orange-500" },
                { id: "music", label: "音乐", icon: Music, color: "text-indigo-500" },
                { id: "image_edit", label: "编辑", icon: Pencil, color: "text-purple-500" },
                { id: "subtitle", label: "字幕", icon: Captions, color: "text-pink-500" },
                { id: "downloader", label: "下载", icon: Download, color: "text-sky-500" },
                { id: "digital_human", label: "数字人", icon: UserRound, color: "text-teal-500" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0",
                    activeTab === tab.id ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  )}
                >
                  <tab.icon className={cn("h-4 w-4", tab.color)} />
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {activeTab === "chat" ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <AgentTypeSelector value={selectedAgentType} onChange={setSelectedAgentType} compact />
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="max-w-4xl mx-auto p-6 space-y-8">
                      {messages.map(msg => (
                        <div key={msg.id} className={cn("flex gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", msg.role === "user" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-500")}>
                            {msg.role === "user" ? <UserRound className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                          </div>
                          <div className={cn("flex flex-col gap-2 max-w-[80%]", msg.role === "user" ? "items-end" : "items-start")}>
                            <div className={cn("px-4 py-3 rounded-2xl text-[15px] shadow-sm", msg.role === "user" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800")}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: ({ className, children }) => renderCodeBlock(className || "", children) }}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                            {msg.thinking && (
                              <div className="w-full">
                                <button onClick={() => toggleThinking(msg.id)} className="flex items-center gap-1.5 text-xs text-slate-400">
                                  <Sparkles className="h-3 w-3" /> 思考过程 {expandedThinking[msg.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </button>
                                {expandedThinking[msg.id] && <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs text-slate-500 italic border border-slate-100 dark:border-slate-800">{msg.thinking}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} className="h-10" />
                    </div>
                  </ScrollArea>
                  {/* 输入框 */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <textarea 
                        value={input} 
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="想聊点什么呢..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2 resize-none max-h-32"
                      />
                      <Button onClick={handleSend} disabled={isStreaming || !input.trim()} size="icon" className="rounded-xl h-10 w-10 bg-blue-600 hover:bg-blue-700">
                        {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : activeTab === "subtitle" ? (
                <SubtitlePanel />
              ) : activeTab === "digital_human" ? (
                <DigitalHumanPanel />
              ) : activeTab === "downloader" ? (
                <VideoDownloaderPanel />
              ) : (
                <ScrollArea className="flex-1 p-8">
                  <div className="max-w-5xl mx-auto">
                    {activeTab === "image" && (
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h2 className="text-2xl font-bold">AI 创意绘图</h2>
                          <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} className="w-full h-32 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-emerald-500/20" />
                          <Button onClick={() => generateImage(imagePrompt)} disabled={isGeneratingImage} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                            {isGeneratingImage ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />} 开始生成
                          </Button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-4 flex items-center justify-center min-h-[400px] border border-dashed border-slate-200 dark:border-slate-800">
                          {generatedImageUrl ? <img src={generatedImageUrl} className="rounded-2xl shadow-2xl max-w-full h-auto" /> : <ImageIcon className="h-12 w-12 text-slate-200" />}
                        </div>
                      </div>
                    )}
                    {/* 其他标签页同理优化... */}
                    {activeTab === "video" && (
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h2 className="text-2xl font-bold">AI 视频合成</h2>
                          <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} className="w-full h-32 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-orange-500/20" />
                          <Button onClick={() => generateVideo(videoPrompt)} disabled={isGeneratingVideo} className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
                            {isGeneratingVideo ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Video className="h-5 w-5 mr-2" />} 开始合成
                          </Button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-4 flex items-center justify-center min-h-[400px] border border-dashed border-slate-200 dark:border-slate-800">
                          {generatedVideoUrl ? <video src={generatedVideoUrl} controls className="rounded-2xl shadow-2xl max-w-full" /> : <Video className="h-12 w-12 text-slate-200" />}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
