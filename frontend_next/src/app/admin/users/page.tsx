/**
 * page.tsx
 * 用户管理页面
 */

"use client";

import { useState } from "react";
import { Download, Edit2, Mail, Search, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const mockUsers = [
  { id: 1, name: "张明", email: "zhangming@example.com", plan: "VIP", status: "active", agent_calls: 1284, joined: "2026-01-15", avatar: "张" },
  { id: 2, name: "李华", email: "lihua@example.com", plan: "免费", status: "active", agent_calls: 42, joined: "2026-02-03", avatar: "李" },
  { id: 3, name: "王芳", email: "wangfang@example.com", plan: "Pro", status: "active", agent_calls: 3891, joined: "2025-12-20", avatar: "王" },
  { id: 4, name: "刘强", email: "liuqiang@example.com", plan: "VIP", status: "inactive", agent_calls: 0, joined: "2026-03-01", avatar: "刘" },
  { id: 5, name: "陈静", email: "chenjing@example.com", plan: "Pro", status: "active", agent_calls: 2108, joined: "2026-01-28", avatar: "陈" },
  { id: 6, name: "赵伟", email: "zhaowei@example.com", plan: "免费", status: "active", agent_calls: 156, joined: "2026-02-14", avatar: "赵" },
  { id: 7, name: "孙丽", email: "sunli@example.com", plan: "Pro", status: "banned", agent_calls: 0, joined: "2025-11-05", avatar: "孙" },
  { id: 8, name: "周杰", email: "zhoujie@example.com", plan: "VIP", status: "active", agent_calls: 4521, joined: "2025-10-18", avatar: "周" },
];

const planBadge: Record<string, string> = {
  VIP: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Pro: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  免费: "bg-muted/40 text-muted-foreground border-border/60",
};

const statusBadge: Record<string, { cls: string; dot: string; label: string }> = {
  active: { cls: "bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-500", label: "正常" },
  inactive: { cls: "bg-muted/40 text-muted-foreground", dot: "bg-muted-foreground/60", label: "未激活" },
  banned: { cls: "bg-red-500/15 text-red-400", dot: "bg-red-500", label: "已封禁" },
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("全部");

  const filtered = mockUsers.filter((u) => {
    const matchSearch = u.name.includes(search) || u.email.includes(search);
    const matchPlan = filterPlan === "全部" || u.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const total = mockUsers.length;

  return (
    <div className="space-y-5">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">用户管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">共 {total} 位注册用户</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border">
            <Download className="h-3.5 w-3.5" />
            导出
          </Button>
          <Button size="sm" className="h-9 gap-2 text-sm shadow-sm">
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
              {["全部", "VIP", "Pro", "免费"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPlan(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    filterPlan === p
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">套餐</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">状态</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agent 调用</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">注册时间</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => {
                  const st = statusBadge[user.status];
                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-border/40 hover:bg-muted/25 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/10"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {user.avatar}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${planBadge[user.plan]}`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          <span className={`text-xs font-medium ${st.cls}`}>{st.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground/80">
                        {user.agent_calls > 0 ? user.agent_calls.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.joined}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors" title="编辑">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-blue-500/15 text-muted-foreground hover:text-blue-400 transition-colors" title="发送邮件">
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors" title="删除">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">未找到匹配的用户</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
