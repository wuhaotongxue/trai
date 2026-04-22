/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-21 10:15:00
 * 描述: 管理后台 - 客户端发布
 */

"use client";

import React, { useEffect, useState } from "react";
import { Cpu, Plus, Download, Search, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/api_client";

type ReleaseItem = {
  id: number;
  version: string;
  release_notes: string | null;
  created_at: string;
  installer_url: string | null;
};

export default function ClientReleasePage() {
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const res = await request<ReleaseItem[]>("/admin/client/releases");
      setReleases(res);
    } catch (e) {
      console.error("Fetch releases failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const filteredReleases = releases.filter(r => 
    r.version.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">客户端发布</h1>
          <p className="text-sm text-muted-foreground mt-1">管理桌面客户端和移动端的版本更新与下发</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="h-9 gap-2 shadow-sm" onClick={() => alert("发布功能开发中,请通过 API 或脚本发布")}>
            <Plus className="h-4 w-4" />
            发布新版本
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-500" />
              版本列表
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
            ) : filteredReleases.length === 0 ? (
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
                  {filteredReleases.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">v{item.version}</span>
                          {releases[0].id === item.id && (
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                          onClick={() => item.installer_url && window.open(item.installer_url)}
                          disabled={!item.installer_url}
                        >
                          <Download className="h-3.5 w-3.5" />
                          下载安装包
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
