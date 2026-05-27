"use client";

/**
 * 文件名: digital_human_panel.tsx
 * 作者: wuhao
 * 日期: 2026-05-23
 * 描述: 数字人实时对话面板
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
      // 直接调用 Agent 的 tool endpoint 进行测试, 或者调用专门的 API
      // 这里为了简单, 我们调用一个封装好的 API, 但后端没有专门的 API,
      // 后端有 DigitalHumanChatTool, 我们可以通过执行工具的接口或者 Agent chat 来调用.
      // 因为这是"实时对话", 我们可以向大模型发送请求, 然后把大模型的回复转给数字人TTS,
      // 或者我们可以直接调用一个伪造的 API, 等一下后端我们可以补充这个 API.
      
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
        content: "抱歉, 数字人生成出现错误.",
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-xl shadow-slate-200/40 dark:shadow-none min-h-[560px]">
      {/* 左侧: 数字人视频展示区 */}
      <div className="flex-1 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-black relative">
        {currentVideo ? (
          <video 
            src={currentVideo} 
            autoPlay 
            className="w-full h-full object-contain"
            onEnded={() => {
              // 视频播放结束可以做一些动作
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Bot className="w-24 h-24 mb-4 opacity-20" />
            <p>等待数字人接入...</p>
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur text-white p-3 rounded-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">数字人正在思考并生成回复...</span>
          </div>
        )}
      </div>

      {/* 右侧: 聊天记录区 */}
      <div className="w-[420px] flex flex-col bg-white/70 dark:bg-slate-950/30">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5 text-teal-500" />
          数字人对话
        </div>
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-slate-400 mt-10">
                发个消息开始与数字人聊天吧
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500"}`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
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
              className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              disabled={isProcessing}
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              size="icon"
              className="rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
