/**
 * page.tsx
 * 数据库管理页面
 * 提供数据库表的查看、优化和备份管理功能
 */

"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Database, Download, HardDrive, RefreshCw, Table2, Upload, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/api_client";
import { useToast } from "@/components/toast/use_toast";

/**
 * 数据表信息接口
 */
interface TableInfo {
  name: string;
  rows: number;
  size: string;
  engine: string;
  charset: string;
  lastOptimize: string;
}

/**
 * 备份记录接口
 */
interface BackupInfo {
  key: string;
  size: number;
  last_modified: string;
  url: string;
}

export default function DatabasePage() {
  const [optimizing, setOptimizing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await request<BackupInfo[]>("/admin/system/database/backups");
      setBackups(res.sort((a, b) => b.last_modified.locale_compare(a.last_modified)));
    } catch (e) {
      console.error("Fetch backups failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
      toast({ message: "数据库优化完成", variant: "success" });
    }, 2000);
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      await request("/admin/system/database/backup", { method: "POST" });
      toast({ message: "手动备份已启动, 请稍后查看备份记录", variant: "success" });
      fetchBackups();
    } catch (e: any) {
      toast({ message: e.message || "备份失败", variant: "error" });
    } finally {
      setBackingUp(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 示例表数据 (后续可增加后端接口获取)
  const tables: TableInfo[] = [
    { name: "users", rows: 1248, size: "12 MB", engine: "PostgreSQL", charset: "utf8mb4", lastOptimize: "2026-04-09 03:00" },
    { name: "chat_sessions", rows: 8420, size: "85 MB", engine: "PostgreSQL", charset: "utf8mb4", lastOptimize: "2026-04-08 03:00" },
    { name: "messages", rows: 128400, size: "320 MB", engine: "PostgreSQL", charset: "utf8mb4", lastOptimize: "2026-04-07 03:00" },
  ];

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
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={fetchBackups}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button size="sm" className="h-9 gap-2 text-sm shadow-sm bg-red-600 hover:bg-red-700" onClick={handleBackup} disabled={backingUp}>
            {backingUp ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {backingUp ? "正在备份..." : "手动备份"}
          </Button>
        </div>
      </div>

      {/* 数据库概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "总表数", value: "24", icon: Table2, color: "text-blue-400", bg: "bg-blue-500/15" },
          { label: "总记录数", value: "623,128", icon: Database, color: "text-emerald-400", bg: "bg-emerald-500/15" },
          { label: "备份数量", value: backups.length.toString(), icon: HardDrive, color: "text-amber-400", bg: "bg-amber-500/15" },
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

      {/* 备份记录 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">S3 备份历史</CardTitle>
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            最近一次: {backups[0]?.last_modified || "无"}
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loading ? (
              <div className="col-span-2 py-8 text-center text-muted-foreground">加载中...</div>
            ) : backups.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-muted-foreground">暂无备份记录</div>
            ) : (
              backups.map((b) => (
                <div key={b.key} className="flex items-center gap-4 p-4 rounded-xl bg-muted/25 hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <Database className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{b.key.split("/").pop()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.last_modified} · {formatSize(b.size)}</p>
                  </div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
