/**
 * page.tsx
 * 管理员登录页
 * 独立路由, 不受 admin/(main)/layout.tsx 影响
 */

"use client";
import Cookies from "js-cookie";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Eye, EyeOff, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api_client";
import { ThemeToggle } from "@/components/website/theme_toggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:5666/api`
      : "http://localhost:5666/api");

  const handleLogin = async () => {
    if (loading) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      Cookies.set("token", res.access_token);
      Cookies.set("refresh_token", res.refresh_token);
      router.replace("/admin");
    } catch (e) {
      const message = e instanceof Error ? e.message : "登录失败";
      if (message.toLowerCase().includes("fetch")) {
        setErrorMessage(`后端接口不可达, 请确认后端已启动: ${apiBase}`);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-[#080c1a] dark:via-[#0d1220] dark:to-[#080c1a] flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="absolute -top-12 right-0">
          <ThemeToggle />
        </div>
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:shadow-blue-500/40 transition-shadow">
              <Bot className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-4">TRAI 管理后台</h1>
          <p className="text-sm text-muted-foreground mt-1">请输入管理员凭证登录系统</p>
        </div>

        <Card className="shadow-2xl shadow-blue-500/10 border-border rounded-2xl backdrop-blur-sm bg-card/90">
          <CardHeader className="space-y-1 pb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center mb-3">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">管理员登录</CardTitle>
            <CardDescription className="text-muted-foreground">
              身份验证后即可进入后台管理
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground/80">管理员账号</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入账号"
                className="h-11 rounded-xl border-border focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin();
                  }}
                  className="h-11 rounded-xl border-border focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-500 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border text-blue-600 focus:ring-blue-500" />
                <span>记住登录状态</span>
              </label>
              <button className="text-xs text-blue-500 hover:underline">忘记密码?</button>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-11 font-semibold rounded-xl shadow-lg shadow-blue-500/20 mt-2 transition-all active:scale-[0.98]"
            >
              {loading ? "正在验证身份..." : "进入后台"}
              {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
            {errorMessage && (
              <p className="text-xs text-red-600 text-center">{errorMessage}</p>
            )}
            <div className="text-center pt-1">
              <Link href="/" className="text-xs text-slate-400 hover:text-blue-500 transition-colors">
                返回 TRAI 官网
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          TRAI Admin System v2.0.0 · 仅限授权人员访问
        </p>
      </div>
    </div>
  );
}
