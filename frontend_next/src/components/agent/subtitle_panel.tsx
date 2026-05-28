"use client";

/**
 * subtitle_panel.tsx
 * 作者: wuhao
 * 日期: 2026-05-23
 * 描述: 字幕生成面板, 左右分栏布局
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { request } from "@/lib/api_client";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileAudio, FileVideo, ExternalLink, Video, Trash2, Captions, Music, Languages, MonitorPlay, Type } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll_area";
import { globalToast } from "@/components/toast/toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BurnMode, SubtitleGenerateResponse, SubtitleRecordDTO, TARGET_LANG_OPTIONS } from "./subtitle/types";
import { HistorySidebar } from "./subtitle/history_sidebar";
import { PANEL_EMPTY_COPY, PANEL_MOTION_TOKENS, PANEL_SUBTITLES } from "./panel_consistency";

import { useAgentStore } from "@/stores/agent.store";

export function SubtitlePanel() {
  const {
    subtitleTaskType: taskType, setSubtitleTaskType: setTaskType,
    subtitleTargetLang: targetLang, setSubtitleTargetLang: setTargetLang,
    subtitleSourceLang: sourceLang, setSubtitleSourceLang: setSourceLang,
    subtitleIncludeZh: includeZh, setSubtitleIncludeZh: setIncludeZh,
    subtitleIncludeTarget: includeTarget, setSubtitleIncludeTarget: setIncludeTarget,
    subtitleBurnMode: burnMode, setSubtitleBurnMode: setBurnMode,
  } = useAgentStore();

  const [file, setFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [currentTask, setCurrentTask] = useState<SubtitleGenerateResponse | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);

  const [history, setHistory] = useState<SubtitleRecordDTO[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const PAGE_SIZE = 10;

  const [activeRecord, setActiveRecord] = useState<SubtitleRecordDTO | null>(null);
  const [showGallery, setShowGallery] = useState(true);
  const brutalBorder = "border-2 border-slate-900 dark:border-white";
  const brutalShadow = "shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff]";
  const brutalShadowSm = "shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]";

  const toolCategories = [
    { id: "subtitle", label: "字幕生成", icon: Captions, color: "text-cyan-600", desc: "自动识别并生成多语种字幕" },
    { id: "separate", label: "人声分离", icon: Music, color: "text-blue-500", desc: "分离背景音乐与人声" },
    { id: "clone", label: "声音克隆", icon: Languages, color: "text-cyan-600", desc: "克隆音色并翻译内容" },
    { id: "lipsync", label: "口型同步", icon: MonitorPlay, color: "text-orange-500", desc: "根据音频同步视频口型" },
    { id: "to_audio", label: "视频转音频", icon: Type, color: "text-teal-500", desc: "提取视频中的音频轨道" },
  ];

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const data = await request<SubtitleRecordDTO[]>("/ai/subtitle/list", { method: "POST" });
      const records = data || [];
      setHistory(records);
      if (!activeRecord && records.length > 0) {
        setActiveRecord(records[0]);
      }
      // 不要重置页码, 以免影响当前浏览
    } catch (e) {
      console.error("Failed to fetch subtitle history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    globalToast({
      title: "确认删除",
      message: "确定要删除这条记录吗? 此操作不可撤销.",
      variant: "warning",
      confirmText: "删除",
      cancelText: "取消",
      duration: 0,
      onConfirm: async () => {
        try {
          await request("/ai/subtitle/delete", {
            method: "POST",
            body: new URLSearchParams({ task_id: taskId }).toString(),
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });
          fetchHistory();
          if (activeRecord?.task_id === taskId) {
            setActiveRecord(null);
          }
          globalToast({
            message: "删除成功, 资源已移除",
            variant: "success",
          });
        } catch (e) {
          console.error("Failed to delete record:", e);
          globalToast({
            message: "删除失败, 请稍后重试",
            variant: "error",
          });
        }
      },
    });
  };

  useEffect(() => {
    // 异步调用避免 setState 同步警告
    setTimeout(() => fetchHistory(), 0);
    
    // 设置轮询以更新状态
    const timer = setInterval(() => {
      // 只有当有处理中的任务时才轮询
      setHistory((prev) => {
        const hasProcessing = prev.some((r) => r.status === "processing" || r.status === "pending");
        if (hasProcessing) {
          fetchHistory();
        }
        return prev;
      });
    }, 5000); // 每 5 秒轮询一次

    return () => clearInterval(timer);
     
  }, []);

  const inferredType = useMemo(() => {
    if (!file) return "";
    const mime = (file.type || "").toLowerCase();
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (["mp4", "mov", "webm", "mkv", "avi", "m4v"].includes(ext)) return "video";
    if (["mp3", "wav", "m4a", "flac", "ogg", "aac"].includes(ext)) return "audio";
    return "";
  }, [file]);

  const submitDisabled = !file || isSubmitting;
  
  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const currentHistory = history.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  const getApiBase = () => {
    if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE;
    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.hostname}:5666/api_trai/v1`;
    }
    return "http://localhost:5666/api_trai/v1";
  };

  const uploadFileWithProgress = (
    endpoint: string,
    formData: FormData,
    abortController: AbortController
  ): Promise<SubtitleGenerateResponse> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const bearerToken = typeof window !== "undefined"
        ? document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1]
        : undefined;

      xhr.open("POST", `${getApiBase()}${endpoint}`);

      if (bearerToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${bearerToken}`);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            reject(new Error("Invalid response format"));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            const msg = errData.detail?.message || errData.message || `HTTP ${xhr.status}`;
            reject(new Error(msg));
          } catch {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.onabort = () => reject(new Error("Upload cancelled"));

      abortController.signal.addEventListener("abort", () => xhr.abort());

      xhr.send(formData);
    });
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("请先上传文件");
      return;
    }
    
    if (taskType === "lipsync" && !audioFile) {
      setError("口型同步需要上传目标音频文件");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setError("");
    setCurrentTask(null);

    const abortController = new AbortController();
    uploadAbortRef.current = abortController;

    try {
      const form = new FormData();
      
      let endpoint = "/ai/subtitle/generate";
      if (taskType === "separate") {
        endpoint = "/ai/video/separate";
        form.append("file", file);
      } else if (taskType === "clone") {
        endpoint = "/ai/video/clone";
        form.append("file", file);
      } else if (taskType === "lipsync") {
        endpoint = "/ai/video/lipsync";
        form.append("video_file", file);
        form.append("audio_file", audioFile!);
      } else if (taskType === "to_audio") {
        endpoint = "/ai/video/to_audio";
        form.append("file", file);
      } else {
        form.append("file", file);
      }

      if (taskType === "subtitle" || taskType === "clone" || taskType === "lipsync") {
        form.append("target_lang", targetLang);
        form.append("source_lang", sourceLang.trim());
        form.append("include_zh_subtitle", String(includeZh));
        form.append("include_target_subtitle", String(includeTarget));
        form.append("burn_mode", inferredType === "audio" ? "none" : burnMode);
      }

      const res = await uploadFileWithProgress(endpoint, form, abortController);
      setCurrentTask(res);
      // 生成任务提交后, 刷新列表并回到第一页
      fetchHistory();
      setHistoryPage(1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "请求失败, 请稍后再试";
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
      uploadAbortRef.current = null;
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start h-full">
      {/* 左侧配置与上传区 */}
      <div className={`bg-cyan-50 dark:bg-slate-900 p-4 flex flex-col h-full ${brutalBorder} ${brutalShadow}`}>
        <div className="mb-4 border-b-4 border-slate-900 dark:border-white pb-2 shrink-0">
          <h2 className="text-2xl font-black uppercase tracking-tight">字幕创作中心</h2>
          <div className="text-sm font-bold mt-1">自动生成字幕, 人声分离, 声音克隆及口型同步.</div>
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-2">
          <div className="space-y-6 pb-4">
            {/* 1. 工具选择 */}
            <div className="space-y-3">
              <div className="font-bold uppercase text-xs text-slate-500 tracking-wider">1. 选择工具类型</div>
              <div className="grid grid-cols-2 gap-2">
                {toolCategories.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setTaskType(tool.id as any);
                      setFile(null);
                      setAudioFile(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2 text-left transition-all border-2 border-slate-900 dark:border-white",
                      taskType === tool.id
                        ? "bg-cyan-400 dark:bg-cyan-600 text-slate-900 dark:text-white shadow-[2px_2px_0px_0px_#0f172a] translate-x-[-2px] translate-y-[-2px]"
                        : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]"
                    )}
                  >
                    <tool.icon className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-[10px] uppercase truncate">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 文件上传 */}
            <div className={`p-4 bg-white dark:bg-slate-800 flex flex-col gap-2 ${brutalBorder} ${brutalShadowSm}`}>
              <div className="font-bold uppercase text-xs border-b-2 border-slate-900 dark:border-white pb-2 mb-1">2. 上传原始文件</div>
              <div className="relative border-2 border-dashed border-cyan-500 dark:border-cyan-700 hover:border-slate-900 dark:hover:border-white transition-colors p-4 text-center cursor-pointer bg-slate-50 dark:bg-slate-900">
                <input
                  aria-label="上传视频或音频"
                  title="上传视频或音频"
                  type="file"
                  accept="video/*,audio/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-1 text-slate-900 dark:text-white pointer-events-none">
                    {inferredType === "video" ? <FileVideo className="w-6 h-6" /> : <FileAudio className="w-6 h-6" />}
                    <div className="text-[10px] font-bold truncate max-w-full px-2">{file.name}</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-500 pointer-events-none">
                    <Upload className="w-6 h-6 text-slate-900 dark:text-white" />
                    <div className="text-[10px] font-bold uppercase">上传视频/音频</div>
                  </div>
                )}
              </div>

              {taskType === "lipsync" && (
                <div className="relative border-2 border-dashed border-slate-900 dark:border-slate-400 hover:border-slate-900 dark:hover:border-white transition-colors p-4 text-center cursor-pointer bg-slate-50 dark:bg-slate-900 mt-1">
                  <input
                    aria-label="上传目标音频"
                    title="上传目标音频"
                    type="file"
                    accept="audio/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setAudioFile(f);
                    }}
                  />
                  {audioFile ? (
                    <div className="flex flex-col items-center gap-1 text-slate-900 dark:text-white pointer-events-none">
                      <FileAudio className="w-6 h-6" />
                      <div className="text-[10px] font-bold truncate max-w-full px-2">{audioFile.name}</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500 pointer-events-none">
                      <Upload className="w-6 h-6 text-slate-900 dark:text-white" />
                      <div className="text-[10px] font-bold uppercase">上传目标音频 (驱动口型)</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. 参数设置 */}
            {taskType !== "separate" && (
              <div className={`p-4 bg-white dark:bg-slate-800 flex flex-col gap-4 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]`}>
                <div className="font-bold uppercase text-xs border-b-2 border-slate-900 dark:border-white pb-2">3. 参数配置</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">源语言 (可选)</label>
                    <input
                      aria-label="源语言"
                      title="源语言"
                      className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-white focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] focus:shadow-none transition-all text-xs"
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      placeholder="zh, en..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">目标翻译语言</label>
                    <select
                      aria-label="目标语言"
                      title="目标语言"
                      className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-white focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] focus:shadow-none transition-all appearance-none cursor-pointer text-xs"
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                    >
                      {TARGET_LANG_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer font-bold">
                    <input
                      aria-label="生成中文字幕"
                      title="生成中文字幕"
                      type="checkbox"
                      checked={includeZh}
                      onChange={(e) => setIncludeZh(e.target.checked)}
                      className="rounded border-slate-900"
                    />
                    生成原语言字幕
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer font-bold">
                    <input
                      aria-label="生成目标语言字幕"
                      title="生成目标语言字幕"
                      type="checkbox"
                      checked={includeTarget}
                      onChange={(e) => setIncludeTarget(e.target.checked)}
                      className="rounded border-slate-900"
                    />
                    生成翻译字幕
                  </label>
                </div>

                {inferredType !== "audio" && (
                  <div className="space-y-2 mt-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500">视频烧录模式</label>
                    <div className="grid grid-cols-4 gap-1">
                      {(["none", "zh", "target", "bilingual"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setBurnMode(mode)}
                          className={cn(
                            "py-1.5 text-[9px] font-black uppercase transition-all border-2 border-slate-900 dark:border-white",
                            burnMode === mode
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[1px_1px_0px_0px_#0f172a] translate-x-[-1px] translate-y-[-1px]"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100"
                          )}
                        >
                          {mode === "none" ? "不压制" : mode === "zh" ? "仅源语" : mode === "target" ? "仅译文" : "双语"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 操作区 */}
        <div className="mt-auto pt-4 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={submitDisabled}
            className={cn(
              "w-full h-14 text-lg font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] disabled:opacity-50 disabled:cursor-not-allowed",
              !submitDisabled ? "bg-cyan-500 dark:bg-cyan-600 text-slate-900 dark:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" : "bg-slate-300 dark:bg-slate-700 text-slate-500"
            )}
          >
            {isSubmitting ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> 处理中 {uploadProgress}%</>
            ) : (
              "开始处理任务"
            )}
          </button>
          
          {error && (
            <div className={`p-3 font-bold text-xs bg-red-500 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] break-all`}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 右侧结果预览与历史区 */}
      <div className={`bg-white dark:bg-slate-900 h-full flex flex-col min-w-0 ${brutalBorder} ${brutalShadow} relative overflow-hidden`}>
        <div className="flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {activeRecord ? (
              <motion.div key="result-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center border-b-2 border-slate-900 dark:border-white relative overflow-hidden">
                  {activeRecord.output_video_url || (activeRecord.zh_srt_url && activeRecord.target_lang === "audio_extract") ? (
                    <video 
                      className={`w-full h-full object-contain bg-black`} 
                      controls 
                      src={activeRecord.output_video_url || activeRecord.zh_srt_url || undefined} 
                    />
                  ) : (
                    <div className="text-center p-6">
                      {activeRecord.status === "processing" || activeRecord.status === "pending" ? (
                        <div className="flex flex-col items-center gap-4">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 bg-cyan-400 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-slate-900 animate-spin" />
                          </motion.div>
                          <span className="text-xl font-black uppercase tracking-widest">正在排队处理...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 opacity-50">
                          <Captions className="w-16 h-16" />
                          <span className="text-sm font-bold uppercase">任务进行中, 完成后将在此显示</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-black text-sm truncate flex-1" title={activeRecord.file_name}>{activeRecord.file_name}</h3>
                    <div className={cn(
                      "px-2 py-0.5 border-2 border-slate-900 text-[10px] font-black uppercase",
                      activeRecord.status === "completed" ? "bg-emerald-400" : activeRecord.status === "failed" ? "bg-red-400" : "bg-cyan-400"
                    )}>
                      {activeRecord.status === "completed" ? "已完成" : activeRecord.status === "failed" ? "失败" : "处理中"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeRecord.output_video_url && (
                      <a href={activeRecord.output_video_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <button className="w-full py-2 text-[10px] font-black uppercase bg-cyan-500 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">成品下载</button>
                      </a>
                    )}
                    {activeRecord.zh_srt_url && (
                      <a href={activeRecord.zh_srt_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <button className="w-full py-2 text-[10px] font-black uppercase bg-white text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">字幕/音频</button>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                <Captions className="w-24 h-24 mb-4" />
                <div className="font-black uppercase text-xl">等待任务提交</div>
                <p className="text-xs font-bold mt-2">处理完成后, 预览和下载选项将在此处出现</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 历史记录画廊 (底部) */}
        <div className="h-[200px] border-t-4 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-950 p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest">处理历史 ({history.length})</span>
            <button onClick={fetchHistory} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><Loader2 className={cn("w-3 h-3", isLoadingHistory && "animate-spin")} /></button>
          </div>
          <ScrollArea className="h-full">
            <div className="flex gap-3 pb-4">
              {history.map((item) => (
                <div
                  key={item.task_id}
                  onClick={() => setActiveRecord(item)}
                  className={cn(
                    "shrink-0 w-32 h-20 p-2 cursor-pointer border-2 transition-all flex flex-col justify-between relative group",
                    activeRecord?.task_id === item.task_id ? "border-cyan-500 bg-cyan-50 dark:bg-slate-800 shadow-[2px_2px_0px_0px_#06b6d4]" : "border-slate-900 dark:border-white bg-white dark:bg-slate-900 hover:bg-slate-100"
                  )}
                >
                  <div className="text-[9px] font-bold truncate">{item.file_name}</div>
                  <div className="flex justify-between items-end">
                    <div className={cn("w-2 h-2 rounded-full", item.status === "completed" ? "bg-emerald-500" : item.status === "failed" ? "bg-red-500" : "bg-cyan-500 animate-pulse")} />
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.task_id); }} className="opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-none"><Trash2 className="w-2 h-2" /></button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
