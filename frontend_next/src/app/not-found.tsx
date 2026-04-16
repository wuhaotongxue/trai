/**
 * not-found.tsx
 * 404 找不到页面
 * 所有未匹配的路由都会显示此页面
 */

"use client";

import Link from "next/link";
import { Bot, ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg">
        {/* 大字 404 */}
        <div className="mb-6">
          <div className="relative inline-block">
            <span className="text-[140px] font-black text-slate-100 leading-none select-none">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
                <Bot className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* 提示文字 */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">页面不存在</h1>
        <p className="text-slate-500 leading-relaxed mb-8">
          抱歉, 你访问的页面已搬离或不存在了。<br />
          可能的原因: 链接错误、页面已删除或地址输入有误。
        </p>

        {/* 建议操作 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-8 text-left">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">你可以尝试</p>
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Home className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">返回首页</p>
                <p className="text-xs text-slate-400">回到 TRAI 官网首页</p>
              </div>
            </Link>
            <Link href="/features" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Search className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">浏览功能</p>
                <p className="text-xs text-slate-400">了解 TRAI 的核心功能</p>
              </div>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <ArrowLeft className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">返回上一页</p>
                <p className="text-xs text-slate-400">回到上一个页面</p>
              </div>
            </button>
          </div>
        </div>

        {/* 底部链接 */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 flex-wrap">
          <Link href="/features" className="hover:text-blue-500 transition-colors">功能介绍</Link>
          <span>·</span>
          <Link href="/pricing" className="hover:text-blue-500 transition-colors">定价方案</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-blue-500 transition-colors">联系我们</Link>
          <span>·</span>
          <Link href="/admin" className="hover:text-blue-500 transition-colors">管理后台</Link>
        </div>

        {/* 错误代码 */}
        <p className="text-xs text-slate-300 mt-4 font-mono">
          Error 404 · Page Not Found · <span suppressHydrationWarning>{new Date().toLocaleDateString("zh-CN")}</span>
        </p>
      </div>
    </div>
  );
}
