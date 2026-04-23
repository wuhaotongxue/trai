/**
 * page.tsx
 * 会话记录页面
 */

"use client";

import { useState, useEffect } from "react";
import { Clock, Download, Eye, MessageSquare, Search, Trash2, RefreshCw, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/api_client";

type SessionRecord = {
  session_id: string;
  user_id: string;
  username: string;
  display_name: string;
  email: string;
  sessions_count: number;
  messages_count: number;
  agent_calls: number;
  last_active: string;
  status: "active" | "inactive";
};

type SessionStatsResponse = {
  total: number;
  sessions: SessionRecord[];
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("全部");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await request<SessionStatsResponse>(`/admin/sessions/grouped?limit=${pageSize}&offset=${(page - 1) * pageSize}`, {
        method: "GET",
      });
      setSessions(res.sessions);
      setTotal(res.total);
    } catch (e) {
      console.error("Fetch sessions failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page]);

  const filtered = sessions.filter((s) => {
    const matchSearch = s.display_name.includes(search) || s.email.includes(search) || s.username.includes(search);
    const matchStatus = filterStatus === "全部" || (filterStatus === "活跃" ? s.status === "active" : s.status === "inactive");
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">会话记录</h1>
          <p className="text-sm text-muted-foreground mt-0.5">管理用户的所有会话历史与消息</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={fetchSessions}>
            <RefreshCw className="h-3.5 w-3.5" />
            刷新
          </Button>
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                      加载中...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">未找到匹配的会话记录</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, i) => (
                    <tr key={s.session_id} className={`border-b border-border/40 hover:bg-muted/25 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/10"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{s.display_name || s.username}</p>
                            <p className="text-xs text-muted-foreground">{s.email || "---"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground/80">{s.sessions_count}</td>
                      <td className="px-4 py-3 text-right text-foreground/80">{s.messages_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{s.agent_calls.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground/60" />
                          {s.last_active || "---"}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            共 {total} 条记录，第 {page} / {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              上一页
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
