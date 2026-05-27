/**
 * footer.tsx
 * TRAI 官网页脚
 * - Neo-Brutalism 风格
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
      className={`fixed bottom-8 right-8 z-50 w-14 h-14 bg-amber-400 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] text-slate-900 flex items-center justify-center transition-all hover:bg-amber-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
    >
      <ArrowUp className="h-8 w-8 font-black" />
    </button>
  );
}

export function Footer() {
  const { locale } = useI18n();
  const isEn = locale === "en";
  const links = isEn ? footerLinks.en : footerLinks.zh;

  return (
    <>
      <footer className="bg-white dark:bg-slate-900 border-t-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-16">
            {/* 品牌区域 */}
            <div className="col-span-2">
              <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                <div className="w-12 h-12 bg-amber-400 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center group-hover:-translate-y-1 transition-transform">
                  <Bot className="h-6 w-6 text-slate-900" />
                </div>
                <span className="text-3xl font-black uppercase tracking-widest text-slate-900 dark:text-white">TRAI</span>
              </Link>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 leading-relaxed mb-8 max-w-sm">
                {isEn
                  ? "Next-generation AI Agent platform for secure, reliable, and scalable enterprise solutions."
                  : "新一代 AI Agent 平台，为企业提供安全、可靠、可扩展的智能助手解决方案。"}
              </p>

              {/* 社交媒体 */}
              <div className="flex items-center gap-4">
                {[
                  { Icon: Globe2, href: "#", label: "Community", color: "bg-emerald-400" },
                  { Icon: MessageCircle, href: "#", label: "WeChat", color: "bg-cyan-400" },
                  { Icon: Users, href: "#", label: "Forum", color: "bg-rose-400" },
                ].map(({ Icon, href, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    title={label}
                    className={`w-12 h-12 ${color} border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex items-center justify-center text-slate-900 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#0f172a] transition-all`}
                  >
                    <Icon className="h-6 w-6" />
                  </a>
                ))}
              </div>
            </div>

            {/* 链接分组 */}
            {Object.entries(links).map(([category, categoryLinks]) => (
              <div key={category}>
                <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 border-b-4 border-slate-900 dark:border-white inline-block pb-2">
                  {category}
                </h3>
                <ul className="space-y-4">
                  {categoryLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-amber-400 dark:hover:bg-amber-500 hover:px-2 transition-all duration-200 inline-block"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 分隔线 */}
          <div className="border-t-4 border-slate-900 dark:border-white w-full my-8" />

          {/* 底部版权栏 */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <span>&copy; {new Date().getFullYear()} TRAI. {isEn ? "All rights reserved." : "保留所有权利."}</span>
              <span className="hidden md:block w-1 h-4 bg-slate-900 dark:bg-white" />
              <span>{isEn ? "Built with Next.js + Tailwind CSS" : "基于 Next.js + Tailwind CSS 构建"}</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">{isEn ? "Privacy" : "隐私政策"}</Link>
              <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">{isEn ? "Terms" : "服务条款"}</Link>
              <Link href="/cookies" className="hover:text-slate-900 dark:hover:text-white transition-colors">{isEn ? "Cookies" : "Cookie 设置"}</Link>
            </div>
          </div>
        </div>
      </footer>

      <BackToTop />
    </>
  );
}
