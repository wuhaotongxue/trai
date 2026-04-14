/**
 * quota_bar.tsx
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: 配额状态栏
 */

"use client";

import { useEffect } from "react";
import { useAgentStore } from "@/stores/agent.store";
import { Zap } from "lucide-react";

export function QuotaBar() {
  const { quotas, loadQuotas } = useAgentStore();

  useEffect(() => {
    loadQuotas();
    const interval = setInterval(loadQuotas, 60000);
    return () => clearInterval(interval);
  }, [loadQuotas]);

  const toolQuota = quotas.find((q) => q.quota_type === "agent_tool_call");
  if (!toolQuota)
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-yellow-500" />
        <span>加载中...</span>
      </div>
    );

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
      <Zap className="h-3.5 w-3.5 text-yellow-500" />
      <span className="text-muted-foreground font-medium">Agent</span>
      {toolQuota.unlimited ? (
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
          无限
        </span>
      ) : (
        <>
          <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
              style={{
                width: `${Math.min(100, (toolQuota.used / toolQuota.limit) * 100)}%`,
              }}
            />
          </div>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {toolQuota.used}
          </span>
          <span className="text-muted-foreground">/ {toolQuota.limit}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 text-muted-foreground text-[10px]">
            {toolQuota.billing_month}
          </span>
        </>
      )}
    </div>
  );
}
