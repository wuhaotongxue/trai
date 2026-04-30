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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!window.confirm(`确定删除版本 v${version} 吗？该操作不可恢复。`)) return;
    try {
      await request(`/admin/client/release/${id}`, { method: "DELETE" });
      toast({ message: `版本 v${version} 已删除` });
      fetchReleases(releases.length === 1 && page > 1 ? page - 1 : page);
    } catch (err: any) {
      toast({ message: err.message || "删除失败", variant: "error" });
    }
  }, [fetchReleases, toast]);

  const handleCopyUrl = useCallback(async (url: string, id: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast({ message: "链接已复制到剪贴板" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ message: "复制失败，请手动复制", variant: "error" });
    }
  }, [toast]);

  // 搜索触发
  useEffect(() => {
    void fetchReleases(1, searchQuery);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [buildStatus.status, initDone]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 一键打包
  const handleBuildAndRelease = async () => {
    if (!releaseNotes.trim()) {
      toast({ message: "请填写更新日志", variant: "error" });
      return;
    }
    if (selectedWecomGroups.length === 0) {
      toast({ message: "请至少选择一个企微通知群", variant: "error" });
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">客户端发布</h1>
          <p className="text-sm text-muted-foreground mt-1">管理桌面客户端版本，支持一键打包和发布</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="h-9 gap-2 shadow-sm" onClick={() => setIsModalOpen(true)}>
            <Zap className="h-4 w-4" />
            一键打包发布
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
                    {buildStatus.status === "running" && "正在构建中..."}
                    {buildStatus.status === "success" && `构建成功: v${buildStatus.version}`}
                    {buildStatus.status === "failed" && "构建失败"}
                  </p>
                  <p className="text-sm text-muted-foreground">
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
                <span className="font-medium text-foreground">正在构建中...</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">当前步骤</span>
                  <span className="text-foreground font-medium">{buildStatus.message || "等待中..."}</span>
                </div>
                {buildStatus.status === "success" && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">构建成功: v{buildStatus.version}</span>
                  </div>
                )}
                {buildStatus.status === "failed" && (
                  <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">构建失败: {buildStatus.error}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {buildStatus.status === "running"
                  ? "页面会自动刷新状态，请稍候..."
                  : buildStatus.status === "success"
                  ? "飞书通知已发送，构建完成！"
                  : "构建遇到问题，请查看错误信息。"}
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
                  {buildStatus.status === "running" ? "构建中..." : "完成"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              {/* 正常状态：显示表单 */}
              <DialogHeader>
                <DialogTitle>一键打包发布</DialogTitle>
                <DialogDescription>
                  系统将在服务器上自动执行构建，完成后自动上传并发送飞书通知。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">更新日志</Label>
                  <textarea
                    id="notes"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="简述本次更新内容..."
                    value={releaseNotes}
                    onChange={e => setReleaseNotes(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">此内容将包含在飞书通知中</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentRole" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI 角色
                  </Label>
                  <select
                    id="agentRole"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                  >
                    <option value="">不指定角色</option>
                    {agentRoles.map(role => (
                      <option key={role.t_id} value={role.t_role_name}>
                        {role.t_role_name}
                      </option>
                    ))}
                  </select>
                  {selectedRole && agentRoles.find(r => r.t_role_name === selectedRole) && (
                    <p className="text-xs text-muted-foreground">
                      {agentRoles.find(r => r.t_role_name === selectedRole)?.t_role_comment}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wecomGroups" className="flex items-center gap-2">
                    企微通知群
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
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
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm">wuhao 群</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
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
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm">wudu 群</span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">选择要发送通知的企微群，至少选择一个</p>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setReleaseNotes(""); }}>
                  取消
                </Button>
                <Button onClick={handleBuildAndRelease} disabled={submitting} className="gap-2 min-w-[140px]">
                  <Zap className="h-4 w-4" />
                  开始构建
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 版本列表 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-500" />
              版本列表
              {activeRelease && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                  当前版本: v{activeRelease.version.split(".")[0]}.{activeRelease.version.split(".")[1]}.{activeRelease.version.split(".")[2]}
                </span>
              )}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索版本号..." 
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
              <div className="p-12 text-center text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 opacity-20" />
                正在加载版本记录...
              </div>
            ) : releases.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Download className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm">暂无发布记录</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">版本号</th>
                    <th className="p-4 font-medium">发布时间</th>
                    <th className="p-4 font-medium">更新说明</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {releases.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">v{item.version}</span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">最新</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs" title={item.release_notes || "无"}>
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
                            下载
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 transition-colors"
                            onClick={() => item.installer_url && handleCopyUrl(item.installer_url, item.id)}
                            disabled={!item.installer_url}
                            title="复制下载地址"
                          >
                            {copiedId === item.id ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            {copiedId === item.id ? "已复制" : "复制"}
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
                            <span className="text-sm text-muted-foreground">每页</span>
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              value={pageSize}
                              onChange={e => {
                                setPageSize(Number(e.target.value));
                                void fetchReleases(1);
                              }}
                            >
                              <option value={5}>5 条</option>
                              <option value={10}>10 条</option>
                              <option value={20}>20 条</option>
                              <option value={50}>50 条</option>
                            </select>
                          </div>

                          {/* 中间：跳转 */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">跳至</span>
                            <input
                              type="number"
                              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
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
                            <span className="text-sm text-muted-foreground">页</span>
                          </div>

                          {/* 右侧：翻页 + 总计 */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              共 {total} 条 / {totalPages} 页
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => void fetchReleases(page - 1)}
                              disabled={page <= 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              上一页
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => void fetchReleases(page + 1)}
                              disabled={page >= totalPages}
                            >
                              下一页
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
