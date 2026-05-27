/**
 * page.tsx
 * TRAI 定价页
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { useI18n } from "@/i18n/i18n_context";

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const plans = [
  {
    nameKey: "pricing.free",
    price: "¥0",
    periodKey: "pricing.free_period",
    descKey: "pricing.free_desc",
    color: "from-slate-400 to-slate-500",
    badgeKey: null,
    features: [
      "pricing.plan.free.1",
      "pricing.plan.free.2",
      "pricing.plan.free.3",
      "pricing.plan.free.4",
      "pricing.plan.free.5",
      "pricing.plan.free.6",
    ],
    ctaKey: "pricing.cta.start",
    ctaVariant: "outline" as const,
  },
  {
    nameKey: "pricing.pro",
    price: "¥99",
    periodKey: "pricing.per_month",
    descKey: "pricing.pro_desc",
    color: "from-blue-500 to-blue-600",
    badgeKey: "pricing.badge.popular",
    popular: true,
    features: [
      "pricing.plan.pro.1",
      "pricing.plan.pro.2",
      "pricing.plan.pro.3",
      "pricing.plan.pro.4",
      "pricing.plan.pro.5",
      "pricing.plan.pro.6",
      "pricing.plan.pro.7",
    ],
    ctaKey: "pricing.cta.upgrade",
    ctaVariant: "default" as const,
  },
  {
    nameKey: "pricing.vip",
    price: "¥299",
    periodKey: "pricing.per_month",
    descKey: "pricing.vip_desc",
    color: "from-cyan-500 to-cyan-600",
    badgeKey: "pricing.badge.enterprise",
    features: [
      "pricing.plan.vip.1",
      "pricing.plan.vip.2",
      "pricing.plan.vip.3",
      "pricing.plan.vip.4",
      "pricing.plan.vip.5",
      "pricing.plan.vip.6",
      "pricing.plan.vip.7",
      "pricing.plan.vip.8",
    ],
    ctaKey: "pricing.cta.contact",
    ctaVariant: "outline" as const,
  },
];

const faqs = [
  { qKey: "pricing.faq.auto_upgrade.q", aKey: "pricing.faq.auto_upgrade.a" },
  { qKey: "pricing.faq.agent_call.q", aKey: "pricing.faq.agent_call.a" },
  { qKey: "pricing.faq.refund.q", aKey: "pricing.faq.refund.a" },
  { qKey: "pricing.faq.invoice.q", aKey: "pricing.faq.invoice.a" },
  { qKey: "pricing.faq.yearly.q", aKey: "pricing.faq.yearly.a" },
];

export default function PricingPage() {
  const { translate } = useI18n();
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-slate-100 dark:bg-slate-900 border-b-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-slate-900 dark:border-white bg-cyan-300 dark:bg-cyan-600 text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
              <Zap className="h-4 w-4" />
              {translate("pricing.hero.badge")}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-5 tracking-tight uppercase leading-tight">
              {translate("pricing.hero.title")}
            </h1>
            <p className="text-xl font-bold text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
              {translate("pricing.hero.subtitle")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 定价卡片 */}
      <section className="py-20 bg-white dark:bg-slate-950 border-b-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, i) => (
              <Reveal key={plan.nameKey} delay={i * 100}>
                <div
                  className={`group relative bg-white dark:bg-slate-800 p-8 transition-all duration-300 border-4 ${
                    plan.popular
                      ? "border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] -translate-y-4"
                      : "border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]"
                  } hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff]`}
                >
                  {plan.badgeKey && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                      <span className={`text-sm font-black uppercase tracking-widest px-4 py-2 text-slate-900 dark:text-white bg-cyan-300 dark:bg-cyan-600 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]`}>
                        {translate(plan.badgeKey)}
                      </span>
                    </div>
                  )}
                  <h3 className="text-3xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">{translate(plan.nameKey)}</h3>
                  <p className="text-base font-bold text-slate-500 dark:text-slate-400 mt-0.5 min-h-[48px]">{translate(plan.descKey)}</p>
                  <div className="flex items-baseline gap-1 mt-6 mb-8 pb-8 border-b-4 border-slate-900 dark:border-slate-700">
                    <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{plan.price}</span>
                    <span className="text-lg font-bold text-slate-500 dark:text-slate-400">/{translate(plan.periodKey)}</span>
                  </div>
                  <Link href="/register">
                    <Button
                      variant={plan.ctaVariant}
                      className={`w-full h-14 mt-2 mb-8 text-lg font-black uppercase tracking-widest border-4 border-slate-900 dark:border-white rounded-none transition-all shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none gap-2 ${
                        plan.popular ? "bg-slate-900 dark:bg-cyan-600 text-white" : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}
                    >
                      {translate(plan.ctaKey)} <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <ul className="space-y-4">
                    {plan.features.map((fKey) => (
                      <li key={fKey} className="flex items-start gap-3 text-base font-bold text-slate-700 dark:text-slate-300">
                        <div className="p-1 bg-cyan-300 dark:bg-cyan-600 border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] flex-shrink-0 mt-0.5">
                          <Check className="h-4 w-4 text-slate-900 dark:text-white" />
                        </div>
                        {translate(fKey)}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto px-4 max-w-4xl">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-slate-900 dark:text-white text-center mb-12 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">{translate("pricing.faq.title")}</h2>
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <Reveal key={faq.qKey} delay={i * 100}>
                  <div className="bg-white dark:bg-slate-800 p-8 border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] transition-all duration-300">
                    <p className="text-xl font-black uppercase tracking-wide text-slate-900 dark:text-white mb-4 flex items-start gap-3">
                      <span className="text-cyan-500 dark:text-cyan-400 shrink-0">Q.</span>
                      {translate(faq.qKey)}
                    </p>
                    <p className="text-base font-bold text-slate-600 dark:text-slate-400 leading-relaxed ml-8">
                      {translate(faq.aKey)}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="text-center mt-16">
              <p className="text-slate-600 dark:text-slate-400 font-bold text-lg mb-6">{translate("pricing.faq.other")}</p>
              <Link href="/contact">
                <Button variant="outline" className="h-14 px-8 text-lg font-black uppercase tracking-widest bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all rounded-none gap-3">
                  {translate("pricing.faq.contact_btn")} <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
      <Footer />
    </>
  );
}
