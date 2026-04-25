/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 09:50:00
 * 描述: partner 占位页
 */

"use client";

import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Construction } from "lucide-react";
import { useI18n } from "@/i18n/i18n_context";

export default function PartnerPage() {
  const { translate } = useI18n();
  return (
    <>
      <Navbar />
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
        <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
          <Construction className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">{translate("partner.title")}</h1>
        <p className="text-slate-500">{translate("partner.desc")}</p>
      </div>
      <Footer />
    </>
  );
}
