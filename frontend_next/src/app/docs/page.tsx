"use client";

import Link from "next/link";
import { BookOpen, FileText, HelpCircle, Package } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n_context";

const docsCards = [
  {
    titleKey: "docs.quickstart.title",
    descKey: "docs.quickstart.desc",
    enterKey: "docs.enter",
    href: "/docs/quickstart",
    icon: BookOpen,
  },
  {
    titleKey: "docs.api.title",
    descKey: "docs.api.desc",
    enterKey: "docs.enter",
    href: "/docs/api",
    icon: FileText,
  },
  {
    titleKey: "docs.sdk.title",
    descKey: "docs.sdk.desc",
    enterKey: "docs.enter",
    href: "/docs/sdk",
    icon: Package,
  },
  {
    titleKey: "docs.faq.title",
    descKey: "docs.faq.desc",
    enterKey: "docs.enter",
    href: "/docs/faq",
    icon: HelpCircle,
  },
];

export default function DocsIndexPage() {
  const { translate } = useI18n();
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        <section className="pt-28 pb-14 bg-slate-100 dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-sm font-medium mb-6">
              <BookOpen className="h-4 w-4" />
              {translate("docs.title")}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {translate("docs.subtitle")}
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed">
              {translate("docs.desc")}
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docsCards.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group p-6 rounded-none border border-slate-200 bg-white hover:bg-slate-50 transition-colors dark:bg-[#0d1220] dark:border-slate-800/60 dark:hover:bg-white/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-none bg-slate-100 flex items-center justify-center shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] shadow-blue-500/20">
                      <c.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {translate(c.titleKey)}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
                        {translate(c.descKey)}
                      </p>
                      <div className="mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-200 dark:border-slate-700"
                        >
                          {translate(c.enterKey)}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
