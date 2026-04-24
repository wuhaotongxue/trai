/**
 * page.tsx
 * 忘记密码页面
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = () => {
    if (!email) { setError("请输入邮箱地址"); return; }
    if (!email.includes("@")) { setError("请输入有效的邮箱地址"); return; }
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-xl">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">TRAI</span>
            <span className="block text-xs text-white/60 -mt-0.5">AI Agent Platform</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              密码忘了?<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
                没关系
              </span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              输入注册邮箱，我们会在 30 分钟内发送密码重置链接到您的邮箱
            </p>
          </div>

          <div className="space-y-3">
            {[
              { step: "01", text: "输入注册邮箱地址" },
              { step: "02", text: "查收密码重置邮件" },
              { step: "03", text: "点击链接重置密码" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3.5 border border-white/10">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{item.step}</span>
                </div>
                <span className="text-sm text-white/90 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/40">
          AI Agent Platform · v2.0 · 10,000+ 企业用户
        </div>
      </div>

      {/* 右侧表单 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo - 移动端 */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">TRAI</span>
          </div>

          {sent ? (
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">重置链接已发送!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  我们已向 <span className="font-medium text-foreground">{email}</span> 发送了一封密码重置邮件，请点击邮件中的链接完成密码重置。
                </p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-sm text-blue-600 dark:text-blue-400 text-left">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>没收到? 检查垃圾邮件，或联系 <a href="mailto:support@trai.ai" className="underline">support@trai.ai</a></p>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full h-11 rounded-xl gap-2" onClick={() => { setSent(false); setEmail(""); }}>
                  <ArrowLeft className="h-4 w-4" />
                  返回重新输入
                </Button>
                <Link href="/login" className="block">
                  <Button className="w-full h-11 rounded-xl text-sm font-medium">
                    返回登录
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">找回密码</h2>
                <p className="text-sm text-muted-foreground mt-2">输入你的注册邮箱，我们会发送重置链接</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/80">注册邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入你的邮箱"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="h-12 rounded-xl border-border/60 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                  />
                  {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{error}</p>
                  )}
                </div>

                <Button
                  onClick={handleSend}
                  disabled={loading}
                  className="w-full h-12 text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      正在发送...
                    </span>
                  ) : "发送重置链接"}
                </Button>

                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
                  <strong className="text-foreground">提示:</strong> 重置链接将在 30 分钟内有效。如果未收到邮件，请检查垃圾邮件文件夹。
                </div>
              </div>
            </>
          )}

          <div className="text-center mt-6">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
