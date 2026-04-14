/**
 * page.tsx
 * Cookie 政策页面
 */

"use client";

import Link from "next/link";
import { ArrowLeft, Cookie, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";

export default function CookiesPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-amber-100 hover:text-white transition-colors text-sm flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> 返回官网
            </Link>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
            <Cookie className="h-4 w-4" />
            Cookie 使用说明
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Cookie 政策</h1>
          <p className="text-amber-100">了解 TRAI 如何使用 Cookie 提升你的体验</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div className="prose max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">什么是 Cookie? </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>Cookie 是由浏览器存储在设备上的小型文本文件, 用于记住你的偏好设置、登录状态和使用习惯。TRAI 使用 Cookie 来确保网站正常运行并提供更好的体验。</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              我们使用的 Cookie 类型
            </h2>
            <div className="space-y-4">
              {[
                {
                  name: "必要 Cookie",
                  desc: "网站正常运行所必需, 无法关闭。如登录状态、安全验证、会话管理。",
                  example: "session_id, auth_token, csrf_token",
                  safe: true,
                },
                {
                  name: "功能 Cookie",
                  desc: "记住你的偏好设置, 如语言选择、主题设置、显示密度等。",
                  example: "lang=zh-CN, theme=light, density=comfortable",
                  safe: true,
                },
                {
                  name: "分析 Cookie",
                  desc: "帮助我们了解网站访问量、最受欢迎的功能和使用路径, 用于持续改进产品。",
                  example: "_ga, _gid, _gat",
                  safe: false,
                },
                {
                  name: "营销 Cookie",
                  desc: "用于个性化推荐和广告投放（TRAI 暂不使用第三方营销 Cookie）。",
                  example: "—",
                  safe: true,
                },
              ].map((c) => (
                <div key={c.name} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-800">{c.name}</h3>
                    {c.safe && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">无害</span>}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{c.desc}</p>
                  <p className="text-xs text-slate-400 font-mono">例如: {c.example}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              如何管理 Cookie
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>你有以下方式管理 Cookie: </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li><strong>浏览器设置: </strong>大多数浏览器允许你阻止或删除 Cookie, 具体方法请查看浏览器帮助文档</li>
                <li><strong>清除数据: </strong>可在浏览器设置中清除所有 Cookie, 这将退出所有网站的登录状态</li>
                <li><strong>隐私模式: </strong>使用无痕/隐私模式浏览时, Cookie 不会被保存</li>
                <li><strong>TRAI 设置: </strong>部分偏好设置可在账号设置中直接修改</li>
              </ul>
              <p className="mt-3 text-amber-600">注意: 禁用必要 Cookie 将导致网站无法正常登录和使用。</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">第三方 Cookie</h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>TRAI 可能使用以下第三方服务, 它们会设置自己的 Cookie: </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li><strong>OpenAI / ModelScope: </strong>AI 模型服务提供商, 用于对话处理</li>
                <li><strong>Vercel / 云服务: </strong>网站托管与 CDN 服务</li>
                <li><strong>支付服务: </strong>如 Stripe / 支付宝（仅在购买时使用）</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">更新说明</h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>我们会定期审查并更新本政策。如有重大变更, 将在 TRAI 官网首页以通知形式告知。</p>
              <p>问题或建议请联系: <a href="mailto:privacy@trai.ai" className="text-blue-600 hover:underline">privacy@trai.ai</a></p>
            </div>
          </section>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/privacy"><Button variant="outline" className="gap-2 border-slate-200 text-slate-600">隐私政策</Button></Link>
            <Link href="/terms"><Button variant="outline" className="gap-2 border-slate-200 text-slate-600">服务条款</Button></Link>
            <Link href="/contact"><Button variant="outline" className="gap-2 border-slate-200 text-slate-600">联系我们</Button></Link>
          </div>
        </div>
      </div>
    </div>
      <Footer />
    </>
  );
}
