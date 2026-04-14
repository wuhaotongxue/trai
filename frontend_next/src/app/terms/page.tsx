/**
 * page.tsx
 * 服务条款页面
 */

"use client";

import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> 返回官网
            </Link>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium mb-4">
            <FileText className="h-4 w-4" />
            法律声明
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">服务条款</h1>
          <p className="text-slate-300">最后更新: 2026 年 4 月 10 日</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div className="prose max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">一、服务说明</h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>欢迎使用 TRAI（以下简称"本服务"）。在使用本服务前, 请仔细阅读以下服务条款。你访问或使用本服务, 即表示你同意受本条款约束。</p>
              <p>TRAI 提供基于大模型的 AI 对话与 Agent 执行服务, 包括但不限于: 多轮对话、工具调用、图片理解、流式响应等功能。本服务会持续更新, 具体功能以官网公示为准。</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">二、账户注册</h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <ul className="space-y-2 pl-4 list-disc">
                <li>你须保证注册信息真实、准确、完整</li>
                <li>账户仅限本人使用, 禁止转让、出借或共享</li>
                <li>你须对账户下所有活动负全部责任</li>
                <li>我们有权因虚假信息或违规使用而冻结账户</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              三、使用规范（禁止行为）
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>使用本服务时, 严禁以下行为: </p>
              <ul className="space-y-2 pl-4 list-disc">
                <li>生成或传播违法、有害、欺诈、骚扰内容</li>
                <li>侵犯他人知识产权、隐私权或肖像权</li>
                <li>尝试破解、逆向工程或滥用系统漏洞</li>
                <li>大规模商业转售或未经授权的商业使用</li>
                <li>用于政治宣传、宗教极端或恐怖主义相关内容</li>
                <li>绕过安全机制或超出套餐额度的滥用行为</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              四、Agent 调用与配额
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <ul className="space-y-2 pl-4 list-disc">
                <li>各套餐 Agent 调用限额以购买时页面公示为准</li>
                <li>额度按自然月统计, 月末清零, 不跨月累计</li>
                <li>超额使用将被暂停服务直至下月重置或升级套餐</li>
                <li>滥用系统资源导致他人体验受损者, 管理员有权限制调用频率</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              五、免责声明
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <ul className="space-y-2 pl-4 list-disc">
                <li>AI 生成内容仅供参考, 不构成专业建议（医疗、法律、金融等）, 由此产生的后果由用户自行承担</li>
                <li>因不可抗力（自然灾害、DNS 故障、第三方服务中断等）导致的服务中断, 我们不承担责任</li>
                <li>用户因自身操作失误导致数据丢失, 我们不保证能够恢复</li>
                <li>免费版用户不享受 SLA 保障</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              六、账户终止
            </h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <ul className="space-y-2 pl-4 list-disc">
                <li>用户可随时注销账户, 注销后所有个人数据将在 30 天内删除</li>
                <li>我们有权因违规行为立即终止服务, 无需事先通知</li>
                <li>账户终止后, 你仍需承担终止前的相关义务</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">七、知识产权</h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>本服务的所有代码、界面设计、Logo、品牌名称等知识产权归 TRAI 所有, 未经授权不得复制或使用。用户在使用服务过程中输入的内容（Prompt）归用户所有, 但授权 TRAI 出于提供服务之目的进行处理。</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">八、联系我们</h2>
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>如有疑问, 请联系: <a href="mailto:legal@trai.ai" className="text-blue-600 hover:underline">legal@trai.ai</a></p>
              <p>地址: 北京市海淀区中关村大街 1 号</p>
            </div>
          </section>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-400 mb-3">阅读更多</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/privacy"><Button variant="outline" className="gap-2 border-slate-200 text-slate-600">隐私政策</Button></Link>
            <Link href="/cookies"><Button variant="outline" className="gap-2 border-slate-200 text-slate-600">Cookie 政策</Button></Link>
            <Link href="/contact"><Button variant="outline" className="gap-2 border-slate-200 text-slate-600">联系我们</Button></Link>
          </div>
        </div>
      </div>
    </div>
      <Footer />
    </>
  );
}
