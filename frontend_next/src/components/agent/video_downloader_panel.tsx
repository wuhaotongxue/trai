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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto w-full h-full grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6"
      >
        <div className={`flex flex-col min-h-[680px] bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadow} overflow-hidden`}>
          <div className={`p-4 bg-cyan-200 dark:bg-slate-200 text-slate-900 ${brutalBorder} border-t-0 border-l-0 border-r-0 flex items-center justify-between gap-4`}>
            <div>
              <h1 className="text-xl font-black uppercase tracking-[0.2em]">Video Downloader</h1>
              <p className="text-xs font-bold uppercase tracking-wider mt-1">同一套边框, 同一套状态感知, 同一套结果区</p>
            </div>
            <div className={`px-3 py-2 bg-white ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] text-xs font-black uppercase tracking-widest`}>
              下载工具
            </div>
          </div>

          <div className="flex-1 grid grid-rows-[auto_1fr] p-4 gap-4 bg-slate-50 dark:bg-slate-950">
            <div className={`p-5 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadowSm} space-y-4`}>
              <div className="flex items-center justify-between gap-4">
                <div className="font-black uppercase tracking-widest text-slate-900 dark:text-white">输入下载链接</div>
                <div className="text-xs font-bold uppercase text-slate-500">{PANEL_SUBTITLES.result_stage}</div>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-900 dark:text-white group-focus-within:text-cyan-500 transition-colors">
                  <Search className="w-6 h-6 font-black" />
                </div>
                <Input 
                  aria-label="视频下载链接"
                  title="视频下载链接"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="粘贴视频链接, 例如: https://www.bilibili.com/video/BV1MSLt6qEdt"
                  className={`pl-14 h-16 bg-white dark:bg-slate-800 rounded-none ${brutalBorder} ${brutalShadowSm} focus-visible:ring-0 focus-visible:border-cyan-500 focus-visible:shadow-[4px_4px_0px_0px_#06b6d4] transition-all text-lg font-bold`}
                />
              </div>
              <Button 
                onClick={handleDownload}
                disabled={!url.trim() || isDownloading}
                className={`w-full h-16 rounded-none bg-slate-100 hover:bg-cyan-100 text-slate-900 disabled:opacity-50 ${brutalBtnBase} text-xl`}
              >
                {isDownloading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin font-black" />
                    <span>正在解析并下载中...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Download className="w-6 h-6 font-black" />
                    <span>立即下载</span>
                  </div>
                )}
              </Button>
            </div>

            <div className={`bg-white dark:bg-slate-900 p-6 ${brutalBorder} ${brutalShadow} flex items-center justify-center overflow-hidden`}>
              {isDownloading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full max-w-2xl space-y-6"
                >
                  <div className={`relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden ${brutalBorder}`}>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: PANEL_MOTION_TOKENS.sweep_duration, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        className={`w-28 h-28 bg-cyan-200 dark:bg-cyan-900 flex items-center justify-center ${brutalBorder} ${brutalShadowSm}`}
                        animate={{ rotate: [0, 4, -4, 0] }}
                        transition={{ duration: PANEL_MOTION_TOKENS.pulse_duration, repeat: Infinity }}
                      >
                        <Loader2 className="w-14 h-14 animate-spin" />
                      </motion.div>
                    </div>
                  </div>
                    <div className={`p-5 bg-slate-50 dark:bg-slate-950 ${brutalBorder} ${brutalShadowSm} space-y-4`}>
                      <div className="flex items-center justify-between font-black uppercase">
                        <span>Agent 运行步骤</span>
                        <span className="text-cyan-500">{currentStepIndex + 1} / {downloadSteps.length}</span>
                      </div>
                      <div className="space-y-2">
                        {downloadSteps.slice(0, currentStepIndex + 1).map((step, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-sm font-bold"
                          >
                            {idx < currentStepIndex ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                            )}
                            <span className={idx < currentStepIndex ? "text-slate-400" : "text-slate-900 dark:text-white"}>
                              {step}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-800 border-2 border-slate-900 dark:border-white overflow-hidden mt-4">
                        <motion.div
                          className="h-full bg-cyan-500"
                          initial={{ width: "0%" }}
                          animate={{ width: `${((currentStepIndex + 1) / downloadSteps.length) * 100}%` }}
                        />
                      </div>
                    </div>
                </motion.div>
              ) : error ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`w-full max-w-2xl p-5 bg-red-500 text-white ${brutalBorder} ${brutalShadowSm} flex items-center gap-4`}
                >
                  <AlertCircle className="w-8 h-8 shrink-0 font-black" />
                  <span className="font-bold text-lg uppercase tracking-wider">{error}</span>
                </motion.div>
              ) : result ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-3xl space-y-5"
                >
                  <div className={`p-5 bg-emerald-100 dark:bg-slate-950 ${brutalBorder} ${brutalShadowSm} flex items-center gap-4`}>
                    <CheckCircle2 className="w-8 h-8 shrink-0 font-black text-emerald-700" />
                    <div>
                      <div className="font-black text-2xl uppercase tracking-widest text-slate-900 dark:text-white">下载成功</div>
                      <div className="text-sm font-bold text-slate-600 dark:text-slate-300">结果已整理到统一结果区</div>
                    </div>
                  </div>
                  <div className={`p-6 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadow} space-y-5`}>
                    <div className="flex items-start gap-6">
                      <div className={`w-16 h-16 bg-cyan-200 dark:bg-cyan-900 ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center shrink-0`}>
                        <Video className="w-8 h-8 text-slate-900 dark:text-white" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="font-black text-xl text-slate-900 dark:text-white truncate uppercase">{result.title}</h3>
                        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase text-slate-500">
                          <span className={`px-3 py-2 bg-slate-100 dark:bg-slate-800 ${brutalBorder}`}>平台: {result.platform || "Bilibili"}</span>
                          <span className={`px-3 py-2 bg-slate-100 dark:bg-slate-800 ${brutalBorder}`}>ID: {result.video_id}</span>
                          <span className={`px-3 py-2 bg-slate-100 dark:bg-slate-800 ${brutalBorder}`}>S3 READY</span>
                        </div>
                      </div>
                      <a href={result.s3_url} target="_blank" rel="noopener noreferrer">
                        <Button className={`shrink-0 h-12 gap-2 bg-cyan-100 hover:bg-cyan-200 text-slate-900 rounded-none ${brutalBtnBase}`}>
                          <ExternalLink className="w-5 h-5" />
                          <span>立即查看</span>
                        </Button>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.98 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: PANEL_MOTION_TOKENS.float_duration, repeat: Infinity, repeatType: "reverse" }}
                  className="flex flex-col items-center justify-center gap-6"
                >
                  <div className={`w-32 h-32 bg-cyan-300 dark:bg-cyan-900 flex items-center justify-center ${brutalBorder} ${brutalShadow}`}>
                    <Download className="w-16 h-16 text-slate-900 dark:text-white" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-black uppercase tracking-widest text-slate-900 dark:text-white">{PANEL_EMPTY_COPY.waiting_input_title}</div>
                    <div className={`inline-flex px-4 py-2 bg-white dark:bg-slate-900 text-sm font-bold ${brutalBorder} ${brutalShadowSm}`}>
                      {PANEL_EMPTY_COPY.waiting_input_desc}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 auto-rows-min overflow-hidden">
          <div className={`p-5 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadow} flex flex-col h-[550px]`}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 font-black" />
                <div className="flex flex-col">
                  <div className="font-black uppercase tracking-widest text-slate-900 dark:text-white text-sm">下载画廊</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{PANEL_SUBTITLES.gallery_rail}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleSelectAll}
                    title="全选/取消全选"
                    className={`h-8 px-2 rounded-none border-2 border-slate-900 dark:border-white font-bold text-xs uppercase bg-white dark:bg-slate-900`}
                  >
                    {selectedIds.size === history.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </Button>
                )}
                {selectedIds.size > 0 && (
                  <Button 
                    onClick={() => handleDelete(Array.from(selectedIds))}
                    className={`h-8 px-2 rounded-none bg-red-100 hover:bg-red-200 text-red-600 border-2 border-slate-900 dark:border-white font-black text-xs uppercase`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  onClick={handleBatchCopy}
                  disabled={selectedIds.size === 0}
                  className={`h-8 px-3 gap-2 rounded-none bg-cyan-100 hover:bg-cyan-200 text-slate-900 border-2 border-slate-900 dark:border-white font-black text-xs uppercase disabled:opacity-50`}
                >
                  <Copy className="w-4 h-4" />
                  <span>复制 ({selectedIds.size})</span>
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="font-bold uppercase tracking-wider text-[10px]">正在同步历史记录...</span>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                    <History className="w-12 h-12 opacity-20" />
                    <div className="text-center">
                      <div className="font-black uppercase tracking-wider text-sm text-slate-600">{PANEL_EMPTY_COPY.waiting_history_title}</div>
                      <div className="font-bold text-[10px] text-slate-400 max-w-[150px] mx-auto mt-1">{PANEL_EMPTY_COPY.waiting_history_desc}</div>
                    </div>
                  </div>
                ) : (
                  history.map((record) => (
                    <motion.div
                      key={record.task_id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`group relative p-3 bg-slate-50 dark:bg-slate-800 border-2 ${selectedIds.has(record.task_id) ? 'border-cyan-500 bg-cyan-50/50 shadow-[4px_4px_0px_0px_#06b6d4]' : 'border-slate-900 dark:border-white'} transition-all hover:bg-white dark:hover:bg-slate-700 cursor-pointer`}
                      onClick={() => toggleSelect(record.task_id)}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className={`mt-1 shrink-0 w-5 h-5 border-2 border-slate-900 dark:border-white flex items-center justify-center ${selectedIds.has(record.task_id) ? 'bg-cyan-500' : 'bg-white dark:bg-slate-900'}`}
                        >
                          {selectedIds.has(record.task_id) && <Check className="w-4 h-4 text-white font-black" strokeWidth={4} />}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white truncate uppercase leading-tight" title={record.title}>
                            {record.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                            <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-none text-slate-700 dark:text-slate-300">
                              {record.platform}
                            </span>
                            <span>{(record.file_size / 1024 / 1024).toFixed(1)} MB</span>
                            <span className="truncate">{new Date(record.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleCopy(record.s3_url)}
                            className="p-1.5 hover:bg-cyan-200 text-slate-900 dark:text-white transition-colors border-2 border-transparent hover:border-slate-900"
                            title="复制链接"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete([record.task_id])}
                            className="p-1.5 hover:bg-red-200 text-red-600 transition-colors border-2 border-transparent hover:border-slate-900"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <a 
                            href={record.s3_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1.5 hover:bg-emerald-200 text-slate-900 dark:text-white transition-colors border-2 border-transparent hover:border-slate-900"
                            title="打开预览"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {total > pageSize && (
              <div className={`mt-4 pt-3 border-t-2 border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4`}>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  PAGE {page} / {Math.ceil(total / pageSize)}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1 || isLoadingHistory}
                    onClick={() => setPage(p => p - 1)}
                    className={`h-8 w-8 p-0 rounded-none border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-900`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(total / pageSize) || isLoadingHistory}
                    onClick={() => setPage(p => p + 1)}
                    className={`h-8 w-8 p-0 rounded-none border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-900`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
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
      </motion.div>
    </div>
  );
}
