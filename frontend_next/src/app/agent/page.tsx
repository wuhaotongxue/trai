/**
 * page.tsx
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: Agent 对话主页面
 */

"use client";

import { useEffect, useState } from "react";
import { Bot, User as UserIcon } from "lucide-react";
import { useAgentStore } from "@/stores/agent.store";
import { ChatPanel } from "@/components/agent/chat_panel";
import { QuotaBar } from "@/components/agent/quota_bar";
import { authApi, type UserInfo } from "@/lib/api_client";
import Cookies from "js-cookie";

export default function AgentPage() {
  const { startSession, loadQuotas, sessionId, quotas } = useAgentStore();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (!sessionId) {
      startSession();
    }
    loadQuotas();
    
    // 获取用户信息
    const token = Cookies.get("token");
    if (token) {
      authApi.me().then(res => {
        if (res && res.user) setUser(res.user);
      }).catch(() => setUser(null));
    }
  }, [loadQuotas, sessionId, startSession]);

  // 找到 Agent 调用配额，显示剩余次数
  const agentQuota = quotas.find(q => q.quota_type === "agent_tool_call");
  const isUnlimited = agentQuota?.unlimited || false;
  const remaining = agentQuota ? Math.max(0, agentQuota.limit - agentQuota.used) : 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white">TRAI Agent</h1>
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center gap-1">
                <UserIcon className="w-3 h-3" />
                {user ? (
                  user.wecom_user_id ? (
                    <>
                      {user.display_name || user.username} ({user.wecom_user_id})
                    </>
                  ) : (
                    user.display_name || user.username
                  )
                ) : "当前: 游客"}
              </span>
              {user?.last_login_ip && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span className="flex items-center gap-1">
                    IP: {user.last_login_ip}
                    {user.last_login_location && ` (${user.last_login_location})`}
                  </span>
                </>
              )}
              {!user && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span className="flex items-center gap-1">
                    IP: 访客地址已记录
                  </span>
                </>
              )}
              <span className="hidden sm:inline">·</span>
              <span className="font-medium text-blue-500/80">
                {isUnlimited ? "无限次数" : `剩余: ${remaining} 次`}
              </span>
            </p>
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
