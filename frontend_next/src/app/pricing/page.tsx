/**
 * page.tsx
 * TRAI 定价页
 */

"use client";

import Link from "next/link";
import { ArrowRight, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { useI18n } from "@/i18n/i18n_context";

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
    color: "from-amber-500 to-amber-600",
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
      <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-amber-400">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            {translate("pricing.hero.badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight">
            {translate("pricing.hero.title")}
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            {translate("pricing.hero.subtitle")}
          </p>
        </div>
      </section>

      {/* 定价卡片 */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.nameKey}
                className={`relative rounded-none border p-6 transition-all ${
                  plan.popular
                    ? "border-blue-300 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] shadow-blue-500/10 ring-2 ring-blue-500"
                    : "border-slate-200 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]"
                }`}
              >
                {plan.badgeKey && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-none text-white bg-gradient-to-r ${plan.color}`}>
                      {translate(plan.badgeKey)}
                    </span>
                  </div>
                )}
                <div className={`h-1 rounded-b-xl bg-gradient-to-r ${plan.color} mb-5`} />
                <h3 className="text-lg font-bold text-slate-900">{translate(plan.nameKey)}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{translate(plan.descKey)}</p>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-400">/{translate(plan.periodKey)}</span>
                </div>
                <Link href="/register">
                  <Button
                    variant={plan.ctaVariant}
                    className={`w-full h-10 mt-5 gap-2 font-semibold text-sm ${
                      plan.popular ? "bg-blue-600 hover:bg-blue-700 text-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] shadow-blue-500/20" : ""
                    }`}
                  >
                    {translate(plan.ctaKey)} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((fKey) => (
                    <li key={fKey} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      {translate(fKey)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">{translate("pricing.faq.title")}</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.qKey} className="bg-white rounded-none p-5 border border-slate-100 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                <p className="text-sm font-semibold text-slate-800 mb-2">{translate(faq.qKey)}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{translate(faq.aKey)}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm mb-3">{translate("pricing.faq.other")}</p>
            <Link href="/contact">
              <Button variant="outline" className="gap-2 border-slate-200">
                {translate("pricing.faq.contact_btn")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
      <Footer />
    </>
  );
}
