/**
 * page.tsx
 * 数据库管理页面
 */

"use client";

import { useState } from "react";
import { CheckCircle2, Database, Download, HardDrive, RefreshCw, Table2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tables = [
  { name: "users", rows: 1248, size: "12 MB", engine: "InnoDB", charset: "utf8mb4", lastOptimize: "2026-04-09 03:00" },
  { name: "chat_sessions", rows: 8420, size: "85 MB", engine: "InnoDB", charset: "utf8mb4", lastOptimize: "2026-04-08 03:00" },
  { name: "messages", rows: 128400, size: "320 MB", engine: "InnoDB", charset: "utf8mb4", lastOptimize: "2026-04-07 03:00" },
  { name: "agent_tool_calls", rows: 482100, size: "180 MB", engine: "InnoDB", charset: "utf8mb4", lastOptimize: "2026-04-06 03:00" },
  { name: "upload_tasks", rows: 3240, size: "45 MB", engine: "InnoDB", charset: "utf8mb4", lastOptimize: "2026-04-05 03:00" },
  { name: "notifications", rows: 5680, size: "8 MB", engine: "InnoDB", charset: "utf8mb4", lastOptimize: "2026-04-04 03:00" },
];

const backups = [
  { name: "daily_backup_20260410", time: "2026-04-10 03:00", size: "512 MB", status: "done" },
  { name: "daily_backup_20260409", time: "2026-04-09 03:00", size: "498 MB", status: "done" },
  { name: "weekly_backup_20260406", time: "2026-04-06 03:00", size: "2.1 GB", status: "done" },
  { name: "daily_backup_20260408", time: "2026-04-08 03:00", size: "505 MB", status: "done" },
];

export default function DatabasePage() {
  const [optimizing, setOptimizing] = useState(false);

  const handleOptimize = () => {
    setOptimizing(true);
    setTimeout(() => setOptimizing(false), 3000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">数据库管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">PostgreSQL 16.2 · 连接状态正常</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={handleOptimize}>
            <RefreshCw className={`h-3.5 w-3.5 ${optimizing ? "animate-spin" : ""}`} />
            {optimizing ? "优化中..." : "优化表"}
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border">
            <Download className="h-3.5 w-3.5" />
            导出备份
          </Button>
          <Button size="sm" className="h-9 gap-2 text-sm shadow-sm bg-red-600 hover:bg-red-700">
            <Upload className="h-3.5 w-3.5" />
            手动备份
          </Button>
        </div>
      </div>

      {/* 数据库概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "总表数", value: "6", icon: Table2, color: "text-blue-400", bg: "bg-blue-500/15" },
          { label: "总记录数", value: "623,128", icon: Database, color: "text-emerald-400", bg: "bg-emerald-500/15" },
          { label: "总占用", value: "650 MB", icon: HardDrive, color: "text-amber-400", bg: "bg-amber-500/15" },
          { label: "健康状态", value: "正常", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/15" },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.bg}`}>
                <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 表列表 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">数据表详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">表名</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">记录数</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">占用空间</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">引擎</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">字符集</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">上次优化</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t, i) => (
                  <tr key={t.name} className={`border-b border-border/40 hover:bg-muted/25 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/10"}`}>
                    <td className="px-4 py-3 font-mono font-medium text-foreground">{t.name}</td>
                    <td className="px-4 py-3 text-right text-foreground/80">{t.rows.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{t.size}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{t.engine}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{t.charset}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.lastOptimize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 备份记录 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">备份记录</CardTitle>
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            近 7 天已自动备份 7 次
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {backups.map((b) => (
              <div key={b.name} className="flex items-center gap-4 p-4 rounded-xl bg-muted/25 hover:bg-muted/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.time} · {b.size}</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">完成</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
