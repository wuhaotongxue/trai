/**
 * page.tsx
 * 作者: wuhao
 * 日期: 2026-04-23
 * 描述: 管理后台 AI 助手独立页面
 */

"use client";

import { ChatPanel } from "@/components/agent/chat_panel";
import { useAgentStore } from "@/stores/agent.store";
import { useEffect, useState } from "react";

export default function AIAssistantPage() {
  const { sessionId, startSession, totalTokens, isStreaming } = useAgentStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!sessionId) {
      startSession();
    }
  }, [sessionId, startSession]);

  if (!mounted) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] bg-background rounded-xl border border-border overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">正在初始化...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-background rounded-xl border border-border overflow-hidden shadow-sm">
      {/* 顶部状态栏 */}
      <div className="px-5 py-3 border-b border-border bg-gradient-to-r from-muted/40 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isStreaming ? "bg-blue-500 animate-pulse" : "bg-emerald-500"}`} />
            <span className="text-xs font-medium text-muted-foreground">
              {isStreaming ? "AI 正在思考中..." : "AI 助手已就绪"}
            </span>
          </div>
        </div>
        {totalTokens > 0 && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{totalTokens}</span> Tokens
            </span>
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
}
