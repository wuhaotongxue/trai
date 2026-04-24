/**
 * footer.tsx
 * TRAI 官网页脚
 * - 双语支持
 * - 品牌信息
 * - 链接分组
 * - 社交媒体
 * - 底部版权
 */

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, Globe2, MessageCircle, Users, ArrowUp } from "lucide-react";
import { useI18n } from "@/i18n/i18n_context";

const footerLinks = {
  zh: {
    产品: [
      { label: "功能介绍", href: "/features" },
      { label: "定价方案", href: "/pricing" },
      { label: "更新日志", href: "/changelog" },
      { label: "路线图", href: "/roadmap" },
    ],
    开发者: [
      { label: "快速开始", href: "/docs/quickstart" },
      { label: "API 参考", href: "/docs/api" },
      { label: "常见问题", href: "/docs/faq" },
      { label: "SDK 下载", href: "/docs/sdk" },
    ],
    公司: [
      { label: "关于我们", href: "/about" },
      { label: "加入我们", href: "/careers" },
      { label: "联系我们", href: "/contact" },
      { label: "隐私政策", href: "/privacy" },
    ],
    合作: [
      { label: "成为代理", href: "/partner" },
      { label: "OEM 合作", href: "/oem" },
      { label: "企业定制", href: "/enterprise" },
    ],
  },
  en: {
    Product: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap", href: "/roadmap" },
    ],
    Developers: [
      { label: "Quick Start", href: "/docs/quickstart" },
      { label: "API Reference", href: "/docs/api" },
      { label: "FAQ", href: "/docs/faq" },
      { label: "SDK", href: "/docs/sdk" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
    ],
    Partners: [
      { label: "Become a Partner", href: "/partner" },
      { label: "OEM Partnership", href: "/oem" },
      { label: "Enterprise", href: "/enterprise" },
    ],
  },
};

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-110 active:scale-95 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

export function Footer() {
  const { locale } = useI18n();
  const isEn = locale === "en";
  const links = isEn ? footerLinks.en : footerLinks.zh;

  return (
    <>
      <footer className="relative bg-slate-950 dark:bg-black border-t border-slate-800/50 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-40 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            {/* 品牌区域 */}
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">TRAI</span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
                {isEn
                  ? "Next-generation AI Agent platform for secure, reliable, and scalable enterprise solutions."
                  : "新一代 AI Agent 平台，为企业提供安全、可靠、可扩展的智能助手解决方案。"}
              </p>

              {/* 社交媒体 */}
              <div className="flex items-center gap-2.5">
                {[
                  { Icon: Globe2, href: "#", label: "Community" },
                  { Icon: MessageCircle, href: "#", label: "WeChat" },
                  { Icon: Users, href: "#", label: "Forum" },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    title={label}
                    className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-blue-500/20 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-all duration-200 border border-slate-700/50 hover:border-blue-500/30"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* 链接分组 */}
            {Object.entries(links).map(([category, categoryLinks]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                  {category}
                </h3>
                <ul className="space-y-3">
                  {categoryLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-500 hover:text-blue-400 transition-colors duration-200 inline-flex items-center gap-1 group"
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">&#x2022;</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/80" />
            </div>
            <div className="relative flex justify-center">
              <div className="px-4 bg-slate-950 dark:bg-black">
                <div className="w-2 h-2 rounded-full bg-blue-500/40" />
              </div>
            </div>
          </div>

          {/* 底部版权栏 */}
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <span>&copy; {new Date().getFullYear()} TRAI. {isEn ? "All rights reserved." : "保留所有权利。"}</span>
              <span className="hidden md:block w-px h-3 bg-slate-700" />
              <span>{isEn ? "Built with Next.js + Tailwind CSS" : "基于 Next.js + Tailwind CSS 构建"}</span>
            </div>
            <div className="flex items-center gap-5 text-xs text-slate-500">
              <Link href="/privacy" className="hover:text-white transition-colors">{isEn ? "Privacy" : "隐私政策"}</Link>
              <Link href="/terms" className="hover:text-white transition-colors">{isEn ? "Terms" : "服务条款"}</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">{isEn ? "Cookies" : "Cookie 设置"}</Link>
            </div>
          </div>
        </div>
      </footer>

      <BackToTop />
    </>
  );
}
