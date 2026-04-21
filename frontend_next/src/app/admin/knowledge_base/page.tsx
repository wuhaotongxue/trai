/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-21 10:00:00
 * 描述: 管理后台 - 知识库管理
 */

"use client";

import React, { useState, useEffect } from "react";
import { Search, Database, Plus, RefreshCw, FolderOpen, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api_client } from "@/lib/api_client";

interface KnowledgeBase {
  id: string;
  name: string;
  status: string;
  documentCount?: number;
  createdAt?: string;
}

export default function KnowledgeBasePage() {
  const [indices, setIndices] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const fetchIndices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api_client.post("/admin/knowledge_base/list", {
        index_name: searchQuery || undefined,
      });
      if (res.code === 200 && res.data?.items) {
        setIndices(res.data.items);
      } else {
        setError(res.msg || "获取知识库列表失败");
      }
    } catch (err: any) {
      setError(err.message || "请求失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
  }, [searchQuery]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">知识库管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理阿里云百炼检索增强生成的私有知识库</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9 gap-2 shadow-sm" onClick={fetchIndices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button className="h-9 gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            新建知识库
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500" />
              索引列表
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索知识库名称..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">知识库名称</th>
                  <th className="px-6 py-4 font-medium">索引 ID</th>
                  <th className="px-6 py-4 font-medium">状态</th>
                  <th className="px-6 py-4 font-medium">文档数</th>
                  <th className="px-6 py-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      加载中...
                    </td>
                  </tr>
                ) : indices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FolderOpen className="h-10 w-10 mb-3 text-muted-foreground/50" />
                        <p>暂无知识库数据</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  indices.map((idx) => (
                    <tr key={idx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-indigo-400" />
                        {idx.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{idx.id}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${idx.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {idx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{idx.documentCount || 0}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 text-indigo-600">管理文档</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-red-600">删除</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
