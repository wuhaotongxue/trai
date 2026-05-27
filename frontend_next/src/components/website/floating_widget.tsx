/**
 * 文件名: floating_widget.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 09:42:00
 * 描述: 官网悬浮组件, 包含返回顶部、到达底部以及前往 AI Agent 的快捷入口
 */

"use client";

import { useState } from "react";
import { Bot, X, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAgentStore } from "@/stores/agent.store";

export function FloatingWidget() {
  const { isFloatingChatOpen: isChatOpen, setFloatingChatOpen: setIsChatOpen } = useAgentStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const isWebsitePage =
    !pathname.startsWith("/agent") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/register") &&
    !pathname.startsWith("/forgot_password") &&
    !pathname.startsWith("/docs") &&
    !pathname.startsWith("/todo");

  if (!isWebsitePage) return null;

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "fixed z-50 h-10 w-10 rounded-none shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] transition-all hover:scale-110 active:scale-95 group relative",
          isChatOpen 
            ? "bg-blue-600 text-white hover:bg-blue-700" 
            : "bg-white/90 dark:bg-[#0d1220]/90 text-blue-600 hover:text-blue-700 dark:hover:bg-white/10",
          pathname.startsWith("/admin") ? "bottom-24 right-6" : "bottom-12 right-6"
        )}
        onClick={() => setIsChatOpen(!isChatOpen)}
        title={isChatOpen ? "关闭助手" : "打开 AI 助手"}
      >
        <div className="relative">
          <Bot className="h-4 w-4 relative z-10" />
          {!isChatOpen && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-none bg-blue-500 animate-pulse" />
          )}
        </div>
      </Button>

      {isChatOpen && (
        <div className={`fixed z-50 bg-background border border-border shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-300 transition-all ${
          isExpanded 
            ? "inset-4 md:inset-10 lg:inset-20 rounded-none" 
            : "bottom-12 right-6 w-[400px] h-[600px] rounded-none slide-in-from-bottom-10"
        }`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-none bg-slate-100 flex items-center justify-center shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-none">TRAI Agent</h3>
                <p className="text-[10px] text-muted-foreground mt-1">AI 助手, 支持工具调用</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-blue-600 rounded-none"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "还原" : "放大"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-blue-600 rounded-none"
                onClick={() => {
                  setIsChatOpen(false);
                  window.open("/agent", "_blank", "noopener,noreferrer");
                }}
                title="在新页面中打开"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-none"
                onClick={() => setIsChatOpen(false)}
                title="关闭"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <iframe 
              src="/agent?mode=widget" 
              className="w-full h-full border-0"
              title="TRAI AI Assistant"
            />
          </div>
        </div>
      )}
    </>
  );
}

