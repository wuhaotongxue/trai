/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-21 10:15:00
 * 描述: 管理后台 - 客户端发布
 */

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Cpu, Plus, Download, Search, RefreshCw, Clock, Upload, X, FileText, Zap, CheckCircle, XCircle, Loader2, Trash2, Copy, ChevronLeft, ChevronRight, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/api_client";
import { adminApi } from "@/lib/api_client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toast/use_toast";
import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/contexts/admin_i18n_context";

type AgentRole = {
  t_id: number;
  t_role_name: string;
  t_role_comment: string;
  t_role_keyword: string | null;
  t_style_type: string;
  t_priority: number;
  t_is_active: boolean;
};

type ReleaseItem = {
  id: number;
  version: string;
  release_notes: string | null;
  created_at: string;
  installer_url: string | null;
};

type ReleaseListResponse = {
  total: number;
  items: ReleaseItem[];
};

type BuildStatus = {
  status: "idle" | "running" | "success" | "failed";
  message: string | null;
  version: string | null;
  error: string | null;
};

/**
 * 客户端发布管理页面
 */
export default function ClientReleasePage() {
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({ status: "idle", message: null, version: null, error: null });
  const [releaseNotes, setReleaseNotes] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [agentRoles, setAgentRoles] = useState<AgentRole[]>([]);
  const [selectedWecomGroups, setSelectedWecomGroups] = useState<string[]>(["wuhao"]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();
  const [initDone, setInitDone] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { translate } = useAdminI18n();

  const fetchAgentRoles = useCallback(async () => {
    try {
      const roles = await adminApi.listAgentRoles({ is_active: true });
      setAgentRoles(roles);
      setSelectedRole(prev => prev || (roles.length > 0 ? roles[0].t_role_name : ""));
    } catch (e) {
      console.error("Fetch agent roles failed", e);
    }
  }, []);

  const fetchReleases = useCallback(async (pageNum = 1, search = searchQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String((pageNum - 1) * pageSize),
      });
      if (search) params.set("search", search);
      const res = await request<ReleaseListResponse>(`/admin/client/releases?${params}`);
      setReleases(res.items);
      setTotal(res.total);
      setPage(pageNum);
    } catch (e) {
      console.error("Fetch releases failed", e);
    } finally {
      setLoading(false);
    }
  }, []);  

  const fetchBuildStatus = useCallback(async () => {
    try {
      const res = await request<BuildStatus>("/admin/client/build/status");
      setBuildStatus(res);
      // 构建成功或失败后刷新列表
      if (res.status === "success" || res.status === "failed") {
        fetchReleases(1);
      }
    } catch (e) {
      console.error("Fetch build status failed", e);
    }
  }, [fetchReleases]);

  const handleDeleteRelease = useCallback(async (id: number, version: string) => {
    if (!window.confirm(translate("admin.client_release.confirm_delete_version").replace("{version}", version))) return;
    try {
      await request(`/admin/client/release/${id}`, { method: "DELETE" });
      toast({ message: translate("admin.client_release.version_deleted").replace("{version}", version) });
      fetchReleases(releases.length === 1 && page > 1 ? page - 1 : page);
    } catch (err: any) {
      toast({ message: err.message || translate("admin.client_release.delete_failed"), variant: "error" });
    }
  }, [fetchReleases, toast]);

  const handleCopyUrl = useCallback(async (url: string, id: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast({ message: translate("admin.client_release.copy_success") });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ message: translate("admin.client_release.copy_failed"), variant: "error" });
    }
  }, [toast]);

  // 搜索触发
  useEffect(() => {
    void fetchReleases(1, searchQuery);
  }, [searchQuery]);  

  // 轮询状态管理：构建中 3 秒轮询，空闲时 30 秒
  useEffect(() => {
    if (!initDone) return;
    if (buildStatus.status === "running") {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = setInterval(() => { void fetchBuildStatus(); }, 3000);
    } else if (buildStatus.status === "idle") {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = setInterval(() => { void fetchBuildStatus(); }, 30000);
    } else {
      // success / failed：构建完成后刷新一次列表，再切回 30 秒
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      void fetchReleases(1);
      pollingIntervalRef.current = setInterval(() => { void fetchBuildStatus(); }, 30000);
    }
  }, [buildStatus.status, initDone]);  

  useEffect(() => {
    if (initDone) return;
    setInitDone(true);
    void fetchReleases();
    void fetchBuildStatus();
    void fetchAgentRoles();
    // 初始轮询：空闲状态 30 秒
    pollingIntervalRef.current = setInterval(() => { void fetchBuildStatus(); }, 30000);
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);  

  // 一键打包
  const handleBuildAndRelease = async () => {
    if (!releaseNotes.trim()) {
      toast({ message: translate("admin.client_release.fill_release_notes"), variant: "error" });
      return;
    }
    if (selectedWecomGroups.length === 0) {
      toast({ message: translate("admin.client_release.select_wecom_group"), variant: "error" });
      return;
    }
    setSubmitting(true);
    // 不关闭 modal，让用户看到构建状态
    try {
      await request("/admin/client/build_release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(selectedRole ? { "agent-role": selectedRole } : {}),
        },
        body: JSON.stringify({
          release_notes: releaseNotes,
          agent_role: selectedRole || null,
          wecom_groups: selectedWecomGroups,
        }),
      });
      // 后端已返回 running，状态由轮询驱动更新
    } catch (err: any) {
      setSubmitting(false);
      setIsModalOpen(false);
      toast({ title: "启动构建失败", message: err.message || "请重试", variant: "error" });
    }
  };

  // 找出当前激活的版本
  const activeRelease = releases[0];
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{translate("admin.client_release.title")}</h1>
          <p className="text-sm text-slate-900 dark:text-white font-bold mt-1">{translate("admin.client_release.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="h-9 gap-2 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]" onClick={() => setIsModalOpen(true)}>
            <Zap className="h-4 w-4" />
            {translate("admin.client_release.build_and_release")}
          </Button>
        </div>
      </div>

      {/* 构建状态卡片 */}
      {buildStatus.status !== "idle" && (
        <Card className={cn(
          "border-l-4",
          buildStatus.status === "running" && "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-500/10",
          buildStatus.status === "success" && "border-l-green-500 bg-green-50/50 dark:bg-green-500/10",
          buildStatus.status === "failed" && "border-l-red-500 bg-red-50/50 dark:bg-red-500/10"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {buildStatus.status === "running" && <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />}
                {buildStatus.status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                {buildStatus.status === "failed" && <XCircle className="h-5 w-5 text-red-600" />}
                <div>
                  <p className="font-medium">
                    {buildStatus.status === "running" && translate("admin.client_release.building")}
                    {buildStatus.status === "success" && translate("admin.client_release.build_success").replace("{version}", buildStatus.version || "")}
                    {buildStatus.status === "failed" && translate("admin.client_release.build_failed")}
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white font-bold">
                    {buildStatus.status === "running" && buildStatus.message}
                    {buildStatus.status === "success" && buildStatus.message}
                    {buildStatus.status === "failed" && buildStatus.error}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchBuildStatus}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 发布对话框 */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        // 构建中不允许关闭
        if (!submitting && buildStatus.status !== "running") setIsModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          {/* 构建中：显示实时状态 */}
          {submitting || buildStatus.status === "running" ? (
            <div className="space-y-5 py-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="font-medium text-foreground">{translate("admin.client_release.building")}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-900 dark:text-white font-bold">{translate("admin.client_release.current_step")}</span>
                  <span className="text-foreground font-medium">{buildStatus.message || translate("admin.client_release.waiting")}</span>
                </div>
                {buildStatus.status === "success" && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{translate("admin.client_release.build_success").replace("{version}", buildStatus.version || "")}</span>
                  </div>
                )}
                {buildStatus.status === "failed" && (
                  <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{translate("admin.client_release.build_failed")}: {buildStatus.error}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-900 dark:text-white font-bold">
                {buildStatus.status === "running"
                  ? translate("admin.client_release.auto_refresh")
                  : buildStatus.status === "success"
                  ? translate("admin.client_release.feishu_sent")
                  : translate("admin.client_release.build_error")}
              </p>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSubmitting(false);
                    setReleaseNotes("");
                    void fetchReleases(1);
                  }}
                  disabled={buildStatus.status === "running"}
                >
                  {buildStatus.status === "running" ? translate("admin.client_release.build_in_progress") : translate("admin.client_release.complete")}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              {/* 正常状态：显示表单 */}
              <DialogHeader>
                    <DialogTitle>{translate("admin.client_release.build_and_release")}</DialogTitle>
                    <DialogDescription>
                      {translate("admin.client_release.build_desc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="notes">{translate("admin.client_release.release_notes_label")}</Label>
                      <textarea
                        id="notes"
                        className="flex min-h-[120px] w-full rounded-none-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-slate-900 dark:text-white font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={translate("admin.client_release.release_notes_placeholder")}
                        value={releaseNotes}
                        onChange={e => setReleaseNotes(e.target.value)}
                      />
                      <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.client_release.release_notes_hint")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentRole" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    {translate("admin.client_release.ai_role_label")}
                  </Label>
                  <select
                    id="agentRole"
                    className="flex h-10 w-full rounded-none-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-slate-900 dark:text-white font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                  >
                    <option value="">{translate("admin.client_release.no_role")}</option>
                    {agentRoles.map(role => (
                      <option key={role.t_id} value={role.t_role_name}>
                        {role.t_role_name}
                      </option>
                    ))}
                  </select>
                  {selectedRole && agentRoles.find(r => r.t_role_name === selectedRole) && (
                    <p className="text-xs text-slate-900 dark:text-white font-bold">
                      {agentRoles.find(r => r.t_role_name === selectedRole)?.t_role_comment}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wecomGroups" className="flex items-center gap-2">
                    {translate("admin.client_release.wecom_groups_label")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-none-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedWecomGroups.includes("wuhao")}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedWecomGroups(prev => [...prev, "wuhao"]);
                          } else {
                            setSelectedWecomGroups(prev => prev.filter(g => g !== "wuhao"));
                          }
                        }}
                        className="h-4 w-4 rounded-none border-gray-300 text-blue-600"
                      />
                      <span className="text-sm">wuhao Group</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 rounded-none-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedWecomGroups.includes("wudu")}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedWecomGroups(prev => [...prev, "wudu"]);
                          } else {
                            setSelectedWecomGroups(prev => prev.filter(g => g !== "wudu"));
                          }
                        }}
                        className="h-4 w-4 rounded-none border-gray-300 text-blue-600"
                      />
                      <span className="text-sm">wudu Group</span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.client_release.wecom_group_select_hint")}</p>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setReleaseNotes(""); }}>
                  {translate("admin.client_release.cancel")}
                </Button>
                <Button onClick={handleBuildAndRelease} disabled={submitting} className="gap-2 min-w-[140px]">
                  <Zap className="h-4 w-4" />
                  {translate("admin.client_release.start_build")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 版本列表 */}
      <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-500" />
              {translate("admin.client_release.version_list")}
              {activeRelease && (
                <span className="ml-2 px-2 py-0.5 rounded-none-none bg-emerald-100 text-emerald-700 text-xs font-medium">
                  {translate("admin.client_release.current_version")}: v{activeRelease.version.split(".")[0]}.{activeRelease.version.split(".")[1]}.{activeRelease.version.split(".")[2]}
                </span>
              )}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900 dark:text-white font-bold" />
              <Input 
                placeholder={translate("admin.client_release.search_version")} 
                className="pl-9 h-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="min-h-[300px]">
            {loading ? (
              <div className="p-12 text-center text-slate-900 dark:text-white font-bold">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 opacity-20" />
                {translate("admin.client_release.loading_versions")}
              </div>
            ) : releases.length === 0 ? (
              <div className="p-12 text-center text-slate-900 dark:text-white font-bold">
                <Download className="h-10 w-10 mx-auto mb-4 text-slate-900 dark:text-white font-bold/30" />
                <p className="text-sm">{translate("admin.client_release.no_releases")}</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/30 text-slate-900 dark:text-white font-bold">
                  <tr>
                    <th className="p-4 font-medium">{translate("admin.client_release.col_version")}</th>
                    <th className="p-4 font-medium">{translate("admin.client_release.col_time")}</th>
                    <th className="p-4 font-medium">{translate("admin.client_release.col_notes")}</th>
                    <th className="p-4 font-medium text-right">{translate("admin.client_release.col_action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {releases.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">v{item.version}</span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.5 rounded-none-none bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">{translate("admin.client_release.latest")}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-slate-900 dark:text-white font-bold line-clamp-1 max-w-xs" title={item.release_notes || "无"}>
                          {item.release_notes || "—"}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                            onClick={() => item.installer_url && window.open(item.installer_url)}
                            disabled={!item.installer_url}
                          >
                            <Download className="h-3.5 w-3.5" />
                            {translate("admin.client_release.download")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 transition-colors"
                            onClick={() => item.installer_url && handleCopyUrl(item.installer_url, item.id)}
                            disabled={!item.installer_url}
                            title={translate("admin.client_release.copy")}
                          >
                            {copiedId === item.id ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            {copiedId === item.id ? translate("admin.client_release.copied") : translate("admin.client_release.copy")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => handleDeleteRelease(item.id, item.version)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* 分页控件 */}
                {totalPages >= 1 && (
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="px-4 py-3 border-t border-border/60">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          {/* 左侧：每页条数 */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-900 dark:text-white font-bold">{translate("admin.client_release.items_per_page")}</span>
                            <select
                              className="h-8 rounded-none-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              value={pageSize}
                              onChange={e => {
                                setPageSize(Number(e.target.value));
                                void fetchReleases(1);
                              }}
                            >
                              <option value={5}>5 {translate("admin.client_release.items")}</option>
                              <option value={10}>10 {translate("admin.client_release.items")}</option>
                              <option value={20}>20 {translate("admin.client_release.items")}</option>
                              <option value={50}>50 {translate("admin.client_release.items")}</option>
                            </select>
                          </div>

                          {/* 中间：跳转 */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-900 dark:text-white font-bold">{translate("admin.client_release.jump_to")}</span>
                            <input
                              type="number"
                              className="h-8 w-16 rounded-none-md border border-input bg-background px-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                              min={1}
                              max={totalPages}
                              value={page}
                              onChange={e => {
                                const val = Number(e.target.value);
                                if (val >= 1 && val <= totalPages) void fetchReleases(val);
                              }}
                              onBlur={e => {
                                const val = Number(e.target.value);
                                if (val < 1) void fetchReleases(1);
                                else if (val > totalPages) void fetchReleases(totalPages);
                              }}
                            />
                            <span className="text-sm text-slate-900 dark:text-white font-bold">{translate("admin.client_release.page")}</span>
                          </div>

                          {/* 右侧：翻页 + 总计 */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-900 dark:text-white font-bold">
                              {translate("admin.client_release.total")} {total} {translate("admin.client_release.items")} / {totalPages} {translate("admin.client_release.page")}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => void fetchReleases(page - 1)}
                              disabled={page <= 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              {translate("admin.client_release.prev_page")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => void fetchReleases(page + 1)}
                              disabled={page >= totalPages}
                            >
                              {translate("admin.client_release.next_page")}
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
