/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-21 10:15:00
 * 描述: 管理后台 - 组织架构管理
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Plus, Building2, Search, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, Shield, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request, adminApi, type UserInfo, type DepartmentTreeNode } from "@/lib/api_client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/toast/use_toast";
import { useAdminI18n } from "@/contexts/admin_i18n_context";

/**
 * 部门树项组件
 */
function DeptTreeItem({ 
  node, 
  level = 0, 
  selectedId, 
  onSelect 
}: { 
  node: DepartmentTreeNode; 
  level?: number; 
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedId === node.dept_id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center justify-between p-2 rounded-none-md cursor-pointer transition-colors
          ${isSelected ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node.dept_id)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {hasChildren ? (
            <ChevronDown 
              className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "" : "-rotate-90"}`} 
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            />
          ) : (
            <div className="w-4 h-4 shrink-0" />
          )}
          <span className="text-sm font-medium truncate">{node.name}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-none-none ${isSelected ? "bg-blue-100 dark:bg-blue-800" : "bg-slate-100 dark:bg-slate-800"}`}>
          {node.user_count}
        </span>
      </div>
      {hasChildren && expanded && (
        <div className="mt-1">
          {node.children.map((child, idx) => (
            <DeptTreeItem 
              key={`${child.dept_id}-${idx}`} 
              node={child} 
              level={level + 1} 
              selectedId={selectedId} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 组织架构管理主页面
 * 提供企业部门同步,列表查看及成员管理功能
 * @returns React 组件
 */
export default function OrganizationPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ departments: number; users: number; status: string } | null>(null);

  // 部门树状态
  const [deptTree, setDeptTree] = useState<DepartmentTreeNode[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  // 用户列表状态
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // 权限管理弹窗状态
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permTarget, setPermTarget] = useState<UserInfo | null>(null);
  const [permRole, setPermRole] = useState("");
  const { toast } = useToast();
  const { translate } = useAdminI18n();

  /**
   * 获取部门树
   */
  const fetchDeptTree = async () => {
    try {
      const tree = await adminApi.getDepartmentTree();
      setDeptTree(tree);
    } catch (e) {
      console.error("Fetch dept tree failed", e);
    }
  };

  /**
   * 获取用户列表
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        dept_id: selectedDeptId || undefined,
      });
      setUsers(res.users);
      setTotal(res.total);
    } catch (e) {
      console.error("Fetch users failed", e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedDeptId]);

  useEffect(() => {
    fetchDeptTree();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await request<{ departments: number; users: number; status: string }>("/admin/sync", { method: "POST" });
      setSyncResult(res);
      // 同步后刷新列表和树
      fetchDeptTree();
      fetchUsers();
    } catch (e) {
      console.error("Sync failed", e);
      toast({ message: translate("admin.organization.sync_failed"), variant: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenPerm = (user: UserInfo) => {
    setPermTarget(user);
    setPermRole(user.role || "normal");
    setPermDialogOpen(true);
  };

  const handleSavePerm = async () => {
    if (!permTarget) return;
    try {
      await request(`/admin/users/${permTarget.user_id}`, {
        method: "PUT",
        body: JSON.stringify({ role: permRole }),
      });
      toast({ message: translate("admin.organization.role_updated").replace("{name}", permTarget.display_name || "").replace("{role}", permRole === "admin" ? translate("admin.organization.admin") : permRole === "vip" ? translate("admin.organization.vip") : translate("admin.organization.normal_user")), variant: "success" });
      setPermDialogOpen(false);
      fetchUsers();
    } catch (e: any) {
      toast({ message: e.message || translate("admin.organization.role_update_failed"), variant: "error" });
    }
  };

  // 分页计算
  const totalPages = Math.ceil(total / pageSize);
  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{translate("admin.organization.title")}</h1>
          <p className="text-sm text-slate-900 dark:text-white font-bold mt-1">{translate("admin.organization.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSync} disabled={syncing} variant="outline" className="h-9 gap-2 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? translate("admin.organization.syncing") || "正在同步..." : translate("admin.organization.sync") || "从企业微信同步"}
          </Button>
          <Button className="h-9 gap-2 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
            <Plus className="h-4 w-4" />
            {translate("admin.organization.create")}
          </Button>
        </div>
      </div>

      {syncResult && (
        <Card className="border-emerald-500/20 bg-cyan-500/5 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-cyan-600">
              <RefreshCw className="h-5 w-5" />
              <div className="text-sm font-medium">
                {translate("admin.organization.sync_complete")}: {translate("admin.organization.sync_departments").replace("{departments}", syncResult.departments.toString())},{translate("admin.organization.sync_users").replace("{users}", syncResult.users.toString())}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSyncResult(null)} className="h-8 text-cyan-600 hover:text-emerald-700 hover:bg-cyan-500/10">
              {translate("admin.organization.sync_close")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 部门树 */}
        <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] col-span-1">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                {translate("admin.organization.department")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-2 overflow-auto max-h-[600px]">
            <div 
              className={`
                flex items-center justify-between p-2 rounded-none-md cursor-pointer mb-2 transition-colors
                ${selectedDeptId === null ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}
              `}
              onClick={() => setSelectedDeptId(null)}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4" />
                <span className="text-sm font-medium">{translate("admin.organization.all_company")}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-none-none ${selectedDeptId === null ? "bg-blue-100 dark:bg-blue-800" : "bg-slate-100 dark:bg-slate-800"}`}>
                {total}
              </span>
            </div>
            {deptTree.map((node, idx) => (
              <DeptTreeItem 
                key={`${node.dept_id}-${idx}`} 
                node={node} 
                selectedId={selectedDeptId} 
                onSelect={setSelectedDeptId} 
              />
            ))}
          </CardContent>
        </Card>

        {/* 成员列表 */}
        <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] col-span-1 md:col-span-3">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                {translate("admin.organization.members")}
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900 dark:text-white font-bold" />
                <Input 
                  placeholder={translate("admin.organization.search_member")} 
                  className="pl-9 h-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            <div className="min-h-[400px]">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold sticky top-0">
                  <tr>
                    <th className="p-4 font-medium">{translate("admin.organization.col_name")}</th>
                    <th className="p-4 font-medium">{translate("admin.organization.col_employee_id")}</th>
                    <th className="p-4 font-medium">{translate("admin.organization.col_email")}</th>
                    <th className="p-4 font-medium">{translate("admin.organization.col_role")}</th>
                    <th className="p-4 font-medium text-right">{translate("admin.organization.col_action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-900 dark:text-white font-bold">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                        {translate("admin.organization.loading")}
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-900 dark:text-white font-bold">
                        {translate("admin.organization.no_members")}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-medium">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.display_name} className="w-8 h-8 rounded-none-none object-cover border border-border" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 rounded-none-none bg-slate-100 flex items-center justify-center text-white text-xs font-medium">
                                {user.display_name?.[0] || user.username?.[0]}
                              </div>
                            )}
                            <span>{user.display_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-900 dark:text-white font-bold font-mono">{user.wecom_user_id || "---"}</td>
                        <td className="p-4 text-slate-900 dark:text-white font-bold">{user.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-none-none text-xs font-medium ${
                            user.role === "admin" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                            user.role === "vip" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" :
                            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {user.role === "admin" ? translate("admin.organization.admin") : user.role === "vip" ? translate("admin.organization.vip") : translate("admin.organization.normal_user")}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => handleOpenPerm(user)}>
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            {translate("admin.organization.manage_permission")}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页控制 */}
            {total > 0 && (
              <div className="p-4 border-t flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <div className="text-xs text-slate-900 dark:text-white font-bold">
                  {translate("admin.organization.showing")} {startIdx} {translate("admin.organization.to")} {endIdx},{translate("admin.organization.total")} {total} {translate("admin.organization.items")}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-xs font-medium px-2">
                    {translate("admin.organization.page")} {page} / {totalPages} {translate("admin.organization.pages")}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1.5 ml-2 border-l pl-3 border-border/60">
                    <span className="text-[10px] text-slate-900 dark:text-white font-bold">{translate("admin.organization.jump")}</span>
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      className="w-12 h-7 px-1 text-center text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt((e.target as HTMLInputElement).value);
                          if (val >= 1 && val <= totalPages) {
                            setPage(val);
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 权限管理弹窗 */}
      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              {translate("admin.organization.set_role")}
            </DialogTitle>
          </DialogHeader>
          {permTarget && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-none-none bg-muted/50">
                <div className="w-10 h-10 rounded-none-none bg-slate-100 flex items-center justify-center text-white font-medium">
                  {permTarget.display_name?.[0] || permTarget.username?.[0] || "?"}
                </div>
                <div>
                  <p className="font-medium">{permTarget.display_name || permTarget.username}</p>
                  <p className="text-sm text-slate-900 dark:text-white font-bold">{permTarget.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{translate("admin.organization.select_role")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "admin", label: translate("admin.organization.admin"), desc: translate("admin.organization.admin_desc"), color: "bg-blue-500" },
                    { value: "vip", label: translate("admin.organization.vip"), desc: translate("admin.organization.vip_desc"), color: "bg-slate-200" },
                    { value: "normal", label: translate("admin.organization.normal_user"), desc: translate("admin.organization.normal_desc"), color: "bg-slate-500" },
                  ].map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setPermRole(role.value)}
                      className={`p-3 rounded-none-none border-2 transition-all text-left ${
                        permRole === role.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-none-none ${role.color}`} />
                        <span className="font-medium text-sm">{role.label}</span>
                      </div>
                      <p className="text-xs text-slate-900 dark:text-white font-bold">{role.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPermDialogOpen(false)}>
              {translate("admin.organization.cancel")}
            </Button>
            <Button onClick={handleSavePerm}>
              {translate("admin.organization.save_settings")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
