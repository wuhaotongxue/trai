/**
 * page.tsx
 * 系统监控页面
 */

"use client";

import { useState } from "react";
import {
  Activity,
  Server,
  Wifi,
  Cpu,
  Database,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const services = [
  { name: "API Gateway", icon: Server, status: "ok", uptime: "99.98%", latency: "8ms", requests: "12.4K/min" },
  { name: "Agent Engine", icon: Zap, status: "ok", uptime: "99.95%", latency: "45ms", requests: "2.1K/min" },
  { name: "PostgreSQL", icon: Database, status: "ok", uptime: "99.99%", latency: "3ms", requests: "—" },
  { name: "Redis Cache", icon: Database, status: "ok", uptime: "99.97%", latency: "1ms", requests: "—" },
  { name: "OpenAI API", icon: Cpu, status: "warn", uptime: "98.72%", latency: "380ms", requests: "892/min" },
  { name: "ModelScope", icon: Cpu, status: "ok", uptime: "99.45%", latency: "120ms", requests: "456/min" },
  { name: "S3 Storage", icon: HardDrive, status: "ok", uptime: "99.99%", latency: "15ms", requests: "—" },
  { name: "SSE Stream", icon: Wifi, status: "ok", uptime: "99.88%", latency: "—", requests: "1.2K/min" },
];

const metrics = [
  { label: "CPU 使用率", value: "23%", bar: "bg-emerald-500", ok: true },
  { label: "内存使用率", value: "41%", bar: "bg-emerald-500", ok: true },
  { label: "磁盘使用率", value: "58%", bar: "bg-amber-500", ok: false },
  { label: "网络 I/O", value: "1.2 GB/s", bar: "bg-blue-500", ok: true },
  { label: "API QPS", value: "128/s", bar: "bg-violet-500", ok: true },
  { label: "错误率", value: "0.12%", bar: "bg-emerald-500", ok: true },
];

export default function MonitorPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  return (
    <div className="space-y-5">
      {/* 顶部 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">系统监控</h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            上次刷新: {lastRefresh.toLocaleTimeString("zh-CN")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-slate-200" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            刷新状态
          </Button>
        </div>
      </div>

      {/* 主机指标 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-0 shadow-sm">
            <CardContent className="p-3.5">
              <p className="text-xs text-slate-500 mb-2">{m.label}</p>
              <p className={`text-lg font-bold ${m.ok ? "text-slate-900" : "text-amber-600"}`}>{m.value}</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${m.bar}`} style={{ width: m.label.includes("率") ? m.value.replace("%", "") + "%" : "60%" }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 服务状态表格 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">服务组件状态</CardTitle>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              正常
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              警告
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              故障
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((svc) => {
              const ok = svc.status === "ok";
              return (
                <div
                  key={svc.name}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ok ? "bg-emerald-50" : "bg-amber-50"}`}>
                    <svc.icon className={`h-5 w-5 ${ok ? "text-emerald-600" : "text-amber-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{svc.name}</p>
                      {ok ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>延迟 {svc.latency}</span>
                      {svc.requests !== "—" && <span>QPS {svc.requests}</span>}
                      <span className="font-medium text-slate-500">可用率 {svc.uptime}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${ok ? "text-emerald-600" : "text-amber-600"}`}>
                      {ok ? "运行中" : "响应慢"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}