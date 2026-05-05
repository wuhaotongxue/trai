/**
 * navbar.tsx
 * TRAI 官网导航栏
 * - 浅色模式(默认)+ 深色模式切换
 * - 滚动后背景模糊效果
 * - 主题切换按钮
 * - 语言切换
 * - 移动端菜单
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, Menu, X, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme_toggle";
import { LanguageSwitcher } from "./language_switcher";
import { cn } from "@/lib/utils";
import { useAgentStore } from "@/stores/agent.store";
import { useI18n } from "@/i18n/i18n_context";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { setFloatingChatOpen } = useAgentStore();
  const { translate, locale } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: translate("nav.home"), href: "/" },
    { label: translate("nav.features"), href: "/features" },
    { label: translate("nav.pricing"), href: "/pricing" },
    { label: translate("nav.scenarios"), href: "/#scenarios" },
    {
      label: translate("nav.docs"),
      href: "/docs",
      children: [
        { label: translate("nav.quickstart"), href: "/docs/quickstart" },
        { label: translate("nav.api"), href: "/docs/api" },
        { label: translate("nav.sdk"), href: "/docs/sdk" },
        { label: translate("nav.faq"), href: "/docs/faq" },
      ],
    },
    { label: translate("nav.about"), href: "/about" },
    { label: translate("nav.contact"), href: "/contact" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 dark:bg-[#0d1220]/95 glass border-b border-slate-200/80 dark:border-slate-800/60 shadow-sm"
          : "bg-white/80 dark:bg-[#0d1220]/80 dark:backdrop-blur-md"
      )}
    >
      {/* 顶部渐变条 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Bot className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">TRAI</span>
              <span className="hidden sm:inline text-[10px] text-blue-500 font-medium ml-1.5 -mt-1 block">AI Agent</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <div key={item.href} className="relative">
                {item.children ? (
                  <button
                    className="flex items-center gap-1 px-3.5 py-2 text-sm text-slate-600 dark:text-slate-100/90 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100/80 dark:hover:bg-white/10"
                    onClick={() =>
                      setOpenDropdown(openDropdown === item.label ? null : item.label)
                    }
                    onBlur={() => setTimeout(() => setOpenDropdown(null), 150)}
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="px-3.5 py-2 text-sm text-slate-600 dark:text-slate-100/90 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100/80 dark:hover:bg-white/10"
                  >
                    {item.label}
                  </Link>
                )}

                {item.children && openDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#0d1220] border border-slate-200/80 dark:border-slate-800/60 rounded-xl shadow-xl shadow-blue-500/5 py-2 z-50 backdrop-blur-sm animate-[slideUpFade_0.2s_cubic-bezier(0,0,0.2,1)_both]">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-100/90 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right: Language + Theme Toggle + AI Assistant + CTA */}
          <div className="hidden lg:flex items-center gap-2.5">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-slate-700 dark:text-slate-200 font-medium gap-1.5 px-3"
              onClick={() => setFloatingChatOpen(true)}
            >
              <div className="relative">
                <Bot className="h-4 w-4 text-blue-500" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
              {translate("nav.ai_assistant")}
            </Button>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                {translate("nav.login")}
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="text-sm font-semibold shadow-md shadow-blue-500/15 transition-all duration-300 rounded-full px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
              >
                <Sparkles className="h-3 w-3 mr-1.5" />
                {translate("nav.register")}
              </Button>
            </Link>
          </div>

          {/* Mobile: Language + Theme + Menu */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              <div className="relative w-5 h-5">
                <X className={cn("h-5 w-5 text-slate-900 dark:text-white absolute inset-0 transition-all duration-300", mobileOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90")} />
                <Menu className={cn("h-5 w-5 text-slate-900 dark:text-white absolute inset-0 transition-all duration-300", mobileOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0")} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden border-t border-slate-200/80 dark:border-slate-800/60 transition-all duration-300 overflow-hidden",
          mobileOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="bg-white/95 dark:bg-[#0d1220]/95 glass px-4 py-4 space-y-0.5">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className="block px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
              {item.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block pl-6 pr-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="flex gap-2 pt-4 mt-2 border-t border-slate-200 dark:border-slate-800/60">
            <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full text-sm rounded-lg">{translate("nav.login")}</Button>
            </Link>
            <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button className="w-full text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
                <Sparkles className="h-3 w-3 mr-1.5" />
                {translate("nav.register")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
