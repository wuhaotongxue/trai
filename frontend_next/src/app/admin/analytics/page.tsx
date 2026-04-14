/**
 * page.tsx
 * 数据分析页面
 */

"use client";

import { useState } from "react";
import { BarChart3, Bot, Calendar, Download, MessageSquare, PieChart, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const chartData = [
  { label: "1月", users: 120, sessions: 840, agent: 2300 },
  { label: "2月", users: 198, sessions: 1210, agent: 4100 },
  { label: "3月", users: 275, sessions: 1680, agent: 6200 },
  { label: "4月", users: 312, sessions: 2040, agent: 8900 },
  { label: "5月", users: 398, sessions: 2650, agent: 12100 },
  { label: "6月", users: 465, sessions: 3100, agent: 15800 },
];

const topFeatures = [
  { name: "多工具 Agent", calls: 4821, pct: 38, color: "from-blue-500 to-blue-600" },
  { name: "视觉理解 Vision", calls: 3102, pct: 24, color: "from-emerald-500 to-emerald-600" },
  { name: "智能自我纠错", calls: 2144, pct: 17, color: "from-amber-500 to-amber-600" },
  { name: "流式响应", calls: 1802, pct: 14, color: "from-indigo-500 to-indigo-600" },
  { name: "文件上传", calls: 821, pct: 7, color: "from-pink-500 to-pink-600" },
];

const deviceData = [
  { label: "桌面端", pct: 62, color: "bg-blue-500" },
  { label: "移动端", pct: 28, color: "bg-emerald-500" },
  { label: "平板", pct: 10, color: "bg-amber-500" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("近30天");

  return (
    <div className="space-y-5">
      {/* 顶部 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">数据分析</h1>
          <p className="text-sm text-muted-foreground mt-0.5">多维度业务数据洞察与趋势分析</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg p-1 border border-border/60">
            {["近7天", "近30天", "近90天", "自定义"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  period === p
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border">
            <Download className="h-3.5 w-3.5" />
            导出报告
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "新增用户", value: "+128", delta: "+18%", up: true, icon: Users, gradient: "from-blue-500 to-blue-600" },
          { label: "活跃会话", value: "3,241", delta: "+23%", up: true, icon: MessageSquare, gradient: "from-emerald-500 to-emerald-600" },
          { label: "Agent 调用", value: "41,928", delta: "+31%", up: true, icon: Bot, gradient: "from-orange-500 to-orange-600" },
          { label: "平均响应", value: "1.2s", delta: "-8%", up: true, icon: TrendingDown, gradient: "from-indigo-500 to-indigo-600" },
        ].map((card) => (
          <Card key={card.label} className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className={`h-1 bg-gradient-to-r ${card.gradient}`} />
              <div className="p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      card.gradient.includes("blue")
                        ? "bg-blue-500/15 text-blue-400"
                        : card.gradient.includes("emerald")
                          ? "bg-emerald-500/15 text-emerald-400"
                          : card.gradient.includes("orange")
                            ? "bg-orange-500/15 text-orange-400"
                            : "bg-indigo-500/15 text-indigo-400"
                    )}
                  >
                    <card.icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      card.up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                    )}
                  >
                    {card.delta}
                  </span>
                </div>
                <p className="text-xl font-bold text-foreground leading-none">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 趋势图表 + 功能使用分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">用户增长趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chartData.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6 text-right">{row.label}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-5 bg-muted/40 rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded transition-all" style={{ width: `${(row.users / 465) * 100}%` }} />
                    </div>
                    <span className="text-xs text-foreground/80 font-medium w-20">{row.users} 人</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-5 bg-muted/40 rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded transition-all" style={{ width: `${(row.sessions / 3100) * 100}%` }} />
                    </div>
                    <span className="text-xs text-foreground/80 font-medium w-20">{row.sessions} 会话</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-5 bg-muted/40 rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded transition-all" style={{ width: `${(row.agent / 15800) * 100}%` }} />
                    </div>
                    <span className="text-xs text-foreground/80 font-medium w-20">{row.agent.toLocaleString()} 调用</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-blue-400 inline-block" />用户数</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-emerald-400 inline-block" />会话数</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-orange-400 inline-block" />Agent调用</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能使用分布 */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">功能使用分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topFeatures.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground/90">{f.name}</span>
                  <span className="text-muted-foreground">{f.calls.toLocaleString()} 次 · {f.pct}%</span>
                </div>
                <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${f.color} transition-all`}
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="border-t border-border/60 pt-3">
              <p className="text-xs text-muted-foreground mb-2">访问设备</p>
              {deviceData.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-foreground/80">{d.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div className={`h-full ${d.color} rounded`} style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-muted-foreground w-8 text-right">{d.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
