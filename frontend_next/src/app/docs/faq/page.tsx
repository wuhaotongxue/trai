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
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        <section className="pt-28 pb-10 bg-amber-400 dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-sm font-medium">
              <HelpCircle className="h-4 w-4" />
              {translate("docs.faq.title")}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-6 tracking-tight">
              FAQ
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed">
              {translate("docs.faq.subtitle")}
              <Link href="/docs" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">
                {translate("docs.quickstart.back")}
              </Link>
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl space-y-4">
            {faqs.map((item) => (
              <div
                key={item.qKey}
                className="p-6 rounded-none border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60"
              >
                <p className="text-base font-bold text-slate-900 dark:text-white">{translate(item.qKey)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
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
