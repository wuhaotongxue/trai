"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Loader2, Video, CheckCircle2, AlertCircle, ExternalLink, Globe } from "lucide-react";
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
      const res = await request<{code: number, msg: string, data: any}>("/tools/video/download", {
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
    <div className="flex flex-col p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full space-y-10"
      >
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black uppercase tracking-widest text-slate-900 dark:text-white inline-block bg-amber-400 px-4 py-2 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] transform -rotate-2">
            视频下载专家
          </h1>
          <p className="text-xl font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] inline-block px-4 py-2 transform rotate-1">
            支持 Bilibili 等主流平台视频下载，输入链接即可开始
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-white p-8 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] space-y-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-900 dark:text-white group-focus-within:text-indigo-500 transition-colors">
              <Search className="w-6 h-6 font-black" />
            </div>
            <Input 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="粘贴视频链接, 例如: https://www.bilibili.com/video/BV1MSLt6qEdt"
              className="pl-14 h-16 bg-white dark:bg-slate-800 border-4 border-slate-900 dark:border-white rounded-none shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] focus-visible:ring-0 focus-visible:border-indigo-500 focus-visible:shadow-[4px_4px_0px_0px_#6366f1] transition-all text-lg font-bold"
            />
          </div>

          <Button 
            onClick={handleDownload}
            disabled={!url.trim() || isDownloading}
            className="w-full h-16 rounded-none bg-emerald-400 hover:bg-emerald-300 text-slate-900 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-black text-xl uppercase tracking-widest disabled:opacity-50"
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

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-rose-400 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex items-center gap-4 text-slate-900"
            >
              <AlertCircle className="w-8 h-8 shrink-0 font-black" />
              <span className="font-bold text-lg uppercase tracking-wider">{error}</span>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-cyan-400 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] space-y-6"
            >
              <div className="flex items-center gap-3 text-slate-900">
                <CheckCircle2 className="w-8 h-8 shrink-0 font-black" />
                <span className="font-black text-2xl uppercase tracking-widest">下载成功!</span>
              </div>
              
              <div className="flex items-start gap-6 bg-white dark:bg-slate-800 p-6 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
                <div className="w-16 h-16 bg-amber-400 border-4 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center shrink-0">
                  <Video className="w-8 h-8 text-slate-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-xl text-slate-900 dark:text-white truncate uppercase">{result.title}</h3>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mt-2 truncate">ID: {result.video_id}</p>
                </div>
                <Button className="shrink-0 h-12 gap-2 bg-indigo-400 hover:bg-indigo-300 text-slate-900 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-none hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-black uppercase">
                  <ExternalLink className="w-5 h-5" />
                  <span>查看文件</span>
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "高清下载", desc: "自动选择最高清晰度", icon: Video, color: "bg-fuchsia-400" },
            { title: "极速响应", desc: "采用高性能下载引擎", icon: Loader2, color: "bg-teal-400" },
            { title: "全平台支持", desc: "Bilibili/Youtube等", icon: Globe, color: "bg-rose-400" },
          ].map((item, i) => (
            <div key={i} className={`p-6 bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] space-y-4 hover:-translate-y-2 transition-transform`}>
              <div className={`w-12 h-12 ${item.color} border-4 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center`}>
                <item.icon className="w-6 h-6 text-slate-900 font-black" />
              </div>
              <h3 className="font-black text-xl uppercase tracking-widest text-slate-900 dark:text-white">{item.title}</h3>
              <p className="font-bold text-slate-600 dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
