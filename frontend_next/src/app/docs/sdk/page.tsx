"use client";

import Link from "next/link";
import { Download, Package } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n_context";

const sdkList = [
  { nameKey: "docs.sdk.frontend", descKey: "docs.sdk.frontend.desc", href: "#" },
  { nameKey: "docs.sdk.backend", descKey: "docs.sdk.backend.desc", href: "#" },
  { nameKey: "docs.sdk.openapi", descKey: "docs.sdk.openapi.desc", href: "/docs/api" },
];

export default function DocsSdkPage() {
  const { translate } = useI18n();
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        <section className="pt-28 pb-10 bg-gradient-to-b from-slate-50 to-white dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-sm font-medium">
              <Package className="h-4 w-4" />
              {translate("docs.sdk.title")}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-6 tracking-tight">
              {translate("docs.sdk.subtitle")}
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed">
              {translate("docs.sdk.subtitle_desc")}
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-4">
            {sdkList.map((s) => (
              <div
                key={s.nameKey}
                className="p-6 rounded-2xl border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60"
              >
                <p className="text-base font-bold text-slate-900 dark:text-white">{translate(s.nameKey)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">{translate(s.descKey)}</p>
                <div className="mt-4">
                  <Link href={s.href}>
                    <Button size="sm" variant="outline" className="gap-2 border-slate-200 dark:border-slate-700">
                      <Download className="h-4 w-4" />
                      {translate("docs.sdk.download")}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
