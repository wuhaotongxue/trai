/**
 * page.tsx
 * TRAI 登录页
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
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
          还没有账号? <Link href="/register" className="text-blue-600 hover:underline font-medium">免费注册</Link>
        </p>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl shadow-blue-500/5 border-slate-200 dark:border-slate-800/60">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">欢迎回来</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                输入您的账号信息, 继续使用 TRAI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">邮箱地址或用户名</Label>
                <Input id="email" type="text" placeholder="admin" defaultValue="admin" className="h-11 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">密码</Label>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">忘记密码?</Link>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" defaultValue="admin123" className="h-11 rounded-lg pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded border-slate-300" aria-label="记住我" title="记住我" />
                <Label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">记住我</Label>
              </div>
              <Button className="w-full h-11 text-base font-semibold rounded-lg shadow-lg shadow-blue-500/20 mt-2">
                登录
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <div className="relative flex items-center justify-center my-2">
                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />
                <span className="absolute bg-white dark:bg-[#0d1220] px-3 text-xs text-slate-400">或</span>
              </div>
              <Button variant="outline" className="w-full h-11 rounded-lg text-sm font-medium">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.523 3.952 1.464l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.478 2.543 12s4.478 10 10.002 10c3.31 0 5.954-1.193 8.033-3.152l-3.033-2.609z"/></svg>
                使用 Google 登录
              </Button>
            </CardContent>
            <CardFooter className="text-xs text-slate-400 text-center pb-6">
              登录即表示同意 <Link href="/terms" className="underline">服务条款</Link> 和 <Link href="/privacy" className="underline">隐私政策</Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
