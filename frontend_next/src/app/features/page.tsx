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

const features = [
  {
    icon: Bot,
    gradient: "from-blue-500 to-blue-600",
    title: "多工具 Agent",
    desc: "内置天气、搜索、翻译、计算器等 20+ 工具, 支持用户自定义扩展, AI 自动编排任务流程, 轻松应对复杂场景。",
    tags: ["自动编排", "工具扩展", "MCP 协议"],
  },
  {
    icon: Zap,
    gradient: "from-amber-500 to-orange-500",
    title: "智能自我纠错",
    desc: "五层错误分类器, rate_limit 自动退避重试, 工具失败自动回退, 保证任务 99.9% 可靠性, 你无需盯着。",
    tags: ["自动重试", "错误恢复", "容错机制"],
  },
  {
    icon: Image,
    gradient: "from-emerald-500 to-teal-500",
    title: "Vision 视觉理解",
    desc: "基于 GPT-4o Vision 的图片问答, 支持 URL 和 Base64 图片输入, 多模态交互更自然, 处理图片如虎添翼。",
    tags: ["图片问答", "多模态", "Base64"],
  },
  {
    icon: MessageSquare,
    gradient: "from-indigo-500 to-indigo-500",
    title: "SSE 流式响应",
    desc: "打字机效果实时呈现, Token 逐字输出, 延迟降低 60%, 用户体验流畅如飞, 不必等待漫长加载。",
    tags: ["实时流式", "打字机效果", "低延迟"],
  },
  {
    icon: Shield,
    gradient: "from-cyan-500 to-blue-500",
    title: "企业级安全",
    desc: "全链路 HTTPS 加密, JWT 身份验证, 细粒度权限控制, 敏感信息脱敏处理, 数据安全是底线。",
    tags: ["JWT 认证", "权限管理", "数据加密"],
  },
  {
    icon: Globe,
    gradient: "from-pink-500 to-rose-500",
    title: "多模型支持",
    desc: "OpenAI GPT-4 / GPT-3.5、ModelScope、智谱 GLM, 支持模型自由切换, 成本与效果自由权衡。",
    tags: ["OpenAI", "ModelScope", "智谱 GLM"],
  },
  {
    icon: Cpu,
    gradient: "from-indigo-500 to-indigo-500",
    title: "DDD 五层架构",
    desc: "后端遵循领域驱动设计, 清晰的分层结构, 业务逻辑与技术实现解耦, 代码可维护性拉满。",
    tags: ["DDD 架构", "Clean Code", "可维护"],
  },
  {
    icon: Workflow,
    gradient: "from-teal-500 to-emerald-500",
    title: "会话管理",
    desc: "多会话并行管理, 历史消息自动归档, 支持会话导出与分享, 让每次对话都有价值。",
    tags: ["历史管理", "会话导出", "多会话"],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            核心功能
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight leading-tight">
            强大能力, <br />
            <span className="text-blue-600">为你的 AI 应用而生</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-8">
            TRAI 集成业界领先的大模型能力与工程化设计, 提供从对话到工具调用、从视觉理解到流式输出的完整 AI 解决方案
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="h-11 px-8 rounded-full text-base font-semibold shadow-lg shadow-blue-500/20 gap-2">
                立即免费体验 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-11 px-8 rounded-full text-base border-slate-200 text-slate-600 gap-2">
                咨询销售 <ArrowRight className="h-4 w-4" />
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
                key={f.title}
                className="group p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-md mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{f.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {f.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
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
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">准备好开始了吗?</h2>
          <p className="text-blue-100 mb-8">无需信用卡, 立即开始你的 AI 之旅</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="h-11 px-8 rounded-full text-base font-semibold bg-white text-blue-600 shadow-lg gap-2 hover:bg-blue-50">
                免费使用 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-11 px-8 rounded-full text-base font-semibold bg-white/10 text-white border-white/30 gap-2 hover:bg-white/20">
                联系销售 <ArrowRight className="h-4 w-4" />
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
