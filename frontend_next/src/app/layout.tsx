/**
 * layout.tsx
 * 根布局
 * - 全局样式 + shadcn
 * - 无障碍: lang=zh-CN, aria-live 动态播报
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FloatingWidget } from "@/components/website/floating_widget";
import "tw-animate-css/animate.css";
import "katex/dist/katex.min.css"; // 引入 katex 样式以支持公式渲染
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TRAI - AI 智能助手平台",
    template: "%s | TRAI",
  },
  description:
    "TRAI 是一个强大的 AI 智能助手平台, 支持多工具调用、Agent 自动化、VLM 视觉理解与流式交互",
  keywords: ["AI", "Agent", "智能助手", "工具调用", "大模型", "GPT"],
  icons: {
    icon: "/kity.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        {children}

        {/* aria-live 动态播报区域 (A11y 规范)
            当 SPA 异步数据刷新、表单提交成功或系统级错误时,
            此区域内容会被屏幕阅读器实时朗读
            中文播报示例: "数据同步已完成, 共拉取 45 条新记录" */}
        <div
          aria-live="polite"
          aria-atomic="true"
          role="status"
          className="sr-only"
          id="aria-live-region"
        />

        {/* 官网全局悬浮组件 */}
        <FloatingWidget />
      </body>
    </html>
  );
}
