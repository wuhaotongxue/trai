"use client";

/**
 * 文件名: video_downloader_panel.tsx
 * 作者: wuhao
 * 日期: 2026-05-29 08:11:45
 * 描述: Agent 视频下载面板, 支持 S3 域名展示与平台区分
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Loader2, Video, CheckCircle2, AlertCircle, ExternalLink, Globe, History, Copy, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { request } from "@/lib/api_client";
import { PANEL_EMPTY_COPY, PANEL_MOTION_TOKENS, PANEL_SUBTITLES } from "./panel_consistency";
import { globalToast } from "@/components/toast/toast";

interface DownloadRecord {
  task_id: string;
  title: string;
  source_url: string;
  s3_url: string;
  file_size: number;
  status: string;
  platform: string;
  created_at: string;
}

interface HistoryResponse {
  items: DownloadRecord[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * 视频下载面板组件.
 *
 * @returns 与 Agent 主界面统一风格的视频下载工具面板.
 */
export function VideoDownloaderPanel() {
  const [url, setUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSteps, setDownloadSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [result, setResult] = useState<{ title: string; s3_url: string; video_id: string; platform?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DownloadRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const brutalBorder = "border-2 border-slate-900 dark:border-white";
  const brutalShadow = "shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff]";
  const brutalShadowSm = "shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]";
  const brutalBtnBase = `font-black uppercase tracking-wider transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${brutalBorder} ${brutalShadowSm}`;

  const fetchHistory = useCallback(async (currentPage: number) => {
    setIsLoadingHistory(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const res = await request<{ code: number; data: HistoryResponse }>(`/tools/video/history?limit=${pageSize}&offset=${offset}`);
      if (res.code === 200) {
        setHistory(res.data.items);
        setTotal(res.data.total);
      }
    } catch (e) {
      console.error("获取历史记录失败", e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchHistory(page);
  }, [fetchHistory, page]);

  const handleDownload = async () => {
    if (!url.trim() || isDownloading) return;
    
    setIsDownloading(true);
    setError(null);
    setResult(null);
    setDownloadSteps([
      "正在初始化 Agent 下载环境...",
      "解析视频 URL 结构及平台属性...",
      "正在建立与 Bilibili 媒体服务器的连接...",
      "提取最高清晰度媒体流地址...",
      "正在下载视频切片并实时合并...",
      "视频下载完成, 准备上传云存储...",
      "正在将视频同步至 S3 高速存储桶...",
      "生成 7 天有效下载凭证...",
      "正在推送通知至飞书与企业微信...",
      "清理本地缓存, 流程即将完成..."
    ]);
    setCurrentStepIndex(0);

    // 模拟步骤进度
    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < 8) return prev + 1;
        return prev;
      });
    }, 4000);

    try {
      const res = await request<{code: number, msg: string, data: any}>("/tools/video/download", {
        method: "POST",
        body: JSON.stringify({ url: url.trim() })
      });

      if (res.code === 200) {
        clearInterval(stepInterval);
        setCurrentStepIndex(9); // 跳到最后一步
        setTimeout(() => {
          setResult(res.data);
          globalToast({ message: res.msg || "视频下载成功并已推送到通知终端", variant: "success" });
          setPage(1); // 刷新回第一页
          fetchHistory(1);
          setIsDownloading(false);
        }, 1000);
      } else {
        clearInterval(stepInterval);
        setError(res.msg || "下载失败, 请检查链接是否正确");
        globalToast({ message: res.msg || "下载失败", variant: "error" });
        setIsDownloading(false);
      }
    } catch (e) {
      clearInterval(stepInterval);
      setError("网络请求失败, 请重试");
      console.error(e);
      globalToast({ message: "请求失败", variant: "error" });
      setIsDownloading(false);
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    
    globalToast({
      title: "确认删除",
      message: `确定要删除这 ${ids.length} 条下载记录吗? 此操作不可撤销.`,
      variant: "warning",
      confirmText: "确定删除",
      cancelText: "取消",
      duration: 0,
      onConfirm: async () => {
        try {
          const res = await request<{ code: number; msg: string }>("/tools/video/delete", {
            method: "POST",
            body: JSON.stringify({ task_ids: ids })
          });
          if (res.code === 200) {
            globalToast({ message: res.msg, variant: "success" });
            setSelectedIds(new Set());
            // 如果当前页删完了, 自动跳回前一页
            const newHistoryLength = history.length - ids.length;
            if (newHistoryLength <= 0 && page > 1) {
              setPage(prev => prev - 1);
            } else {
              fetchHistory(page);
            }
          }
        } catch (e) {
          globalToast({ message: "删除失败", variant: "error" });
        }
      }
    });
  };

  const handleCopy = (s3_url: string) => {
    navigator.clipboard.writeText(s3_url);
    globalToast({ message: "下载链接已复制到剪贴板", variant: "success" });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history.map(r => r.task_id)));
    }
  };

  const handleBatchCopy = () => {
    if (selectedIds.size === 0) return;
    const urls = history
      .filter(r => selectedIds.has(r.task_id))
      .map(r => r.s3_url)
      .join("\n");
    
    navigator.clipboard.writeText(urls);
    globalToast({ message: `已复制 ${selectedIds.size} 个下载链接`, variant: "success" });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-950 p-1 sm:p-2 overflow-hidden">
      <div 
        className="w-full h-full flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-2 lg:gap-4 overflow-hidden"
      >
        <div className={`flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadowSm} overflow-hidden`}>
          <div className={`p-3 bg-cyan-200 dark:bg-slate-200 text-slate-900 border-b-2 border-slate-900 flex items-center justify-between gap-4 shrink-0`}>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider">Video Downloader</h1>
              <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">同一套边框, 同一套状态感知</p>
            </div>
            <div className={`px-2 py-1 bg-white ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] text-[10px] font-black uppercase`}>
              下载工具
            </div>
          </div>

          <div className="flex-1 grid grid-rows-[auto_1fr] p-2 gap-2 bg-slate-50 dark:bg-slate-950 overflow-hidden min-h-0">
            <div className={`p-3 sm:p-4 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadowSm} space-y-3 shrink-0`}>
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">输入下载链接</div>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-900 dark:text-white group-focus-within:text-cyan-500 transition-colors">
                  <Search className="w-5 h-5 font-black" />
                </div>
                <Input 
                  aria-label="视频下载链接"
                  title="视频下载链接"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="粘贴视频链接..."
                  className={`pl-12 h-11 bg-white dark:bg-slate-800 rounded-none ${brutalBorder} ${brutalShadowSm} focus-visible:ring-0 focus-visible:border-cyan-500 transition-all text-sm font-bold`}
                />
              </div>
              <Button 
                onClick={handleDownload}
                disabled={!url.trim() || isDownloading}
                className={`w-full h-11 rounded-none bg-slate-100 hover:bg-cyan-100 text-slate-900 disabled:opacity-50 ${brutalBtnBase} text-base`}
              >
                {isDownloading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin font-black" />
                    <span>正在解析中...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 font-black" />
                    <span>立即下载</span>
                  </div>
                )}
              </Button>
            </div>

            <div className={`bg-white dark:bg-slate-900 p-4 ${brutalBorder} ${brutalShadowSm} flex items-center justify-center overflow-hidden min-h-0`}>
              {isDownloading ? (
                <div
                  className="w-full max-w-lg space-y-4"
                >
                  <div className={`relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden ${brutalBorder} max-h-[160px] mx-auto`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`w-16 h-16 bg-cyan-200 dark:bg-cyan-900 flex items-center justify-center ${brutalBorder} ${brutalShadowSm}`}
                      >
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    </div>
                  </div>
                    <div className={`p-3 bg-slate-50 dark:bg-slate-950 ${brutalBorder} ${brutalShadowSm} space-y-2`}>
                      <div className="flex items-center justify-between font-black uppercase text-[10px]">
                        <span>运行步骤</span>
                        <span className="text-cyan-500">{currentStepIndex + 1} / {downloadSteps.length}</span>
                      </div>
                      <div className="space-y-1 max-h-[100px] overflow-y-auto no-scrollbar">
                        {downloadSteps.slice(0, currentStepIndex + 1).map((step, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-2 text-[10px] font-bold"
                          >
                            {idx < currentStepIndex ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />
                            )}
                            <span className={idx < currentStepIndex ? "text-slate-400" : "text-slate-900 dark:text-white"}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>
              ) : error ? (
                <div 
                  className={`w-full max-w-lg p-4 bg-red-500 text-white ${brutalBorder} ${brutalShadowSm} flex items-center gap-3`}
                >
                  <AlertCircle className="w-6 h-6 shrink-0 font-black" />
                  <span className="font-bold text-sm uppercase">{error}</span>
                </div>
              ) : result ? (
                <div 
                  className="w-full max-w-lg space-y-3"
                >
                  <div className={`p-3 bg-emerald-100 dark:bg-slate-950 ${brutalBorder} ${brutalShadowSm} flex items-center gap-3`}>
                    <CheckCircle2 className="w-6 h-6 shrink-0 font-black text-emerald-700" />
                    <div>
                      <div className="font-black text-lg uppercase tracking-wider text-slate-900 dark:text-white">下载成功</div>
                    </div>
                  </div>
                  <div className={`p-4 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadowSm} space-y-3`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 bg-cyan-200 dark:bg-cyan-900 ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center shrink-0`}>
                        <Video className="w-6 h-6 text-slate-900 dark:text-white" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-black text-sm text-slate-900 dark:text-white truncate uppercase">{result.title}</h3>
                        <div className="flex flex-wrap gap-1.5 text-[9px] font-bold uppercase text-slate-500">
                          <span className={`px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 ${brutalBorder}`}>平台: {result.platform || "Bilibili"}</span>
                          <span className={`px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 ${brutalBorder}`}>S3 READY</span>
                        </div>
                      </div>
                      <a href={result.s3_url} target="_blank" rel="noopener noreferrer">
                        <Button className={`shrink-0 h-9 px-3 gap-1.5 bg-cyan-100 hover:bg-cyan-200 text-slate-900 rounded-none ${brutalBtnBase} text-[10px]`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>查看</span>
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-4"
                >
                  <div className={`w-20 h-20 bg-cyan-300 dark:bg-cyan-900 flex items-center justify-center ${brutalBorder} ${brutalShadowSm}`}>
                    <Download className="w-10 h-10 text-slate-900 dark:text-white" />
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">{PANEL_EMPTY_COPY.waiting_input_title}</div>
                    <div className={`inline-flex px-3 py-1 bg-white dark:bg-slate-900 text-[10px] font-bold ${brutalBorder} ${brutalShadowSm}`}>
                      {PANEL_EMPTY_COPY.waiting_input_desc}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 overflow-hidden min-h-0">
          <div className={`p-4 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadowSm} flex flex-col flex-1 min-h-0`}>
            <div className="flex items-center justify-between gap-4 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 font-black" />
                <div className="flex flex-col">
                  <div className="font-black uppercase tracking-wider text-slate-900 dark:text-white text-xs">下载画廊</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">GALLERY</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedIds.size > 0 && (
                  <Button 
                    onClick={() => handleDelete(Array.from(selectedIds))}
                    className={`h-7 px-2 rounded-none bg-red-100 hover:bg-red-200 text-red-600 border-2 border-slate-900 dark:border-white font-black text-[9px] uppercase`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                <Button 
                  onClick={handleBatchCopy}
                  disabled={selectedIds.size === 0}
                  className={`h-7 px-2 gap-1 rounded-none bg-cyan-100 hover:bg-cyan-200 text-slate-900 border-2 border-slate-900 dark:border-white font-black text-[9px] uppercase disabled:opacity-50`}
                >
                  <Copy className="w-3 h-3" />
                  <span>复制 ({selectedIds.size})</span>
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 no-scrollbar">
              <AnimatePresence mode="popLayout">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-bold uppercase tracking-wider text-[8px]">同步中...</span>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                    <History className="w-10 h-10 opacity-20" />
                    <div className="text-center">
                      <div className="font-black uppercase tracking-wider text-xs text-slate-600">暂无记录</div>
                    </div>
                  </div>
                ) : (
                  history.map((record) => (
                    <motion.div
                      key={record.task_id}
                      layout
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={`group relative p-2 bg-slate-50 dark:bg-slate-800 border-2 ${selectedIds.has(record.task_id) ? 'border-cyan-500 bg-cyan-50/50 shadow-[2px_2px_0px_0px_#06b6d4]' : 'border-slate-900 dark:border-white'} transition-all hover:bg-white dark:hover:bg-slate-700 cursor-pointer`}
                      onClick={() => toggleSelect(record.task_id)}
                    >
                      <div className="flex items-start gap-2">
                        <div 
                          className={`mt-0.5 shrink-0 w-4 h-4 border-2 border-slate-900 dark:border-white flex items-center justify-center ${selectedIds.has(record.task_id) ? 'bg-cyan-500' : 'bg-white dark:bg-slate-900'}`}
                        >
                          {selectedIds.has(record.task_id) && <Check className="w-3 h-3 text-white font-black" strokeWidth={4} />}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4 className="font-black text-[10px] text-slate-900 dark:text-white truncate uppercase leading-tight" title={record.title}>
                            {record.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase text-slate-400">
                            <span className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-none text-slate-700 dark:text-slate-300">
                              {record.platform}
                            </span>
                            <span>{(record.file_size / 1024 / 1024).toFixed(1)} MB</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopy(record.s3_url); }}
                            className="p-1 hover:bg-cyan-200 text-slate-900 dark:text-white transition-colors border border-transparent hover:border-slate-900"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                          <a 
                            href={record.s3_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1 hover:bg-emerald-200 text-slate-900 dark:text-white transition-colors border border-transparent hover:border-slate-900"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {total > pageSize && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="h-6 px-1.5 rounded-none border-2 border-slate-900 dark:border-white disabled:opacity-30"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-[9px] font-black uppercase tracking-tighter">
                  PAGE {page} / {Math.ceil(total / pageSize)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page >= Math.ceil(total / pageSize)} 
                  onClick={() => setPage(p => p + 1)}
                  className="h-6 px-1.5 rounded-none border-2 border-slate-900 dark:border-white disabled:opacity-30"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          <div className={`p-5 bg-amber-100 dark:bg-slate-950 ${brutalBorder} ${brutalShadow} space-y-3`}>
            <div className="font-black uppercase tracking-widest text-slate-900 dark:text-white">{PANEL_SUBTITLES.system_notes}</div>
            <ul className="space-y-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              <li>优先粘贴完整作品页地址, 不要直接贴短链.</li>
              <li>下载结果会统一落入右侧结果卡片, 方便后续查看.</li>
              <li>如果平台限流或源站异常, 这里会直接给出错误提示.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
