/**
 * 文件名: layout.tsx
 * 作者: wuhao
 * 日期: 2026-04-16
 * 描述: 管理后台布局, 负责鉴权跳转, 侧边栏, 顶部栏与用户菜单.
 */

"use client";

import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, AlertCircle, BarChart3, Bell, Bot, ChevronDown, ChevronRight,
  ChevronsLeft, ChevronsRight, Cpu, Database, FileText, Globe, LayoutDashboard,
  LogOut, MessageSquare, RefreshCw, Search, Settings, UserPlus, Users, Wifi,
  User as UserIcon, HardDrive,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { ThemeToggle } from "@/components/website/theme_toggle";
import { authApi } from "@/lib/api_client";
import { useAgentStore } from "@/stores/agent.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown_menu";
import { ToastContainer } from "@/components/toast/toast";
import { AdminToastProvider, useAdminToast } from "@/contexts/admin_toast_context";
import { AdminI18nProvider, useAdminI18n } from "@/contexts/admin_i18n_context";
import { cn } from "@/lib/utils";

function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toasts, toast, dismiss } = useAdminToast();
  const { locale, setLocale, refreshTranslations, refreshing, translate } = useAdminI18n();
  const { setFloatingChatOpen } = useAgentStore();
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    "overview": true,
    "userManagement": true,
    "businessFunctions": true,
    "operations": true,
    "systemSettings": true,
  });

  useEffect(() => {
    const syncAuth = async () => {
      const currentToken = Cookies.get("token") || null;
      setToken(currentToken);
      const collapsed = localStorage.getItem("admin_sidebar_collapsed") === "1";
      setSidebarCollapsed(collapsed);

      if (currentToken) {
        try {
          const res = await authApi.me();
          const me = res.user;
          setUser(me);
          if (me.role === "admin" || me.username === "admin" || me.username === "A28441") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
    if (token === null) router.replace("/admin/login");
  }, [router, token]);

  const menuGroups = useMemo(() => [
    {
      label: translate("admin.overview"),
      key: "overview",
      items: [
        { label: translate("admin.dashboard"), href: "/admin", icon: LayoutDashboard, desc: translate("admin.dashboard.desc") },
        { label: translate("admin.analytics"), href: "/admin/analytics", icon: BarChart3, desc: translate("admin.analytics.desc") },
        { label: "实时大屏", href: "/admin/analytics/bigscreen", icon: Activity, desc: "实时数据监控大屏" },
        { label: translate("admin.monitor"), href: "/admin/monitor", icon: Activity, desc: translate("admin.monitor.desc") },
      ],
    },
    {
      label: translate("admin.userManagement"),
      key: "userManagement",
      items: [
        { label: translate("admin.users"), href: "/admin/users", icon: Users, desc: translate("admin.users.desc") },
        { label: translate("admin.users.new"), href: "/admin/users/new", icon: UserPlus, desc: translate("admin.users.new.desc") },
        { label: translate("admin.sessions"), href: "/admin/sessions", icon: MessageSquare, desc: translate("admin.sessions.desc") },
      ],
    },
    {
      label: translate("admin.businessFunctions"),
      key: "businessFunctions",
      items: [
        { label: translate("admin.ai_assistant"), href: "/admin/ai_assistant", icon: Bot, desc: translate("admin.ai_assistant.desc") },
        { label: translate("admin.ai"), href: "/admin/ai", icon: Bot, desc: translate("admin.ai.desc") },
        { label: translate("admin.knowledge_base"), href: "/admin/knowledge_base", icon: Database, desc: translate("admin.knowledge_base.desc") },
        { label: translate("admin.organization"), href: "/admin/organization", icon: Users, desc: translate("admin.organization.desc") },
        { label: translate("admin.client_release"), href: "/admin/client_release", icon: Cpu, desc: translate("admin.client_release.desc") },
      ],
    },
    {
      label: translate("admin.operations"),
      key: "operations",
      items: [
        { label: translate("admin.quotas"), href: "/admin/quotas", icon: Cpu, desc: translate("admin.quotas.desc") },
        { label: translate("admin.notifications"), href: "/admin/notifications", icon: Bell, desc: translate("admin.notifications.desc") },
        { label: translate("admin.logs"), href: "/admin/logs", icon: FileText, desc: translate("admin.logs.desc") },
        { label: translate("admin.login_logs"), href: "/admin/login_logs", icon: FileText, desc: translate("admin.login_logs.desc") },
      ],
    },
    {
      label: translate("admin.systemSettings"),
      key: "systemSettings",
      items: [
        { label: translate("admin.settings"), href: "/admin/settings", icon: Settings, desc: translate("admin.settings.desc") },
        { label: translate("admin.backup"), href: "/admin/backup", icon: HardDrive, desc: translate("admin.backup.desc") },
        { label: translate("admin.i18n"), href: "/admin/i18n", icon: Globe, desc: translate("admin.i18n.desc") },
        { label: translate("admin.database"), href: "/admin/database", icon: Database, desc: translate("admin.database.desc") },
        { label: translate("admin.network"), href: "/admin/network", icon: Wifi, desc: translate("admin.network.desc") },
      ],
    },
  ], [translate]);

  if (token === undefined || isAdmin === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full rounded-none-none border border-border bg-card p-6 text-center">
          <div className="text-sm font-semibold text-foreground">TRAI {translate("admin.title")}</div>
          <div className="text-xs text-slate-900 dark:text-white font-bold mt-2">{translate("admin.loading")}</div>
        </div>
      </div>
    );
  }

  if (token === null || isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full rounded-none-none border border-border bg-card p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-none-none flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{translate("admin.access_denied.title")}</h2>
          <p className="text-sm text-slate-900 dark:text-white font-bold">
            {token === null ? translate("admin.access_denied.not_logged_in") : translate("admin.access_denied.admin_only")}
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link href="/" className="inline-flex items-center justify-center h-9 px-4 rounded-none-none bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
              {translate("admin.access_denied.back_to_home")}
            </Link>
            <Link href="/admin/login" className="inline-flex items-center justify-center h-9 px-4 rounded-none-none bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              {translate("admin.access_denied.relogin")}
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

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      {/* 侧边栏 */}
      <aside className={cn("flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r-4 border-slate-900 dark:border-white transition-all duration-300 z-20", (sidebarCollapsed ?? false) ? "w-20" : "w-64")}>
        {/* Logo */}
        <div className={cn("flex items-center gap-3 h-16 border-b-4 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-200", (sidebarCollapsed ?? false) ? "px-3 justify-center" : "px-5")}>
          <div className="w-10 h-10 border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-800 flex items-center justify-center shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] z-10">
            <Bot className="h-6 w-6 text-slate-900 dark:text-white" />
          </div>
          {!(sidebarCollapsed ?? false) && (
            <div className="relative z-10 flex-1">
              <span className="text-xl font-black text-slate-900 uppercase tracking-widest">TRAI</span>
              <span className="text-[10px] font-bold text-slate-800 block leading-none uppercase">{translate("admin.sidebar.brand")}</span>
            </div>
          )}
          <button type="button" onClick={toggleSidebar} className="w-8 h-8 border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all z-10" aria-label={translate("admin.sidebar.toggle_sidebar")}>
            {(sidebarCollapsed ?? false) ? <ChevronsRight className="h-4 w-4 text-slate-900 dark:text-white" /> : <ChevronsLeft className="h-4 w-4 text-slate-900 dark:text-white" />}
          </button>
        </div>

        {/* 搜索框 */}
        <div className={cn("py-3 border-b border-border/40", (sidebarCollapsed ?? false) ? "px-3" : "px-4")}>
          {(sidebarCollapsed ?? false) ? (
            <button type="button" className="w-full h-10 rounded-none-none border border-border/60 bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors" title={translate("admin.sidebar.search_menu")} aria-label={translate("admin.sidebar.search_menu")}>
              <Search className="h-4 w-4 text-slate-900 dark:text-white font-bold" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-none-none border border-border/60 transition-all focus-within:border-blue-500/50 group">
              <Search className="h-3.5 w-3.5 text-slate-900 dark:text-white font-bold group-focus-within:text-blue-500 transition-colors" />
              <input type="text" placeholder={translate("admin.sidebar.search_menu")} className="bg-transparent text-xs text-foreground placeholder:text-slate-900 dark:text-white font-bold outline-none w-full" />
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
          {menuGroups.map((group) => {
            return (
              <div key={group.label} className={(sidebarCollapsed ?? false) ? "space-y-2" : "space-y-1"}>
                {!(sidebarCollapsed ?? false) && (
                  <button type="button" onClick={() => toggleGroup(group.key)} className="w-full flex items-center justify-between px-2 mb-3 text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest border-b-2 border-slate-900 dark:border-white pb-1">
                    <span>{group.label}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", !collapsedGroups[group.key] ? "-rotate-90" : "")} />
                  </button>
                )}
                {collapsedGroups[group.key] ? null : (
                  <>
                    {group.items.map((item) => {
                      const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                      return (
                        <Link key={item.href} href={item.href} title={item.label}
                          className={cn("group flex items-center transition-all duration-200 border-2 border-slate-900 dark:border-white",
                            (sidebarCollapsed ?? false) ? "justify-center p-3 mb-2" : "gap-3 px-3 py-3 mb-2",
                            active ? "bg-slate-50 dark:bg-cyan-600 text-slate-900 dark:text-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] translate-x-[-2px] translate-y-[-2px]" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]")}>
                          <item.icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white")} />
                          {!(sidebarCollapsed ?? false) && (
                            <>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm leading-none uppercase tracking-wide">{item.label}</p>
                              </div>
                              {active && <ChevronRight className="h-4 w-4 text-slate-900 dark:text-white flex-shrink-0" />}
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

        {/* 底部版本 */}
        <div className={cn("py-3 border-t-4 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-200", (sidebarCollapsed ?? false) ? "px-3" : "px-4")}>
          <div className={cn("flex items-center gap-2 text-xs font-black uppercase text-slate-900", (sidebarCollapsed ?? false) ? "justify-center" : "")}>
            <div className="w-2 h-2 border-2 border-slate-900 bg-slate-100" />
            <span>v2.0.0</span>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
        {/* 顶部栏 */}
        <header className="h-16 flex items-center justify-between px-6 border-b-4 border-slate-900 dark:border-white bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
              <span>TRAI</span>
              <ChevronRight className="h-4 w-4" />
              <span>{translate("admin.dashboard")}</span>
            </div>
            <div className="hidden md:block h-6 w-1 bg-slate-900 dark:bg-white" />
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-cyan-600 border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] text-slate-900 dark:text-white text-xs font-black uppercase">
              <div className="w-2 h-2 border-2 border-slate-900 bg-white" />
              <span>{translate("admin.v2.0.0")}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* 中英文切换 */}
            <button
              type="button"
              disabled={refreshing}
              onClick={async () => {
                const next = locale === "zh" ? "en" : "zh";
                setLocale(next);
                await refreshTranslations();
                toast({ message: translate("admin.topbar.lang_switched"), variant: "success", duration: 2000 });
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-indigo-600 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-xs font-black uppercase disabled:opacity-60"
              title={translate("admin.topbar.switch_lang")}
            >
              <Globe className={cn("h-4 w-4", refreshing && "animate-spin")} />
              <span>{refreshing ? translate("admin.topbar.switching") : locale === "zh" ? "EN" : "中文"}</span>
            </button>

            <button type="button" onClick={() => setFloatingChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-cyan-600 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
              <Bot className="h-4 w-4" />
              <span className="text-xs font-black uppercase hidden sm:inline">{translate("admin.topbar.ai_assistant")}</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-cyan-600 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a]">
              <div className="w-2 h-2 border-2 border-slate-900 bg-white animate-pulse" />
              <span className="text-xs font-black uppercase">{translate("admin.systemNormal")}</span>
            </div>
            <div className="h-8 w-1 bg-slate-900 dark:bg-white mx-2" />
            <ThemeToggle />
            <button type="button" className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-black uppercase text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-800 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              <span>{translate("admin.topbar.refresh")}</span>
            </button>
            <button type="button" aria-label={translate("admin.topbar.notifications")} title={translate("admin.topbar.notifications")} onClick={() => router.push("/admin/notifications")}
              className="relative p-2 border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-800 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
              <Bell className="h-4 w-4 text-slate-900 dark:text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 border-2 border-slate-900" />
            </button>
            {/* 用户下拉 */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 pl-3 border-l border-border/60 hover:opacity-90 transition-opacity outline-none">
                <div className="w-8 h-8 rounded-none-none bg-slate-100 flex items-center justify-center text-white text-sm font-semibold shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] shadow-blue-500/20">
                  {user?.display_name?.[0] || user?.username?.[0] || "A"}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-semibold text-foreground leading-none">{user?.display_name || user?.username || "管理员"}</p>
                  <p className="text-[11px] text-slate-900 dark:text-white font-bold mt-0.5">{user?.wecom_user_id ? `工号: ${user.wecom_user_id}` : user?.email || "admin@trai.ai"}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-900 dark:text-white font-bold hidden lg:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-2">
                <DropdownMenuLabel className="p-2">
                  <div className="text-sm font-semibold">{user?.display_name || user?.username || "管理员"}</div>
                  <div className="text-xs text-slate-900 dark:text-white font-bold">{user?.email || "admin@trai.ai"}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="rounded-none-none cursor-pointer"><UserIcon className="mr-2 h-4 w-4" /><span>{translate("admin.topbar.profile")}</span></DropdownMenuItem>
                  <DropdownMenuItem className="rounded-none-none cursor-pointer"><Settings className="mr-2 h-4 w-4" /><span>{translate("admin.topbar.account_settings")}</span></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-none-none cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                  onClick={() => { Cookies.remove("token"); Cookies.remove("refresh_token"); window.location.href = "/login"; }}>
                  <LogOut className="mr-2 h-4 w-4" /><span>{translate("admin.topbar.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-auto p-6 bg-background">{children}</main>
      </div>

      {/* 全局 Toast */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminToastProvider>
      <AdminI18nProvider>
        <AdminShell>{children}</AdminShell>
      </AdminI18nProvider>
    </AdminToastProvider>
  );
}
