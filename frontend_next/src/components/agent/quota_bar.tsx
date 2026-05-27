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
      <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-900 dark:text-white bg-slate-50 px-3 py-1 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
        <Zap className="h-4 w-4 text-slate-900" />
        <span>加载中...</span>
      </div>
    );

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] text-xs font-black uppercase tracking-widest">
      <Zap className="h-4 w-4 text-cyan-500 fill-cyan-500" />
      <span className="text-slate-900 dark:text-white">AGENT</span>
      {toolQuota.unlimited ? (
        <span className="px-2 py-0.5 bg-slate-100 text-slate-900 border-2 border-slate-900 text-[10px]">
          无限
        </span>
      ) : (
        <>
          <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 border-2 border-slate-900 dark:border-white overflow-hidden shadow-inner">
            <div
              className="h-full bg-slate-100 border-r-2 border-slate-900 dark:border-white transition-all"
              style={{
                width: `${Math.min(100, (toolQuota.used / toolQuota.limit) * 100)}%`,
              }}
            />
          </div>
          <span className="text-slate-900 dark:text-white">
            {toolQuota.used}
          </span>
          <span className="text-slate-500 dark:text-slate-400">/ {toolQuota.limit}</span>
          <span className="px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] border-2 border-slate-900 dark:border-white">
            {toolQuota.billing_month}
          </span>
        </>
      )}
    </div>
  );
}
