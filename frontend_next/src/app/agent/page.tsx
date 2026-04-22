/**
 * page.tsx
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: Agent 对话主页面
 */

"use client";

import { ChatPanel } from "@/components/agent/chat_panel";
import { Sidebar } from "@/components/agent/sidebar";
import { Navbar } from "@/components/website/navbar";
import { useAgentStore } from "@/stores/agent.store";
import { useEffect } from "react";

/**
 * Agent 对话主页面组件
 * 
 * 提供 Agent 对话界面，包含侧边栏和聊天面板
 */
export default function AgentPage() {
  const { sessionId, startSession } = useAgentStore();

  /**
   * 初始化会话
   * 
   * 如果没有活跃会话，自动创建一个新会话
   */
  useEffect(() => {
    // 如果没有活跃会话, 自动创建一个
    if (!sessionId) {
      startSession();
    }
  }, [sessionId, startSession]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar />
        <main className="flex-1 relative flex flex-col min-w-0 bg-white dark:bg-[#0b0f1a]">
          <div className="flex-1 overflow-hidden">
            <ChatPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
