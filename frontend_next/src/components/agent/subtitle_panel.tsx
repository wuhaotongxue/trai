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
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BurnMode, SubtitleGenerateResponse, SubtitleRecordDTO, TARGET_LANG_OPTIONS } from "./subtitle/types";
import { HistorySidebar } from "./subtitle/history_sidebar";

export function SubtitlePanel() {
  const [taskType, setTaskType] = useState<"subtitle" | "separate" | "clone" | "lipsync" | "to_audio">("subtitle");
  const [file, setFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState<string>("en");
  const [sourceLang, setSourceLang] = useState<string>("");
  const [includeZh, setIncludeZh] = useState<boolean>(true);
  const [includeTarget, setIncludeTarget] = useState<boolean>(true);
  const [burnMode, setBurnMode] = useState<BurnMode>("bilingual");
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

  const toolCategories = [
    { id: "subtitle", label: "字幕生成", icon: Captions, color: "text-pink-500", desc: "自动识别并生成多语种字幕" },
    { id: "separate", label: "人声分离", icon: Music, color: "text-blue-500", desc: "分离背景音乐与人声" },
    { id: "clone", label: "声音克隆", icon: Languages, color: "text-indigo-500", desc: "克隆音色并翻译内容" },
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
      // 不要重置页码，以免影响当前浏览
    } catch (e) {
      console.error("Failed to fetch subtitle history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    globalToast({
      title: "确认删除",
      message: "确定要删除这条记录吗？此操作不可撤销。",
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
            message: "删除成功，资源已移除",
            variant: "success",
            duration: 3000,
          });
        } catch (e) {
          console.error("Failed to delete subtitle record:", e);
          globalToast({
            message: "删除失败，请稍后重试",
            variant: "error",
            duration: 3000,
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
    <div className="flex w-full h-full overflow-hidden border-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-950 relative shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]">
      {/* 左侧配置栏 (拆分为两个并排的区域) */}
      <div className={`w-[600px] h-full flex-shrink-0 flex bg-white dark:bg-slate-900 border-r-2 border-slate-900 dark:border-white relative z-10`}>
        
        {/* 工具类型选择区 */}
        <div className="w-[280px] h-full flex flex-col border-r-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-900">
          <div className={`p-4 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-900 dark:border-white`}>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">1. 选择工具类型</h2>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 space-y-2">
              {toolCategories.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setTaskType(tool.id as any);
                    setFile(null);
                    setAudioFile(null);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 text-left transition-all border-2 border-slate-900 dark:border-white",
                    taskType === tool.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] translate-x-[-2px] translate-y-[-2px]"
                      : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]"
                  )}
                >
                  <div className={cn(
                    "p-1.5 border-2 border-slate-900 dark:border-white",
                    taskType === tool.id ? "bg-white/20 dark:bg-slate-900/20" : "bg-slate-100 dark:bg-slate-900"
                  )}>
                    <tool.icon className={cn("w-5 h-5", taskType === tool.id ? "text-current" : tool.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs uppercase tracking-wide">{tool.label}</div>
                    <div className={cn("text-[10px] mt-0.5 opacity-80 leading-tight", taskType === tool.id ? "" : "text-slate-500 dark:text-slate-400")}>
                      {tool.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 文件上传与配置区 */}
        <div className="flex-1 h-full flex flex-col bg-white dark:bg-slate-800">
          <div className={`p-4 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-900 dark:border-white`}>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">2. 配置与上传</h2>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-6">

              {/* 上传文件 */}
              <div className={`p-4 bg-white dark:bg-slate-800 flex flex-col gap-2 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]`}>
                <div className="font-bold uppercase text-sm border-b-2 border-slate-900 dark:border-white pb-2 mb-2">上传文件</div>
                <div className="relative border-2 border-dashed border-slate-900 dark:border-slate-400 hover:border-slate-900 dark:hover:border-white transition-colors p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-900">
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
                    <div className="flex flex-col items-center gap-2 text-slate-900 dark:text-white pointer-events-none">
                      {inferredType === "video" ? <FileVideo className="w-8 h-8" /> : <FileAudio className="w-8 h-8" />}
                      <div className="text-sm font-bold truncate max-w-full px-4">{file.name}</div>
                      <div className="text-xs font-bold text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 pointer-events-none">
                      <Upload className="w-8 h-8 text-slate-900 dark:text-white" />
                      <div className="text-sm font-bold uppercase">点击或拖拽原始视频/音频</div>
                      <div className="text-xs">支持 MP4, MOV, WAV, MP3 等</div>
                    </div>
                  )}
                </div>

                {taskType === "lipsync" && (
                  <div className="relative border-2 border-dashed border-slate-900 dark:border-slate-400 hover:border-slate-900 dark:hover:border-white transition-colors p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-900 mt-2">
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
                      <div className="flex flex-col items-center gap-2 text-slate-900 dark:text-white pointer-events-none">
                        <FileAudio className="w-8 h-8" />
                        <div className="text-sm font-bold truncate max-w-full px-4">{audioFile.name}</div>
                        <div className="text-xs font-bold text-slate-500">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500 pointer-events-none">
                        <Upload className="w-8 h-8 text-slate-900 dark:text-white" />
                        <div className="text-sm font-bold uppercase">上传目标音频(驱动口型)</div>
                        <div className="text-xs">Wav2Lip 需要目标配音 (支持 WAV, MP3)</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 参数设置 */}
              {taskType !== "separate" && (
                <div className={`p-4 bg-white dark:bg-slate-800 flex flex-col gap-4 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]`}>
                  <div className="font-bold uppercase text-sm border-b-2 border-slate-900 dark:border-white pb-2">3. 参数设置</div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">源语言 (可选)</label>
                    <input
                      aria-label="源语言"
                      title="源语言"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-white focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] focus:shadow-none transition-all text-sm"
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      placeholder="如: zh, en, 留空自动识别"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">目标翻译语言</label>
                    <select
                      aria-label="目标语言"
                      title="目标语言"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-white focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] focus:shadow-none transition-all appearance-none cursor-pointer text-sm"
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                    >
                      {TARGET_LANG_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 space-y-2">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        aria-label="生成中文字幕"
                        title="生成中文字幕"
                        type="checkbox"
                        checked={includeZh}
                        onChange={(e) => setIncludeZh(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      生成原语言字幕 (SRT)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        aria-label="生成目标语言字幕"
                        title="生成目标语言字幕"
                        type="checkbox"
                        checked={includeTarget}
                        onChange={(e) => setIncludeTarget(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      生成翻译字幕 (SRT)
                    </label>
                  </div>

                  {inferredType !== "audio" && (
                    <div className="space-y-2 mt-4">
                      <label className="text-xs font-bold uppercase text-slate-500">视频烧录模式 (仅视频)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBurnMode("none")}
                          className={cn(
                            "px-3 py-2 text-xs font-bold transition-all border-2 border-slate-900 dark:border-white",
                            burnMode === "none"
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] translate-x-[-2px] translate-y-[-2px]"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] hover:bg-slate-100"
                          )}
                        >
                          不压制
                        </button>
                        <button
                          type="button"
                          onClick={() => setBurnMode("zh")}
                          className={cn(
                            "px-3 py-2 text-xs font-bold transition-all border-2 border-slate-900 dark:border-white",
                            burnMode === "zh"
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] translate-x-[-2px] translate-y-[-2px]"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] hover:bg-slate-100"
                          )}
                        >
                          仅压制源语
                        </button>
                        <button
                          type="button"
                          onClick={() => setBurnMode("target")}
                          className={cn(
                            "px-3 py-2 text-xs font-bold transition-all border-2 border-slate-900 dark:border-white",
                            burnMode === "target"
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] translate-x-[-2px] translate-y-[-2px]"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] hover:bg-slate-100"
                          )}
                        >
                          仅压制译文
                        </button>
                        <button
                          type="button"
                          onClick={() => setBurnMode("bilingual")}
                          className={cn(
                            "px-3 py-2 text-xs font-bold transition-all border-2 border-slate-900 dark:border-white",
                            burnMode === "bilingual"
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] translate-x-[-2px] translate-y-[-2px]"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] hover:bg-slate-100"
                          )}
                        >
                          双语字幕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 底部操作区 */}
          <div className={`p-4 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-900 dark:border-white`}>
            <button
              onClick={handleSubmit}
              disabled={submitDisabled}
              className={cn(
                "w-full h-12 text-base font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] disabled:opacity-50 disabled:cursor-not-allowed",
                !submitDisabled ? "bg-slate-900 dark:bg-cyan-600 text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" : "bg-slate-300 dark:bg-slate-700 text-slate-500"
              )}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 上传中 {uploadProgress}%</>
              ) : (
                "开始生成"
              )}
            </button>

            {isSubmitting && (
              <div className="mt-4 w-full">
                <div className={`h-4 w-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-900 dark:border-white p-0.5`}>
                  <motion.div
                    className="h-full bg-slate-900 dark:bg-cyan-600 border-r-2 border-slate-900 dark:border-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                </div>
                <p className="text-xs font-bold text-center mt-2 uppercase text-slate-500">
                  {uploadProgress < 100 ? `正在上传文件... ${uploadProgress}%` : "上传完成, 等待处理..."}
                </p>
              </div>
            )}

            {error && (
              <div className={`mt-3 p-3 font-bold text-sm bg-red-500 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] break-all`}>
                {error}
              </div>
            )}
            {currentTask && (
              <div className={`mt-3 p-3 font-bold text-sm bg-cyan-500 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] text-center uppercase`}>
                任务已提交, 请在右侧查看进度
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 中间预览区 */}
      <div className="flex-1 h-full flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 relative">
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={() => setShowGallery(!showGallery)}
            className={`px-4 py-2 bg-white dark:bg-slate-800 text-xs font-bold uppercase border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all`}
          >
            {showGallery ? "隐藏侧边栏" : "显示侧边栏"}
          </button>
        </div>
        
        <ScrollArea className="flex-1 w-full h-full">
          <div className="flex flex-col min-h-full p-6 pt-16">
            {activeRecord ? (
              <div className={`m-auto w-full max-w-3xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col border-2 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff]`}>
                {/* 视频/状态预览区 */}
              <div className="w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[400px] border-b-2 border-slate-900 dark:border-white relative">
                {activeRecord.output_video_url || (activeRecord.zh_srt_url && activeRecord.target_lang === "audio_extract") ? (
                  <video 
                    className={`w-full h-full object-contain max-h-[500px] bg-black`} 
                    controls 
                    src={activeRecord.output_video_url || activeRecord.zh_srt_url || undefined} 
                  />
                ) : (
                  <div className="text-center p-6">
                    {activeRecord.status === "processing" || activeRecord.status === "pending" ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-slate-900 dark:text-white animate-spin" />
                        <span className="text-lg font-black uppercase tracking-wider">正在处理中...</span>
                      </div>
                    ) : activeRecord.status === "failed" ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 bg-red-500 rounded-none flex items-center justify-center border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]`}>
                          <Captions className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-lg font-black uppercase text-red-500 tracking-wider">处理失败</span>
                        <span className="text-sm font-bold text-slate-500 mt-2 px-4">{activeRecord.error_message || "未知错误"}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 bg-slate-100 rounded-none flex items-center justify-center border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]`}>
                          <Captions className="h-8 w-8 text-slate-900" />
                        </div>
                        <span className="text-lg font-black uppercase text-cyan-600 tracking-wider">任务已完成</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 详情与下载区 */}
              <div className="w-full p-6 bg-white dark:bg-slate-800 flex flex-col">
                <div className="mb-6 flex flex-col gap-2">
                  <h3 className="font-black text-xl line-clamp-2" title={activeRecord.file_name}>{activeRecord.file_name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-bold uppercase text-slate-500">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 border-2 border-slate-900 dark:border-white">ID: {activeRecord.task_id.substring(0, 8)}...</span>
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 border-2 border-slate-900 dark:border-white">类型: {activeRecord.task_type}</span>
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 border-2 border-slate-900 dark:border-white">时间: {activeRecord.created_at}</span>
                    <span className={cn(
                      "px-2 py-1 border-2 border-slate-900 dark:border-white",
                      activeRecord.status === "completed" ? "bg-emerald-200 text-emerald-800" :
                      activeRecord.status === "failed" ? "bg-red-200 text-red-800" :
                      "bg-cyan-200 text-cyan-800"
                    )}>
                      {activeRecord.status === "completed" ? "已完成" : activeRecord.status === "failed" ? "失败" : "处理中"}
                    </span>
                  </div>
                </div>

                {activeRecord.error_message && (
                  <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-xs break-all">
                    {activeRecord.error_message}
                  </div>
                )}

                <div className="mt-auto pt-4">
                  <div className="flex flex-wrap gap-4 mt-2">
                    {activeRecord.output_video_url && (
                      <a href={activeRecord.output_video_url} target="_blank" rel="noopener noreferrer">
                        <button className="h-10 px-4 text-sm font-black uppercase flex items-center gap-2 bg-slate-50 dark:bg-cyan-600 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[-2px] active:translate-y-[-2px] active:shadow-none transition-all">
                          <ExternalLink className="w-4 h-4" /> 成品视频
                        </button>
                      </a>
                    )}
                    {activeRecord.target_lang === "audio_extract" && activeRecord.zh_srt_url && (
                      <a href={activeRecord.zh_srt_url} target="_blank" rel="noopener noreferrer">
                        <button className="h-10 px-4 text-sm font-black uppercase flex items-center gap-2 bg-slate-50 dark:bg-cyan-600 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[-2px] active:translate-y-[-2px] active:shadow-none transition-all">
                          <ExternalLink className="w-4 h-4" /> 提取音频
                        </button>
                      </a>
                    )}
                    {activeRecord.zh_srt_url && activeRecord.target_lang !== "audio_extract" && activeRecord.task_type !== "to_audio" && (
                      <a href={activeRecord.zh_srt_url} target="_blank" rel="noopener noreferrer">
                        <button className="h-10 px-4 text-sm font-black uppercase flex items-center gap-2 bg-slate-50 dark:bg-indigo-600 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[-2px] active:translate-y-[-2px] active:shadow-none transition-all">
                          <ExternalLink className="w-4 h-4" /> 原字幕
                        </button>
                      </a>
                    )}
                    {activeRecord.target_srt_url && activeRecord.task_type !== "to_audio" && (
                      <a href={activeRecord.target_srt_url} target="_blank" rel="noopener noreferrer">
                        <button className="h-10 px-4 text-sm font-black uppercase flex items-center gap-2 bg-slate-50 dark:bg-cyan-600 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[-2px] active:translate-y-[-2px] active:shadow-none transition-all">
                          <ExternalLink className="w-4 h-4" /> 翻译字幕
                        </button>
                      </a>
                    )}
                    {activeRecord.target_srt_url && activeRecord.task_type === "to_audio" && (
                      <a href={activeRecord.target_srt_url} target="_blank" rel="noopener noreferrer">
                        <button className="h-10 px-4 text-sm font-black uppercase flex items-center gap-2 bg-slate-50 dark:bg-cyan-600 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[-2px] active:translate-y-[-2px] active:shadow-none transition-all">
                          <ExternalLink className="w-4 h-4" /> 提取字幕 (SRT)
                        </button>
                      </a>
                    )}
                    {activeRecord.vocal_url && (
                      <a href={activeRecord.vocal_url} target="_blank" rel="noopener noreferrer">
                        <button className="h-10 px-4 text-sm font-black uppercase flex items-center gap-2 bg-sky-300 dark:bg-sky-600 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[-2px] active:translate-y-[-2px] active:shadow-none transition-all">
                          <ExternalLink className="w-4 h-4" /> 提取人声
                        </button>
                      </a>
                    )}
                    {activeRecord.bgm_url && (
                      <a href={activeRecord.bgm_url} target="_blank" rel="noopener noreferrer">
                        <button className="h-10 px-4 text-sm font-black uppercase flex items-center gap-2 bg-teal-300 dark:bg-teal-600 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[-2px] active:translate-y-[-2px] active:shadow-none transition-all">
                          <ExternalLink className="w-4 h-4" /> 提取伴奏
                        </button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-900 dark:text-white">
              <div className={`w-32 h-32 bg-slate-100 dark:bg-slate-200 rounded-none flex items-center justify-center border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] transform -rotate-3`}>
                <Captions className="h-16 w-16 text-slate-900" />
              </div>
              <div className="font-black uppercase text-3xl tracking-widest mt-6">等待任务执行</div>
              <p className="font-bold text-sm bg-white dark:bg-slate-800 px-4 py-2 border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]">在左侧上传文件并提交</p>
            </div>
          )}
          </div>
        </ScrollArea>
      </div>

      {/* 右侧可折叠画廊 */}
      <HistorySidebar
        showGallery={showGallery}
        isLoadingHistory={isLoadingHistory}
        history={history}
        currentHistory={currentHistory}
        activeRecord={activeRecord}
        historyPage={historyPage}
        totalPages={totalPages}
        setActiveRecord={setActiveRecord}
        handleDelete={handleDelete}
        fetchHistory={fetchHistory}
        setHistoryPage={setHistoryPage}
      />
    </div>
  );
}
