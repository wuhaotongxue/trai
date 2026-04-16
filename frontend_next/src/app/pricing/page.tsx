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

const plans = [
  {
    name: "免费版",
    price: "¥0",
    period: "永久免费",
    desc: "适合体验用户",
    color: "from-slate-400 to-slate-500",
    badge: null,
    features: [
      "50 次 Agent 调用/月",
      "单次 10 轮对话",
      "基础 Vision 图片支持",
      "文件上传 10MB",
      "SSE 流式响应",
      "社区支持",
    ],
    cta: "立即开始",
    ctaVariant: "outline" as const,
  },
  {
    name: "Pro",
    price: "¥99",
    period: "每月",
    desc: "适合个人开发者",
    color: "from-blue-500 to-blue-600",
    badge: "最受欢迎",
    popular: true,
    features: [
      "500 次 Agent 调用/月",
      "无限对话轮次",
      "完整 Vision + 流式",
      "文件上传 100MB",
      "优先客服支持",
      "API 访问权限",
      "自定义 Agent 工具",
    ],
    cta: "立即升级",
    ctaVariant: "default" as const,
  },
  {
    name: "VIP",
    price: "¥299",
    period: "每月",
    desc: "适合企业团队",
    color: "from-amber-500 to-amber-600",
    badge: "企业首选",
    features: [
      "无限 Agent 调用",
      "无限对话轮次",
      "完整 Vision + 流式",
      "文件上传 1GB",
      "专属客户成功经理",
      "SLA 99.9% 可用性",
      "批量用户管理",
      "数据分析报告",
    ],
    cta: "联系销售",
    ctaVariant: "outline" as const,
  },
];

const faqs = [
  { q: "免费版用完了会自动升级吗? ", a: "不会。免费版额度用完当月会暂停 Agent 调用, 下月自动恢复, 不会产生额外费用。" },
  { q: "Agent 调用是什么意思? ", a: "每次你让 AI 执行一个工具（如查天气、翻译）就算一次 Agent 调用。普通聊天消息不计入。" },
  { q: "可以退款吗? ", a: "Pro 和 VIP 支持 7 天无理由退款。联系客服即可申请, 退款将在 3 个工作日内原路返回。" },
  { q: "可以开发票吗? ", a: "可以。升级后联系 support@trai.ai, 提供企业信息, 即可开具增值税普通发票或专用发票。" },
  { q: "有年度套餐吗? ", a: "有的。年度套餐享受 8 折优惠, 相当于 10 个月费用用 12 个月。联系销售获取折扣码。" },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            简单透明定价
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight">
            选择适合你的<span className="text-blue-600">方案</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            无隐藏费用, 无信用卡要求, 随时可取消。所有套餐均含完整功能体验
          </p>
        </div>
      </section>

      {/* 定价卡片 */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 transition-all ${
                  plan.popular
                    ? "border-blue-300 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500"
                    : "border-slate-200 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white bg-gradient-to-r ${plan.color}`}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className={`h-1 rounded-b-xl bg-gradient-to-r ${plan.color} mb-5`} />
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-400">/{plan.period}</span>
                </div>
                <Link href="/register">
                  <Button
                    variant={plan.ctaVariant}
                    className={`w-full h-10 mt-5 gap-2 font-semibold text-sm ${
                      plan.popular ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" : ""
                    }`}
                  >
                    {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      {f}
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
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">常见问题</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <p className="text-sm font-semibold text-slate-800 mb-2">{faq.q}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm mb-3">还有其他问题?</p>
            <Link href="/contact">
              <Button variant="outline" className="gap-2 border-slate-200">
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
