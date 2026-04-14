/**
 * page.tsx
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: Agent 对话主页面
 */

"use client";

import { useEffect } from "react";
import { useAgentStore } from "@/stores/agent.store";
import { ChatPanel } from "@/components/agent/chat-panel";
import { QuotaBar } from "@/components/agent/quota-bar";

export default function AgentPage() {
  const { startSession, loadQuotas, sessionId } = useAgentStore();

  useEffect(() => {
    if (!sessionId) {
      startSession();
    }
    loadQuotas();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white">TRAI Agent</h1>
            <p className="text-xs text-muted-foreground">AI 助手，支持工具调用</p>
          </div>
        </div>
        <QuotaBar />
      </header>

      <main className="flex-1 overflow-hidden">
        <ChatPanel />
      </main>
    </div>
  );
}
