/**
 * page.tsx
 * 管理员仪表盘
 * - 企业级 SaaS 规范: 高信息密度、骨架屏、情感化文案、多彩紧凑布局
 */

"use client";
import Cookies from "js-cookie";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, AlertCircle, ArrowUp, Bot, CheckCircle2, Clock, Cpu, Database, Eye, FileText, MessageSquare, RefreshCw, Star, TrendingUp, Upload, Users, Wifi, Zap, Shield, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";

type DashboardStats = {
  total_users: number;
  active_users_today: number;
  total_sessions: number;
  total_messages: number;
  total_image_generations: number;
  total_uploads: number;
  total_agent_tool_calls: number;
  vip_users: number;
  new_users_this_month: number;
};

type DailyTrend = {
  date: string;
  users: number;
  sessions: number;
  messages: number;
  agent_calls: number;
};

const statCards = [
  {
    label: "admin.dashboard.total_users",
    key: "total_users" as const,
    icon: Users,
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-500/10",
    badge: "bg-blue-500/15 text-blue-400",
    trend: "+18",
    trendUp: true,
    sparkline: [40, 55, 45, 60, 58, 72, 68, 85, 80, 95],
  },
  {
    label: "admin.dashboard.active_today",
    key: "active_users_today" as const,
    icon: Activity,
    gradient: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-500/10",
    badge: "bg-emerald-500/15 text-emerald-400",
    trend: "+5",
    trendUp: true,
    sparkline: [20, 25, 22, 30, 28, 35, 32, 40, 38, 45],
  },
  {
    label: "admin.dashboard.total_sessions",
    key: "total_sessions" as const,
    icon: MessageSquare,
    gradient: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-500/10",
    badge: "bg-indigo-500/15 text-indigo-400",
    trend: "+32",
    trendUp: true,
    sparkline: [60, 55, 70, 65, 80, 75, 90, 85, 100, 95],
  },
  {
    label: "admin.dashboard.total_messages",
    key: "total_messages" as const,
    icon: FileText,
    gradient: "from-cyan-500 to-cyan-600",
    bg: "bg-cyan-500/10",
    badge: "bg-cyan-500/15 text-cyan-400",
    trend: "+89",
    trendUp: true,
    sparkline: [80, 75, 90, 85, 100, 95, 110, 105, 120, 115],
  },
  {
    label: "admin.dashboard.agent_calls",
    key: "total_agent_tool_calls" as const,
    icon: Bot,
    gradient: "from-orange-500 to-orange-600",
    bg: "bg-orange-500/10",
    badge: "bg-orange-500/15 text-orange-400",
    trend: "+42",
    trendUp: true,
    sparkline: [30, 35, 28, 45, 42, 55, 50, 65, 60, 75],
  },
  {
    label: "admin.dashboard.file_uploads",
    key: "total_uploads" as const,
    icon: Upload,
    gradient: "from-pink-500 to-pink-600",
    bg: "bg-pink-500/10",
    badge: "bg-pink-500/15 text-pink-400",
    trend: "+12",
    trendUp: true,
    sparkline: [15, 18, 16, 22, 20, 25, 23, 28, 26, 32],
  },
  {
    label: "admin.dashboard.vip_users",
    key: "vip_users" as const,
    icon: Star,
    gradient: "from-amber-500 to-amber-600",
    bg: "bg-amber-500/10",
    badge: "bg-amber-500/15 text-amber-400",
    trend: "+3",
    trendUp: true,
    sparkline: [10, 12, 11, 14, 13, 16, 15, 18, 17, 20],
  },
  {
    label: "admin.dashboard.new_this_month",
    key: "new_users_this_month" as const,
    icon: TrendingUp,
    gradient: "from-teal-500 to-teal-600",
    bg: "bg-teal-500/10",
    badge: "bg-teal-500/15 text-teal-400",
    trend: "+28",
    trendUp: true,
    sparkline: [25, 30, 28, 35, 33, 40, 38, 45, 42, 50],
  },
];

