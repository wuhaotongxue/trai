/* eslint-disable */
/**
 * navbar.tsx
 * TRAI 官网导航栏
 * - Neo-Brutalism 风格
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, Menu, X, ChevronDown, Sparkles, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme_toggle";
import { LanguageSwitcher } from "./language_switcher";
import { cn } from "@/lib/utils";
import { useAgentStore } from "@/stores/agent.store";
import { useI18n } from "@/i18n/i18n_context";
import { authApi } from "@/lib/api_client";
import Cookies from "js-cookie";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown_menu";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setFloatingChatOpen } = useAgentStore();
  const { translate, locale } = useI18n();

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("token");
      if (token) {
        try {
          const res = await authApi.me();
          setUser(res.user);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: translate("nav.home") || "首页", href: "/" },
    { label: translate("nav.features") || "功能", href: "/features" },
    { label: translate("nav.pricing") || "价格", href: "/pricing" },
    {
      label: translate("nav.docs") || "文档",
      href: "/docs",
      children: [
        { label: translate("nav.quickstart") || "快速开始", href: "/docs/quickstart" },
        { label: translate("nav.api") || "API 文档", href: "/docs/api" },
        { label: translate("nav.faq") || "常见问题", href: "/docs/faq" },
      ],
    },
    { label: translate("nav.about") || "关于", href: "/about" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        "bg-white dark:bg-slate-900 border-b-4 border-slate-900 dark:border-white"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-amber-400 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0px_0px_#0f172a] dark:group-hover:shadow-[6px_6px_0px_0px_#ffffff] transition-all">
              <Bot className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-widest text-slate-900 dark:text-white uppercase">TRAI</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <div key={item.href} className="relative">
                {item.children ? (
                  <button
                    className="flex items-center gap-1 px-4 py-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider hover:bg-emerald-400 hover:border-2 hover:border-slate-900 hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all border-2 border-transparent"
                    onClick={() =>
                      setOpenDropdown(openDropdown === item.label ? null : item.label)
                    }
                    onBlur={() => setTimeout(() => setOpenDropdown(null), 150)}
                  >
                    {item.label}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="px-4 py-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider hover:bg-emerald-400 hover:text-slate-900 hover:border-2 hover:border-slate-900 hover:shadow-[4px_4px_0px_0px_#0f172a] transition-all border-2 border-transparent"
                  >
                    {item.label}
                  </Link>
                )}

                {item.children && openDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] py-2 z-50">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center gap-3 px-4 py-3 font-bold text-slate-900 dark:text-white hover:bg-amber-400 hover:text-slate-900 border-y-2 border-transparent hover:border-slate-900 transition-colors uppercase tracking-wider"
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

          {/* Right: Language + Theme Toggle + AI Assistant + CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
            
            <Button
              variant="outline"
              className="h-10 px-4 gap-2 font-black uppercase tracking-widest bg-cyan-400 text-slate-900 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:bg-cyan-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none"
              onClick={() => setFloatingChatOpen(true)}
            >
              <Bot className="h-5 w-5" />
              AI 助手
            </Button>
            
            {isLoading ? (
              <div className="w-10 h-10 border-2 border-slate-900 bg-slate-200 animate-pulse shadow-[4px_4px_0px_0px_#0f172a]" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-3 pl-4 border-l-4 border-slate-900 dark:border-white hover:opacity-80 transition-opacity outline-none">
                  <div className="w-10 h-10 bg-rose-400 border-2 border-slate-900 flex items-center justify-center text-slate-900 text-lg font-black shadow-[4px_4px_0px_0px_#0f172a]">
                    {user?.display_name?.[0] || user?.username?.[0] || "A"}
                  </div>
                  <ChevronDown className="h-5 w-5 text-slate-900 dark:text-white hidden lg:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-0 bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] rounded-none">
                  <DropdownMenuLabel className="p-4 border-b-4 border-slate-900 dark:border-white bg-indigo-400 text-slate-900">
                    <div className="text-lg font-black uppercase tracking-wider">{user?.display_name || user?.username || "用户"}</div>
                    <div className="text-sm font-bold">{user?.email || ""}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuGroup className="p-2">
                    <DropdownMenuItem className="p-3 font-bold text-slate-900 dark:text-white uppercase tracking-wider hover:bg-emerald-400 hover:text-slate-900 border-2 border-transparent hover:border-slate-900 cursor-pointer rounded-none">
                      <User className="mr-3 h-5 w-5" />
                      <span>个人中心</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <div className="border-t-4 border-slate-900 dark:border-white p-2">
                    <DropdownMenuItem 
                      className="p-3 font-bold text-slate-900 uppercase tracking-wider bg-rose-400 hover:bg-rose-500 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] cursor-pointer rounded-none"
                      onClick={() => { 
                        Cookies.remove("token"); 
                        Cookies.remove("refresh_token"); 
                        window.location.href = "/login"; 
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-emerald-400 hover:text-slate-900 border-2 border-transparent hover:border-slate-900 rounded-none h-10 px-6">
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    className="h-10 px-6 font-black uppercase tracking-widest bg-rose-500 text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:bg-rose-400 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none"
                  >
                    免费注册
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Menu Toggle */}
          <div className="flex items-center gap-3 lg:hidden">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              className="p-2 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] bg-amber-400 text-slate-900 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden border-t-4 border-slate-900 dark:border-white transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900",
          mobileOpen ? "max-h-[800px] border-b-4" : "max-h-0 border-0"
        )}
      >
        <div className="px-4 py-6 space-y-4">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className="block px-4 py-3 font-black text-xl text-slate-900 dark:text-white uppercase tracking-widest hover:bg-emerald-400 hover:text-slate-900 border-2 border-transparent hover:border-slate-900 transition-all"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
              {item.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block pl-8 pr-4 py-2 font-bold text-lg text-slate-600 dark:text-slate-400 uppercase hover:text-slate-900 hover:bg-amber-400 border-l-4 border-transparent hover:border-slate-900 transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="pt-6 border-t-4 border-slate-900 dark:border-white space-y-4">
            {user ? (
              <>
                <div className="p-4 bg-indigo-400 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-400 border-2 border-slate-900 flex items-center justify-center text-slate-900 text-xl font-black">
                    {user?.display_name?.[0] || user?.username?.[0] || "A"}
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 uppercase tracking-wider">{user?.display_name || user?.username}</p>
                    <p className="text-sm font-bold text-slate-800">{user?.email}</p>
                  </div>
                </div>
                <button
                  className="w-full p-4 font-black text-xl uppercase tracking-widest bg-rose-500 text-white border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-3"
                  onClick={() => { 
                    Cookies.remove("token"); 
                    Cookies.remove("refresh_token"); 
                    window.location.href = "/login"; 
                  }}
                >
                  <LogOut className="h-6 w-6" />
                  退出登录
                </button>
              </>
            ) : (
              <div className="flex gap-4">
                <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full h-14 text-lg font-black uppercase tracking-widest bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] rounded-none hover:bg-slate-100">
                    登录
                  </Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full h-14 text-lg font-black uppercase tracking-widest bg-emerald-400 text-slate-900 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-none hover:bg-emerald-300">
                    注册
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
