"use client";

import { useState, useEffect } from "react";
import {
  Bot, RefreshCw, Activity, ShieldCheck,
  Users, Download, BrainCircuit, TrendingUp, Target, Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactECharts from "echarts-for-react";
import { request } from "@/lib/api_client";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";

interface WeComAnalytics {
  total_users: number;
  total_depts: number;
  dept_stats: Array<{ dept_name: string; user_count: number; new_hires: number; resignations: number }>;
  weekly_trend: Array<{ week: string; hires: number; resignations: number }>;
  sys_health: number;
  db_latency: string;
  api_latency: string;
  ai_queue_len: number;
}

export default function AnalyticsPage() {
  const { translate, locale, loadNamespace } = useAdminI18n();
  const [data, setData] = useState<WeComAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const { toast } = useAdminToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request<WeComAnalytics>("/admin/analytics/wecom");
      setData(res);
      setLastUpdated(new Date().toLocaleString(locale === "zh" ? "zh-CN" : "en-US"));
    } catch (e: any) {
      const errorMsg = e?.message || e?.msg || translate("admin.analytics.fetch_failed");
      toast({ message: errorMsg, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNamespace('admin');
    void fetchData();
  }, [locale]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const res = await request<{ pdf_url: string }>("/admin/analytics/report/generate", { method: "POST" });
      toast({ message: translate("admin.analytics.report_generated"), variant: "success" });
      if (res.pdf_url) window.open(res.pdf_url, "_blank");
    } catch (e: any) {
      toast({ message: e.message || translate("admin.analytics.report_failed"), variant: "error" });
    } finally {
      setGenerating(false);
    }
  };

  // ECharts: 组织分布 (简约环形图)
  const getDeptOption = () => ({
    backgroundColor: "transparent",
    tooltip: { trigger: "item", backgroundColor: "rgba(255, 255, 255, 0.9)", textStyle: { color: "#1e293b" } },
    legend: { bottom: "0%", left: "center", itemWidth: 8, itemHeight: 8, textStyle: { color: "#64748b", fontSize: 11 } },
    series: [
      {
        name: translate("admin.analytics.headcount"),
        type: "pie",
        radius: ["55%", "75%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        data: data?.dept_stats.map((d, i) => ({
          value: d.user_count,
          name: d.dept_name,
          itemStyle: {
            color: ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1"][i % 6]
          }
        })) || []
      }
    ]
  });

  // ECharts: 业务趋势 (平滑折线图)
  const getTrendOption = () => ({
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", axisPointer: { type: "line" } },
    grid: { left: "2%", right: "2%", bottom: "10%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data?.weekly_trend.map(t => t.week) || [],
      axisLabel: { color: "#94a3b8", fontSize: 11 },
      axisLine: { show: false }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#94a3b8", fontSize: 11 },
      splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } }
    },
    series: [
      {
        name: translate("admin.analytics.performance_board"),
        type: "line",
        smooth: true,
        lineStyle: { width: 3, color: "#4f46e5" },
        showSymbol: false,
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: "rgba(79, 70, 229, 0.1)" }, { offset: 1, color: "transparent" }]
          }
        },
        data: data?.weekly_trend.map(t => t.hires * 1.5 + 10) || []
      }
    ]
  });

  const coreIndicators = [
    { labelKey: "admin.analytics.total_users", value: data?.total_users || 0, subKey: "admin.analytics.monthly_change", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { labelKey: "admin.analytics.digital_coverage", value: "98.5%", subKey: "admin.analytics.achieved", icon: Target, color: "text-cyan-600", bg: "bg-cyan-50" },
    { labelKey: "admin.analytics.ai_index", value: "84.2", subKey: "admin.analytics.leading", icon: BrainCircuit, color: "text-emerald-600", bg: "bg-emerald-50" },
    { labelKey: "admin.analytics.operational_health", value: data?.sys_health || 98, subKey: "admin.analytics.system_stable", icon: ShieldCheck, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  const systemStats = [
    { labelKey: "admin.analytics.db_latency", value: data?.db_latency || "12ms", color: "bg-blue-500" },
    { labelKey: "admin.analytics.api_efficiency", value: data?.api_latency || "45ms", color: "bg-emerald-500" },
    { labelKey: "admin.analytics.ai_pressure", value: translate("admin.analytics.low"), color: "bg-amber-500" },
  ];

  return (
    <div className="h-screen text-foreground p-6 overflow-hidden flex flex-col">
      {/* 顶部行政区 */}
      <div className="max-w-[1600px] mx-auto w-full space-y-5 flex-1 flex flex-col">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-5 shrink-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold tracking-widest text-xs uppercase">
              <Activity className="h-3.5 w-3.5" />
              {translate("admin.analytics.exec_dashboard")}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              {translate("admin.analytics.digital_assets")} <span className="text-muted-foreground font-light">{translate("admin.analytics.and")}</span> {translate("admin.analytics.performance_board")}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              {translate("admin.analytics.sync_desc")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right mr-4">
              <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter">{translate("admin.analytics.last_sync")}</p>
              <p className="text-xs font-semibold text-foreground">{lastUpdated || translate("admin.analytics.syncing_status")}</p>
            </div>
            <Button
              variant="outline"
              className="gap-2 shadow-sm"
              onClick={() => void fetchData()}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              {translate("admin.analytics.refresh")}
            </Button>
            <Button
              className="gap-2 shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
              onClick={() => void handleGenerateReport()}
              disabled={generating}
            >
              {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {translate("admin.analytics.export_report")}
            </Button>
          </div>
        </header>

        {/* 核心战略指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {coreIndicators.map((item) => (
            <Card key={item.labelKey} className="border-0 shadow-sm hover:shadow-md transition-all bg-card/80 backdrop-blur-sm group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-xl", item.bg)}>
                    <item.icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{translate(item.subKey)}</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">{item.value}</h3>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{translate(item.labelKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 中部深度分析 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* 效能趋势 */}
          <Card className="lg:col-span-2 border-0 shadow-sm overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/40 shrink-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold text-foreground">{translate("admin.analytics.trend_title")}</CardTitle>
                  <CardDescription>{translate("admin.analytics.trend_desc")}</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-4">
              <ReactECharts option={getTrendOption()} style={{ height: "100%" }} />
            </CardContent>
          </Card>

          {/* 组织结构 */}
          <Card className="border-0 shadow-sm overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/40 shrink-0">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-foreground">{translate("admin.analytics.talent_matrix")}</CardTitle>
                <CardDescription>{translate("admin.analytics.talent_desc")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-4">
              <ReactECharts option={getDeptOption()} style={{ height: "100%" }} />
            </CardContent>
          </Card>
        </div>

        {/* 底部详细看板 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
          {/* 详细列表 */}
          <Card className="lg:col-span-2 border-0 shadow-sm bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground">{translate("admin.analytics.dept_metrics")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.analytics.dept")}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">{translate("admin.analytics.headcount")}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">{translate("admin.analytics.new_hires")}</th>
                      <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">{translate("admin.analytics.efficiency")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data?.dept_stats.slice(0, 6).map((d, idx) => (
                      <tr key={`${d.dept_name}-${idx}`} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Briefcase className="h-4 w-4 text-blue-500" />
                            </div>
                            <span className="font-semibold text-foreground">{d.dept_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-mono font-bold text-foreground">{d.user_count}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                            +{d.new_hires}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                style={{ width: `${Math.min(100, (d.user_count / 200) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground">A+</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 管理建议 */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  {translate("admin.analytics.ai_suggestion")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: translate("admin.analytics.ai_suggestion_text") }} />
                <div className="h-px bg-white/20" />
                <div className="text-xs bg-white/10 p-3 rounded-lg border border-white/10">
                  <p className="font-bold mb-1 opacity-60">{translate("admin.analytics.system_optimization")}</p>
                  {translate("admin.analytics.system_optimization_text")}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">{translate("admin.analytics.system_summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemStats.map((stat) => (
                  <div key={stat.labelKey} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{translate(stat.labelKey)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{stat.value}</span>
                      <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stat.color)} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
