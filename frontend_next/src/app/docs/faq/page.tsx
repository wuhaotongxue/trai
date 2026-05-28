"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { useI18n } from "@/i18n/i18n_context";

const faqs = [
  { qKey: "docs.faq.q1", aKey: "docs.faq.a1" },
  { qKey: "docs.faq.q2", aKey: "docs.faq.a2" },
  { qKey: "docs.faq.q3", aKey: "docs.faq.a3" },
  { qKey: "docs.faq.q4", aKey: "docs.faq.a4" },
];

export default function DocsFaqPage() {
  const { translate } = useI18n();
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <section className="pt-28 pb-10 bg-cyan-300 dark:bg-cyan-900 border-b-4 border-slate-900 dark:border-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]">
              <HelpCircle className="h-4 w-4" />
              {translate("docs.faq.title")}
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mt-6 tracking-widest uppercase">
              FAQ
            </h1>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-300 mt-4 leading-relaxed">
              {translate("docs.faq.subtitle")}
              <Link href="/docs" className="ml-2 text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 underline decoration-4 underline-offset-4">
                {translate("docs.quickstart.back")}
              </Link>
            </p>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 max-w-7xl space-y-6">
            {faqs.map((item) => (
              <div
                key={item.qKey}
                className="p-8 rounded-none border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-800 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all"
              >
                <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">{translate(item.qKey)}</p>
                <p className="text-lg font-bold text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                  {translate(item.aKey)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
