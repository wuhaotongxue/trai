/**
 * page.tsx
 * 登录日志管理页面
 */

"use client";

import { useState, useEffect } from "react";
import { Clock, Download, Search, RefreshCw, CheckCircle, XCircle, User, Globe, Globe2, Cpu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { request } from "@/lib/api_client";
import { useAdminI18n } from "@/contexts/admin_i18n_context";

type LoginLogItem = {
  log_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  role: string;
  tenant_id: string | null;
  login_status: "success" | "failure";
  failure_reason: string | null;
  client_ip: string;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  created_at: string;
};

type LoginStats = {
  total: number;
  success: number;
  failure: number;
  success_rate: number;
};

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-500/10", label: "成功" },
  failure: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", label: "失败" },
};

const ROLE_CONFIG: Record<string, string> = {
  admin: "管理员",
  vip: "VIP用户",
  normal: "普通用户",
};

export default function LoginLogsPage() {
  const [logs, setLogs] = useState<LoginLogItem[]>([]);
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const { translate, locale, loadNamespace } = useAdminI18n();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (statusFilter !== "全部") {
        params.set("login_status", statusFilter);
      }

      const res = await request<{ logs: LoginLogItem[]; total: number; page: number; page_size: number }>(
        `/admin/login-logs?${params.toString()}`
      );
      setLogs(res?.logs || []);
      setTotal(res?.total || 0);
    } catch (e) {
      console.error("Fetch login logs failed", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await request<LoginStats>("/admin/login-logs/stats");
      setStats(res);
    } catch (e) {
      console.error("Fetch login stats failed", e);
    }
  };

  useEffect(() => {
    void loadNamespace("admin");
  }, [locale]);

  useEffect(() => {
    void fetchLogs();
    void fetchStats();
  }, [page, statusFilter]);

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.username.toLowerCase().includes(searchLower) ||
      log.client_ip.includes(search) ||
      (log.display_name && log.display_name.toLowerCase().includes(searchLower))
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getRoleLabel = (role: string) => {
    return ROLE_CONFIG[role] || role;
  };

  const statCards = stats
    ? [
        {
          label: translate("admin.login_logs.stats_total"),
          value: stats.total,
          icon: Clock,
          color: "text-blue-600",
          bg: "bg-blue-500/10",
        },
        {
          label: translate("admin.login_logs.stats_success"),
          value: stats.success,
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-500/10",
        },
        {
          label: translate("admin.login_logs.stats_failure"),
          value: stats.failure,
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-500/10",
        },
        {
          label: translate("admin.login_logs.stats_success_rate"),
          value: `${stats.success_rate.toFixed(1)}%`,
          icon: Cpu,
          color: "text-amber-600",
          bg: "bg-amber-500/10",
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{translate("admin.login_logs.title")}</h1>
          <p className="text-sm text-slate-900 dark:text-white font-bold mt-1">{translate("admin.login_logs.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={() => { void fetchLogs(); void fetchStats(); }}>
            <RefreshCw className="h-3.5 w-3.5" />
            {translate("admin.login_logs.refresh")}
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border">
            <Download className="h-3.5 w-3.5" />
            {translate("admin.login_logs.export")}
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white font-bold">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-none-none ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-900 dark:text-white font-bold" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={translate("admin.login_logs.search_placeholder")}
                className="h-9 pl-9 rounded-none-none border-border text-sm"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-muted rounded-none-none">
              {["全部", "success", "failure"].map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-none-md transition-colors ${
                    statusFilter === status ? "bg-background text-foreground shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]" : "text-slate-900 dark:text-white font-bold hover:text-foreground"
                  }`}
                >
                  {status === "全部" ? translate("admin.login_logs.filter_all") :
                   status === "success" ? "成功" : "失败"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.login_logs.col_status")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.login_logs.col_time")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.login_logs.col_user")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.login_logs.col_role")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.login_logs.col_ip")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.login_logs.col_device")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.login_logs.col_browser")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.login_logs.col_os")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.login_logs.col_reason")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-900 dark:text-white font-bold">
                      {translate("admin.login_logs.loading")}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-900 dark:text-white font-bold">
                      {translate("admin.login_logs.no_data")}
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => {
                    const statusConfig = STATUS_CONFIG[log.login_status];
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr key={log.log_id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Badge className={`${statusConfig.bg} ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-bold">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(log.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-900 dark:text-white font-bold" />
                            <span className="font-medium">{log.username}</span>
                            {log.display_name && (
                              <span className="text-xs text-slate-900 dark:text-white font-bold">({log.display_name})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-none text-xs font-medium bg-muted">
                            {getRoleLabel(log.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-bold">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <Globe className="h-3.5 w-3.5" />
                            {log.client_ip}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-bold">
                          <div className="flex items-center gap-1.5">
                            <Globe2 className="h-3.5 w-3.5" />
                            {log.device_type || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-bold">
                          <div className="flex items-center gap-1.5">
                            <Globe2 className="h-3.5 w-3.5" />
                            {log.browser || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-bold">{log.os || "-"}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate" title={log.failure_reason || undefined}>
                          {log.login_status === "failure" && log.failure_reason ? (
                            <span className="text-red-500 text-xs">{log.failure_reason}</span>
                          ) : (
                            <span className="text-slate-900 dark:text-white font-bold text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-slate-900 dark:text-white font-bold">
                {translate("admin.login_logs.pagination_info")
                  .replace("{total}", String(total))
                  .replace("{page}", String(page))
                  .replace("{totalPages}", String(totalPages))}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {translate("admin.login_logs.prev_page")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {translate("admin.login_logs.next_page")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
