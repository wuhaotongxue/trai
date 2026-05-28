/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 09:50:00
 * 描述: careers 占位页
 */

"use client";

import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Construction } from "lucide-react";
import { useI18n } from "@/i18n/i18n_context";

export default function CareersPage() {
  const { translate } = useI18n();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        
        <div className="relative z-10 w-32 h-32 bg-rose-300 dark:bg-rose-600 rounded-none border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] flex items-center justify-center mb-10 transform rotate-3 hover:rotate-0 hover:scale-110 transition-all duration-300">
          <Construction className="w-16 h-16 text-slate-900 dark:text-white" />
        </div>
        <h1 className="relative z-10 text-5xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 bg-white dark:bg-slate-800 px-8 py-4 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]">
          加入我们
        </h1>
        <p className="relative z-10 text-xl md:text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white bg-cyan-300 dark:bg-cyan-600 px-6 py-3 border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] transform -rotate-2 mt-4 hover:rotate-1 transition-transform">
          该页面正在建设中，敬请期待！
        </p>
      </div>
      <Footer />
    </div>
  );
}
