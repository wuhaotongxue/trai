"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Loader2, Video, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { request } from "@/lib/api_client";

export function VideoDownloaderPanel() {
  const [url, setUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<{ title: string; file_path: string; video_id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!url.trim() || isDownloading) return;
    
    setIsDownloading(true);
    setError(null);
    setResult(null);

    try {
      const res = await request<any>("/tools/video/download", {
        method: "POST",
        body: JSON.stringify({ url: url.trim() })
      });

      if (res.code === 200) {
        setResult(res.data);
      } else {
        setError(res.msg || "下载失败, 请检查链接是否正确");
      }
    } catch (e) {
      setError("网络请求失败, 请重试");
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0d1220] p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">视频下载专家</h1>
          <p className="text-slate-500 dark:text-slate-400">支持 Bilibili 等主流平台视频下载, 输入链接即可开始</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <Input 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="粘贴视频链接, 例如: https://www.bilibili.com/video/BV1MSLt6qEdt"
              className="pl-12 h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
            />
          </div>

          <Button 
            onClick={handleDownload}
            disabled={!url.trim() || isDownloading}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isDownloading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>正在解析并下载中...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span>立即下载</span>
              </div>
            )}
          </Button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span className="font-semibold text-lg">下载成功!</span>
              </div>
              
              <div className="flex items-start gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-500/10">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-white truncate">{result.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 truncate">ID: {result.video_id}</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-2 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                  <ExternalLink className="w-4 h-4" />
                  <span>查看文件</span>
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "高清下载", desc: "自动选择最高清晰度", icon: Video },
            { title: "极速响应", desc: "采用高性能下载引擎", icon: Loader2 },
            { title: "全平台支持", desc: "Bilibili/Youtube等", icon: Globe },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <item.icon className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
