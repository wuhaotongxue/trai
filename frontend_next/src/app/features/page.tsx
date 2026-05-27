/**
 * page.tsx
 * TRAI 功能介绍页
 */

"use client";

import Link from "next/link";
import { ArrowRight, Bot, Zap, Image, MessageSquare, Shield, Globe, Cpu, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { useI18n } from "@/i18n/i18n_context";

const features = [
  {
    icon: Bot,
    gradient: "from-blue-500 to-blue-600",
    titleKey: "features.agent",
    descKey: "features.agent.desc",
    tags: ["自动编排", "工具扩展", "MCP 协议"],
  },
  {
    icon: Zap,
    gradient: "from-amber-500 to-orange-500",
    titleKey: "features.correct",
    descKey: "features.correct.desc",
    tags: ["自动重试", "错误恢复", "容错机制"],
  },
  {
    icon: Image,
    gradient: "from-emerald-500 to-teal-500",
    titleKey: "features.vision",
    descKey: "features.vision.desc",
    tags: ["图片问答", "多模态", "Base64"],
  },
  {
    icon: MessageSquare,
    gradient: "from-indigo-500 to-indigo-500",
    titleKey: "features.sse",
    descKey: "features.sse.desc",
    tags: ["实时流式", "打字机效果", "低延迟"],
  },
  {
    icon: Shield,
    gradient: "from-cyan-500 to-blue-500",
    titleKey: "features.security",
    descKey: "features.security.desc",
    tags: ["JWT 认证", "权限管理", "数据加密"],
  },
  {
    icon: Globe,
    gradient: "from-pink-500 to-rose-500",
    titleKey: "features.model",
    descKey: "features.model.desc",
    tags: ["OpenAI", "ModelScope", "智谱 GLM"],
  },
  {
    icon: Cpu,
    gradient: "from-indigo-500 to-indigo-500",
    titleKey: "features.ddd",
    descKey: "features.ddd.desc",
    tags: ["DDD 架构", "Clean Code", "可维护"],
  },
  {
    icon: Workflow,
    gradient: "from-teal-500 to-emerald-500",
    titleKey: "features.session",
    descKey: "features.session.desc",
    tags: ["历史管理", "会话导出", "多会话"],
  },
];

export default function FeaturesPage() {
  const { translate } = useI18n();
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="pt-32 pb-20 bg-amber-400">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            {translate("features.hero.title")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight leading-tight">
            {translate("features.hero.subtitle")}<br />
            <span className="text-blue-600">为你的 AI 应用而生</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-8">
            {translate("features.hero.desc")}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="h-11 px-8 rounded-none text-base font-semibold shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] shadow-blue-500/20 gap-2">
                {translate("features.hero.cta1")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-11 px-8 rounded-none text-base border-slate-200 text-slate-600 gap-2">
                {translate("features.hero.cta2")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 功能列表 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {features.map((f) => (
              <div
                key={f.titleKey}
                className="group p-6 rounded-none border border-slate-100 hover:border-blue-200 hover:shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-none bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{translate(f.titleKey)}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{translate(f.descKey)}</p>
                <div className="flex flex-wrap gap-2">
                  {f.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-none bg-slate-100 text-slate-600 font-medium group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-amber-400">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{translate("features.ready.title")}</h2>
          <p className="text-blue-100 mb-8">{translate("features.ready.subtitle")}</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="h-11 px-8 rounded-none text-base font-semibold bg-white text-blue-600 shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] gap-2 hover:bg-blue-50">
                {translate("features.ready.cta1")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-11 px-8 rounded-none text-base font-semibold bg-white/10 text-white border-white/30 gap-2 hover:bg-white/20">
                {translate("features.ready.cta2")} <ArrowRight className="h-4 w-4" />
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
