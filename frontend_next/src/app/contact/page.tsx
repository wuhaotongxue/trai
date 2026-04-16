/**
 * page.tsx
 * TRAI 联系我们页
 */

"use client";

import { useState } from "react";
import { Send, Mail, Phone, MapPin, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            <Phone className="h-4 w-4" />
            联系我们
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight">
            期待与你<span className="text-blue-600">交流</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            无论是售前咨询、技术支持还是商务合作, 我们都会在 24 小时内回复你
          </p>
        </div>
      </section>

      {/* 联系表单 + 信息 */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* 左侧: 联系信息 */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-5">联系方式</h2>
                <div className="space-y-4">
                  {[
                    { icon: Mail, label: "邮箱", value: "contact@trai.ai", color: "bg-blue-50 text-blue-600" },
                    { icon: Phone, label: "电话", value: "400-888-8888（工作日 9:00-18:00）", color: "bg-emerald-50 text-emerald-600" },
                    { icon: MapPin, label: "地址", value: "北京市海淀区中关村大街 1 号", color: "bg-amber-50 text-amber-600" },
                    { icon: Clock, label: "响应时间", value: "工作日 24 小时内必回", color: "bg-indigo-50 text-indigo-600" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color.split(" ")[0]}`}>
                        <item.icon className={`h-4 w-4 ${item.color.split(" ")[1]}`} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                        <p className="text-sm text-slate-700 font-medium">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-sm font-semibold text-slate-800 mb-2">快速咨询</p>
                <p className="text-xs text-slate-500 leading-relaxed">企业客户优先享受专属服务, 请留下公司邮箱我们会优先处理你的需求</p>
              </div>
            </div>

            {/* 右侧: 表单 */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-5">发送消息</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">姓名 *</Label>
                      <Input className="h-10 rounded-lg" placeholder="请输入你的姓名" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">邮箱 *</Label>
                      <Input className="h-10 rounded-lg" type="email" placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">公司（选填）</Label>
                    <Input className="h-10 rounded-lg" placeholder="你的公司名称" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">咨询类型</Label>
                    <div className="flex flex-wrap gap-2">
                      {["售前咨询", "技术支持", "商务合作", "企业采购", "渠道代理", "其他"].map((type) => (
                        <button
                          key={type}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">留言内容 *</Label>
                    <textarea
                      className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                      placeholder="请详细描述你的需求, 我们会认真对待每一条消息..."
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    className="h-10 px-6 font-semibold rounded-lg shadow-md shadow-blue-500/20 gap-2 w-full md:w-auto"
                  >
                    {sent ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Send className="h-4 w-4" />}
                    {sent ? "消息已发送, 我们会尽快联系你" : "发送消息"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
      <Footer />
    </>
  );
}
