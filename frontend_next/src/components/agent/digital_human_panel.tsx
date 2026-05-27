"use client";

/**
 * 文件名: digital_human_panel.tsx
 * 作者: wuhao
 * 日期: 2026-05-23
 * 描述: 数字人实时对话面板
 * - Neo-Brutalism 风格
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { request } from "@/lib/api_client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  videoUrl?: string;
}

export function DigitalHumanPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="flex w-full h-[700px] border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] bg-white dark:bg-slate-900">
      {/* 左侧: 数字人视频展示区 */}
      <div className="flex-1 border-r-4 border-slate-900 dark:border-white flex flex-col bg-slate-100 dark:bg-slate-800 relative">
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
            <div className="w-32 h-32 bg-amber-400 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex items-center justify-center mb-6 transform -rotate-3">
              <Bot className="w-16 h-16 text-slate-900" />
            </div>
            <p className="font-black uppercase tracking-widest text-2xl">等待数字人接入</p>
            <p className="font-bold text-sm mt-2">请在右侧发送消息</p>
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute bottom-6 left-6 right-6 bg-rose-400 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] text-slate-900 p-4 flex items-center gap-4 transform rotate-1">
            <Loader2 className="w-6 h-6 animate-spin font-black" />
            <span className="text-lg font-black uppercase tracking-widest">数字人正在思考...</span>
          </div>
        )}
      </div>

      {/* 右侧: 聊天记录区 */}
      <div className="w-[480px] flex flex-col bg-white dark:bg-slate-900">
        <div className="p-5 border-b-4 border-slate-900 dark:border-white font-black uppercase tracking-widest text-xl flex items-center gap-3 bg-emerald-400 text-slate-900">
          <Bot className="w-6 h-6" />
          数字人对话
        </div>
        
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="text-center mt-12 opacity-50 text-slate-900 dark:text-white">
                <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-none flex items-center justify-center border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] mx-auto mb-4">
                  <Bot className="w-10 h-10" />
                </div>
                <div className="font-black uppercase text-xl tracking-widest">暂无对话记录</div>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-12 h-12 border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-indigo-400 text-slate-900" : "bg-white text-slate-900"}`}>
                  {msg.role === "user" ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                <div className={`max-w-[75%] p-4 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] font-bold text-base leading-relaxed ${msg.role === "user" ? "bg-cyan-400 text-slate-900" : "bg-amber-200 text-slate-900"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-6 border-t-4 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <Input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入对话内容..."
              className="flex-1 h-14 rounded-none bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] text-lg font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-[4px_4px_0px_0px_#10b981]"
              disabled={isProcessing}
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="h-14 w-14 rounded-none bg-rose-500 hover:bg-rose-400 text-white border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all shrink-0"
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
