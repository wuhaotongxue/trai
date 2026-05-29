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
import { 
  Loader2, Upload, FileAudio, FileVideo, ExternalLink, Video, Trash2, 
  Captions, Music, Languages, MonitorPlay, Type, Mic, MicOff, 
  FileText as FileTextIcon, History as HistoryIcon, Check, CheckCircle2, ChevronRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll_area";
import { globalToast } from "@/components/toast/toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BurnMode, SubtitleGenerateResponse, SubtitleRecordDTO, TARGET_LANG_OPTIONS } from "./subtitle/types";
import { HistorySidebar } from "./subtitle/history_sidebar";
import { PANEL_EMPTY_COPY, PANEL_MOTION_TOKENS, PANEL_SUBTITLES } from "./panel_consistency";

import { useAgentStore } from "@/stores/agent.store";

export function SubtitlePanel() {
  const [activeTab, setActiveTab] = useState<"subtitle" | "audio" | "meeting">("subtitle");
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
  const [meetingOptions, setMeetingOptions] = useState<string[]>(["精简摘要", "行动项提取"]);
  const [isRecording, setIsRecording] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
    setTimeout(() => fetchHistory(), 0);
    const timer = setInterval(() => {
      setHistory((prev) => {
        const hasProcessing = prev.some((r) => r.status === "processing" || r.status === "pending");
        if (hasProcessing) {
          fetchHistory();
        }
        return prev;
      });
    }, 5000);
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
      if (bearerToken) xhr.setRequestHeader("Authorization", `Bearer ${bearerToken}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error("Invalid response format")); }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.detail?.message || errData.message || `HTTP ${xhr.status}`));
          } catch { reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`)); }
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.onabort = () => reject(new Error("Upload cancelled"));
      abortController.signal.addEventListener("abort", () => xhr.abort());
      xhr.send(formData);
    });
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // 停止录音
      mediaRecorderRef.current?.stop();
      micStream?.getTracks().forEach(track => track.stop());
      setMicStream(null);
      setIsRecording(false);
      globalToast({ message: "录音已停止, 请选择是否保存结果", variant: "info" });
    } else {
      // 开始录音
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(stream);
        setIsRecording(true);
        setLiveTranscript("");
        setPendingAudioBlob(null);
        
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
            
            if (recorder.state === 'recording') {
              const currentBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
              const formData = new FormData();
              formData.append('file', currentBlob, 'recording.wav');
              
              try {
                const res = await request<any>("/ai/audio/incremental_transcribe", {
                  method: "POST",
                  body: formData
                });
                if (res.code === 200 && res.data.transcript) {
                  setLiveTranscript(res.data.transcript);
                }
              } catch (err) {
                console.error("Incremental ASR Error:", err);
              }
            }
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setPendingAudioBlob(audioBlob);
        };

        // 每 1.5 秒触发一次 ondataavailable，提升实时感
        recorder.start(1500);
        globalToast({ message: "麦克风已开启, 正在录音...", variant: "success" });
      } catch (err) {
        console.error("Failed to access microphone:", err);
        globalToast({ message: "无法访问麦克风, 请检查权限设置", variant: "error" });
      }
    }
  };

  const handleSaveAudioRecord = async () => {
    if (!pendingAudioBlob) return;
    
    const formData = new FormData();
    formData.append('file', pendingAudioBlob, 'recording.wav');

    setIsTranscribing(true);
    try {
      const res = await request<any>("/ai/audio/realtime_transcribe", {
        method: "POST",
        body: formData
      });
      if (res.code === 200) {
        setLiveTranscript(res.data.transcript);
        setPendingAudioBlob(null);
        globalToast({ message: "保存成功! 已同步 S3 并推送通知", variant: "success" });
        fetchHistory(); // 刷新历史记录
      }
    } catch (err) {
      console.error("ASR Error:", err);
      globalToast({ message: "保存失败, 请检查网络或重试", variant: "error" });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDiscardAudioRecord = () => {
     setPendingAudioBlob(null);
     setLiveTranscript("");
     globalToast({ message: "已放弃当前录音结果", variant: "info" });
   };
 
   const handleCancelRecording = () => {
     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
       mediaRecorderRef.current.stop();
     }
     micStream?.getTracks().forEach(track => track.stop());
     setMicStream(null);
     setIsRecording(false);
     setPendingAudioBlob(null);
     setLiveTranscript("");
     globalToast({ message: "录音已直接取消", variant: "warning" });
   };

  const toggleMeetingOption = (opt: string) => {
    setMeetingOptions(prev => 
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  const handleSubmit = async () => {
    if (!file) { setError("请先上传文件"); return; }
    if (taskType === "lipsync" && !audioFile) { setError("口型同步需要上传目标音频文件"); return; }
    setIsSubmitting(true);
    setUploadProgress(0);
    setError("");
    setCurrentTask(null);
    const abortController = new AbortController();
    uploadAbortRef.current = abortController;
    try {
      const form = new FormData();
      let endpoint = "/ai/subtitle/generate";
      if (taskType === "separate") { endpoint = "/ai/video/separate"; form.append("file", file); }
      else if (taskType === "clone") { endpoint = "/ai/video/clone"; form.append("file", file); }
      else if (taskType === "lipsync") { endpoint = "/ai/video/lipsync"; form.append("video_file", file); form.append("audio_file", audioFile!); }
      else if (taskType === "to_audio") { endpoint = "/ai/video/to_audio"; form.append("file", file); }
      else { form.append("file", file); }
      if (taskType === "subtitle" || taskType === "clone" || taskType === "lipsync") {
        form.append("target_lang", targetLang);
        form.append("source_lang", sourceLang.trim());
        form.append("include_zh_subtitle", String(includeZh));
        form.append("include_target_subtitle", String(includeTarget));
        form.append("burn_mode", inferredType === "audio" ? "none" : burnMode);
      }
      const res = await uploadFileWithProgress(endpoint, form, abortController);
      setCurrentTask(res);
      fetchHistory();
      setHistoryPage(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "请求失败, 请稍后再试");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
      uploadAbortRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 p-6">
      {/* 顶部 Tab 切换 */}
      <div className="flex gap-4 mb-6 shrink-0">
        {[
          { id: "subtitle", label: "字幕创作", icon: Video },
          { id: "audio", label: "音频处理", icon: Music },
          { id: "meeting", label: "会议记录", icon: FileTextIcon },
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`h-12 px-6 gap-2 rounded-none font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-cyan-400 text-slate-900 shadow-[4px_4px_0px_0px_#0f172a]"
                : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100"
            } ${brutalBorder}`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-base">{tab.label}</span>
          </Button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden min-h-0">
        {/* 左侧配置区 */}
        <div className={`bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadow} flex flex-col overflow-hidden`}>
          <div className="p-8 border-b-2 border-slate-100 dark:border-slate-800 shrink-0">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-2">
              {activeTab === "subtitle" ? "字幕创作中心" : activeTab === "audio" ? "音频处理中心" : "智能会议助手"}
            </h2>
            <p className="text-base font-bold text-slate-500 uppercase">
              {activeTab === "subtitle" 
                ? "自动生成字幕, 人声分离, 声音克隆及口型同步" 
                : activeTab === "audio" 
                ? "高精度人声提取、背景音分离与音色克隆" 
                : "会议实时转录、要点自动提取与会议纪要生成"}
            </p>
          </div>
          
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-10 pb-6">
              {activeTab === "subtitle" && (
                <div className="space-y-8">
                  {/* 1. 工具选择 */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-2 h-6 bg-cyan-400" />
                      1. 选择工具类型
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {toolCategories.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => { setTaskType(tool.id as any); setFile(null); setAudioFile(null); }}
                          className={cn(
                            "flex items-center justify-between p-5 text-left transition-all border-2 border-slate-900 dark:border-white",
                            taskType === tool.id
                              ? "bg-cyan-400 text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] translate-x-[-2px] translate-y-[-2px]"
                              : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <tool.icon className="w-6 h-6 shrink-0" />
                            <span className="font-black text-base uppercase">{tool.label}</span>
                          </div>
                          {taskType === tool.id && <Check className="w-6 h-6" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. 文件上传 */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-2 h-6 bg-amber-400" />
                      2. 上传原始文件
                    </h3>
                    <div className={cn("p-12 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center gap-4 cursor-pointer hover:bg-slate-100 transition-colors relative")}>
                      <input type="file" accept="video/*,audio/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                      <div className="w-16 h-16 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] flex items-center justify-center">
                        <Upload className="w-8 h-8 text-slate-900 dark:text-white" />
                      </div>
                      <span className="text-base font-black text-slate-500 uppercase">{file ? file.name : "点击或拖拽视频/音频文件"}</span>
                    </div>
                  </div>

                  {/* 3. 参数配置 */}
                  {taskType !== "separate" && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-2 h-6 bg-indigo-400" />
                          3. 参数配置
                        </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-slate-500">源语言 (可选)</label>
                          <input className={cn("w-full h-12 px-4 bg-slate-50 dark:bg-slate-900", brutalBorder)} value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} placeholder="zh, en..." />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-slate-500">目标翻译语言</label>
                          <select className={cn("w-full h-12 px-4 bg-slate-50 dark:bg-slate-900", brutalBorder)} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                            {TARGET_LANG_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleSubmit} disabled={submitDisabled} className="w-full h-20 text-2xl font-black uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-slate-800 rounded-none shadow-[8px_8px_0px_0px_#22d3ee] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                    {isSubmitting ? <><Loader2 className="w-8 h-8 animate-spin" /> 处理中 {uploadProgress}%</> : "开始处理任务"}
                  </Button>
                </div>
              )}

              {activeTab === "audio" && (
                <div className="space-y-10">
                  <section className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-3 h-8 bg-indigo-400" />
                      音频增强工具
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex gap-4">
                        <button 
                          onClick={toggleRecording}
                          disabled={isTranscribing}
                          className={cn(
                            "flex-1 p-8 flex items-center justify-between transition-all",
                            brutalBorder,
                            isRecording 
                              ? "bg-red-500 text-white shadow-none translate-x-1 translate-y-1" 
                              : "bg-indigo-100 text-slate-900 shadow-[6px_6px_0px_0px_#0f172a]"
                          )}
                        >
                          <div className="flex items-center gap-6">
                            {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                            <div className="text-left">
                              <div className="text-2xl font-black uppercase tracking-tight">
                                {isRecording ? "停止录音" : "实时语音识别"}
                              </div>
                              <div className={cn("text-base font-bold", isRecording ? "text-white/80" : "text-indigo-600")}>
                                {isRecording ? "点击结束并进入保存确认" : "使用麦克风进行实时转录"}
                              </div>
                            </div>
                          </div>
                          {isRecording && (
                            <div className="flex gap-1">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="w-1.5 h-6 bg-white animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                              ))}
                            </div>
                          )}
                        </button>
                        
                        {isRecording && (
                          <button
                            onClick={handleCancelRecording}
                            className={cn(
                              "px-8 bg-white text-red-500 font-black uppercase tracking-tight transition-all",
                              brutalBorder,
                              "shadow-[4px_4px_0px_0px_#ef4444] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                            )}
                          >
                            直接取消
                          </button>
                        )}
                      </div>

                      {/* 实时识别结果展示区 */}
                      {(liveTranscript || isTranscribing || pendingAudioBlob) && (
                        <div className={cn("p-8 bg-white dark:bg-slate-900 min-h-[160px] flex flex-col gap-4 transition-all", brutalBorder, brutalShadow)}>
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-black uppercase tracking-tighter text-indigo-600 flex items-center gap-2">
                              <Type className="w-5 h-5" />
                              {isRecording ? "正在实时识别 (Live Transcription)" : "识别结果预览 (Transcription Preview)"}
                            </h4>
                            {isTranscribing && <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />}
                          </div>
                          
                          <div className="flex-1 text-xl font-bold leading-relaxed text-slate-700 dark:text-slate-300 italic">
                            {isTranscribing ? (
                              <div className="flex flex-col gap-2">
                                <span className="animate-pulse">正在保存并同步至 S3...</span>
                                <div className="w-full h-2 bg-slate-100 overflow-hidden">
                                  <div className="w-1/2 h-full bg-indigo-500 animate-[shimmer_2s_infinite]" />
                                </div>
                              </div>
                            ) : (
                              liveTranscript || (isRecording ? "正在倾听..." : "未识别到内容")
                            )}
                          </div>

                          {!isTranscribing && !isRecording && pendingAudioBlob && (
                            <div className="flex items-center justify-between pt-6 border-t-2 border-slate-900 dark:border-white gap-4">
                              <div className="text-xs font-black uppercase text-slate-500">录音已就绪, 是否入库?</div>
                              <div className="flex gap-4">
                                <Button 
                                  onClick={handleDiscardAudioRecord}
                                  variant="outline"
                                  className={cn("h-12 px-6 font-black uppercase rounded-none border-2 border-red-500 text-red-500 hover:bg-red-50")}
                                >
                                  放弃 (Discard)
                                </Button>
                                <Button 
                                  onClick={handleSaveAudioRecord}
                                  className={cn("h-12 px-8 font-black uppercase rounded-none bg-emerald-500 text-white hover:bg-emerald-600 shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none")}
                                >
                                  保存记录 (Save)
                                </Button>
                              </div>
                            </div>
                          )}

                          {!isTranscribing && !isRecording && !pendingAudioBlob && liveTranscript && (
                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn("h-10 px-4 font-black uppercase rounded-none", brutalBorder)}
                                onClick={() => {
                                  navigator.clipboard.writeText(liveTranscript);
                                  globalToast({ message: "已复制到剪贴板", variant: "success" });
                                }}
                              >
                                复制文本
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                  <section className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-3 h-8 bg-emerald-400" />
                      处理规范 (Skills)
                    </h3>
                    <div className="p-8 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-900/10 space-y-6">
                      <div className="flex items-start gap-4 text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 className="w-6 h-6 mt-1 shrink-0" />
                        <span className="font-black text-lg leading-tight uppercase">音频结果将自动同步至 S3 私有桶并生成预签名 URL</span>
                      </div>
                      <div className="flex items-start gap-4 text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 className="w-6 h-6 mt-1 shrink-0" />
                        <span className="font-black text-lg leading-tight uppercase">处理完成后将即时推送通知至飞书与企业微信</span>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "meeting" && (
                <div className="space-y-10">
                  <section className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-3 h-8 bg-indigo-400" />
                      会议纪要生成
                    </h3>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-500">会议标题</label>
                      <input placeholder="请输入会议标题..." className={`w-full h-16 text-xl font-black bg-white dark:bg-slate-900 px-6 ${brutalBorder} focus:outline-none focus:ring-8 focus:ring-indigo-400/20`} />
                    </div>
                    <div className={`p-12 bg-slate-50 dark:bg-slate-800 ${brutalBorder} border-dashed flex flex-col items-center gap-6 group cursor-pointer hover:bg-slate-100 transition-all`}>
                      <div className="w-20 h-20 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] flex items-center justify-center group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
                        <Upload className="w-10 h-10 text-slate-900 dark:text-white" />
                      </div>
                      <span className="font-black text-xl text-slate-500 uppercase tracking-widest">上传会议录音 (MP3/WAV/M4A)</span>
                    </div>
                  </section>
                  <section className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-3 h-8 bg-pink-400" />
                      AI 智能总结选项
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      {["精简摘要", "详细纪要", "行动项提取", "全量转录"].map((item) => (
                        <div 
                          key={item} 
                          onClick={() => toggleMeetingOption(item)}
                          className={cn(
                            "p-6 border-2 transition-all cursor-pointer flex items-center gap-4",
                            meetingOptions.includes(item)
                              ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20 text-pink-900 dark:text-pink-100 shadow-[4px_4px_0px_0px_#ec4899]"
                              : "border-slate-900 dark:border-white bg-white dark:bg-slate-800 hover:bg-slate-50"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 border-2 flex items-center justify-center shrink-0 transition-all",
                            meetingOptions.includes(item) ? "border-pink-500 bg-pink-500" : "border-slate-300"
                          )}>
                            {meetingOptions.includes(item) && <Check className="w-5 h-5 text-white" />}
                          </div>
                          <span className="font-black text-lg uppercase tracking-tight">{item}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                  <Button className="w-full h-24 bg-indigo-600 text-white text-3xl font-black uppercase tracking-[0.2em] rounded-none shadow-[10px_10px_0px_0px_#000000] hover:bg-indigo-700 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none">
                    开始智能转录
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 右侧结果区 */}
        <div className="flex flex-col gap-6 overflow-hidden min-h-0">
          {/* 实时预览 / 播放器 */}
          <div className={cn(
            "aspect-video bg-slate-900 relative group flex items-center justify-center shrink-0 overflow-hidden",
            brutalBorder,
            brutalShadow
          )}>
            {activeTab === "meeting" ? (
               <div className="flex flex-col items-center gap-4 text-slate-500">
                 <Mic className="w-16 h-16 animate-pulse text-cyan-500" />
                 <span className="font-black uppercase tracking-widest">等待会议音频输入...</span>
               </div>
            ) : (activeTab === "audio" && (isRecording || liveTranscript)) ? (
              <div className="w-full h-full p-8 flex flex-col gap-6 bg-slate-900 text-white overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-black uppercase tracking-widest text-cyan-400">实时识别预览 (Live Preview)</span>
                  </div>
                  {isTranscribing && <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />}
                </div>
                <ScrollArea className="flex-1">
                  <div className="text-2xl font-bold leading-relaxed text-slate-200 italic pr-4">
                    {liveTranscript || (isRecording ? "正在倾听语音..." : "")}
                  </div>
                </ScrollArea>
              </div>
            ) : activeRecord?.output_video_url ? (
              <video className="w-full h-full object-contain" controls src={activeRecord.output_video_url} />
            ) : (
              <div className="text-center p-6 text-slate-500">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <span className="font-black uppercase tracking-widest">等待任务完成后显示预览</span>
              </div>
            )}
          </div>
          
          {/* 任务列表 / 历史 */}
          <div className={`flex-1 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadow} p-6 flex flex-col overflow-hidden min-h-0`}>
             <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
                  <HistoryIcon className="w-6 h-6" />
                  历史任务
                </h3>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-white text-xs font-black">TOTAL: {history.length}</span>
             </div>
             <ScrollArea className="flex-1">
                <div className="space-y-4 pb-4">
                  {history.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-300 gap-4">
                       <FileTextIcon className="w-12 h-12 opacity-20" />
                       <span className="font-bold text-sm uppercase">暂无历史记录</span>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item.task_id} onClick={() => setActiveRecord(item)} className={cn("p-4 border-2 transition-all cursor-pointer group flex items-center justify-between", activeRecord?.task_id === item.task_id ? "border-cyan-500 bg-cyan-50 dark:bg-slate-800" : "border-slate-900 dark:border-white hover:bg-slate-50 dark:hover:bg-slate-800")}>
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative">
                            <div className={cn("w-4 h-4 rounded-full shrink-0 flex items-center justify-center", item.status === "completed" ? "bg-emerald-500" : "bg-cyan-500 animate-pulse")}>
                              {activeRecord?.task_id === item.task_id && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-sm uppercase truncate">{item.file_name}</div>
                            <div className="text-[10px] font-bold text-slate-400">{new Date(item.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(item.task_id); }} className="p-2 text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          {item.output_video_url && <a href={item.output_video_url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-900 dark:text-white hover:bg-slate-100"><ExternalLink className="w-4 h-4" /></a>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
