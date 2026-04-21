/**
 * 文件名: floating_widget.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 09:42:00
 * 描述: 官网悬浮组件, 包含返回顶部、到达底部以及前往 AI Agent 的快捷入口
 */

"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, BotMessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function FloatingWidget() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);
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

        <Link href="/agent" target="_blank" rel="noopener noreferrer">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl shadow-blue-500/20 bg-gradient-to-br from-blue-600 to-indigo-600 hover:scale-105 transition-all text-white group"
            title="AI 助手对话 (新窗口打开)"
          >
            <BotMessageSquare className="h-6 w-6 group-hover:animate-pulse" />
          </Button>
        </Link>
      </div>
    </>
  );
}

