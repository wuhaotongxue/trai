/**
 * navbar.tsx
 * TRAI 官网导航栏
 * - 浅色模式（默认）+ 深色模式切换
 * - 滚动后背景模糊效果
 * - 主题切换按钮
 * - 移动端菜单
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "首页", href: "/" },
  { label: "功能", href: "/features" },
  { label: "定价", href: "/pricing" },
  { label: "应用场景", href: "/#scenarios" },
  {
    label: "文档中心",
    href: "/docs",
    children: [
      { label: "快速开始", href: "/docs/quickstart" },
      { label: "API 参考", href: "/docs/api" },
      { label: "SDK 下载", href: "/docs/sdk" },
      { label: "常见问题", href: "/docs/faq" },
    ],
  },
  { label: "关于我们", href: "/about" },
  { label: "联系销售", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 dark:bg-[#0d1220]/90 glass border-b border-slate-200 dark:border-slate-800/60"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
              <Bot className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">TRAI</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <div key={item.href} className="relative">
                {item.children ? (
                  <button
                    className="flex items-center gap-1 px-3.5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    onClick={() =>
                      setOpenDropdown(openDropdown === item.label ? null : item.label)
                    }
                    onBlur={() => setTimeout(() => setOpenDropdown(null), 150)}
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="px-3.5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  >
                    {item.label}
                  </Link>
                )}

                {item.children && openDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-[#0d1220] border border-slate-200 dark:border-slate-800/60 rounded-xl shadow-xl py-2 z-50">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right: Theme Toggle + CTA */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                登录
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="text-sm font-semibold shadow-md shadow-blue-500/15 transition-all duration-300 rounded-full px-5"
              >
                免费使用
              </Button>
            </Link>
          </div>

          {/* Mobile: Theme + Menu */}
          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <button
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5 text-slate-900 dark:text-white" />
              ) : (
                <Menu className="h-5 w-5 text-slate-900 dark:text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-[#0d1220]/95 glass border-t border-slate-200 dark:border-slate-800/60">
          <div className="container px-4 py-4 space-y-0.5">
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
            <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800/60">
              <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full text-sm">登录</Button>
              </Link>
              <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button className="w-full text-sm font-semibold">免费使用</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}