/**
 * page.tsx
 * 用户管理页面
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, Search, Trash2, UserPlus, FileText, FileSpreadsheet, FileJson, CheckCircle2, XCircle, Clock, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown_menu";
import { adminApi, type UserInfo } from "@/lib/api_client";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";

const STATUS_TABS = [
  { key: "admin.users.all", api: undefined as string | undefined, filterKey: "全部" },
  { key: "admin.users.pending", api: "pending" as const, filterKey: "待审核" },
  { key: "admin.users.normal", api: "active" as const, filterKey: "正常" },
  { key: "admin.users.disabled", api: "disabled" as const, filterKey: "已禁用" },
];

const STATUS_CONFIG = {
  pending: { labelKey: "admin.users.table.pending", cls: "text-amber-600 bg-amber-500/10", dot: "bg-amber-500", icon: Clock },
  active: { labelKey: "admin.users.table.normal", cls: "text-emerald-600 bg-emerald-500/10", dot: "bg-emerald-500", icon: CheckCircle2 },
  disabled: { labelKey: "admin.users.table.disabled", cls: "text-red-600 bg-red-500/10", dot: "bg-red-500", icon: XCircle },
};

const ROLE_CONFIG = {
  admin: { labelKey: "admin.users.admin", cls: "text-amber-600 bg-amber-500/10" },
  vip: { labelKey: "admin.users.vip", cls: "text-purple-600 bg-purple-500/10" },
  normal: { labelKey: "admin.users.normal_user", cls: "text-blue-600 bg-blue-500/10" },
};

const ROLE_FILTER_TABS = [
  { labelKey: "admin.users.all", api: undefined as string | undefined },
  { labelKey: "admin.users.admin", api: "admin" as const },
  { labelKey: "admin.users.vip", api: "vip" as const },
  { labelKey: "admin.users.normal_user", api: "normal" as const },
];

export default function UsersPage() {
  const { translate, locale, loadNamespace } = useAdminI18n();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [activeRoleTab, setActiveRoleTab] = useState(0);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const { toast } = useAdminToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      };
      const statusVal = STATUS_TABS[activeTab].api;
      if (statusVal) params.status = statusVal;
      const roleVal = ROLE_FILTER_TABS[activeRoleTab].api;
      if (roleVal) params.role = roleVal;
      const res = await adminApi.listUsers(params as any);
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [activeTab, activeRoleTab, page, pageSize]);

  useEffect(() => {
    void loadNamespace('admin');
    void fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (user: UserInfo) => {
    try {
      await adminApi.approveUser(user.user_id);
      toast({ message: `${user.display_name || user.username} ${translate("admin.users.approved")}`, variant: "success" });
      void fetchUsers();
    } catch (e: any) {
      toast({ message: e.message || translate("admin.users.error.operation_failed"), variant: "error" });
    }
  };

  const handleReject = async (user: UserInfo) => {
    try {
      await adminApi.rejectUser(user.user_id);
      toast({ message: `${user.display_name || user.username} ${translate("admin.users.rejected")}`, variant: "success" });
      void fetchUsers();
    } catch (e: any) {
      toast({ message: e.message || translate("admin.users.error.operation_failed"), variant: "error" });
    }
  };

  const toggleStatus = async (user: UserInfo) => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    try {
      await adminApi.updateUserStatus(user.user_id, newStatus);
      toast({ message: translate("admin.users.status_updated"), variant: "success" });
      void fetchUsers();
    } catch (e: any) {
      toast({ message: e.message || translate("admin.users.error.operation_failed"), variant: "error" });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(translate("admin.users.confirm_delete"))) return;
    try {
      await adminApi.deleteUser(userId);
      toast({ message: translate("admin.users.deleted"), variant: "success" });
      void fetchUsers();
    } catch (e: any) {
      toast({ message: e.message || translate("admin.users.error.operation_failed"), variant: "error" });
    }
  };

  const handleExportUsers = async (format: "csv" | "excel" | "json" = "csv") => {
    try {
      const res = await adminApi.listUsers({ limit: 10000 } as any);
      const allUsers = res.users || [];
      const headers = [
        translate("admin.users.employee_id_col"),
        translate("admin.users.username_col"),
        translate("admin.users.display_name_col"),
        translate("admin.users.email_col"),
        translate("admin.users.role_col"),
        translate("admin.users.status_col"),
        translate("admin.users.wecom_col"),
        translate("admin.users.created_col"),
      ];
      const roleMap: Record<string, string> = {
        admin: translate("admin.users.admin"),
        vip: translate("admin.users.vip"),
        normal: translate("admin.users.normal_user"),
      };
      const statusMap: Record<string, string> = {
        active: translate("admin.users.normal"),
        pending: translate("admin.users.pending"),
        disabled: translate("admin.users.disabled"),
      };
      const data: Record<string, string>[] = allUsers.map((user) => ({
        [translate("admin.users.employee_id_col")]: user.user_id,
        [translate("admin.users.username_col")]: user.username || "",
        [translate("admin.users.display_name_col")]: user.display_name || "",
        [translate("admin.users.email_col")]: user.email || "",
        [translate("admin.users.role_col")]: roleMap[user.role] || user.role,
        [translate("admin.users.status_col")]: statusMap[user.status ?? ""] || user.status || "",
        [translate("admin.users.wecom_col")]: user.wecom_user_id || "",
        [translate("admin.users.created_col")]: user.created_at || "",
      }));
      const date = new Date().toISOString().split("T")[0];
      const filename = locale === "zh"
        ? `用户列表_${date}`
        : `users_${date}`;
      if (format === "csv") {
        const csvRows = [headers.join(",")];
        data.forEach((row) => {
          csvRows.push(Object.values(row as Record<string, string>).map((v) => `"${v}"`).join(","));
        });
        const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `${filename}.csv`);
      } else if (format === "excel") {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, locale === "zh" ? "用户列表" : "Users");
        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${filename}.xlsx`);
      } else {
        saveAs(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${filename}.json`);
      }
    } catch (e) {
      console.error("Export users failed", e);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.display_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q)
    );
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const pendingTab = STATUS_TABS.find((s) => s.api === "pending");
  const pendingTabIndex = STATUS_TABS.indexOf(pendingTab!);

  return (
    <div className="space-y-5">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{translate("admin.users.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {translate("admin.users.total")} {total} {translate("admin.users.registered")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm rounded-lg border border-border bg-background hover:bg-slate-100 cursor-pointer transition-colors">
              <Download className="h-3.5 w-3.5" />
              {translate("admin.users.export")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => void handleExportUsers("csv")} className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                {translate("admin.users.csv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExportUsers("excel")} className="flex items-center gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                {translate("admin.users.excel")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExportUsers("json")} className="flex items-center gap-2 cursor-pointer">
                <FileJson className="h-4 w-4" />
                {translate("admin.users.json")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={() => window.location.href = "/admin/users/new"}>
            <UserPlus className="h-3.5 w-3.5" />
            {translate("admin.users.new_user")}
          </Button>
        </div>
      </div>

      {/* 待审核提醒横幅 */}
      {activeTab === 0 && pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {translate("admin.users.pending_count")} <span className="text-amber-600 font-bold">{pendingCount}</span> {translate("admin.users.pending_wait")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{translate("admin.users.pending_desc")}</p>
          </div>
          <Button
            size="sm"
            className="h-8 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium"
            onClick={() => { setActiveTab(pendingTabIndex); setPage(1); }}
          >
            {translate("admin.users.go_review")}
          </Button>
        </div>
      )}

      {/* 筛选工具栏 */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 搜索框 */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={translate("admin.users.search")}
                className="h-9 pl-9 pr-4 rounded-lg border-border text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg p-1 border border-border/60">
              {STATUS_TABS.map((tab, i) => {
                const count = i === 0 ? total :
                  i === 1 ? users.filter((u) => u.status === "pending").length :
                  i === 2 ? users.filter((u) => u.status === "active").length :
                  users.filter((u) => u.status === "disabled").length;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(i); setPage(1); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeTab === i
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {translate(tab.key)}
                    {count > 0 && (
                      <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                        activeTab === i
                          ? "bg-blue-500 text-white"
                          : i === 1
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 角色筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{translate("admin.users.role")}</span>
            <div className="flex items-center gap-1.5">
              {ROLE_FILTER_TABS.map((tab, i) => (
                <button
                  key={tab.labelKey}
                  onClick={() => { setActiveRoleTab(i); setPage(1); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    activeRoleTab === i
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border/60"
                  }`}
                >
                  {translate(tab.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.users.table.user")}</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.users.table.employee_id")}</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.users.table.role")}</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.users.table.status")}</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.users.table.reg_time")}</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.users.table.login_ip")}</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.users.table.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                        <span className="text-sm">{translate("admin.users.loading")}</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-sm">{translate("admin.users.no_result")}</td>
                  </tr>
                ) : (
                  filtered.map((user) => {
                    const stCfg = STATUS_CONFIG[user.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.disabled;
                    const roleCfg = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.normal;
                    return (
                      <tr key={user.user_id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.display_name} className="h-9 w-9 rounded-full object-cover border border-border shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center font-bold text-sm text-blue-600 shrink-0 border border-blue-500/20">
                                {(user.display_name || user.username || "U")[0].toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-foreground">{user.display_name || user.username}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email || user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                          {user.wecom_user_id || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${roleCfg.cls}`}>
                            {translate(roleCfg.labelKey)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${stCfg.dot} ${user.status === "pending" ? "animate-pulse" : ""}`} />
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${stCfg.cls}`}>
                              {translate(stCfg.labelKey)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          <div>{user.last_login_ip || "—"}</div>
                          <div className="truncate max-w-[120px]">{user.last_login_location || ""}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* 待审核操作 */}
                            {user.status === "pending" && (
                              <>
                                <button
                                  onClick={() => void handleApprove(user)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                                  title={translate("admin.users.approve")}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {translate("admin.users.approve")}
                                </button>
                                <button
                                  onClick={() => void handleReject(user)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-medium transition-colors"
                                  title={translate("admin.users.reject")}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  {translate("admin.users.reject")}
                                </button>
                              </>
                            )}
                            {/* 正常用户操作 */}
                            {user.status === "active" && (
                              <button
                                onClick={() => void toggleStatus(user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-red-500/10 text-muted-foreground hover:text-red-500 text-xs font-medium transition-colors"
                                title={translate("admin.users.disable")}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                {translate("admin.users.disable")}
                              </button>
                            )}
                            {/* 已禁用用户 */}
                            {user.status === "disabled" && (
                              <button
                                onClick={() => void toggleStatus(user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                                title={translate("admin.users.enable")}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {translate("admin.users.enable")}
                              </button>
                            )}
                            <button
                              onClick={() => void deleteUser(user.user_id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors"
                              title={translate("admin.users.delete")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {total > 0 && (
            <div className="p-4 border-t border-border/60 flex items-center justify-between bg-muted/10">
              <div className="text-xs text-muted-foreground">
                {translate("admin.users.pagination.show")} {(page - 1) * pageSize + 1} {translate("admin.users.pagination.to")} {Math.min(page * pageSize, total)} {translate("admin.users.pagination.total")} {total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-medium px-2">
                  {translate("admin.users.pagination.page")} {page} / {Math.ceil(total / pageSize)} {translate("admin.users.pagination.pages")}
                </div>
                <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))} disabled={page === Math.ceil(total / pageSize) || loading}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
