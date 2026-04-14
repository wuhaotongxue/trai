/**
 * page.tsx
 * 管理员仪表盘
 * - 企业级 SaaS 规范：高信息密度、骨架屏、情感化文案、多彩紧凑布局
 */

"use client";

import { useEffect, useState } from "react";
import {
  Users,
  MessageSquare,
  Bot,
  Upload,
  TrendingUp,
  Zap,
  ArrowUp,
  ArrowDown,
  Activity,
  Clock,
  RefreshCw,
  Eye,
  Star,
  FileText,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Cpu,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

// 多彩紧凑数据卡片
const statCards = [
  {
    label: "总用户数",
    key: "total_users" as const,
    icon: Users,
    gradient: "from-blue-500 to-blue-600",
    badge: "bg-blue-50 text-blue-600",
    trend: "+18",
  },
  {
    label: "今日活跃",
    key: "active_users_today" as const,
    icon: Activity,
    gradient: "from-emerald-500 to-emerald-600",
    badge: "bg-emerald-50 text-emerald-600",
    trend: "+5",
  },
  {
    label: "总会话数",
    key: "total_sessions" as const,
    icon: MessageSquare,
    gradient: "from-indigo-500 to-indigo-600",
    badge: "bg-indigo-50 text-indigo-600",
    trend: "+32",
  },
  {
    label: "总消息数",
    key: "total_messages" as const,
    icon: FileText,
    gradient: "from-cyan-500 to-cyan-600",
    badge: "bg-cyan-50 text-cyan-600",
    trend: "+89",
  },
  {
    label: "Agent 调用",
    key: "total_agent_tool_calls" as const,
    icon: Bot,
    gradient: "from-orange-500 to-orange-600",
    badge: "bg-orange-50 text-orange-600",
    trend: "+42",
  },
  {
    label: "文件上传",
    key: "total_uploads" as const,
    icon: Upload,
    gradient: "from-pink-500 to-pink-600",
    badge: "bg-pink-50 text-pink-600",
    trend: "+12",
  },
  {
    label: "VIP 用户",
    key: "vip_users" as const,
    icon: Star,
    gradient: "from-amber-500 to-amber-600",
    badge: "bg-amber-50 text-amber-600",
    trend: "+3",
  },
  {
    label: "本月新增",
    key: "new_users_this_month" as const,
    icon: TrendingUp,
    gradient: "from-teal-500 to-teal-600",
    badge: "bg-teal-50 text-teal-600",
    trend: "+28",
  },
];

// 系统服务状态
const services = [
  { name: "API 服务", icon: Wifi, status: "ok", latency: "12ms", uptime: "99.98%" },
  { name: "Agent 引擎", icon: Bot, status: "ok", latency: "45ms", uptime: "99.95%" },
  { name: "数据库", icon: Database, status: "ok", latency: "3ms", uptime: "99.99%" },
  { name: "模型服务", icon: Cpu, status: "warn", latency: "380ms", uptime: "98.72%" },
];

function SkeletonCard() {
  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="h-1.5 bg-slate-200 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-slate-100 animate-pulse" />
            <div className="w-12 h-5 rounded-full bg-slate-100 animate-pulse" />
          </div>
          <div className="w-16 h-7 rounded bg-slate-100 animate-pulse" />
          <div className="w-20 h-3 rounded bg-slate-100 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api"}/admin/dashboard`
    )
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setTrends(data.trends || []);
        setLastUpdated(new Date());
      })
      .catch(() => {
        // 静默失败，保持骨架屏
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const now = new Date();
  const greeting =
    now.getHours() < 11 ? "早安" :
    now.getHours() < 14 ? "午安" :
    now.getHours() < 18 ? "下午好" : "晚上好";

  if (loading) {
    return (
      <div className="space-y-5">
        {/* 骨架屏：顶部 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="w-40 h-7 rounded bg-slate-200 animate-pulse" />
            <div className="w-64 h-4 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-28 h-9 rounded-lg bg-slate-200 animate-pulse" />
            <div className="w-28 h-9 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
        {/* 骨架屏：数据卡片 2x4 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        {/* 骨架屏：图表 */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><div className="w-40 h-5 rounded bg-slate-100 animate-pulse" /></CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-32">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="flex-1 bg-slate-100 rounded-t-sm animate-pulse" style={{ height: `${Math.random() * 80 + 10}%` }} />
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
    <div className="space-y-5">
      {/* ===== 顶部区域 ===== */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}，管理员
            <span className="ml-2 text-blue-500 text-lg">👋</span>
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {now.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {lastUpdated && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                数据已更新至 {lastUpdated.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-2 text-sm shadow-sm border-slate-200 text-slate-600"
            onClick={fetchData}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            刷新数据
          </Button>
          <Button size="sm" className="h-9 gap-2 text-sm shadow-sm">
            <TrendingUp className="h-3.5 w-3.5" />
            查看报表
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
              className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-0">
                <div className={`h-1.5 bg-gradient-to-r ${card.gradient}`} />
                <div className="p-3.5">
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${card.gradient.replace("from-", "").split("-")[0] === card.gradient.split(" ")[0].split("-")[1] ? "" : ""}` }}
                    >
                      <card.icon className={`h-4.5 w-4.5 ${card.badge.replace("bg-", "text-").split(" ")[0]}`} />
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.badge}`}>
                      ↑ {card.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 leading-none mb-1.5">
                    {typeof val === "number" ? val.toLocaleString() : val}
                  </p>
                  <p className="text-xs font-medium text-slate-500 leading-none">
                    {card.label}
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
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">
                近 30 天 Agent 调用趋势
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                共 {chartBars.reduce((s, t) => s + t.agent_calls, 0).toLocaleString()} 次调用
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-sm bg-gradient-to-r from-blue-500 to-blue-600 inline-block" />
                Agent 调用
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-28">
              {chartBars.map((t, i) => {
                const height = (t.agent_calls / maxAgentCalls) * 100;
                const date = new Date(t.date);
                const label = `${date.getMonth() + 1}/${date.getDate()}`;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-0.5 group"
                  >
                    <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                      {t.agent_calls}
                    </span>
                    <div
                      className="w-full rounded-t-sm transition-all duration-300 bg-gradient-to-t from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                      style={{ height: `${Math.max(3, height)}%` }}
                      title={`${label}: ${t.agent_calls} 次调用`}
                    />
                    {i % 5 === 0 && (
                      <span className="text-[9px] text-slate-400 leading-none">{label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 系统服务状态 */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">服务状态</CardTitle>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              全部正常
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.map((svc) => {
              const ok = svc.status === "ok";
              return (
                <div
                  key={svc.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ok ? "bg-emerald-50" : "bg-amber-50"}`}>
                    <svc.icon className={`h-3.5 w-3.5 ${ok ? "text-emerald-600" : "text-amber-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700">{svc.name}</p>
                    <p className="text-xs text-slate-400">{svc.latency} · {svc.uptime}</p>
                  </div>
                  {ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ===== 底部：数据摘要 + 每日明细 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 数据摘要 */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">关键指标</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "用户增长", value: stats ? `+${stats.new_users_this_month}` : "—", desc: "本月新增", color: "text-emerald-600", bg: "bg-emerald-50", icon: TrendingUp },
              { label: "VIP 占比", value: stats ? `${((stats.vip_users / Math.max(stats.total_users, 1)) * 100).toFixed(1)}%` : "—", desc: "付费转化率", color: "text-amber-600", bg: "bg-amber-50", icon: Star },
              { label: "Agent 总调用", value: stats ? stats.total_agent_tool_calls.toLocaleString() : "—", desc: "历史累计", color: "text-blue-600", bg: "bg-blue-50", icon: Bot },
              { label: "平均会话", value: stats ? Math.round(stats.total_messages / Math.max(stats.total_sessions, 1)).toString() : "—", desc: "每会话消息数", color: "text-indigo-600", bg: "bg-indigo-50", icon: MessageSquare },
              { label: "上传总量", value: stats ? stats.total_uploads.toLocaleString() : "—", desc: "文件存储", color: "text-pink-600", bg: "bg-pink-50", icon: Upload },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                  {item.label === "用户增长" && <ArrowUp className="h-3 w-3 text-emerald-500 ml-auto" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 每日明细 */}
        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">每日明细</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-slate-500">
              <Eye className="h-3 w-3" />
              查看全部
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left pb-2.5 font-semibold text-slate-400 uppercase tracking-wide">日期</th>
                    <th className="text-right pb-2.5 font-semibold text-slate-400 uppercase tracking-wide">用户</th>
                    <th className="text-right pb-2.5 font-semibold text-slate-400 uppercase tracking-wide">会话</th>
                    <th className="text-right pb-2.5 font-semibold text-slate-400 uppercase tracking-wide">消息</th>
                    <th className="text-right pb-2.5 font-semibold text-slate-400 uppercase tracking-wide">Agent</th>
                    <th className="text-right pb-2.5 font-semibold text-slate-400 uppercase tracking-wide">健康度</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.slice(-8).reverse().map((t, i) => {
                    const rate = Math.min((t.agent_calls / Math.max(maxAgentCalls, 1)) * 100, 100);
                    const health =
                      rate > 70
                        ? { bar: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" }
                        : rate > 40
                        ? { bar: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" }
                        : { bar: "bg-red-500", text: "text-red-600", bg: "bg-red-50" };
                    return (
                      <tr
                        key={t.date}
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2 text-slate-600 font-medium">{t.date}</td>
                        <td className="py-2 text-right text-slate-500">+{t.users}</td>
                        <td className="py-2 text-right text-slate-500">{t.sessions.toLocaleString()}</td>
                        <td className="py-2 text-right text-slate-500">{t.messages.toLocaleString()}</td>
                        <td className="py-2 text-right font-semibold text-slate-800">{t.agent_calls.toLocaleString()}</td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-14 h-1 bg-slate-100 rounded-full overflow-hidden">
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
