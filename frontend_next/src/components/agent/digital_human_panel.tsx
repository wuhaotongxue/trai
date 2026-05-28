"use client";

/**
 * 文件名: digital_human_panel.tsx
 * 作者: wuhao
 * 日期: 2026-05-28 15:05:09
 * 描述: 数字人实时对话面板, 统一使用 Agent 主工作区的边框和状态动画风格
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { request } from "@/lib/api_client";
import { PANEL_EMPTY_COPY, PANEL_SUBTITLES } from "./panel_consistency";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  videoUrl?: string;
}

/**
 * 数字人对话面板组件.
 *
 * @returns 与 Agent 主工作区一致视觉语言的数字人互动面板.
 */
export function DigitalHumanPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const brutalBorder = "border-2 border-slate-900 dark:border-white";
  const brutalShadow = "shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff]";
  const brutalShadowSm = "shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]";
  const brutalBtnBase = `font-black uppercase tracking-wider transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${brutalBorder} ${brutalShadowSm}`;

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    setInput("");
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const res = await request<{ reply: string, video_url: string }>("/ai/digital_human/chat", {
        method: "POST",
        body: JSON.stringify({ text: userText })
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.reply,
        videoUrl: res.video_url,
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (res.video_url) {
        setCurrentVideo(res.video_url);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "抱歉，数字人生成出现错误。",
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`flex w-full h-[700px] ${brutalBorder} border-[3px] ${brutalShadow} bg-white dark:bg-slate-900 overflow-hidden`}>
      {/* 左侧: 数字人视频展示区 */}
      <div className="flex-1 border-r-[3px] border-slate-900 dark:border-white flex flex-col bg-slate-100 dark:bg-slate-950 relative">
        <div className="p-4 bg-cyan-200 dark:bg-slate-200 text-slate-900 border-b-[3px] border-slate-900 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em]">Digital Human Stage</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mt-1 opacity-70">{PANEL_SUBTITLES.result_stage}</p>
          </div>
          <div className={`px-3 py-2 bg-white ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] text-xs font-black uppercase tracking-widest`}>
            视频舞台
          </div>
        </div>
        <div className="flex-1 relative">
        {currentVideo ? (
          <video 
            src={currentVideo} 
            autoPlay 
            className="w-full h-full object-cover"
            onEnded={() => {
              // 视频播放结束可以做一些动作
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-900 dark:text-white">
            <div className={`w-32 h-32 bg-cyan-200 dark:bg-cyan-900 ${brutalBorder} ${brutalShadowSm} flex items-center justify-center mb-6`}>
              <Bot className="w-16 h-16 text-slate-900" />
            </div>
            <p className="font-black uppercase tracking-widest text-2xl">{PANEL_EMPTY_COPY.waiting_input_title}</p>
            <p className="font-bold text-sm mt-2">{PANEL_EMPTY_COPY.waiting_input_desc}</p>
          </div>
        )}
        
        {isProcessing && (
          <div className={`absolute bottom-6 left-6 right-6 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadowSm} text-slate-900 dark:text-white p-4 space-y-3`}>
            <div className="flex items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin font-black" />
              <span className="text-lg font-black uppercase tracking-widest">数字人正在回应...</span>
            </div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 border-2 border-slate-900 dark:border-white overflow-hidden">
              <div className="h-full w-1/3 bg-cyan-500 animate-pulse" />
            </div>
          </div>
        )}
        </div>
      </div>

      {/* 右侧: 聊天记录区 */}
      <div className="w-[480px] flex flex-col bg-white dark:bg-slate-900">
        <div className="p-5 border-b-[3px] border-slate-900 dark:border-white font-black uppercase tracking-widest text-xl flex items-center justify-between gap-3 bg-cyan-200 dark:bg-slate-200 text-slate-900">
          <div className="flex items-center gap-3">
          <Bot className="w-6 h-6" />
          数字人对话
          </div>
          <span className={`px-3 py-2 bg-white ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] text-xs`}>
            {PANEL_SUBTITLES.chat_rail}
          </span>
        </div>
        
        <ScrollArea className="flex-1 p-5" ref={scrollRef}>
          <div className="space-y-5">
            {messages.length === 0 && (
              <div className="text-center mt-12 opacity-50 text-slate-900 dark:text-white">
                <div className={`w-24 h-24 bg-cyan-100 dark:bg-cyan-900 rounded-none flex items-center justify-center ${brutalBorder} ${brutalShadowSm} mx-auto mb-4`}>
                  <Bot className="w-10 h-10" />
                </div>
                <div className="font-black uppercase text-xl tracking-widest">{PANEL_EMPTY_COPY.waiting_history_title}</div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] mt-2">{PANEL_EMPTY_COPY.waiting_history_desc}</div>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-12 h-12 ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-100 text-slate-900" : "bg-cyan-100 text-slate-900"}`}>
                  {msg.role === "user" ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                <div className={`max-w-[75%] p-4 ${brutalBorder} ${brutalShadowSm} font-bold text-base leading-relaxed ${msg.role === "user" ? "bg-slate-100 text-slate-900" : "bg-cyan-200 text-slate-900"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-6 border-t-[3px] border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <Input 
              aria-label="数字人对话输入框"
              title="数字人对话输入框"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入对话内容..."
              className={`flex-1 h-14 rounded-none bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-white ${brutalShadowSm} text-lg font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyan-500`}
              disabled={isProcessing}
            />
            <Button 
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              aria-label="发送数字人消息"
              title="发送数字人消息"
              className={`h-14 w-14 rounded-none bg-cyan-500 hover:bg-cyan-400 text-slate-900 dark:text-white ${brutalBtnBase} shrink-0`}
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
