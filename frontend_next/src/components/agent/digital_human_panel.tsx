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
import { Send, Bot, User, Loader2, Mic, MicOff, Sparkles, Volume2 } from "lucide-react";
import { request } from "@/lib/api_client";
import { PANEL_EMPTY_COPY, PANEL_SUBTITLES } from "./panel_consistency";
import { globalToast } from "@/components/toast/toast";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  videoUrl?: string;
}

/**
 * 数字人 SVG 形象组件 - 妹子版
 * 采用纯 SVG 绘制, 100% 可见, 带有呼吸和眨眼动效
 */
function FemaleAvatarSVG({ isListening }: { isListening?: boolean }) {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full max-h-[500px]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFDBAC" />
          <stop offset="100%" stopColor="#F1C27D" />
        </linearGradient>
        <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4A2C2A" />
          <stop offset="100%" stopColor="#2A1817" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* 背景光晕 - 听录音时变色 */}
      <circle cx="200" cy="200" r="150" fill={isListening ? "#06b6d4" : "#F1C27D"} opacity="0.15">
        <animate attributeName="r" values="145;160;145" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.1;0.2;0.1" dur="3s" repeatCount="indefinite" />
      </circle>

      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 6; 0 0" dur="4s" repeatCount="indefinite" />
        
        {/* 身体/肩膀 */}
        <path d="M100 400 Q100 320 200 320 T300 400" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
        
        {/* 听力波纹 - 仅在录音时显示 */}
        {isListening && (
          <g filter="url(#glow)">
            <circle cx="200" cy="360" r="10" fill="none" stroke="#06b6d4" strokeWidth="2">
              <animate attributeName="r" values="10;80" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="360" r="10" fill="none" stroke="#06b6d4" strokeWidth="2">
              <animate attributeName="r" values="10;80" dur="1.5s" begin="0.75s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="1.5s" begin="0.75s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* 颈部 */}
        <rect x="180" y="290" width="40" height="40" fill="#F1C27D" stroke="#0F172A" strokeWidth="2" />

        {/* 头发 - 后层 */}
        <path d="M110 200 Q110 100 200 100 T290 200 L290 350 Q200 330 110 350 Z" fill="url(#hairGrad)" stroke="#0F172A" strokeWidth="2" />

        {/* 脸部 */}
        <path d="M130 200 Q130 300 200 300 T270 200 Q270 120 200 120 T130 200" fill="url(#skinGrad)" stroke="#0F172A" strokeWidth="4" />

        {/* 头发 - 前层/刘海 */}
        <path d="M130 180 Q160 130 200 140 T270 180 Q250 110 200 110 T130 180" fill="url(#hairGrad)" stroke="#0F172A" strokeWidth="2" />

        {/* 眼睛 */}
        <g>
          <circle cx="170" cy="210" r="6" fill="#0F172A">
            <animate attributeName="ry" values="6;0.5;6" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx="230" cy="210" r="6" fill="#0F172A">
            <animate attributeName="ry" values="6;0.5;6" dur="5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* 腮红 */}
        <circle cx="150" cy="240" r="10" fill="#FFB6C1" opacity="0.4" />
        <circle cx="250" cy="240" r="10" fill="#FFB6C1" opacity="0.4" />

        {/* 嘴巴 */}
        <path d="M185 260 Q200 275 215 260" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
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
  const [isRecording, setIsRecording] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const brutalBorder = "border-2 border-slate-900 dark:border-white";
  const brutalShadow = "shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff]";
  const brutalShadowSm = "shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]";
  const brutalBtnBase = `font-black uppercase tracking-wider transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${brutalBorder} ${brutalShadowSm}`;

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 自动聚焦输入框
  useEffect(() => {
    if (!isProcessing && !isRecording) {
      inputRef.current?.focus();
    }
  }, [isProcessing, isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;
        
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");

        try {
          setIsProcessing(true);
          const res = await request<{ code: number; data: { transcript: string } }>("/ai/audio/incremental_transcribe", {
            method: "POST",
            body: formData,
          });
          if (res.data.transcript) {
            setInput(res.data.transcript);
            globalToast({ message: "语音识别成功", variant: "success" });
          } else {
            globalToast({ message: "未能识别到声音,请大声一点", variant: "warning" });
          }
        } catch (error) {
          console.error("语音识别失败:", error);
          globalToast({ message: "语音服务暂时不可用", variant: "error" });
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("获取麦克风权限失败:", err);
      globalToast({ message: "请允许使用麦克风以开启语音对话", variant: "error" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

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
      const res = await request<{ code: number; msg: string; data: { reply: string, video_url: string } }>("/ai/digital_human/chat", {
        method: "POST",
        body: JSON.stringify({ text: userText })
      });

      if (res.code === 200 && res.data) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: res.data.reply || "（未生成回复文本）",
          videoUrl: res.data.video_url,
        };

        setMessages(prev => [...prev, assistantMsg]);
        if (res.data.video_url) {
          setCurrentVideo(res.data.video_url);
        }
      } else {
        throw new Error(res.msg || "生成失败");
      }
    } catch (e) {
      console.error(e);
      globalToast({ message: "回复生成失败,请稍后重试", variant: "error" });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "抱歉,数字人生成出现错误。",
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`flex w-full flex-1 min-h-0 ${brutalBorder} border-[3px] ${brutalShadowSm} bg-white dark:bg-slate-900 overflow-hidden`}>
      {/* 左侧: 数字人视频展示区 */}
      <div className="flex-1 border-r-[3px] border-slate-900 dark:border-white flex flex-col bg-slate-100 dark:bg-slate-950 relative min-h-0">
        <div className="p-3 bg-cyan-200 dark:bg-slate-200 text-slate-900 border-b-[3px] border-slate-900 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider">Digital Human Stage</h2>
          </div>
          <div className={`px-2 py-1 bg-white ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] text-[10px] font-black uppercase`}>
            视频舞台
          </div>
        </div>
        <div className="flex-1 relative bg-slate-900 overflow-hidden">
          {/* 背景层: 始终存在的 SVG 形象 (常驻) */}
          <div className={`absolute inset-0 flex items-center justify-center bg-slate-950 transition-opacity duration-500 ${isVideoPlaying ? 'opacity-0' : 'opacity-100'}`}>
            <FemaleAvatarSVG isListening={isRecording} />
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
            <div className="absolute bottom-6 left-0 right-0 text-center text-white">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 bg-cyan-400/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-cyan-400/50 mb-1`}>
                  {isRecording ? <Volume2 className="w-5 h-5 text-cyan-300 animate-pulse" /> : <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />}
                </div>
                <p className="font-black uppercase tracking-widest text-base drop-shadow-2xl">
                  {isRecording ? "正在倾听..." : "智能助手已就绪"}
                </p>
              </div>
            </div>
          </div>

          {/* 视频层: 仅在有视频时显示 */}
          {currentVideo && (
            <video 
              key={currentVideo}
              src={currentVideo} 
              autoPlay 
              playsInline
              className={`w-full h-full object-contain relative z-10 transition-opacity duration-500 ${isVideoPlaying ? 'opacity-100' : 'opacity-0'}`}
              onPlay={() => setIsVideoPlaying(true)}
              onEnded={() => {
                setCurrentVideo(null);
                setIsVideoPlaying(false);
              }}
              onError={() => {
                console.error("Video load failed, falling back to SVG");
                setCurrentVideo(null);
                setIsVideoPlaying(false);
                globalToast({ message: "视频加载失败，已切换回虚拟形象", variant: "warning" });
              }}
            />
          )}
        
          {(isProcessing || isRecording) && (
          <div className={`absolute bottom-4 left-4 right-4 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadowSm} text-slate-900 dark:text-white p-3 space-y-2 z-10`}>
            <div className="flex items-center gap-3">
              {isRecording ? <Mic className="w-5 h-5 animate-bounce text-red-500" /> : <Loader2 className="w-5 h-5 animate-spin font-black" />}
              <span className="text-sm font-black uppercase tracking-widest">
                {isRecording ? "正在倾听您的声音..." : "数字人正在回应..."}
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 border-2 border-slate-900 dark:border-white overflow-hidden">
              <div className={`h-full bg-cyan-500 ${isRecording ? 'w-full animate-[shimmer_2s_infinite]' : 'w-1/3 animate-pulse'}`} />
            </div>
          </div>
        )}
        </div>
      </div>

      {/* 右侧: 聊天记录区 */}
      <div className="w-[320px] flex flex-col bg-white dark:bg-slate-900 border-l-[3px] border-slate-900 dark:border-white min-h-0">
        <div className="p-3 border-b-[3px] border-slate-900 dark:border-white font-black uppercase tracking-wider text-base flex items-center justify-between gap-3 bg-cyan-200 dark:bg-slate-200 text-slate-900 shrink-0">
          <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          数字人对话
          </div>
          <span className={`px-1.5 py-0.5 bg-white ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] text-[8px]`}>
            LIVE CHAT
          </span>
        </div>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center mt-6 opacity-40 text-slate-900 dark:text-white">
                <div className={`w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-none flex items-center justify-center ${brutalBorder} ${brutalShadowSm} mx-auto mb-2`}>
                  <Bot className="w-6 h-6" />
                </div>
                <div className="font-black uppercase text-xs tracking-widest">等待对话</div>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-100 text-slate-900" : "bg-cyan-100 text-slate-900"}`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[85%] p-2 ${brutalBorder} ${brutalShadowSm} font-bold text-xs leading-snug ${
                  msg.role === "user" 
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100" 
                    : "bg-cyan-200 text-slate-900 dark:bg-cyan-900 dark:text-cyan-50"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} className="h-1" />
          </div>
        </ScrollArea>

        <div className="p-3 border-t-[3px] border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <Button 
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`h-10 w-10 rounded-none ${isRecording ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100'} ${brutalBtnBase} shrink-0 p-0`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input 
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isRecording ? "正在录音..." : "输入内容..."}
              className={`flex-1 h-10 rounded-none bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-white ${brutalShadowSm} text-xs font-bold text-slate-900 dark:text-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyan-500`}
              disabled={isProcessing || isRecording}
            />
            <Button 
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isProcessing || isRecording}
              className={`h-10 w-10 rounded-none bg-cyan-500 hover:bg-cyan-400 text-slate-900 dark:text-white ${brutalBtnBase} shrink-0 p-0`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
