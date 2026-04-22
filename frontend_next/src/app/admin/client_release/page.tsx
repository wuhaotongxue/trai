/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-21 10:15:00
 * 描述: 管理后台 - 客户端发布
 */

"use client";

import React, { useEffect, useState } from "react";
import { Cpu, Plus, Download, Search, RefreshCw, Clock, Upload, X, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/api_client";
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

type ReleaseItem = {
  id: number;
  version: string;
  release_notes: string | null;
  created_at: string;
  installer_url: string | null;
};

/**
 * 客户端发布管理页面
 * 
 * 用于管理桌面客户端的版本发布，包括上传安装包和更新配置文件
 * 支持版本列表查看、搜索和下载功能
 */
export default function ClientReleasePage() {
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // 表单状态
  const [version, setVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [latestYml, setLatestYml] = useState<File | null>(null);
  const [installerExe, setInstallerExe] = useState<File | null>(null);

  /**
   * 获取发布版本列表
   * 
   * 从后端 API 获取所有客户端发布记录
   */
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

  /**
   * 处理发布新版本
   * 
   * @param e 表单提交事件
   * 
   * 验证表单数据，上传文件到后端，处理成功或失败的回调
   */
  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version || !latestYml || !installerExe) {
      toast({
        title: "参数错误",
        message: "版本号和文件均为必填项",
        variant: "error"
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("version", version);
      formData.append("release_notes", releaseNotes);
      formData.append("latest_yml", latestYml);
      formData.append("installer_exe", installerExe);

      await request("/admin/client/release", {
        method: "POST",
        body: formData,
      });

      toast({
        title: "发布成功",
        message: `版本 v${version} 已成功上传并通知飞书`,
      });
      setIsModalOpen(false);
      // 重置表单
      setVersion("");
      setReleaseNotes("");
      setLatestYml(null);
      setInstallerExe(null);
      fetchReleases();
    } catch (err: any) {
      toast({
        title: "发布失败",
        message: err.message || "上传过程中出现错误",
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

/**
 * 过滤后的版本列表
 * 
 * 根据搜索关键词过滤版本号
 */
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
          <Button className="h-9 gap-2 shadow-sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            发布新版本
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>发布新版本</DialogTitle>
            <DialogDescription>
              请上传最新的客户端安装包及 electron-builder 生成的 yml 文件。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRelease} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="version">版本号</Label>
              <Input 
                id="version" 
                placeholder="例如: 1.0.0" 
                value={version}
                onChange={e => setVersion(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">更新日志</Label>
              <textarea 
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="简述本次更新内容..."
                value={releaseNotes}
                onChange={e => setReleaseNotes(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>latest.yml</Label>
                <div className="relative">
                  <Input 
                    type="file" 
                    accept=".yml"
                    className="hidden" 
                    id="yml-upload"
                    onChange={e => setLatestYml(e.target.files?.[0] || null)}
                  />
                  <Label 
                    htmlFor="yml-upload"
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                      latestYml ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10" : "border-muted-foreground/20 hover:border-muted-foreground/40 bg-muted/20"
                    )}
                  >
                    {latestYml ? (
                      <div className="flex flex-col items-center gap-1">
                        <FileText className="h-6 w-6 text-blue-500" />
                        <span className="text-[10px] truncate max-w-[120px]">{latestYml.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">上传 yml</span>
                      </div>
                    )}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>安装包 (.exe)</Label>
                <div className="relative">
                  <Input 
                    type="file" 
                    accept=".exe"
                    className="hidden" 
                    id="exe-upload"
                    onChange={e => setInstallerExe(e.target.files?.[0] || null)}
                  />
                  <Label 
                    htmlFor="exe-upload"
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                      installerExe ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10" : "border-muted-foreground/20 hover:border-muted-foreground/40 bg-muted/20"
                    )}
                  >
                    {installerExe ? (
                      <div className="flex flex-col items-center gap-1">
                        <Download className="h-6 w-6 text-indigo-500" />
                        <span className="text-[10px] truncate max-w-[120px]">{installerExe.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">上传 exe</span>
                      </div>
                    )}
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                取消
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2 min-w-[100px]">
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    正在上传...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    立即发布
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
