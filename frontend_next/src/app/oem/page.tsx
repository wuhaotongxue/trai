/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 09:50:00
 * 描述: oem 占位页
 */

"use client";

import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Construction } from "lucide-react";
import { useI18n } from "@/i18n/i18n_context";

export default function OemPage() {
  const { translate } = useI18n();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col selection:bg-slate-100 selection:text-slate-900">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-32 h-32 bg-cyan-400 rounded-none border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex items-center justify-center mb-8 transform rotate-3 hover:rotate-0 transition-transform">
          <Construction className="w-16 h-16 text-slate-900" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 bg-white dark:bg-slate-800 px-6 py-3 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]">
          {translate("oem.title") || "OEM 私有化部署"}
        </h1>
        <p className="text-xl font-bold text-slate-600 dark:text-slate-400 bg-cyan-100 dark:bg-cyan-900 px-4 py-2 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] transform -rotate-1 mt-4">
          {translate("oem.desc") || "该页面正在建设中，敬请期待！"}
        </p>
      </div>
      <Footer />
    </div>
  );
}
