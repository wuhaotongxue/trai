/**
 * page.tsx
 * TRAI 官网首页 (根路由)
 * 默认浅色主题, 支持深色模式切换
 * 参考: Google Material Motion 设计体系
 */

"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Bot, CheckCircle, ChevronRight, Cpu, Database, Globe, Image, MessageSquare, Shield, Sparkles, Star, Workflow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/website/navbar";
import { useEffect, useRef, useState } from "react";

// ---- 信任背书 ----
const trustedBy = [
  "字X跳动", "腾X云", "阿X云", "美X", "小X", "华X",
  "字X", "腾X", "阿X", "美X",
];

// ---- 核心功能 ----
const features = [
  {
    icon: Bot,
    color: "from-blue-600 to-blue-500",
    title: "多工具 Agent",
    desc: "内置天气、搜索、翻译、计算器等工具, 支持用户自定义扩展, AI 自动编排任务流程",
  },
  {
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    title: "智能自我纠错",
    desc: "五层错误分类器, rate_limit 自动退避重试, 工具失败自动回退, 保证任务可靠性",
  },
  {
    icon: Image,
    color: "from-emerald-500 to-teal-500",
    title: "Vision 视觉理解",
    desc: "基于 GPT-4o Vision 的图片问答, 支持 URL 和 Base64 图片输入, 多模态交互更自然",
  },
  {
    icon: MessageSquare,
    color: "from-blue-500 to-cyan-500",
    title: "流式 SSE 响应",
    desc: "打字机效果实时显示, 支持随时中断, 流式 Token 统计透明可见",
  },
  {
    icon: Shield,
    color: "from-rose-500 to-red-500",
    title: "配额 & 权限体系",
    desc: "基于角色的月度配额（Guest/User/VIP）, DB 层强制约束, 管理员可动态配置",
  },
  {
    icon: BarChart3,
    color: "from-teal-500 to-cyan-500",
    title: "数据分析后台",
    desc: "30 天趋势图、用户排行、配额报表、完整审计日志, 为运营决策提供依据",
  },
];

// ---- 数据指标 ----
const stats = [
  { value: "10,000+", label: "企业用户" },
  { value: "99.9%", label: "服务可用性" },
  { value: "100M+", label: "月调用次数" },
  { value: "< 200ms", label: "平均响应延迟" },
];

// ---- 应用场景 ----
const scenarios = [
  { icon: Workflow, title: "智能客服", desc: "7x24 自动问答, 降低 80% 人工成本" },
  { icon: Database, title: "数据分析", desc: "自然语言查询数据库, 生成可视化报表" },
  { icon: Globe, title: "内容生成", desc: "批量生成营销文案, 支持多语言翻译" },
  { icon: Cpu, title: "流程自动化", desc: "复杂任务自动编排, 减少人工干预" },
];

// ---- 使用步骤 ----
const steps = [
  { num: "01", title: "注册账号", desc: "输入邮箱和密码即可注册, 无需信用卡, 即刻体验完整功能" },
  { num: "02", title: "开始对话", desc: "打开 Agent 界面, 输入问题或上传图片, AI 即时响应, 支持流式交互" },
  { num: "03", title: "调用工具", desc: "Agent 自动识别问题类型, 调用搜索、翻译等工具, 完成复杂任务" },
];

// ---- 用户评价 ----
const testimonials = [
  {
    quote: "TRAI 的工具调用能力远超预期, 我们用它替代了内部 80% 的重复查询工作, 效率提升显著。",
    name: "张明", role: "CTO", company: "某科技公司", avatar: "ZM",
    color: "from-blue-600 to-blue-500",
  },
  {
    quote: "流式响应加上随时中断的设计非常贴心, 配额体系也清晰透明, 用户体验做得很好。",
    name: "李华", role: "产品经理", company: "某 SaaS 创业公司", avatar: "LH",
    color: "from-amber-500 to-orange-500",
  },
  {
    quote: "从注册到接入 API 不到 10 分钟, 文档清晰, SDK 友好, 集成成本极低。",
    name: "王芳", role: "全栈工程师", company: "某数字化企业", avatar: "WF",
    color: "from-emerald-500 to-teal-500",
  },
];

