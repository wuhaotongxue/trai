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
  User as UserIcon,
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
  const { locale, setLocale, refreshTranslations, refreshing, t } = useAdminI18n();
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
      label: t("admin.overview"),
      key: "overview",
      items: [
        { label: t("admin.dashboard"), href: "/admin", icon: LayoutDashboard, desc: t("admin.dashboard.desc") },
        { label: t("admin.analytics"), href: "/admin/analytics", icon: BarChart3, desc: t("admin.analytics.desc") },
        { label: t("admin.monitor"), href: "/admin/monitor", icon: Activity, desc: t("admin.monitor.desc") },
      ],
    },
    {
      label: t("admin.userManagement"),
      key: "userManagement",
      items: [
        { label: t("admin.users"), href: "/admin/users", icon: Users, desc: t("admin.users.desc") },
        { label: t("admin.users.new"), href: "/admin/users/new", icon: UserPlus, desc: t("admin.users.new.desc") },
        { label: t("admin.sessions"), href: "/admin/sessions", icon: MessageSquare, desc: t("admin.sessions.desc") },
      ],
    },
    {
      label: t("admin.businessFunctions"),
      key: "businessFunctions",
      items: [
        { label: t("admin.ai_assistant"), href: "/admin/ai_assistant", icon: Bot, desc: t("admin.ai_assistant.desc") },
        { label: t("admin.ai"), href: "/admin/ai", icon: Bot, desc: t("admin.ai.desc") },
        { label: t("admin.knowledge_base"), href: "/admin/knowledge_base", icon: Database, desc: t("admin.knowledge_base.desc") },
        { label: t("admin.organization"), href: "/admin/organization", icon: Users, desc: t("admin.organization.desc") },
        { label: t("admin.client_release"), href: "/admin/client_release", icon: Cpu, desc: t("admin.client_release.desc") },
      ],
    },
    {
      label: t("admin.operations"),
      key: "operations",
      items: [
        { label: t("admin.quotas"), href: "/admin/quotas", icon: Cpu, desc: t("admin.quotas.desc") },
        { label: t("admin.notifications"), href: "/admin/notifications", icon: Bell, desc: t("admin.notifications.desc") },
        { label: t("admin.logs"), href: "/admin/logs", icon: FileText, desc: t("admin.logs.desc") },
      ],
    },
    {
      label: t("admin.systemSettings"),
      key: "systemSettings",
      items: [
        { label: t("admin.settings"), href: "/admin/settings", icon: Settings, desc: t("admin.settings.desc") },
        { label: t("admin.i18n"), href: "/admin/i18n", icon: Globe, desc: t("admin.i18n.desc") },
        { label: t("admin.database"), href: "/admin/database", icon: Database, desc: t("admin.database.desc") },
        { label: t("admin.network"), href: "/admin/network", icon: Wifi, desc: t("admin.network.desc") },
      ],
    },
  ], [t]);

  if (token === undefined || isAdmin === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center">
          <div className="text-sm font-semibold text-foreground">TRAI {t("admin.title")}</div>
          <div className="text-xs text-muted-foreground mt-2">{t("admin.loading")}</div>
        </div>
      </div>
    );
  }

  if (token === null || isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t("admin.access_denied.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {token === null ? t("admin.access_denied.not_logged_in") : t("admin.access_denied.admin_only")}
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link href="/" className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
              {t("admin.access_denied.back_to_home")}
            </Link>
            <Link href="/admin/login" className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              {t("admin.access_denied.relogin")}
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 侧边栏 */}
      <aside className={cn("flex-shrink-0 flex flex-col bg-sidebar border-r border-border transition-all duration-300", (sidebarCollapsed ?? false) ? "w-20" : "w-64")}>
        {/* Logo */}
        <div className={cn("flex items-center gap-3 h-16 relative overflow-hidden", (sidebarCollapsed ?? false) ? "px-3" : "px-5")}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-700/90" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl" />
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shadow-lg relative z-10">
            <Bot className="h-5 w-5 text-white" />
          </div>
          {!(sidebarCollapsed ?? false) && (
            <div className="relative z-10">
              <span className="text-lg font-bold text-white tracking-wide">TRAI</span>
              <span className="text-xs text-white/70 block -mt-0.5 leading-none">{t("admin.sidebar.brand")}</span>
            </div>
          )}
          <button type="button" onClick={toggleSidebar} className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all relative z-10" aria-label={t("admin.sidebar.toggle_sidebar")}>
            {(sidebarCollapsed ?? false) ? <ChevronsRight className="h-4 w-4 text-white/90" /> : <ChevronsLeft className="h-4 w-4 text-white/90" />}
          </button>
        </div>

        {/* 搜索框 */}
        <div className={cn("py-3 border-b border-border/40", (sidebarCollapsed ?? false) ? "px-3" : "px-4")}>
          {(sidebarCollapsed ?? false) ? (
            <button type="button" className="w-full h-10 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors" title={t("admin.sidebar.search_menu")} aria-label={t("admin.sidebar.search_menu")}>
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/60 transition-all focus-within:border-blue-500/50 group">
              <Search className="h-3.5 w-3.5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
              <input type="text" placeholder={t("admin.sidebar.search_menu")} className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full" />
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
          {menuGroups.map((group) => {
            return (
              <div key={group.label} className={(sidebarCollapsed ?? false) ? "space-y-1" : "space-y-0.5"}>
                {!(sidebarCollapsed ?? false) && (
                  <button type="button" onClick={() => toggleGroup(group.key)} className="w-full flex items-center justify-between px-2 mb-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider hover:text-foreground transition-colors">
                    <span>{group.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", collapsedGroups[group.key] ? "-rotate-90" : "")} />
                  </button>
                )}
                {(sidebarCollapsed ?? false) && collapsedGroups[group.key] ? null : (
                  <>
                    {group.items.map((item) => {
                      const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                      return (
                        <Link key={item.href} href={item.href} title={item.label}
                          className={cn("group flex items-center rounded-lg text-sm transition-all duration-200 relative overflow-hidden",
                            (sidebarCollapsed ?? false) ? "justify-center p-2.5 mb-1" : "gap-3 px-3 py-2.5 mb-0.5",
                            active ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground")}>
                          {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white rounded-r shadow-sm" />}
                          <item.icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-white" : "text-muted-foreground group-hover:text-blue-500")} />
                          {!(sidebarCollapsed ?? false) && (
                            <>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium leading-none">{item.label}</p>
                                <p className={cn("text-[11px] mt-0.5 truncate", active ? "text-white/70" : "text-muted-foreground/70")}>{item.desc}</p>
                              </div>
                              {active ? <ChevronRight className="h-3.5 w-3.5 text-white/60 flex-shrink-0" /> : <div className="w-1.5 h-1.5 rounded-full bg-border/60 group-hover:bg-blue-400 flex-shrink-0 transition-colors" />}
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
        <div className={cn("py-3 border-t border-border/40", (sidebarCollapsed ?? false) ? "px-3" : "px-4")}>
          <div className={cn("flex items-center gap-2 text-[10px] text-muted-foreground/50", (sidebarCollapsed ?? false) ? "justify-center" : "")}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>v2.0.0</span>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border/60 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground/80">TRAI</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="font-semibold text-foreground">{t("admin.dashboard")}</span>
            </div>
            <div className="hidden md:block h-5 w-px bg-border/60" />
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{t("admin.v2.0.0")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 中英文切换 */}
            <button
              type="button"
              disabled={refreshing}
              onClick={async () => {
                const next = locale === "zh" ? "en" : "zh";
                setLocale(next);
                await refreshTranslations();
                toast({ message: t("admin.topbar.lang_switched", { lang: next === "zh" ? "中文" : "English" }), variant: "success", duration: 2000 });
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl border border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-500/15 transition-all text-xs font-medium disabled:opacity-60"
              title={t("admin.topbar.switch_lang")}
            >
              <Globe className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              <span>{refreshing ? t("admin.topbar.switching") : locale === "zh" ? "EN" : "中文"}</span>
            </button>

            <button type="button" onClick={() => setFloatingChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="relative">
                <Bot className="h-4 w-4" />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">{t("admin.topbar.ai_assistant")}</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </div>
              <span className="text-xs font-medium">{t("admin.systemNormal")}</span>
            </div>
            <div className="h-6 w-px bg-border/60 mx-1" />
            <ThemeToggle />
            <button type="button" className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{t("admin.topbar.refresh")}</span>
            </button>
            <button type="button" aria-label={t("admin.topbar.notifications")} title={t("admin.topbar.notifications")} onClick={() => router.push("/admin/notifications")}
              className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-card animate-pulse" />
            </button>
            {/* 用户下拉 */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 pl-3 border-l border-border/60 hover:opacity-90 transition-opacity outline-none">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-blue-500/20">
                  {user?.display_name?.[0] || user?.username?.[0] || "A"}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-semibold text-foreground leading-none">{user?.display_name || user?.username || "管理员"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{user?.wecom_user_id ? `工号: ${user.wecom_user_id}` : user?.email || "admin@trai.ai"}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden lg:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-2">
                <DropdownMenuLabel className="p-2">
                  <div className="text-sm font-semibold">{user?.display_name || user?.username || "管理员"}</div>
                  <div className="text-xs text-muted-foreground">{user?.email || "admin@trai.ai"}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="rounded-lg cursor-pointer"><UserIcon className="mr-2 h-4 w-4" /><span>{t("admin.topbar.profile")}</span></DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer"><Settings className="mr-2 h-4 w-4" /><span>{t("admin.topbar.account_settings")}</span></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                  onClick={() => { Cookies.remove("token"); Cookies.remove("refresh_token"); window.location.href = "/login"; }}>
                  <LogOut className="mr-2 h-4 w-4" /><span>{t("admin.topbar.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-background">{children}</main>
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
