"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Clock, Globe, RefreshCw, Signal, XCircle, Cpu, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/api_client";

interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  network_sent: number;
  network_recv: number;
}

export default function NetworkPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await request<SystemStats>("/admin/monitor/system");
      setStats(res);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Fetch system stats failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">服务器状态</h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            上次检测: {lastRefresh.toLocaleTimeString("zh-CN")} (每 5s 自动刷新)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={fetchStats}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            重新检测
          </Button>
        </div>
      </div>

      {/* 硬件状态总览 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "CPU 使用率", value: `${stats?.cpu_percent || 0}%`, icon: Cpu, color: "text-blue-400", bg: "bg-blue-500/15" },
          { label: "内存 使用率", value: `${stats?.memory_percent || 0}%`, icon: Signal, color: "text-emerald-400", bg: "bg-emerald-500/15" },
          { label: "磁盘 占用率", value: `${stats?.disk_percent || 0}%`, icon: HardDrive, color: "text-amber-400", bg: "bg-amber-500/15" },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{item.value}</p>
                <p className={`text-xs font-medium ${item.color}`}>{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 网络流量 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">实时网络流量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">总发送流量</span>
                <span className="font-mono text-foreground">{( (stats?.network_sent || 0) / 1024 / 1024 / 1024 ).toFixed(2)} GB</span>
              </div>
              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[65%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">总接收流量</span>
                <span className="font-mono text-foreground">{( (stats?.network_recv || 0) / 1024 / 1024 / 1024 ).toFixed(2)} GB</span>
              </div>
              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[45%]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
