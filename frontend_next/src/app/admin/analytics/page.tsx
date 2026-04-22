"use client";

import { useState, useEffect } from "react";
import { Bot, Download, MessageSquare, TrendingDown, Users, RefreshCw, BarChart3, PieChart as PieIcon, LineChart as LineIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactECharts from "echarts-for-react";
import { request } from "@/lib/api_client";
import { useToast } from "@/components/toast/use_toast";

interface WeComAnalytics {
  total_users: number;
  total_depts: number;
  dept_stats: Array<{ dept_name: string; user_count: number; new_hires: number; resignations: number }>;
  weekly_trend: Array<{ week: string; hires: number; resignations: number }>;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("近30天");
  const [data, setData] = useState<WeComAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request<WeComAnalytics>("/admin/analytics/wecom");
      setData(res);
    } catch (e) {
      console.error("Fetch analytics failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const res = await request<{ pdf_url: string }>("/admin/analytics/report/generate", { method: "POST" });
      toast({ message: "AI 报告生成成功", variant: "success" });
      if (res.pdf_url) window.open(res.pdf_url, "_blank");
    } catch (e: any) {
      toast({ message: e.message || "生成报告失败", variant: "error" });
    } finally {
      setGenerating(false);
    }
  };

  // ECharts 配置: 部门分布
  const getDeptOption = () => ({
    tooltip: { trigger: "item" },
    legend: { bottom: "0%", left: "center", textStyle: { color: "#94a3b8", fontSize: 10 } },
    series: [
      {
        name: "部门人数",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: "transparent", borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 12, fontWeight: "bold" } },
        data: data?.dept_stats.map(d => ({ value: d.user_count, name: d.dept_name })) || []
      }
    ]
  });

  // ECharts 配置: 入职离职趋势
  const getTrendOption = () => ({
    tooltip: { trigger: "axis" },
    legend: { data: ["入职", "离职"], textStyle: { color: "#94a3b8" } },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { type: "category", data: data?.weekly_trend.map(t => t.week) || [], axisLabel: { color: "#94a3b8" } },
    yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
    series: [
      { name: "入职", type: "bar", data: data?.weekly_trend.map(t => t.hires) || [], itemStyle: { color: "#3b82f6" } },
      { name: "离职", type: "bar", data: data?.weekly_trend.map(t => t.resignations) || [], itemStyle: { color: "#ef4444" } }
    ]
  });

  return (
    <div className="space-y-5 bg-[#0b0f1a] p-6 min-h-screen text-slate-200">
      {/* 顶部 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            企业数字化大屏分析
          </h1>
          <p className="text-sm text-slate-400 mt-1">多维度业务数据洞察与趋势分析</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" className="h-9 gap-2 border-slate-700 bg-slate-800/50 text-slate-300" onClick={fetchData}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            刷新数据
          </Button>
          <Button size="sm" className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" onClick={handleGenerateReport} disabled={generating}>
            {generating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
            AI 生成分析报告
          </Button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "全员人数", value: data?.total_users || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "活跃部门", value: data?.total_depts || 0, icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "本周入职", value: data?.dept_stats.reduce((acc, d) => acc + d.new_hires, 0) || 0, icon: TrendingDown, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "本周离职", value: 0, icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((card) => (
          <Card key={card.label} className="bg-slate-900/50 border-slate-800 shadow-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">{card.value}</p>
                <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <LineIcon className="h-4 w-4 text-blue-400" />
              入离职趋势分析 (周)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loading ? <div className="h-full flex items-center justify-center">加载中...</div> : (
              <ReactECharts option={getTrendOption()} style={{ height: "100%", width: "100%" }} />
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-emerald-400" />
              部门人员分布
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loading ? <div className="h-full flex items-center justify-center">加载中...</div> : (
              <ReactECharts option={getDeptOption()} style={{ height: "100%", width: "100%" }} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部详细数据列表 */}
      <Card className="bg-slate-900/50 border-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">部门详细指标</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-4 py-3 font-medium">部门名称</th>
                  <th className="px-4 py-3 font-medium text-right">总人数</th>
                  <th className="px-4 py-3 font-medium text-right">本周入职</th>
                  <th className="px-4 py-3 font-medium text-right">本周离职</th>
                  <th className="px-4 py-3 font-medium text-center">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.dept_stats.map((d) => (
                  <tr key={d.dept_name} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4 text-slate-300">{d.dept_name}</td>
                    <td className="px-4 py-4 text-right font-semibold text-white">{d.user_count}</td>
                    <td className="px-4 py-4 text-right text-blue-400">+{d.new_hires}</td>
                    <td className="px-4 py-4 text-right text-red-400">-{d.resignations}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        正常
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
