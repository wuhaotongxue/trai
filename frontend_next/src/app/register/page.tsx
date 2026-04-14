/**
 * page.tsx
 * TRAI 注册页
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const benefits = [
  "免费 50 次 Agent 调用 / 月",
  "无信用卡，随时取消",
  "完整 Vision + 流式功能",
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-[#080c1a] dark:via-[#0d1220] dark:to-[#080c1a] flex flex-col">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">TRAI</span>
        </Link>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          已有账号? <Link href="/login" className="text-blue-600 hover:underline font-medium">立即登录</Link>
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl shadow-blue-500/5 border-slate-200 dark:border-slate-800/60">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">创建账号</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                开始使用 TRAI AI Agent 平台
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">昵称</Label>
                <Input id="name" type="text" placeholder="您的昵称" className="h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">邮箱地址</Label>
                <Input id="email" type="email" placeholder="your@email.com" className="h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="至少 8 位"
                    className="h-11 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 space-y-1.5">
                {benefits.map((b) => (
                  <div key={b} className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    {b}
                  </div>
                ))}
              </div>
              <Button className="w-full h-11 text-base font-semibold rounded-lg shadow-lg shadow-blue-500/20 mt-1">
                立即注册
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <div className="relative flex items-center justify-center my-1">
                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />
                <span className="absolute bg-white dark:bg-[#0d1220] px-3 text-xs text-slate-400">或</span>
              </div>
              <Button variant="outline" className="w-full h-11 rounded-lg text-sm font-medium">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.523 3.952 1.464l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.478 2.543 12s4.478 10 10.002 10c3.31 0 5.954-1.193 8.033-3.152l-3.033-2.609z"/></svg>
                使用 Google 注册
              </Button>
            </CardContent>
            <CardFooter className="text-xs text-slate-400 text-center pb-6">
              注册即表示同意 <Link href="/terms" className="underline">服务条款</Link> 和 <Link href="/privacy" className="underline">隐私政策</Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}