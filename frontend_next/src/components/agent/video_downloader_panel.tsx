"use client";

/**
 * 文件名: video_downloader_panel.tsx
 * 作者: wuhao
 * 日期: 2026-05-28 14:35:09
 * 描述: Agent 视频下载面板, 统一使用与主工作区一致的结果区和状态动画风格
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Loader2, Video, CheckCircle2, AlertCircle, ExternalLink, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { request } from "@/lib/api_client";

/**
 * 视频下载面板组件.
 *
 * @returns 与 Agent 主界面统一风格的视频下载工具面板.
 */
export function VideoDownloaderPanel() {
  const [url, setUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<{ title: string; file_path: string; video_id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const brutalBorder = "border-2 border-slate-900 dark:border-white";
  const brutalShadow = "shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff]";
  const brutalShadowSm = "shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]";
  const brutalBtnBase = `font-black uppercase tracking-wider transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${brutalBorder} ${brutalShadowSm}`;

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
                <div className="text-xs font-bold uppercase text-slate-500">Bilibili / Youtube / More</div>
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
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        className={`w-28 h-28 bg-cyan-200 dark:bg-cyan-900 flex items-center justify-center ${brutalBorder} ${brutalShadowSm}`}
                        animate={{ rotate: [0, 4, -4, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      >
                        <Loader2 className="w-14 h-14 animate-spin" />
                      </motion.div>
                    </div>
                  </div>
                  <div className={`p-5 bg-slate-50 dark:bg-slate-950 ${brutalBorder} ${brutalShadowSm} space-y-4`}>
                    <div className="flex items-center justify-between font-black uppercase">
                      <span>下载流程处理中</span>
                      <span>Pipeline Active</span>
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 border-2 border-slate-900 dark:border-white overflow-hidden">
                      <motion.div
                        className="h-full bg-cyan-500"
                        animate={{ x: ["-25%", "100%"] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        style={{ width: "35%" }}
                      />
                    </div>
                    <div className="text-sm font-bold">正在解析页面结构, 抽取可下载媒体源并写入结果区...</div>
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
                          <span className={`px-3 py-2 bg-slate-100 dark:bg-slate-800 ${brutalBorder}`}>ID: {result.video_id}</span>
                          <span className={`px-3 py-2 bg-slate-100 dark:bg-slate-800 ${brutalBorder}`}>PATH READY</span>
                        </div>
                      </div>
                      <a href={result.file_path} target="_blank" rel="noopener noreferrer">
                        <Button className={`shrink-0 h-12 gap-2 bg-cyan-100 hover:bg-cyan-200 text-slate-900 rounded-none ${brutalBtnBase}`}>
                          <ExternalLink className="w-5 h-5" />
                          <span>查看文件</span>
                        </Button>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.98 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                  className="flex flex-col items-center justify-center gap-6"
                >
                  <div className={`w-32 h-32 bg-cyan-300 dark:bg-cyan-900 flex items-center justify-center ${brutalBorder} ${brutalShadow}`}>
                    <Download className="w-16 h-16 text-slate-900 dark:text-white" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-black uppercase tracking-widest text-slate-900 dark:text-white">等待链接输入</div>
                    <div className={`inline-flex px-4 py-2 bg-white dark:bg-slate-900 text-sm font-bold ${brutalBorder} ${brutalShadowSm}`}>
                      在上方粘贴链接后开始解析
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 auto-rows-min">
          <div className={`p-5 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadow} space-y-4`}>
            <div className="font-black uppercase tracking-widest text-slate-900 dark:text-white">能力看板</div>
            <div className="grid grid-cols-1 gap-4">
          {[
            { title: "高清下载", desc: "自动选择最高清晰度", icon: Video, color: "bg-cyan-300" },
            { title: "极速响应", desc: "采用高性能下载引擎", icon: Loader2, color: "bg-teal-400" },
            { title: "全平台支持", desc: "Bilibili/Youtube等", icon: Globe, color: "bg-slate-100" },
          ].map((item, i) => (
            <div key={i} className={`p-5 bg-slate-50 dark:bg-slate-950 ${brutalBorder} ${brutalShadowSm} space-y-4 hover:-translate-y-1 transition-transform`}>
              <div className={`w-12 h-12 ${item.color} border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center`}>
                <item.icon className="w-6 h-6 text-slate-900 font-black" />
              </div>
              <h3 className="font-black text-xl uppercase tracking-widest text-slate-900 dark:text-white">{item.title}</h3>
              <p className="font-bold text-slate-600 dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
            </div>
          </div>
          <div className={`p-5 bg-amber-100 dark:bg-slate-950 ${brutalBorder} ${brutalShadow} space-y-3`}>
            <div className="font-black uppercase tracking-widest text-slate-900 dark:text-white">使用建议</div>
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
