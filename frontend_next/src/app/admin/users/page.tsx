/**
 * page.tsx
 * 用户管理页面
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, Search, Trash2, UserPlus, FileText, FileSpreadsheet, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown_menu";
import { request } from "@/lib/api_client";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type UserItem = {
  user_id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  role: string;
  status: string;
  tenant_id: string;
  wecom_user_id: string;
  created_at: string;
  last_login_ip: string;
  last_login_location: string;
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("全部");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const roleQuery = filterRole === "全部" ? "" : `&role=${filterRole === "管理员" ? "admin" : "normal"}`;
      const res = await request<{ users: UserItem[]; total: number }>(`/admin/users?limit=${pageSize}&offset=${(page - 1) * pageSize}${roleQuery}`);
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error("Failed to fetch users", e);
    } finally {
      setLoading(false);
    }
  }, [filterRole, page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = async (user: UserItem) => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    try {
      await request(`/admin/users/${user.user_id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUsers();
    } catch (e) {
      console.error("Toggle status failed", e);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("确定要删除该用户吗？")) return;
    try {
      await request(`/admin/users/${userId}`, { method: "DELETE" });
      fetchUsers();
    } catch (e) {
      console.error("Delete user failed", e);
    }
  };

  const toggleRole = async (user: UserItem) => {
    const newRole = user.role === "admin" ? "normal" : "admin";
    if (!confirm(`确定要将该用户设为 ${newRole === "admin" ? "管理员" : "普通用户"} 吗？`)) return;
    try {
      await request(`/admin/users/${user.user_id}`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } catch (e) {
      console.error("Toggle role failed", e);
    }
  };

  const handleExportUsers = async (format: "csv" | "excel" | "json" = "csv") => {
    try {
      // 获取所有用户数据
      const res = await request<{ users: UserItem[]; total: number }>("/admin/users?limit=10000");
      const allUsers = res.users || [];
      
      // 准备数据
      const headers = ["用户ID", "用户名", "显示名", "邮箱", "角色", "状态", "企业微信ID", "创建时间"];
      const data = allUsers.map(user => ({
        "用户ID": user.user_id,
        "用户名": user.username || "",
        "显示名": user.display_name || "",
        "邮箱": user.email || "",
        "角色": user.role === "admin" ? "管理员" : "普通用户",
        "状态": user.status === "active" ? "正常" : "停用",
        "企业微信ID": user.wecom_user_id || "",
        "创建时间": user.created_at || ""
      }));
      
      const filename = `用户列表_${new Date().toISOString().split('T')[0]}`;
      
      switch (format) {
        case "csv":
          // CSV 格式
          const csvRows = [headers.join(",")];
          data.forEach(user => {
            const row = [
              `"${user["用户ID"]}"`,
              `"${user["用户名"]}"`,
              `"${user["显示名"]}"`,
              `"${user["邮箱"]}"`,
              `"${user["角色"]}"`,
              `"${user["状态"]}"`,
              `"${user["企业微信ID"]}"`,
              `"${user["创建时间"]}"`
            ];
            csvRows.push(row.join(","));
          });
          const csvContent = csvRows.join("\n");
          const csvBlob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
          saveAs(csvBlob, `${filename}.csv`);
          break;
          
        case "excel":
          // Excel 格式
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "用户列表");
          const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
          const excelBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
          saveAs(excelBlob, `${filename}.xlsx`);
          break;
          
        case "json":
          // JSON 格式
          const jsonContent = JSON.stringify(data, null, 2);
          const jsonBlob = new Blob([jsonContent], { type: "application/json" });
          saveAs(jsonBlob, `${filename}.json`);
          break;
      }
    } catch (e) {
      console.error("导出用户列表失败", e);
      alert("导出失败，请稍后重试");
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = (u.display_name || "").includes(search) || (u.email || "").includes(search) || (u.username || "").includes(search);
    
    // 角色筛选逻辑
    let matchRole = true;
    if (filterRole === "管理员") {
      matchRole = u.role === "admin";
    } else if (filterRole === "VIP") {
      matchRole = u.role === "vip";
    } else if (filterRole === "普通用户") {
      matchRole = u.role === "normal";
    }
    
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-5">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">用户管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">共 {total} 位注册用户</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border">
                <Download className="h-3.5 w-3.5" />
                导出
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleExportUsers("csv")} className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                CSV 格式
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportUsers("excel")} className="flex items-center gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Excel 格式
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportUsers("json")} className="flex items-center gap-2 cursor-pointer">
                <FileJson className="h-4 w-4" />
                JSON 格式
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={() => window.location.href = "/admin/users/new"}>
            <UserPlus className="h-3.5 w-3.5" />
            新增用户
          </Button>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索用户名或邮箱..."
                className="h-9 pl-9 rounded-lg border-border text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg p-1 border border-border/60">
              {["全部", "管理员", "VIP", "普通用户"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterRole(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    filterRole === p
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户表格 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">用户</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">工号</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">角色</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">状态</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">注册时间</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">登录 IP</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">加载中...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">没有找到匹配的用户</td>
                  </tr>
                ) : (
                  filtered.map((user) => {
                    const st = user.status === "active" ? { label: "正常", cls: "text-emerald-500 bg-emerald-500/10" } : { label: "停用", cls: "text-red-500 bg-red-500/10" };
                    return (
                      <tr key={user.user_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.display_name} className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-border" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {user.display_name ? user.display_name[0].toUpperCase() : "U"}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-foreground">{user.display_name || user.username}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{user.email || user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {user.wecom_user_id || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => toggleRole(user)}
                            className={`px-2 py-0.5 rounded text-xs font-medium hover:opacity-80 transition-opacity ${user.role === "admin" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"}`}>
                            {user.role === "admin" ? "管理员" : "普通用户"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => toggleStatus(user)}
                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                            <span className={`text-xs font-medium ${st.cls}`}>{st.label}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          <div>{user.last_login_ip || "—"}</div>
                          <div className="text-xs text-muted-foreground/70">{user.last_login_location || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => deleteUser(user.user_id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors" title="删除">
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

          {/* 分页控制 */}
          {total > 0 && (
            <div className="p-4 border-t flex items-center justify-between bg-muted/10">
              <div className="text-xs text-muted-foreground">
                显示 {(page - 1) * pageSize + 1} 到 {Math.min(page * pageSize, total)} 条，共 {total} 条
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
                    第 {page} / {Math.ceil(total / pageSize)} 页
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
                    disabled={page === Math.ceil(total / pageSize) || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1.5 ml-2 border-l pl-3 border-border/60">
                    <span className="text-[10px] text-muted-foreground">跳转</span>
                    <Input
                      type="number"
                      min={1}
                      max={Math.ceil(total / pageSize)}
                      className="w-12 h-7 px-1 text-center text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt((e.target as HTMLInputElement).value);
                          const totalPages = Math.ceil(total / pageSize);
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
  );
}
