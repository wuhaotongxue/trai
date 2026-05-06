/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-21 10:00:00
 * 描述: 管理后台 - 知识库管理
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Database, Plus, RefreshCw, FolderOpen, AlertCircle, FileText, X, Trash2, Upload, FileUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/api_client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { globalToast } from "@/components/toast/toast";
import { toastMessages } from "@/components/toast/use_toast";

interface KnowledgeBase {
  id: string;
  name: string;
  status: string;
  documentCount?: number;
  createdAt?: string;
}

interface KBFile {
  id: string;
  name: string;
  status: string;
  size?: number;
  createdAt?: string;
}

interface CreateKBDialogState {
  open: boolean;
  name: string;
  content: string;
  creating: boolean;
}

export default function KnowledgeBasePage() {
  const [indices, setIndices] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // 文档管理弹窗状态
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [files, setFiles] = useState<KBFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // 上传状态
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadContent, setUploadContent] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  // 新建知识库弹窗状态
  const [createKBDialog, setCreateKBDialog] = useState<CreateKBDialogState>({
    open: false,
    name: "",
    content: "",
    creating: false,
  });

  const fetchIndices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await request<{ items: KnowledgeBase[]; total?: number }>("/admin/knowledge_base/indices" + (searchQuery ? `?index_name=${encodeURIComponent(searchQuery)}` : ""), {
        method: "GET",
      });
      if (res.items) {
        setIndices(res.items);
      } else {
        setError("获取知识库列表失败");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "请求失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchIndices();
  }, [fetchIndices]);

  const fetchFiles = async (kbId: string) => {
    setFilesLoading(true);
    try {
      const res = await request<{ items: any[] }>(`/admin/knowledge_base/indices/${kbId}/files`, {
        method: "GET",
      });
      const formattedFiles = (res.items || []).map(item => ({
        id: item.Id || item.id || item.FileId,
        name: item.Name || item.name || item.FileName,
        status: item.Status || item.status,
        size: item.Size || item.size,
        createdAt: item.CreatedAt || item.createdAt
      }));
      setFiles(formattedFiles);
    } catch (err) {
      console.error("Fetch files failed", err);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleManageDocs = (kb: KnowledgeBase) => {
    setSelectedKB(kb);
    setManageDialogOpen(true);
    fetchFiles(kb.id);
  };

  const handleDeleteClick = (type: "file" | "index", id: string, name: string) => {
    const message = type === "file" 
      ? `确定要删除文档 "${name}" 吗？此操作不可撤销。`
      : `确定要删除知识库 "${name}" 吗？此操作不可撤销。`;
    if (confirm(message)) {
      if (type === "file" && selectedKB) {
        request(`/admin/knowledge_base/indices/${selectedKB.id}/files/${id}`, { method: "DELETE" })
          .then(() => { globalToast({ message: toastMessages.deleted, variant: "success" }); fetchFiles(selectedKB.id); })
          .catch(() => globalToast({ message: toastMessages.deleteFailed, variant: "error" }));
      } else {
        request(`/admin/knowledge_base/indices/${id}`, { method: "DELETE" })
          .then(() => { globalToast({ message: toastMessages.deleted, variant: "success" }); fetchIndices(); })
          .catch(() => globalToast({ message: toastMessages.deleteFailed, variant: "error" }));
      }
    }
  };
    if (!selectedKB || !uploadContent || !uploadFileName) return;
    setUploading(true);
    try {
      await request(`/admin/knowledge_base/indices/${selectedKB.id}/files/upload_text`, {
        method: "POST",
        body: JSON.stringify({
          content: uploadContent,
          file_name: uploadFileName.endsWith(".md") ? uploadFileName : `${uploadFileName}.md`
        })
      });
      globalToast({ message: toastMessages.created, variant: "success" });
      setUploadDialogOpen(false);
      setUploadContent("");
      setUploadFileName("");
      fetchFiles(selectedKB.id);
    } catch (err) {
      globalToast({ message: toastMessages.uploadFailed, variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteIndex = async (kbId: string) => {
    try {
      await request(`/admin/knowledge_base/indices/${kbId}`, {
        method: "DELETE"
      });
      globalToast({ message: toastMessages.deleted, variant: "success" });
      fetchIndices();
    } catch (err) {
      globalToast({ message: toastMessages.deleteFailed, variant: "error" });
    }
  };

  const handleCreateKB = async () => {
    if (!createKBDialog.name.trim()) {
      globalToast({ message: "请输入知识库名称", variant: "warning" });
      return;
    }
    setCreateKBDialog(prev => ({ ...prev, creating: true }));
    try {
      const res = await request<{ index_id: string; job_status: string }>("/admin/knowledge_base/demo_create", {
        method: "POST",
        body: JSON.stringify({
          index_name: createKBDialog.name,
          content: createKBDialog.content || "# " + createKBDialog.name + "\n\n这是新建的知识库内容。",
        })
      });
      if (res.index_id) {
        globalToast({ message: toastMessages.created, variant: "success" });
        setCreateKBDialog({ open: false, name: "", content: "", creating: false });
        fetchIndices();
      }
    } catch (err) {
      globalToast({ message: toastMessages.createFailed, variant: "error" });
    } finally {
      setCreateKBDialog(prev => ({ ...prev, creating: false }));
    }
  };

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
          <Button className="h-9 gap-2 shadow-sm" onClick={() => setCreateKBDialog(prev => ({ ...prev, open: true }))}>
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
                  indices.map((idx: any) => {
                    // 兼容多种字段名映射
                    const id = idx.id || idx.Id || idx.IndexId;
                    const name = idx.name || idx.Name || idx.IndexName;
                    const status = idx.status || idx.Status;
                    const docCount = idx.documentCount || idx.DocumentCount || 0;
                    
                    if (!id) return null; // 过滤无效数据
                    const kb: KnowledgeBase = { id, name, status, documentCount: docCount };

                    return (
                      <tr key={id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4 text-indigo-400" />
                          {name}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{id}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{docCount}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 text-indigo-600" onClick={() => handleManageDocs(kb)}>管理文档</Button>
                          <Button variant="ghost" size="sm" className="h-8 text-red-600" onClick={() => handleDeleteClick("index", id, name)}>删除</Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 文档管理弹窗 */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              文档管理 - {selectedKB?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">管理该知识库下的所有已同步文档</p>
              <Button size="sm" className="gap-2" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4" />
                上传文本
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">文件名</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filesLoading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">加载中...</td>
                    </tr>
                  ) : files.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">暂无文档</td>
                    </tr>
                  ) : (
                    files.map(file => (
                      <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium truncate max-w-[300px]">{file.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${file.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {file.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={() => handleDeleteClick("file", file.id, file.name)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 上传文本弹窗 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-indigo-500" />
              上传 Markdown 文本
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">文件名</label>
              <Input 
                placeholder="例如: 产品手册.md" 
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">文本内容 (Markdown)</label>
              <textarea
                className="w-full h-64 p-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="请输入要上传的 Markdown 内容..."
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>取消</Button>
            <Button onClick={handleUploadText} disabled={uploading || !uploadContent || !uploadFileName}>
              {uploading ? "上传中..." : "开始上传"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建知识库弹窗 */}
      <Dialog open={createKBDialog.open} onOpenChange={(open) => setCreateKBDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500" />
              新建知识库
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">知识库名称</label>
              <Input 
                placeholder="例如: 产品文档库" 
                value={createKBDialog.name}
                onChange={(e) => setCreateKBDialog(prev => ({ ...prev, name: e.target.value }))}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">最多 20 个字符</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">初始内容 (可选)</label>
              <textarea
                className="w-full h-48 p-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="输入初始的 Markdown 内容... (不填则使用默认内容)"
                value={createKBDialog.content}
                onChange={(e) => setCreateKBDialog(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateKBDialog(prev => ({ ...prev, open: false }))}>取消</Button>
            <Button onClick={handleCreateKB} disabled={createKBDialog.creating || !createKBDialog.name.trim()}>
              {createKBDialog.creating ? "创建中..." : "创建知识库"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
