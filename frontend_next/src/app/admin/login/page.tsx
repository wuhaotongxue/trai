/**
 * page.tsx
 * 管理员登录页
 * 独立路由，不受 admin/(main)/layout.tsx 影响
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Eye, EyeOff, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.href = "/admin";
    }, 800);
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:shadow-blue-500/40 transition-shadow">
              <Bot className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">TRAI 管理后台</h1>
          <p className="text-sm text-slate-500 mt-1">请输入管理员凭证登录系统</p>
        </div>

        <Card className="shadow-2xl shadow-blue-500/10 border-slate-200/80 rounded-2xl backdrop-blur-sm bg-white/80">
          <CardHeader className="space-y-1 pb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">管理员登录</CardTitle>
            <CardDescription className="text-slate-500">
              身份验证后即可进入后台管理
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-slate-700">管理员账号</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入账号"
                className="h-11 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                defaultValue="admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  className="h-11 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span>记住登录状态</span>
              </label>
              <button className="text-xs text-blue-600 hover:underline">忘记密码?</button>
            </div>
            <Button
              onClick={handleLogin}
              loading={loading}
              className="w-full h-11 font-semibold rounded-xl shadow-lg shadow-blue-500/20 mt-2 transition-all active:scale-[0.98]"
            >
              {loading ? "正在验证身份..." : "进入后台"}
              {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
            <div className="text-center pt-1">
              <Link href="/" className="text-xs text-slate-400 hover:text-blue-500 transition-colors">
                返回 TRAI 官网
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-4">
          TRAI Admin System v2.0.0 · 仅限授权人员访问
        </p>
      </div>
    </div>
  );
}