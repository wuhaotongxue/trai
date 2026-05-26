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

type BurnMode = "none" | "zh" | "target" | "bilingual";

interface SubtitleGenerateResponse {
  task_id: string;
  status: string;
  input_type: "video" | "audio";
  target_lang: string;
  burn_mode: BurnMode;
  zh_srt_url: string | null;
  target_srt_url: string | null;
  output_video_url: string | null;
  vocal_url?: string | null;
  bgm_url?: string | null;
  object_prefix: string;
  audio_url?: string | null; // 视频转音频的音频 URL
}

interface SubtitleRecordDTO {
  task_id: string;
  task_type: string;
  file_name: string;
  target_lang: string;
  burn_mode: string;
  status: string;
  zh_srt_url: string | null;
  target_srt_url: string | null;
  output_video_url: string | null;
  vocal_url?: string | null;
  bgm_url?: string | null;
  error_message: string | null;
  created_at: string;
}

const TARGET_LANG_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "英文", value: "en" },
  { label: "日文", value: "ja" },
  { label: "韩文", value: "ko" },
  { label: "法文", value: "fr" },
  { label: "德文", value: "de" },
  { label: "西班牙文", value: "es" },
  { label: "俄文", value: "ru" },
];

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
    { id: "clone", label: "声音克隆", icon: Languages, color: "text-purple-500", desc: "克隆音色并翻译内容" },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="flex h-full w-full overflow-hidden bg-background relative">
      {/* 左侧配置栏 */}
      <div className="w-80 flex-shrink-0 border-r border-border flex flex-col bg-card relative z-10">
        <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">工具箱</h2>
          <div className="space-y-2">
            {toolCategories.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setTaskType(tool.id as any)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group",
                  taskType === tool.id 
                    ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  taskType === tool.id ? "bg-slate-100 dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-900/50"
                )}>
                  <tool.icon className={cn("w-4 h-4", tool.color)} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{tool.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{tool.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <div className="space-y-4">

              {/* 上传区域 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">2. 上传文件</label>
                <div className="relative border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg p-6 text-center cursor-pointer bg-background">
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
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                    {file ? (
                      inferredType === "video" ? <FileVideo className="h-6 w-6 text-primary" /> : <FileAudio className="h-6 w-6 text-primary" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground line-clamp-1 break-all">
                      {file ? file.name : "点击或拖拽原始视频/音频"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "支持 MP4, MOV, WAV, MP3 等"}
                    </span>
                  </div>
                </div>

                {taskType === "lipsync" && (
                  <div className="relative border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg p-6 text-center cursor-pointer bg-background mt-2">
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
                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                      {audioFile ? (
                        <FileAudio className="h-6 w-6 text-primary" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground line-clamp-1 break-all">
                        {audioFile ? audioFile.name : "点击或拖拽目标音频至此"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {audioFile ? `${(audioFile.size / 1024 / 1024).toFixed(2)} MB` : "Wav2Lip 需要目标配音 (支持 WAV, MP3)"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 参数设置 */}
              {taskType !== "separate" && (
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium text-foreground">3. 参数设置</label>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">源语言 (可选)</label>
                    <input
                      aria-label="源语言"
                      title="源语言"
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      placeholder="如: zh, en, 留空自动识别"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">目标翻译语言</label>
                    <select
                      aria-label="目标语言"
                      title="目标语言"
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs text-muted-foreground">视频烧录模式</label>
                      <select
                        aria-label="视频烧录模式"
                        title="视频烧录模式"
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={burnMode}
                        onChange={(e) => setBurnMode(e.target.value as BurnMode)}
                      >
                        <option value="none">不烧录 (仅提取SRT)</option>
                        <option value="zh">仅烧录原语言</option>
                        <option value="target">仅烧录翻译语言</option>
                        <option value="bilingual">双语烧录</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* 底部操作区 */}
        <div className="p-4 border-t border-border bg-card">
          <Button
            className="w-full h-10"
            disabled={submitDisabled}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />上传中 {uploadProgress}%</>
            ) : (
              "开始生成"
            )}
          </Button>

          {isSubmitting && (
            <div className="mt-3 w-full">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {uploadProgress < 100 ? `正在上传文件... ${uploadProgress}%` : "上传完成, 等待处理..."}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 p-2 rounded-lg bg-destructive/10 text-destructive text-xs break-all">
              {error}
            </div>
          )}
          {currentTask && (
            <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs text-center">
              任务已提交, 请在右侧画廊查看进度
            </div>
          )}
        </div>
      </div>

      {/* 中间预览区 */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10 relative">
        <div className="absolute top-4 right-4 z-20">
          <Button variant="outline" size="sm" onClick={() => setShowGallery(!showGallery)}>
            {showGallery ? "隐藏长廊" : "显示长廊"}
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {activeRecord ? (
            <div className="w-full max-w-3xl rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
              {/* 视频/状态预览区 */}
              <div className="w-full bg-muted/30 flex items-center justify-center min-h-[300px] border-b border-border relative">
                {activeRecord.output_video_url || (activeRecord.zh_srt_url && activeRecord.target_lang === "audio_extract") ? (
                  <video 
                    className="w-full h-full object-contain max-h-[500px] bg-black" 
                    controls 
                    src={activeRecord.output_video_url || activeRecord.zh_srt_url || undefined} 
                  />
                ) : (
                  <div className="text-center p-6">
                    {activeRecord.status === "processing" || activeRecord.status === "pending" ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground">正在处理中...</span>
                      </div>
                    ) : activeRecord.status === "failed" ? (
                      <div className="text-destructive text-sm flex flex-col items-center gap-2">
                        <span className="text-2xl">❌</span>
                        <span>处理失败</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <FileAudio className="h-8 w-8 text-muted-foreground/50" />
                        <span className="text-sm text-muted-foreground">纯音频或无视频输出</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 详情与下载区 */}
              <div className="w-full p-5 flex flex-col">
                <div className="mb-4">
                  <h4 className="font-semibold text-base text-foreground line-clamp-2" title={activeRecord.file_name}>
                    {activeRecord.file_name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded">任务ID: {activeRecord.task_id.substring(0, 8)}...</span>
                    <span className="bg-muted px-2 py-0.5 rounded">目标语言: {activeRecord.target_lang}</span>
                    <span className="bg-muted px-2 py-0.5 rounded">时间: {activeRecord.created_at}</span>
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      activeRecord.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                      activeRecord.status === "failed" ? "bg-destructive/10 text-destructive" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {activeRecord.status === "completed" ? "已完成" : activeRecord.status === "failed" ? "失败" : "处理中"}
                    </span>
                    <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-medium ml-auto">
                      {activeRecord.task_type === "separate" ? "🎵 人声分离" : activeRecord.task_type === "clone" ? "🗣️ 声音克隆" : activeRecord.task_type === "lipsync" ? "👄 口型同步" : activeRecord.task_type === "to_audio" ? "🎬 视频转音频" : "📝 字幕生成"}
                    </span>
                  </div>
                </div>

                {activeRecord.error_message && (
                  <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-xs break-all">
                    {activeRecord.error_message}
                  </div>
                )}

                <div className="mt-auto space-y-2">
                  <p className="text-xs font-medium text-foreground mb-2">下载文件</p>
                  <div className="flex flex-wrap gap-2">
                    {activeRecord.zh_srt_url && activeRecord.target_lang !== "audio_extract" && activeRecord.task_type !== "to_audio" && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(activeRecord.zh_srt_url!, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" /> 原字幕
                      </Button>
                    )}
                    {activeRecord.target_srt_url && activeRecord.task_type !== "to_audio" && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(activeRecord.target_srt_url!, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" /> 翻译字幕
                      </Button>
                    )}
                    {activeRecord.target_srt_url && activeRecord.task_type === "to_audio" && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(activeRecord.target_srt_url!, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" /> 提取字幕 (SRT)
                      </Button>
                    )}
                    {activeRecord.vocal_url && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(activeRecord.vocal_url!, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" /> 提取人声
                      </Button>
                    )}
                    {activeRecord.bgm_url && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(activeRecord.bgm_url!, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" /> 提取伴奏
                      </Button>
                    )}
                    {activeRecord.output_video_url && (
                      <Button variant="default" size="sm" className="h-8 text-xs" onClick={() => window.open(activeRecord.output_video_url!, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" /> 成品视频
                      </Button>
                    )}
                    {activeRecord.target_lang === "audio_extract" && activeRecord.zh_srt_url && (
                      <Button variant="default" size="sm" className="h-8 text-xs" onClick={() => window.open(activeRecord.zh_srt_url!, "_blank")}>
                        <ExternalLink className="h-3 w-3 mr-1" /> 提取音频
                      </Button>
                    )}
                    {!activeRecord.zh_srt_url &&
                      !activeRecord.target_srt_url &&
                      !activeRecord.output_video_url &&
                      !activeRecord.vocal_url &&
                      !activeRecord.bgm_url &&
                      activeRecord.status === "completed" && (
                        <span className="text-xs text-muted-foreground py-1">无生成文件</span>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Video className="h-8 w-8 text-muted-foreground/50" />
              </div>
              暂无处理任务, 请在左侧上传文件开始
            </div>
          )}
        </div>
      </div>

      {/* 右侧可折叠画廊 */}
      <div className={`border-l border-border bg-background transition-all duration-300 flex flex-col z-20 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)] ${showGallery ? 'w-80' : 'w-0 overflow-hidden border-none'}`}>
        <div className="h-12 border-b border-border flex items-center px-4 shrink-0 bg-background/50 backdrop-blur-sm min-w-[320px]">
          <h3 className="font-semibold text-foreground text-sm">影音长廊</h3>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={fetchHistory} disabled={isLoadingHistory} className="h-8">
            <Loader2 className={`h-4 w-4 mr-1 ${isLoadingHistory ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>

        <ScrollArea className="flex-1 min-w-[320px]">
          <div className="p-4 space-y-4">
            {history.length === 0 && !isLoadingHistory && (
              <div className="text-center py-10 text-muted-foreground text-xs">
                暂无记录
              </div>
            )}
            
            {currentHistory.map((record) => (
              <div 
                key={record.task_id} 
                className={`rounded-lg border p-3 transition-colors ${activeRecord?.task_id === record.task_id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div 
                    onClick={() => setActiveRecord(record)}
                    className="flex-1 cursor-pointer hover:bg-muted/30 rounded transition-colors"
                  >
                    <h4 className="font-medium text-sm text-foreground line-clamp-1 mb-1" title={record.file_name}>
                      {record.file_name}
                    </h4>
                    <div className="flex items-center justify-between mt-2 text-[10px]">
                      <span className="text-muted-foreground">{record.created_at.split(' ')[0]}</span>
                      <span className={`px-1.5 py-0.5 rounded font-medium ${
                        record.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                        record.status === "failed" ? "bg-destructive/10 text-destructive" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {record.status === "completed" ? "已完成" : record.status === "failed" ? "失败" : "处理中"}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-blue-600 bg-blue-500/10 inline-block px-1.5 py-0.5 rounded">
                      {record.task_type === "separate" ? "🎵 人声分离" : record.task_type === "clone" ? "🗣️ 声音克隆" : record.task_type === "lipsync" ? "👄 口型同步" : record.task_type === "to_audio" ? "🎬 视频转音频" : "📝 字幕生成"}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(record.task_id)}
                    title="删除记录"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2"
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                >
                  上一页
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  {historyPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2"
                  onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                  disabled={historyPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}