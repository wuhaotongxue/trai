/**
 * page.tsx
 * 系统监控与数据库备份管理
 */

"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle, CheckCircle2, Clock, Cpu, Database,
  HardDrive, RefreshCw, Server, Download,
  Trash2, Settings2, ShieldCheck, History, ChevronRight,
  Activity, Gauge
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown_menu";
import { request } from "@/lib/api_client";
import { useToast } from "@/components/toast/use_toast";
import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/contexts/admin_i18n_context";

interface BackupFile {
  key: string;
  size: number;
  last_modified: string;
  url: string;
}

const SERVICE_KEYS = [
  { cnKey: "admin.monitor.api_gateway", icon: Server, status: "ok", uptime: "99.98%", latency: "8ms", requests: "12.4K/分" },
  { cnKey: "admin.monitor.agent_engine", icon: Cpu, status: "ok", uptime: "99.95%", latency: "45ms", requests: "2.1K/分" },
  { cnKey: "admin.monitor.postgresql", icon: Database, status: "ok", uptime: "99.99%", latency: "3ms", requests: "—" },
  { cnKey: "admin.monitor.redis_cache", icon: HardDrive, status: "ok", uptime: "99.97%", latency: "1ms", requests: "—" },
  { cnKey: "admin.monitor.openai_api", icon: Cpu, status: "warn", uptime: "98.72%", latency: "380ms", requests: "892/分" },
  { cnKey: "admin.monitor.s3_storage", icon: HardDrive, status: "ok", uptime: "99.99%", latency: "15ms", requests: "—" },
];

