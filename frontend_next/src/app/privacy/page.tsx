/**
 * page.tsx
 * 隐私政策页面
 */

"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Eye, Lock, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-blue-100 hover:text-white transition-colors text-sm flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> 返回官网
            </Link>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            隐私保护
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">隐私政策</h1>
          <p className="text-blue-100">最后更新: 2026 年 4 月 10 日</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div className="prose max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-500" />
              信息收集
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>我们高度重视你的隐私安全. 当你注册 TRAI 账号时, 我们会收集以下信息: </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>账号信息: 邮箱地址、昵称、密码（加密存储）</li>
                <li>使用数据: 对话记录、Agent 调用次数、功能使用偏好</li>
                <li>设备信息: IP 地址、浏览器类型、操作系统（用于安全分析）</li>
                <li>上传文件: 仅用于 AI 处理目的, 处理完成后自动删除</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              信息使用
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>你的信息将用于以下目的: </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>提供和改进 AI 对话服务</li>
                <li>账户安全验证与异常检测</li>
                <li>发送服务通知（如系统维护公告）</li>
                <li>生成使用统计报告（全部匿名化, 不涉及个人）</li>
                <li>客户支持与问题解答</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-500" />
              信息保护
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>我们采用企业级安全措施保护你的数据: </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>全链路 HTTPS/TLS 1.3 加密传输</li>
                <li>密码使用 bcrypt 加盐哈希存储, 永不明文</li>
                <li>JWT Token 短期失效机制</li>
                <li>数据库访问严格权限控制</li>
                <li>定期安全审计与渗透测试</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              数据保留
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>你的数据保留策略如下: </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>账户注销后 30 天内删除所有个人数据</li>
                <li>对话记录可随时手动删除, 删除后无法恢复</li>
                <li>日志数据保留 90 天后自动归档</li>
                <li>法律要求的保留期限除外</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              第三方共享
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>我们不会将你的个人信息出售给任何第三方. 以下情况除外: </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>经你明确同意的共享行为</li>
                <li>为提供服务而必须共享给 AI 模型供应商（OpenAI、ModelScope 等）</li>
                <li>法律法规要求的强制性披露</li>
                <li>企业并购或重组时的业务转移（同等隐私保护下）</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">你的权利</h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>作为 TRAI 用户, 你享有以下权利: </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>随时查看和导出你的个人数据</li>
                <li>要求更正不准确的个人信息</li>
                <li>注销账户并要求删除全部个人数据</li>
                <li>拒绝接收营销类通知（系统公告仍会正常发送）</li>
              </ul>
              <p className="mt-3">行使以上权利请联系 <a href="mailto:privacy@trai.ai" className="text-blue-600 hover:underline">privacy@trai.ai</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">政策更新</h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>我们会根据法律法规或产品变化更新本政策. 任何重大变更都会通过站内通知或邮件提前告知. 如你继续使用 TRAI, 即视为同意更新后的政策. </p>
            </div>
          </section>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-400 mb-3">还有其他问题?</p>
          <Link href="/contact">
            <Button variant="outline" className="gap-2 border-slate-200 text-slate-600">
              联系客服 <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
      <Footer />
    </>
  );
}
