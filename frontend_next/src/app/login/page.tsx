/**
 * page.tsx
 * TRAI 登录页
 */

"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api_client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "not_bound") {
      setErrorMessage("当前企业微信未绑定账号，请先使用密码登录后绑定");
    } else if (err === "account_disabled") {
      setErrorMessage("该企业微信绑定的账号已被禁用");
    } else if (err === "auth_failed" || err === "wecom_auth_failed") {
      setErrorMessage("企业微信登录失败，请重试");
    }
  }, [searchParams]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await authApi.login({ username: email, password });
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("refresh_token", res.refresh_token);
      
      // 使用 window.location.href 强制刷新跳转，根据角色跳转到不同的后台/工作台
      if (res.user && res.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/agent";
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "登录失败";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

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
            <form onSubmit={handleLogin}>
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">欢迎回来</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  输入您的账号信息, 继续使用 TRAI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">邮箱地址或用户名</Label>
                <Input 
                  id="email" 
                  type="text" 
                  placeholder="请输入用户名或邮箱" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">密码</Label>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">忘记密码?</Link>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded border-slate-300" aria-label="记住我" title="记住我" />
                <Label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">记住我</Label>
              </div>
              
              {errorMessage && (
                <div className="text-sm text-red-500 text-center">{errorMessage}</div>
              )}

              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base font-semibold rounded-lg shadow-lg shadow-blue-500/20 mt-2"
              >
                {loading ? "正在登录..." : "登录"}
                {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
              <div className="relative flex items-center justify-center my-2">
                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />
                <span className="absolute bg-white dark:bg-[#0d1220] px-3 text-xs text-slate-400">或</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" className="w-full h-11 rounded-lg text-sm font-medium">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.523 3.952 1.464l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.478 2.543 12s4.478 10 10.002 10c3.31 0 5.954-1.193 8.033-3.152l-3.033-2.609z"/></svg>
                  Google
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-11 rounded-lg text-sm font-medium hover:text-[#3370FF] hover:border-[#3370FF]"
                  onClick={async () => {
                    try {
                      // 调用后端获取企业微信扫码登录链接
                      const res = await fetch("http://localhost:5666/api/auth/wecom/url");
                      const data = await res.json();
                      if (data && data.url) {
                        window.location.href = data.url;
                      }
                    } catch (e) {
                      setErrorMessage("获取企业微信登录链接失败");
                    }
                  }}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.996 22.46c-5.772 0-10.45-4.679-10.45-10.45S6.224 1.56 11.996 1.56c5.771 0 10.45 4.678 10.45 10.45s-4.679 10.45-10.45 10.45zm0-19.46c-4.968 0-8.988 4.02-8.988 8.988s4.02 8.989 8.988 8.989c4.968 0 8.988-4.021 8.988-8.989S16.964 3 11.996 3zm-2.85 13.568v-7.14h1.764v5.617h3.693v1.523H9.146zm2.85-8.54c-.642 0-1.162-.52-1.162-1.163 0-.641.52-1.162 1.162-1.162.641 0 1.162.521 1.162 1.162 0 .642-.52 1.163-1.162 1.163z"/>
                  </svg>
                  企业微信
                </Button>
              </div>
            </CardContent>
              <CardFooter className="text-xs text-slate-400 text-center pb-6">
                登录即表示同意 <Link href="/terms" className="underline">服务条款</Link> 和 <Link href="/privacy" className="underline">隐私政策</Link>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-[#080c1a]" />}>
      <LoginForm />
    </Suspense>
  );
}
