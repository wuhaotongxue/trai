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
    if (!email) {
      setError("请输入邮箱地址");
      return;
    }
    if (!email.includes("@")) {
      setError("请输入有效的邮箱地址");
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
              <Bot className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">找回密码</h1>
          <p className="text-sm text-slate-500 mt-1">输入你的注册邮箱，我们会发送重置链接</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-blue-500/10 p-6 backdrop-blur-sm">
          {!sent ? (
            <>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 mx-auto">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">注册邮箱</Label>
                  <Input
                    type="email"
                    placeholder="请输入你的邮箱"
                    className="h-11 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSend}
                  loading={loading}
                  className="w-full h-11 font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                >
                  {loading ? "正在发送..." : "发送重置链接"}
                </Button>

                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
                  <strong className="text-slate-700">提示：</strong>重置链接将在 30 分钟内有效。如果未收到邮件，请检查垃圾邮件文件夹。
                </div>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 mb-1">重置链接已发送！</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  我们已向 <strong className="text-slate-700">{email}</strong> 发送了一封密码重置邮件，请点击邮件中的链接完成密码重置。
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-600">
                没收到？检查垃圾邮件，或联系 <a href="mailto:support@trai.ai" className="underline">support@trai.ai</a>
              </div>
              <Button variant="outline" className="w-full h-10 rounded-xl gap-2" onClick={() => { setSent(false); setEmail(""); }}>
                <ArrowLeft className="h-4 w-4" />
                返回重新输入
              </Button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-slate-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}