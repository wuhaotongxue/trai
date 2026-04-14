/**
 * page.tsx
 * 会话记录页面
 */

"use client";

import { useState } from "react";
import { Clock, Download, Eye, Filter, MessageSquare, Search, Trash2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sessions = [
  { id: 1, user: "张明", email: "zhangming@example.com", sessions_count: 128, messages: 842, agent_calls: 2034, last_active: "2026-04-10 14:23", status: "active" },
  { id: 2, user: "李华", email: "lihua@example.com", sessions_count: 34, messages: 210, agent_calls: 156, last_active: "2026-04-10 11:05", status: "active" },
  { id: 3, user: "王芳", email: "wangfang@example.com", sessions_count: 289, messages: 3201, agent_calls: 8742, last_active: "2026-04-09 22:18", status: "active" },
  { id: 4, user: "刘强", email: "liuqiang@example.com", sessions_count: 5, messages: 12, agent_calls: 0, last_active: "2026-03-15 09:30", status: "inactive" },
  { id: 5, user: "陈静", email: "chenjing@example.com", sessions_count: 156, messages: 1892, agent_calls: 3201, last_active: "2026-04-10 13:47", status: "active" },
  { id: 6, user: "赵伟", email: "zhaowei@example.com", sessions_count: 78, messages: 654, agent_calls: 892, last_active: "2026-04-08 16:22", status: "active" },
  { id: 7, user: "孙丽", email: "sunli@example.com", sessions_count: 12, messages: 48, agent_calls: 0, last_active: "2026-03-01 10:00", status: "inactive" },
  { id: 8, user: "周杰", email: "zhoujie@example.com", sessions_count: 412, messages: 5842, agent_calls: 12004, last_active: "2026-04-10 14:55", status: "active" },
];

export default function SessionsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("全部");

  const filtered = sessions.filter((s) => {
    const matchSearch = s.user.includes(search) || s.email.includes(search);
    const matchStatus = filterStatus === "全部" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">会话记录</h1>
          <p className="text-sm text-muted-foreground mt-0.5">管理用户的所有会话历史与消息</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border">
            <Download className="h-3.5 w-3.5" />
            导出记录
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
                placeholder="搜索用户..."
                className="h-9 pl-9 rounded-lg border-border text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg p-1 border border-border/60">
              {["全部", "活跃", "不活跃"].map((label) => {
                const value = label === "活跃" ? "active" : label === "不活跃" ? "inactive" : "全部";
                const active = filterStatus === value;
                return (
                <button
                  key={label}
                  onClick={() => setFilterStatus(value)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 会话表格 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">用户</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">会话数</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">消息数</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agent 调用</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">最后活跃</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">状态</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`border-b border-border/40 hover:bg-muted/25 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/10"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {s.user[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{s.user}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground/80">{s.sessions_count}</td>
                    <td className="px-4 py-3 text-right text-foreground/80">{s.messages.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{s.agent_calls.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                        {s.last_active}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted/40 text-muted-foreground"
                      }`}>
                        {s.status === "active" ? "活跃" : "不活跃"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-blue-500/15 text-muted-foreground hover:text-blue-400 transition-colors" title="查看详情">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors" title="删除">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">未找到匹配的会话记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
