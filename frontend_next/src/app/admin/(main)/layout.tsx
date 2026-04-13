/**
 * layout.tsx
 * 管理员后台布局
 * - 左侧垂直菜单导航（白色清爽风格）
 * - 顶部信息栏
 * - 企业级侧边栏规范：分组图标、hover 动效、毫秒级响应
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  Users,
  BarChart3,
  Activity,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Bell,
  Search,
  FileText,
  MessageSquare,
  Cpu,
  UserPlus,
  Database,
  Wifi,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-slate-200 shadow-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-14 bg-gradient-to-r from-blue-600 to-blue-500 shadow-md shadow-blue-500/20">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-sm">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-wide">TRAI</span>
            <span className="text-xs text-blue-100 block -mt-0.5 leading-none">管理后台</span>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 transition-colors focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索菜单... (Ctrl+K)"
              className="bg-transparent text-xs text-slate-600 placeholder:text-slate-400 outline-none w-full"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-400 text-[10px] rounded font-mono">⌘K</kbd>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.desc}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 mb-0.5 relative overflow-hidden",
                      active
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-500/25"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                    )}
                  >
                    {/* 激活态左侧竖条 */}
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r" />
                    )}
                    <item.icon className={cn(
                      "h-4 w-4 flex-shrink-0 transition-colors",
                      active ? "text-white" : "text-slate-400 group-hover:text-blue-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-none">{item.label}</p>
                      <p className={cn(
                        "text-xs mt-0.5 truncate transition-colors",
                        active ? "text-blue-100" : "text-slate-400"
                      )}>
                        {item.desc}
                      </p>
                    </div>
                    {active ? (
                      <ChevronRight className="h-3 w-3 text-white/70 flex-shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-400 flex-shrink-0 transition-colors" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-slate-100 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-[0.98]"
          >
            <Bot className="h-3.5 w-3.5" />
            <span>返回官网</span>
            <span className="ml-auto text-slate-300">↗</span>
          </Link>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>退出登录</span>
          </button>
          <div className="px-3 py-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">系统正常</span>
            </div>
            <RefreshCw className="h-3 w-3 text-slate-300 ml-auto cursor-pointer hover:text-slate-500 transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-13 flex items-center justify-between px-6 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <span className="font-medium text-slate-700">TRAI 管理后台</span>
              <span className="text-slate-300">·</span>
              <span>v2.0.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 快捷操作按钮 */}
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
              <RefreshCw className="h-3 w-3" />
              刷新数据
            </button>
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="h-4 w-4 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                A
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 leading-none">管理员</p>
                <p className="text-xs text-slate-400 mt-0.5">admin@trai.ai</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 bg-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
