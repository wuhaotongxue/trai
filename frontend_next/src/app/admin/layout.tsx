/**
 * 文件名: layout.tsx
 * 作者: wuhao
 * 日期: 2026-04-16 09:40:24
 * 描述: 管理后台布局, 负责鉴权跳转, 侧边栏, 顶部栏与用户菜单.
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, Bell, Bot, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Cpu, Database, FileText, LayoutDashboard, LogOut, MessageSquare, RefreshCw, Search, Settings, UserPlus, Users, Wifi, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/website/theme_toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown_menu";

const menuGroups = [
  {
    label: "概览",
    items: [
      { label: "仪表盘", href: "/admin", icon: LayoutDashboard, desc: "平台运营数据总览" },
      { label: "数据分析", href: "/admin/analytics", icon: BarChart3, desc: "多维度数据洞察" },
      { label: "系统监控", href: "/admin/monitor", icon: Activity, desc: "服务健康状态" },
    ],
  },
  {
    label: "用户管理",
    items: [
      { label: "用户列表", href: "/admin/users", icon: Users, desc: "注册用户管理" },
      { label: "新增用户", href: "/admin/users/new", icon: UserPlus, desc: "手动添加用户" },
      { label: "会话记录", href: "/admin/sessions", icon: MessageSquare, desc: "用户会话明细" },
    ],
  },
  {
    label: "运营管理",
    items: [
      { label: "配额配置", href: "/admin/quotas", icon: Cpu, desc: "额度与套餐管理" },
      { label: "消息通知", href: "/admin/notifications", icon: Bell, desc: "系统公告推送" },
      { label: "操作日志", href: "/admin/logs", icon: FileText, desc: "管理员操作记录" },
    ],
  },
  {
    label: "系统设置",
    items: [
      { label: "基础配置", href: "/admin/settings", icon: Settings, desc: "系统参数设置" },
      { label: "数据库管理", href: "/admin/database", icon: Database, desc: "数据库状态维护" },
      { label: "网络状态", href: "/admin/network", icon: Wifi, desc: "API 服务连通性" },
    ],
  },
];

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean | undefined>(undefined);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("token"));
      setSidebarCollapsed(localStorage.getItem("admin_sidebar_collapsed") === "1");
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
    if (!isLoginPage && token === null) router.replace("/admin/login");
  }, [router, isLoginPage, token]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (token === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center">
          <div className="text-sm font-semibold text-foreground">TRAI 管理后台</div>
          <div className="text-xs text-muted-foreground mt-2">正在加载登录状态...</div>
        </div>
      </div>
    );
  }

  if (token === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center">
          <div className="text-sm font-semibold text-foreground">未登录</div>
          <div className="text-xs text-muted-foreground mt-2">即将跳转到登录页...</div>
          <div className="mt-4">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    const next = !(sidebarCollapsed ?? false);
    setSidebarCollapsed(next);
    localStorage.setItem("admin_sidebar_collapsed", next ? "1" : "0");
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "flex-shrink-0 flex flex-col bg-sidebar border-r border-border transition-[width] duration-200",
          (sidebarCollapsed ?? false) ? "w-20" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/10",
            (sidebarCollapsed ?? false) ? "px-3" : "px-5"
          )}
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shadow-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          {!(sidebarCollapsed ?? false) && (
            <div>
              <span className="text-base font-bold text-white tracking-wide">TRAI</span>
              <span className="text-xs text-white/80 block -mt-0.5 leading-none">管理后台</span>
            </div>
          )}
          <button
            type="button"
            className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            onClick={toggleSidebar}
            title={(sidebarCollapsed ?? false) ? "展开侧边栏" : "折叠侧边栏"}
            aria-label={(sidebarCollapsed ?? false) ? "展开侧边栏" : "折叠侧边栏"}
          >
            {(sidebarCollapsed ?? false) ? (
              <ChevronsRight className="h-4 w-4 text-white/90" />
            ) : (
              <ChevronsLeft className="h-4 w-4 text-white/90" />
            )}
          </button>
        </div>

        <div className={cn("py-3 border-b border-border/60", (sidebarCollapsed ?? false) ? "px-3" : "px-4")}>
          {(sidebarCollapsed ?? false) ? (
            <button
              type="button"
              className="w-full h-10 rounded-lg border border-border/60 bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition-colors"
              title="搜索菜单"
              aria-label="搜索菜单"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-lg border border-border/60 transition-colors focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/15">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索菜单... (Ctrl+K)"
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted/50 border border-border/60 text-muted-foreground text-[10px] rounded font-mono">
                ⌘K
              </kbd>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {menuGroups.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.label];
            return (
            <div key={group.label} className={(sidebarCollapsed ?? false) ? "space-y-1" : "space-y-0.5"}>
              {!(sidebarCollapsed ?? false) ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-2 mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isGroupCollapsed ? "-rotate-90" : "")} />
                </button>
              ) : (
                <div className="w-full h-px bg-border/40 my-2 first:mt-0" />
              )}
              {(!(sidebarCollapsed ?? false) && isGroupCollapsed) ? null : (
                <>
                  {group.items.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== "/admin" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label + " - " + item.desc}
                        className={cn(
                          "group flex items-center rounded-lg text-sm transition-all duration-150 relative overflow-hidden",
                          (sidebarCollapsed ?? false) ? "justify-center p-2.5 mb-1" : "gap-3 px-3 py-2.5 mb-0.5",
                          active
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground active:scale-[0.98]"
                        )}
                      >
                        {active && !(sidebarCollapsed ?? false) && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r" />
                        )}
                        <item.icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0 transition-colors",
                            active
                              ? "text-white"
                              : "text-muted-foreground group-hover:text-blue-400"
                          )}
                        />
                        {!(sidebarCollapsed ?? false) && (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium leading-none">{item.label}</p>
                              <p
                                className={cn(
                                  "text-xs mt-0.5 truncate transition-colors",
                                  active ? "text-white/80" : "text-muted-foreground"
                                )}
                              >
                                {item.desc}
                              </p>
                            </div>
                            {active ? (
                              <ChevronRight className="h-3 w-3 text-white/70 flex-shrink-0" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-blue-400 flex-shrink-0 transition-colors" />
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
            );
          })}
        </nav>

      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">TRAI 管理后台</span>
              <span className="text-muted-foreground/50">·</span>
              <span>v2.0.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 mr-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium">系统正常</span>
            </div>
            <ThemeToggle />
            <button
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              刷新数据
            </button>
            <button
              type="button"
              aria-label="通知"
              title="通知"
              className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-card" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 pl-3 border-l border-border/60 hover:opacity-80 transition-opacity outline-none">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                  A
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground leading-none">管理员</p>
                  <p className="text-xs text-muted-foreground mt-0.5">admin@trai.ai</p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>上传用户头像</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>修改密码</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refresh_token");
                    window.location.href = "/login";
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
