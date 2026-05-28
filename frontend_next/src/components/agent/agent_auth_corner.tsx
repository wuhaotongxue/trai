/**
 * 文件名: agent_auth_corner.tsx
 * 作者: wuhao
 * 日期: 2026-05-28 13:59:23
 * 描述: Agent 页面左下角认证入口组件
 */

"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgentAuthCornerProps {
  className?: string;
}

/**
 * Agent 页面左下角认证入口.
 *
 * @param props 组件样式扩展参数.
 * @returns 左下角登录和注册入口.
 */
export function AgentAuthCorner({ className }: AgentAuthCornerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-950 px-4 py-3 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]",
        className
      )}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
        账号密码
      </span>
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button
            type="button"
            variant="ghost"
            className="h-8 rounded-none border-2 border-transparent px-3 text-xs font-black uppercase tracking-widest text-slate-900 hover:border-slate-900 hover:bg-slate-100 dark:text-white dark:hover:border-white dark:hover:bg-slate-800"
          >
            登录
          </Button>
        </Link>
        <Link href="/register">
          <Button
            type="button"
            className="h-8 rounded-none border-2 border-slate-900 bg-cyan-500 px-3 text-xs font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-cyan-400 hover:shadow-[1px_1px_0px_0px_#0f172a] dark:border-white dark:shadow-[2px_2px_0px_0px_#ffffff]"
          >
            注册
          </Button>
        </Link>
      </div>
    </div>
  );
}
