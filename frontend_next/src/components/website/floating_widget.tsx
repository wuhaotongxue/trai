/**
 * 文件名: floating_widget.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 09:42:00
 * 描述: 官网悬浮组件, 包含返回顶部、到达底部以及前往 AI Agent 的快捷入口
 */

"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, BotMessageSquare, X, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { ChatPanel } from "@/components/agent/chat_panel";

export function FloatingWidget() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const isWebsitePage =
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/agent") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/register") &&
    !pathname.startsWith("/forgot-password") &&
    !pathname.startsWith("/docs") &&
    !pathname.startsWith("/todo");

  useEffect(() => {
    if (!isWebsitePage) return;

    const handleScroll = () => {
      setShowTop(window.scrollY > 300);

      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
      setShowBottom(!scrolledToBottom);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isWebsitePage, pathname]);

  if (!isWebsitePage) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        {showTop && (
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-lg border-slate-200 bg-white/90 dark:bg-[#0d1220]/90 glass text-slate-600 hover:text-blue-600 transition-all hover:-translate-y-1"
            onClick={scrollToTop}
            title="返回顶部"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}

        {showBottom && (
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-lg border-slate-200 bg-white/90 dark:bg-[#0d1220]/90 glass text-slate-600 hover:text-blue-600 transition-all hover:translate-y-1"
            onClick={scrollToBottom}
            title="直达底部"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        )}

        {!isChatOpen && (
          <Button
            size="icon"
            onClick={() => setIsChatOpen(true)}
            className="h-14 w-14 rounded-full shadow-xl shadow-blue-500/20 bg-gradient-to-br from-blue-600 to-indigo-600 hover:scale-105 transition-all text-white group"
            title="AI 助手对话"
          >
            <BotMessageSquare className="h-6 w-6 group-hover:animate-pulse" />
          </Button>
        )}
      </div>

      {isChatOpen && (
        <div className={`fixed z-50 bg-background border border-border shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-300 transition-all ${
          isExpanded 
            ? "inset-4 md:inset-10 lg:inset-20 rounded-xl" 
            : "bottom-24 right-8 w-[400px] h-[600px] rounded-2xl slide-in-from-bottom-10"
        }`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <BotMessageSquare className="h-4 w-4 text-white" />
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
                className="h-8 w-8 text-muted-foreground hover:text-blue-600 rounded-full"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "还原" : "放大"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-blue-600 rounded-full"
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
                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                onClick={() => setIsChatOpen(false)}
                title="关闭"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <ChatPanel />
          </div>
        </div>
      )}
    </>
  );
}

