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
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <section className="pt-28 pb-14 bg-cyan-300 dark:bg-cyan-900 border-b-4 border-slate-900 dark:border-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] mb-6">
              <BookOpen className="h-4 w-4" />
              {translate("docs.title")}
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-widest uppercase">
              {translate("docs.subtitle")}
            </h1>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-300 mt-4 leading-relaxed max-w-2xl">
              {translate("docs.desc")}
            </p>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {docsCards.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group p-8 rounded-none border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-800 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-none bg-cyan-300 dark:bg-cyan-600 flex items-center justify-center border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                      <c.icon className="h-8 w-8 text-slate-900 dark:text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {translate(c.titleKey)}
                      </p>
                      <p className="text-base font-bold text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                        {translate(c.descKey)}
                      </p>
                      <div className="mt-6">
                        <Button
                          size="sm"
                          className="h-10 px-6 rounded-none border-2 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors"
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
