"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n_context";

const steps = [
  { titleKey: "docs.quickstart.step1", descKey: "docs.quickstart.step1.desc", done: true },
  { titleKey: "docs.quickstart.step2", descKey: "docs.quickstart.step2.desc", done: true },
  { titleKey: "docs.quickstart.step3", descKey: "docs.quickstart.step3.desc", done: false },
  { titleKey: "docs.quickstart.step4", descKey: "docs.quickstart.step4.desc", done: false },
];

export default function DocsQuickstartPage() {
  const { translate } = useI18n();
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        <section className="pt-28 pb-12 bg-slate-100 dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                {translate("docs.quickstart.title")}
              </div>
              <Link href="/docs" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
                {translate("docs.quickstart.back")}
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-6 tracking-tight">
              {translate("docs.quickstart.hero.title")}
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed">
              {translate("docs.quickstart.hero.desc")}
            </p>
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <Link href="/agent">
                <Button className="gap-2">
                  {translate("docs.quickstart.hero.cta1")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs/api">
                <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-700">
                  {translate("docs.quickstart.hero.cta2")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {steps.map((s) => (
                <div
                  key={s.titleKey}
                  className="p-6 rounded-none border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-none flex items-center justify-center ${s.done ? "bg-cyan-500/15" : "bg-muted/40"} `}>
                      <CheckCircle2 className={`h-5 w-5 ${s.done ? "text-emerald-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900 dark:text-white">{translate(s.titleKey)}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">{translate(s.descKey)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