export default function MonitorPage() {
  const { translate, locale, loadNamespace } = useAdminI18n();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [retentionDays, setRetentionPolicy] = useState(30);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { toast } = useToast();

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await request<BackupFile[]>("/admin/system/database/backups");
      setBackups(res.sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime()));
      setLastRefresh(new Date());
    } catch {
      toast({ message: translate("admin.monitor.backup_list_failed"), variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNamespace('admin');
    void fetchBackups();
  }, [locale]);

  const handleBackup = async () => {
    toast({ message: translate("admin.monitor.backup_started"), variant: "info" });
    try {
      await request("/admin/system/database/backup", { method: "POST" });
      toast({ message: translate("admin.monitor.backup_success"), variant: "success" });
      void fetchBackups();
    } catch (e: any) {
      toast({ message: `${translate("admin.monitor.backup_failed")} ${e.message}`, variant: "error" });
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(translate("admin.monitor.delete_confirm"))) return;
    try {
      await request(`/admin/system/database/backup?key=${encodeURIComponent(key)}`, { method: "DELETE" });
      toast({ message: translate("admin.monitor.delete_success"), variant: "success" });
      void fetchBackups();
    } catch (e: any) {
      toast({ message: `${translate("admin.monitor.delete_failed")} ${e.message}`, variant: "error" });
    }
  };

  const handleCleanup = async (days: number) => {
    setRetentionPolicy(days);
    const msg = days === 0 ? translate("admin.monitor.permanent") : `${days} ${translate("admin.monitor.retention_days")}`;
    toast({ message: `${translate("admin.monitor.cleanup_updated")} ${msg}`, variant: "info" });
    try {
      const res: any = await request("/admin/system/database/cleanup", {
        method: "POST",
        body: JSON.stringify({ days })
      });
      toast({ message: `${translate("admin.monitor.cleanup_done")} ${res.message}`, variant: "success" });
      void fetchBackups();
    } catch (e: any) {
      toast({ message: `${translate("admin.monitor.cleanup_failed")} ${e.message}`, variant: "error" });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const securityGuidelines = [
    translate("admin.monitor.auto_backup"),
    translate("admin.monitor.aes_encrypt"),
    translate("admin.monitor.audit_log"),
    translate("admin.monitor.dr_test"),
  ];

  const quickTools = [
    { labelKey: "admin.monitor.db_config", icon: Settings2 },
    { labelKey: "admin.monitor.slow_query", icon: Activity },
    { labelKey: "admin.monitor.permission_check", icon: ShieldCheck },
  ];

  const cleanupOptions = [
    { days: 7, labelKey: "admin.monitor.keep_7d" },
    { days: 30, labelKey: "admin.monitor.keep_30d" },
    { days: 90, labelKey: "admin.monitor.keep_90d" },
    { days: 0, labelKey: "admin.monitor.keep_forever" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 p-2 page-enter">
      {/* 顶部行政区 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-none-none bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
            </div>
            {translate("admin.monitor.title")}
          </h1>
          <p className="text-sm text-slate-900 dark:text-white font-bold mt-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {translate("admin.monitor.sync_time")} {lastRefresh.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void fetchBackups()}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {translate("admin.monitor.refresh_status")}
          </Button>
          <Button size="sm" className="gap-1.5 bg-slate-100 hover:from-blue-500 hover:to-indigo-500 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]" onClick={() => void handleBackup()}>
            <Database className="h-3.5 w-3.5" />
            {translate("admin.monitor.backup_now")}
          </Button>
        </div>
      </div>

      {/* 服务组件状态 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICE_KEYS.map((svc) => (
          <Card key={svc.cnKey} className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] transition-all bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white  group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("w-11 h-11 rounded-none-none flex items-center justify-center transition-colors",
                svc.status === "ok" ? "bg-emerald-500/10 group-hover:bg-emerald-500/15" : "bg-slate-200/10 group-hover:bg-slate-200/15")}>
                <svc.icon className={cn("h-5 w-5",
                  svc.status === "ok" ? "text-emerald-500" : "text-cyan-500")} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{translate(svc.cnKey)}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-none-none",
                    svc.status === "ok" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-200/10 text-cyan-600 dark:text-cyan-400")}>
                    {svc.status === "ok" ? translate("admin.monitor.normal") : translate("admin.monitor.warning")}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-900 dark:text-white font-bold font-mono">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    {svc.latency}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {svc.uptime}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* S3 备份历史 */}
        <Card className="lg:col-span-2 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white ">
          <CardHeader className="border-b border-border/40 flex flex-row items-center justify-between space-y-0 py-4">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-blue-500" />
                {translate("admin.monitor.s3_backup")}
              </CardTitle>
              <CardDescription className="text-[11px]">{translate("admin.monitor.s3_desc")}</CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1 h-8 px-3 text-xs rounded-none-none border border-border/60 bg-background hover:bg-muted cursor-pointer transition-colors text-sm">
                <Settings2 className="h-3.5 w-3.5" />
                {translate("admin.monitor.retention")} {retentionDays === 0 ? translate("admin.monitor.permanent") : `${retentionDays} ${translate("admin.monitor.retention_days")}`}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{translate("admin.monitor.auto_cleanup")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {cleanupOptions.map((opt) => (
                  <DropdownMenuItem key={opt.days} onClick={() => void handleCleanup(opt.days)}>
                    {translate(opt.labelKey)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-900 dark:text-white font-bold uppercase tracking-wide">{translate("admin.monitor.backup_file")}</th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-slate-900 dark:text-white font-bold uppercase tracking-wide text-right">{translate("admin.monitor.size")}</th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-slate-900 dark:text-white font-bold uppercase tracking-wide text-right">{translate("admin.monitor.backup_time")}</th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-slate-900 dark:text-white font-bold uppercase tracking-wide text-center">{translate("admin.monitor.operation")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {backups.map((b) => (
                    <tr key={b.key} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-none-none bg-blue-500/10 group-hover:bg-blue-500/15 transition-colors">
                            <Database className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[200px]" title={b.key}>
                            {b.key.split("/").pop()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-slate-900 dark:text-white font-bold font-mono text-xs">{formatSize(b.size)}</td>
                      <td className="px-4 py-4 text-right text-slate-900 dark:text-white font-bold text-xs">
                        {new Date(b.last_modified).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <a href={b.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            onClick={() => void handleDelete(b.key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {backups.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-900 dark:text-white font-bold text-sm italic">
                        {translate("admin.monitor.no_backups")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 侧边信息栏 */}
        <div className="space-y-4">
          <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] bg-slate-100 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="h-24 w-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                {translate("admin.monitor.data_security")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-3">
                {securityGuidelines.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <ChevronRight className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-700/50">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">{translate("admin.monitor.storage_status")}</p>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xl font-bold">{backups.length} <span className="text-xs font-normal opacity-50">{translate("admin.monitor.files")}</span></p>
                    <p className="text-[10px] opacity-50">{translate("admin.monitor.bucket")} trai-backups</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatSize(backups.reduce((acc, b) => acc + b.size, 0))}</p>
                    <p className="text-[10px] opacity-50 text-blue-400 font-bold">{translate("admin.monitor.cloud_total")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white ">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">{translate("admin.monitor.quick_tools")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickTools.map((tool) => (
                <Button key={tool.labelKey} variant="outline" className="w-full justify-start text-xs h-9 border-border/60 hover:bg-muted/50">
                  <tool.icon className="h-3.5 w-3.5 mr-2 text-slate-900 dark:text-white font-bold" />
                  {translate(tool.labelKey)}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
