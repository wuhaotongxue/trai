/**
 * page.tsx
 * 登录日志页面
 */

"use client";

import { useState, useEffect } from "react";
import { Clock, Download, Search, RefreshCw, Filter, CheckCircle2, XCircle, User, Globe, Monitor, Smartphone, Tablet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/api_client";
import { useAdminI18n } from "@/contexts/admin_i18n_context";

type LoginLogItem = {
  log_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  role: string;
  tenant_id: string | null;
  login_status: string;
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

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10", label: "成功" },
  failure: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", label: "失败" },
};

const DEVICE_CONFIG: Record<string, { icon: typeof Monitor; label: string }> = {
  desktop: { icon: Monitor, label: "桌面" },
  mobile: { icon: Smartphone, label: "手机" },
  tablet: { icon: Tablet, label: "平板" },
};

export default function LoginLogsPage() {
  const [logs, setLogs] = useState<LoginLogItem[]>([]);
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
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
    } catch (e) {
      console.error("Fetch login logs failed", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await request<LoginStats>("/admin/login-logs/stats?days=30");
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
    const matchSearch =
      log.username.toLowerCase().includes(search.toLowerCase()) ||
      log.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.client_ip.includes(search);
    const matchStatus = statusFilter === "全部" || log.login_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedLogs = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getStatusIcon = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.success;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const getDeviceIcon = (deviceType: string | null) => {
    const config = DEVICE_CONFIG[deviceType || "desktop"] || DEVICE_CONFIG.desktop;
    const Icon = config.icon;
    return <Icon className="h-3.5 w-3.5" />;
  };

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
    const roles: Record<string, string> = {
      admin: "管理员",
      user: "普通用户",
      normal: "普通用户",
    };
    return roles[role] || role;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{translate("admin.login_logs.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{translate("admin.login_logs.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={() => { setPage(1); void fetchLogs(); void fetchStats(); }}>
            <RefreshCw className="h-3.5 w-3.5" />
            {translate("admin.login_logs.refresh")}
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border">
            <Download className="h-3.5 w-3.5" />
            {translate("admin.login_logs.export")}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{translate("admin.login_logs.stats_total")}</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{translate("admin.login_logs.stats_success")}</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{stats.success}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{translate("admin.login_logs.stats_failure")}</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">{stats.failure}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{translate("admin.login_logs.stats_success_rate")}</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{stats.success_rate}%</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={translate("admin.login_logs.search_placeholder")}
                className="h-9 pl-9 rounded-lg border-border text-sm"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              {["全部", "success", "failure"].map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === status ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {status === "全部" ? translate("admin.login_logs.filter_all") : STATUS_CONFIG[status]?.label || status}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card className="border-0 shadow-sm">
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
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      {translate("admin.login_logs.loading")}
                    </td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      {translate("admin.login_logs.no_data")}
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const statusConfig = STATUS_CONFIG[log.login_status] || STATUS_CONFIG.success;
                    return (
                      <tr key={log.log_id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            {getStatusIcon(log.login_status)}
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(log.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{log.username}</p>
                              <p className="text-xs text-muted-foreground">{log.display_name || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.role === "admin" ? "bg-purple-500/10 text-purple-600" :
                            "bg-blue-500/10 text-blue-600"
                          }`}>
                            {getRoleLabel(log.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-xs">
                            <Globe className="h-3.5 w-3.5" />
                            {log.client_ip}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {getDeviceIcon(log.device_type)}
                            <span>{DEVICE_CONFIG[log.device_type || "desktop"]?.label || "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{log.browser || "-"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{log.os || "-"}</td>
                        <td className="px-4 py-3">
                          {log.login_status === "failure" && log.failure_reason ? (
                            <span className="text-red-600 text-xs">{log.failure_reason}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
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
              <p className="text-xs text-muted-foreground">
                {translate("admin.login_logs.pagination_info").replace("{total}", String(filtered.length)).replace("{page}", String(page)).replace("{totalPages}", String(totalPages))}
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