const services = [
  { nameKey: "admin.dashboard.api_service", icon: Wifi, status: "ok", latency: "12ms", uptime: "99.98%" },
  { nameKey: "admin.dashboard.agent_engine", icon: Bot, status: "ok", latency: "45ms", uptime: "99.95%" },
  { nameKey: "admin.dashboard.database", icon: Database, status: "ok", latency: "3ms", uptime: "99.99%" },
  { nameKey: "admin.dashboard.model_service", icon: Cpu, status: "warn", latency: "380ms", uptime: "98.72%" },
];

const skeletonChartHeights = [62, 44, 78, 35, 56, 24, 71, 40, 65, 29, 52, 33, 84, 47, 58, 22, 69, 38, 74, 41];

/**
 * 迷你趋势线组件
 */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 60;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

/**
 * 骨架屏加载卡片组件
 */
function SkeletonCard({ gradient }: { gradient: string }) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-card/50">
      <CardContent className="p-0">
        <div className={`h-1 bg-gradient-to-r ${gradient}`} />
        <div className="p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-muted/30 animate-pulse" />
            <div className="w-12 h-5 rounded-full bg-muted/30 animate-pulse" />
          </div>
          <div className="w-16 h-7 rounded bg-muted/30 animate-pulse" />
          <div className="w-20 h-3 rounded bg-muted/30 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t, locale } = useAdminI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || "http://192.168.100.119:5666/api_trai/v1"}/admin/dashboard`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      if (res.status === 401) {
        Cookies.remove("token");
        Cookies.remove("refresh_token");
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) {
        await res.json().catch(() => null);
        return;
      }
      const data = (await res.json()) as { stats: DashboardStats; trends?: DailyTrend[] };
      setStats(data.stats);
      setTrends(data.trends ?? []);
      setLastUpdated(new Date());
    } catch {
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const t = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(t);
  }, [fetchData]);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const greeting =
    !now ? t("admin.dashboard.greeting.morning") :
    now.getHours() < 11 ? t("admin.dashboard.greeting.morning") :
    now.getHours() < 14 ? t("admin.dashboard.greeting.noon") :
    now.getHours() < 18 ? t("admin.dashboard.greeting.afternoon") : t("admin.dashboard.greeting.evening");

  if (loading) {
    return (
      <div className="space-y-5 page-enter">
        {/* 骨架屏: 顶部 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-48 h-8 rounded-lg bg-muted/40 animate-pulse" />
            <div className="w-72 h-4 rounded bg-muted/25 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-28 h-9 rounded-lg bg-muted/40 animate-pulse" />
            <div className="w-28 h-9 rounded-lg bg-muted/40 animate-pulse" />
          </div>
        </div>
        {/* 骨架屏: 数据卡片 2x4 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((card) => (
            <SkeletonCard key={card.key} gradient={card.gradient} />
          ))}
        </div>
        {/* 骨架屏: 图表 */}
        <Card className="border-0 shadow-sm bg-card/50">
          <CardHeader className="pb-3"><div className="w-40 h-5 rounded bg-muted/25 animate-pulse" /></CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-32">
              {skeletonChartHeights.map((h, i) => (
                <div key={i} className="flex-1 bg-muted/25 rounded-t-sm animate-pulse" style={{ height: `${h}%` }} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxAgentCalls = Math.max(...trends.map((t) => t.agent_calls), 1);
  const chartBars = trends.slice(-20);

  return (
    <div className="space-y-5 page-enter">
      {/* ===== 顶部区域 ===== */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">&#x1F44B;</span>
            {greeting}, {t("admin.dashboard.admin")}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            {now && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {now.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            {lastUpdated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("admin.dashboard.updated_to")} {lastUpdated.toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-2 text-sm shadow-sm border-border/60 text-muted-foreground hover:bg-muted/50"
            onClick={fetchData}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("admin.dashboard.refresh")}
          </Button>
          <Button
            size="sm"
            className="h-9 gap-2 text-sm shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
            onClick={() => router.push("/admin/analytics")}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {t("admin.dashboard.view_report")}
          </Button>
        </div>
      </div>

      {/* ===== 数据卡片（紧凑 2x4）====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const val = stats ? stats[card.key] : 0;
          return (
            <Card
              key={card.key}
              className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-card/80 backdrop-blur-sm group"
            >
              <CardContent className="p-0">
                {/* 顶部渐变条 */}
                <div className={`h-1 bg-gradient-to-r ${card.gradient}`} />
                <div className="p-3.5">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <card.icon className={`h-4 w-4 ${card.badge.replace("bg-", "text-").split(" ")[0]}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.badge} flex items-center gap-0.5`}>
                        <ArrowUp className="h-2.5 w-2.5" />
                        {card.trend}
                      </span>
                      <Sparkline data={card.sparkline} color={card.badge.split(" ")[0].replace("bg-", "rgb(").replace("500/15", ")").replace("blue", "59,130,246").replace("emerald", "16,185,129").replace("indigo", "99,102,241").replace("cyan", "6,182,212").replace("orange", "249,115,22").replace("pink", "236,72,153").replace("amber", "245,158,11").replace("teal", "20,184,166")} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1.5 tabular-nums">
                    {typeof val === "number" ? val.toLocaleString() : val}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground leading-none flex items-center gap-1">
                    <div className={`w-1 h-1 rounded-full ${card.badge.replace("bg-", "bg-").split(" ")[0]}`} />
                    {t(card.label)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ===== 图表 + 系统状态 + 摘要 3列 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 近 30 天趋势 */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                {t("admin.dashboard.agent_trend")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("admin.dashboard.total_calls")} {chartBars.reduce((s, t) => s + t.agent_calls, 0).toLocaleString()} {t("admin.dashboard.calls")}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-sm bg-gradient-to-r from-blue-500 to-blue-600 inline-block" />
                {t("admin.dashboard.agent_trend_label")}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-28">
              {chartBars.map((bar, i) => {
                const height = (bar.agent_calls / maxAgentCalls) * 100;
                const date = new Date(bar.date);
                const label = `${date.getMonth() + 1}/${date.getDate()}`;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-0.5 group"
                  >
                    <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity leading-none bg-slate-900 dark:bg-slate-700 text-white px-1.5 py-0.5 rounded mb-0.5">
                      {bar.agent_calls}
                    </span>
                    <div
                      className="w-full rounded-t-sm transition-all duration-300 bg-gradient-to-t from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/30 cursor-pointer"
                      style={{ height: `${Math.max(3, height)}%` }}
                      title={`${label}: ${bar.agent_calls} ${t("admin.dashboard.calls")}`}
                    />
                    {i % 5 === 0 && (
                      <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 系统服务状态 */}
        <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              {t("admin.dashboard.service_status")}
            </CardTitle>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("admin.dashboard.all_ok")}
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.map((svc) => {
              const ok = svc.status === "ok";
              return (
                <div
                  key={svc.nameKey}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/25 hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ok ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                    <svc.icon className={`h-4 w-4 ${ok ? "text-emerald-400" : "text-amber-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground/90">{t(svc.nameKey)}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" />
                      {svc.latency} &middot; {svc.uptime}
                    </p>
                  </div>
                  {ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ===== 底部: 数据摘要 + 每日明细 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 数据摘要 */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              {t("admin.dashboard.key_metrics")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { labelKey: "admin.dashboard.user_growth", valueKey: "admin.dashboard.new_this_month_sub", descKey: "admin.dashboard.new_this_month", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: TrendingUp },
              { labelKey: "admin.dashboard.vip_ratio", valueKey: "vip_pct", descKey: "admin.dashboard.paid_conversion", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Star },
              { labelKey: "admin.dashboard.agent_total", valueKey: "agent_total", descKey: "admin.dashboard.total_history", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Bot },
              { labelKey: "admin.dashboard.avg_session", valueKey: "avg_session", descKey: "admin.dashboard.msg_per_session", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: MessageSquare },
              { labelKey: "admin.dashboard.upload_total", valueKey: "upload_total", descKey: "admin.dashboard.file_storage", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", icon: Upload },
            ].map((item) => {
              let displayValue = "—";
              let actualValue = "—";
              if (stats) {
                if (item.labelKey === "admin.dashboard.user_growth") {
                  actualValue = `+${stats.new_users_this_month}`;
                  displayValue = `+${stats.new_users_this_month}`;
                } else if (item.labelKey === "admin.dashboard.vip_ratio") {
                  actualValue = ((stats.vip_users / Math.max(stats.total_users, 1)) * 100).toFixed(1) + "%";
                  displayValue = actualValue;
                } else if (item.labelKey === "admin.dashboard.agent_total") {
                  actualValue = stats.total_agent_tool_calls.toLocaleString();
                  displayValue = actualValue;
                } else if (item.labelKey === "admin.dashboard.avg_session") {
                  actualValue = Math.round(stats.total_messages / Math.max(stats.total_sessions, 1)).toString();
                  displayValue = actualValue;
                } else if (item.labelKey === "admin.dashboard.upload_total") {
                  actualValue = stats.total_uploads.toLocaleString();
                  displayValue = actualValue;
                }
              }
              return (
                <div
                  key={item.labelKey}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/25 transition-colors border ${item.border}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.bg}`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground/90">{t(item.labelKey)}</p>
                    <p className="text-[11px] text-muted-foreground">{t(item.descKey)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${item.color}`}>{displayValue}</p>
                    {item.labelKey === "admin.dashboard.user_growth" && <ArrowUp className="h-3 w-3 text-emerald-500 ml-auto" />}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 每日明细 */}
        <Card className="lg:col-span-3 border-0 shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-500" />
              {t("admin.dashboard.daily_detail")}
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => router.push("/admin/analytics")}>
              <Eye className="h-3 w-3" />
              {t("admin.dashboard.view_all")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left pb-2.5 font-semibold text-muted-foreground uppercase tracking-wide">{t("admin.dashboard.date")}</th>
                    <th className="text-right pb-2.5 font-semibold text-muted-foreground uppercase tracking-wide">{t("admin.dashboard.users")}</th>
                    <th className="text-right pb-2.5 font-semibold text-muted-foreground uppercase tracking-wide">{t("admin.dashboard.sessions")}</th>
                    <th className="text-right pb-2.5 font-semibold text-muted-foreground uppercase tracking-wide">{t("admin.dashboard.messages")}</th>
                    <th className="text-right pb-2.5 font-semibold text-muted-foreground uppercase tracking-wide">Agent</th>
                    <th className="text-right pb-2.5 font-semibold text-muted-foreground uppercase tracking-wide">{t("admin.dashboard.health")}</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.slice(-8).reverse().map((t) => {
                    const rate = Math.min((t.agent_calls / Math.max(maxAgentCalls, 1)) * 100, 100);
                    const health =
                      rate > 70
                        ? { bar: "bg-gradient-to-r from-emerald-400 to-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10" }
                        : rate > 40
                        ? { bar: "bg-gradient-to-r from-amber-400 to-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" }
                        : { bar: "bg-gradient-to-r from-red-400 to-red-500", text: "text-red-400", bg: "bg-red-500/10" };
                    return (
                      <tr
                        key={t.date}
                        className="border-b border-border/40 hover:bg-muted/25 transition-colors"
                      >
                        <td className="py-2.5 text-foreground/80 font-medium">{t.date}</td>
                        <td className="py-2.5 text-right text-emerald-500 font-medium">+{t.users}</td>
                        <td className="py-2.5 text-right text-muted-foreground">{t.sessions.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-muted-foreground">{t.messages.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-semibold text-foreground">{t.agent_calls.toLocaleString()}</td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-14 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${health.bar}`} style={{ width: `${rate}%` }} />
                            </div>
                            <span className={`text-xs font-medium w-8 text-right ${health.text}`}>{rate.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