// ---- 常见问题 ----
const faqs = [
  { q: "如何申请 VIP 账号?", a: "登录后在个人中心点击「升级 VIP」, 支持支付宝和微信支付, 支付成功后即时生效。" },
  { q: "配额用完了怎么办?", a: "配额按自然月重置, 或升级为 VIP 获得无限配额。配额超限后 API 直接返回错误, 禁止降级。" },
  { q: "支持私有化部署吗?", a: "支持, 企业版提供完整的私有化部署方案, 可接入内网环境, 支持定制模型接入。" },
];

// ---- Intersection Observer Hook ----
function useInView(threshold = 0.15) {
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
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ---- 滚动入场动画 ----
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();
  const delayClass =
    delay === 0 ? "delay-0" :
    delay === 100 ? "delay-100" :
    delay === 200 ? "delay-200" :
    delay === 300 ? "delay-300" :
    delay === 350 ? "delay-[350ms]" :
    delay === 400 ? "delay-400" :
    delay === 500 ? "delay-500" :
    delay === 600 ? "delay-600" :
    delay === 650 ? "delay-[650ms]" :
    delay === 700 ? "delay-700" :
    delay === 800 ? "delay-800" :
    delay === 900 ? "delay-900" :
    delay === 1000 ? "delay-1000" :
    "";
  return (
    <div
      ref={ref}
      className={[
        className,
        "transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
        delayClass,
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7",
      ].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />

      {/* ===== Hero: 浅色干净背景 ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center pt-16">
        {/* 浅色背景 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#080c1a] dark:via-[#0d1220] dark:to-[#080c1a]" />
        <div className="absolute inset-0 hero-glow" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] hero-glow-warm opacity-60" />
        {/* 微妙网格 */}
        <div className="absolute inset-0 opacity-[0.04] hero_grid" />

        <div className="container mx-auto px-4 pb-20 relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 text-sm font-medium mb-8 animate-[fadeIn_0.5s_cubic-bezier(0,0,0.2,1)_0.1s_both]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Agent Platform &middot; v2.0 发布
          </div>

          {/* 大标题: Google 风格居中 */}
          <h1
            className="text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-slate-900 dark:text-white animate-[slideUpFade_0.6s_cubic-bezier(0,0,0.2,1)_0.2s_both]"
          >
            AI Agent
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              替你完成工作
            </span>
          </h1>

          <p
            className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10 animate-[slideUpFade_0.6s_cubic-bezier(0,0,0.2,1)_0.35s_both]"
          >
            企业级 AI 助手平台, 支持多工具调用、自动纠错、VLM 视觉理解与流式交互。
            开箱即用, 配额清晰, 企业级安全。
          </p>

          {/* CTA 按钮 */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-[slideUpFade_0.6s_cubic-bezier(0,0,0.2,1)_0.5s_both]"
          >
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 gap-2 shadow-lg shadow-blue-500/20 text-base font-semibold rounded-full btn-press transition-all duration-300">
                立即免费试用
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="h-12 px-8 gap-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 text-base rounded-full btn-press transition-all duration-300">
                查看功能
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div
            className="flex items-center justify-center gap-6 text-sm text-slate-400 dark:text-slate-500 animate-[slideUpFade_0.6s_cubic-bezier(0,0,0.2,1)_0.65s_both]"
          >
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>4.9 / 5</span>
            </div>
            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <span>10,000+ 企业用户</span>
            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <span>99.9% SLA</span>
          </div>

          {/* 产品 Mockup */}
          <div className="max-w-2xl mx-auto mt-16 animate-[slideUpFade_0.7s_cubic-bezier(0,0,0.2,1)_0.8s_both]">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-white dark:bg-[#0d1117] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-2xl shadow-blue-500/10 dark:shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#080818]/80">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                    <div className="w-3 h-3 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-slate-400">TRAI Agent</span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-[#161b22] rounded-2xl rounded-tl-md px-4 py-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-sm">
                      你好! 我是 TRAI Agent。今天天气如何? 我需要为明天的户外活动做准备。
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-blue-600 rounded-2xl rounded-tr-md px-4 py-3 text-sm text-white max-w-sm shadow-sm">
                      明天北京多云转晴, 26~34&deg;C, 适合户外活动。建议上午出行, 午后注意防晒补水。
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-[#161b22] rounded-2xl rounded-tl-md px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
                        <span className="text-green-600 dark:text-green-400 text-xs font-medium">工具调用: weather</span>
                      </div>
                      已为您查询天气预报并生成出行建议。
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-blue-500/90 rounded-2xl rounded-tr-md px-4 py-3 text-sm text-white/90 max-w-sm shadow-sm">
                      再帮我翻译: The future belongs to those who believe in the beauty of their dreams.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-[#161b22] rounded-2xl rounded-tl-md px-4 py-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
                        <span className="text-green-600 dark:text-green-400 text-xs font-medium">工具调用: translate</span>
                      </div>
                      未来属于那些相信梦想之美的人。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 信任背书 Marquee ===== */}
      <section className="py-10 border-y border-slate-200 dark:border-slate-800/50 bg-white dark:bg-[#080c1a] overflow-hidden">
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mb-6 tracking-widest uppercase">已服务企业</p>
        <div className="relative">
          <div className="flex animate-marquee gap-12 md:gap-20 whitespace-nowrap">
            {[...trustedBy, ...trustedBy].map((name, i) => (
              <span key={i} className="text-base md:text-lg font-semibold text-slate-300 dark:text-slate-600 tracking-wide">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 核心功能: 白色卡片 ===== */}
      <section className="py-28 bg-white dark:bg-[#080c1a]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-medium mb-4">核心功能</div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                为企业级 AI 应用打造的完整能力
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                从智能 Agent 到配额管控, 从视觉理解到数据分析, TRAI 提供端到端的产品能力
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <Card className="group bg-white dark:bg-[#0d1220] border-slate-200 dark:border-slate-800/60 shadow-sm dark:shadow-none card-hover">
                  <CardContent className="p-6">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <f.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 数据指标: 蓝色渐变背景 ===== */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 100}>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                  <div className="text-sm text-blue-200">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 应用场景: 浅灰背景 ===== */}
      <section className="py-28 bg-slate-50 dark:bg-[#080c1a]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">覆盖核心业务场景</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">TRAI 已深度集成到各行业的关键业务流程中, 持续创造价值</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {scenarios.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <Card className="bg-white dark:bg-[#0d1220] border-slate-200 dark:border-slate-800/60 p-6 card-hover shadow-sm dark:shadow-none">
                  <CardContent className="p-0 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                      <s.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{s.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 技术架构 ===== */}
      <section className="py-28 bg-white dark:bg-[#0d1220]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-medium mb-4">技术架构</div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                  现代化技术栈<br /><span className="text-blue-600 dark:text-blue-400">稳定可靠</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                  前端基于 Next.js 15 App Router, 后端遵循 DDD 五层架构。支持 OpenAI、ModelScope、智谱等多模型接入, Redis 缓存加速, SSE 流式输出。
                </p>
                <div className="space-y-3">
                  {[
                    "Next.js 15 + Tailwind CSS + shadcn/ui",
                    "Python FastAPI + DDD 五层架构",
                    "PostgreSQL + Redis + S3 对象存储",
                    "OpenAI / ModelScope / 智谱 多模型支持",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="bg-slate-50 dark:bg-[#080c1a] rounded-2xl border border-slate-200 dark:border-slate-800/60 p-6 space-y-3">
                {[
                  { label: "前端", icon: "🖥", desc: "Next.js 15 + App Router", color: "border-blue-200 dark:border-blue-500/30", bg: "bg-blue-50 dark:bg-blue-500/5", dot: "bg-blue-500 dark:bg-blue-400" },
                  { label: "API 网关", icon: "⚡", desc: "FastAPI + SSE 流式", color: "border-cyan-200 dark:border-cyan-500/30", bg: "bg-cyan-50 dark:bg-cyan-500/5", dot: "bg-cyan-500 dark:bg-cyan-400" },
                  { label: "AI 引擎", icon: "🤖", desc: "多模型 + 工具治理", color: "border-amber-200 dark:border-amber-500/30", bg: "bg-amber-50 dark:bg-amber-500/5", dot: "bg-amber-500 dark:bg-amber-400" },
                  { label: "数据层", icon: "💾", desc: "PostgreSQL + Redis + S3", color: "border-emerald-200 dark:border-emerald-500/30", bg: "bg-emerald-50 dark:bg-emerald-500/5", dot: "bg-emerald-500 dark:bg-emerald-400" },
                ].map((layer) => (
                  <div key={layer.label} className={`flex items-center gap-4 p-4 rounded-xl ${layer.bg} border ${layer.color}`}>
                    <div className="text-2xl">{layer.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{layer.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{layer.desc}</div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${layer.dot}`} />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== AI 工作流动画展示 ===== */}
      <section className="py-28 bg-gradient-to-b from-slate-50 to-white dark:from-[#080c1a] dark:to-[#0d1220]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-medium mb-4">交互演示</div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                看 AI 如何<span className="text-blue-600 dark:text-blue-400">替你工作</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                输入自然语言, Agent 自动规划、调用工具、返回结果, 全流程可视化展示
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="max-w-4xl mx-auto">
              {/* 工作流可视化容器 */}
              <div className="bg-white dark:bg-[#0d1220] rounded-2xl border border-slate-200 dark:border-slate-800/60 shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-white/30" />
                      <div className="w-3 h-3 rounded-full bg-white/30" />
                      <div className="w-3 h-3 rounded-full bg-white/40" />
                    </div>
                    <span className="text-white/80 text-sm font-medium">TRAI Agent 工作流</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
                    <span className="text-white/80 text-xs">实时演示</span>
                  </div>
                </div>

                {/* Workflow Steps - 3步动画 */}
                <div className="px-8 py-8 space-y-6">

                  {/* Step 1: 用户输入 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-[#080c1a] rounded-xl p-4 border border-slate-100 dark:border-slate-800/60">
                      <p className="text-xs text-slate-400 mb-1">用户输入</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        &ldquo;帮我查一下明天北京的天气, 然后翻译成日语并发给我&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* 连接线 */}
                  <div className="ml-4 border-l-2 border-dashed border-slate-200 dark:border-slate-700 h-5" />

                  {/* Step 2: AI 规划 + 工具调用 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">2</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      {/* 规划标签 */}
                      <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 border border-amber-100 dark:border-amber-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse-dot" />
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Agent 规划中...</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {["天气查询", "语言翻译"].map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs rounded-full font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 工具调用动画 */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
                          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shadow-sm">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-700 dark:text-green-300">天气查询</p>
                            <p className="text-xs text-green-500 dark:text-green-400">北京 &middot; 明天</p>
                          </div>
                          <svg className="w-4 h-4 text-green-500 ml-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h13M5 5v13M5 5l6 6m4-6h6" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">语言翻译</p>
                            <p className="text-xs text-blue-500 dark:text-blue-400">中文 → 日语</p>
                          </div>
                          <svg className="w-4 h-4 text-blue-500 ml-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 连接线 */}
                  <div className="ml-4 border-l-2 border-dashed border-slate-200 dark:border-slate-700 h-5" />

                  {/* Step 3: 汇总结果 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">3</span>
                    </div>
                    <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/20 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse-dot" />
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">任务完成</span>
                      </div>
                      <div className="bg-white/60 dark:bg-[#080c1a]/60 rounded-lg p-3 space-y-2">
                        <div>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">北京天气预报（4月10日）</p>
                          <p className="text-sm text-slate-700 dark:text-slate-200">多云转晴, 18~26&deg;C, 东南风 3-4 级, 适合出行</p>
                        </div>
                        <div className="border-t border-emerald-100 dark:border-emerald-500/20 pt-2">
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">日语翻译</p>
                          <p className="text-sm text-slate-700 dark:text-slate-200 font-ja">明日の北京の天気予報: 晴れ、時々曇り、気温18〜26度、 南東の風3〜4級、外出に適しています。</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* 底部提示 */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-dot" />
                <p className="text-sm text-slate-400 dark:text-slate-500">以上为交互演示, 实际效果因网络环境略有差异</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 使用步骤 ===== */}
      <section className="py-28 bg-slate-50 dark:bg-[#080c1a]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">3 步开始使用</h2>
              <p className="text-slate-500 dark:text-slate-400">从注册到完成第一个任务, 不超过 5 分钟</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-px bg-gradient-to-r from-blue-400/30 via-blue-500/30 to-blue-400/30 dark:from-blue-400/20 dark:via-blue-400/20 dark:to-blue-400/20" />
            {steps.map((s, i) => (
              <Reveal key={s.num} delay={i * 100}>
                <div className="text-center relative">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-[#0d1220] border border-slate-200 dark:border-slate-800/60 shadow-sm dark:shadow-none mb-6">
                    <span className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">{s.num}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 用户评价 ===== */}
      <section className="py-28 bg-white dark:bg-[#0d1220]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">用户怎么说</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <Card className="bg-white dark:bg-[#080c1a] border-slate-200 dark:border-slate-800/60 p-6 shadow-sm dark:shadow-none">
                  <CardContent className="p-0 space-y-4">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-medium`}>
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{t.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">{t.role} &middot; {t.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 常见问题 ===== */}
      <section className="py-28 bg-slate-50 dark:bg-[#080c1a]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">常见问题</h2>
            </div>
          </Reveal>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={faq.q} delay={i * 80}>
                <Card className="bg-white dark:bg-[#0d1220] border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm dark:shadow-none">
                  <button
                    className="w-full text-left p-5 flex items-center justify-between gap-4"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{faq.q}</span>
                    <ChevronRight className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-90" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-4">
                      {faq.a}
                    </div>
                  )}
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA 底部: 蓝色渐变 ===== */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="container mx-auto px-4 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">准备好开始了吗?</h2>
            <p className="text-blue-100 text-lg max-w-lg mx-auto mb-10">
              注册即可获得免费配额, 体验完整 Agent 功能。无需信用卡, 立即试用。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="h-12 px-10 gap-2 bg-white text-blue-700 hover:bg-blue-50 shadow-xl text-base font-semibold rounded-full btn-press transition-all duration-300">
                  免费开始
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="h-12 px-10 gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 text-base rounded-full btn-press transition-all duration-300">
                  联系我们
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-slate-900 dark:bg-[#080c1a] border-t border-slate-200 dark:border-slate-800/50">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">TRAI</span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
                新一代 AI Agent 平台, 为企业提供安全、可靠、可扩展的智能助手解决方案。
              </p>
            </div>
            {([
              { title: "产品", links: [
                { label: "功能介绍", href: "/features" },
                { label: "定价方案", href: "/pricing" },
                { label: "更新日志", href: "/changelog" },
                { label: "路线图", href: "/roadmap" },
              ]},
              { title: "开发者", links: [
                { label: "快速开始", href: "/docs/quickstart" },
                { label: "API 参考", href: "/docs/api" },
                { label: "常见问题", href: "/docs/faq" },
                { label: "SDK 下载", href: "/docs/sdk" },
              ]},
              { title: "公司", links: [
                { label: "关于我们", href: "/about" },
                { label: "加入我们", href: "/careers" },
                { label: "联系我们", href: "/contact" },
                { label: "隐私政策", href: "/privacy" },
              ]},
            ] as const).map(({ title, links }) => (
              <div key={title}>
                <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} TRAI. 保留所有权利.</p>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">隐私政策</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">服务条款</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
