/**
 * page.tsx
 * 新增用户页面
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Mail, Shield, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const planOptions = [
  { value: "free", label: "免费版", desc: "50 次 Agent 调用/月" },
  { value: "pro", label: "Pro", desc: "500 次 Agent 调用/月" },
  { value: "vip", label: "VIP", desc: "无限 Agent 调用" },
];

export default function NewUserPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    plan: "free",
  });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "请输入用户姓名";
    if (!form.email.trim()) newErrors.email = "请输入邮箱";
    else if (!form.email.includes("@")) newErrors.email = "邮箱格式不正确";
    if (!form.password) newErrors.password = "请输入初始密码";
    else if (form.password.length < 6) newErrors.password = "密码至少 6 位";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      window.location.href = "/admin/users";
    }, 1200);
  };

  return (
    <div className="space-y-5">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          返回用户列表
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-foreground font-medium">新增用户</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">新增用户</h1>
          <p className="text-sm text-muted-foreground mt-0.5">手动添加新用户账号</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 左侧: 表单 */}
        <div className="lg:col-span-2 space-y-5">
          {/* 基本信息 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">
                    用户姓名 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className={`h-10 rounded-lg ${errors.name ? "border-red-400 focus:ring-red-100" : ""}`}
                    placeholder="请输入用户姓名"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">
                    邮箱地址 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    className={`h-10 rounded-lg ${errors.email ? "border-red-400 focus:ring-red-100" : ""}`}
                    placeholder="user@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground/80">
                  初始密码 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  className={`h-10 rounded-lg ${errors.password ? "border-red-400 focus:ring-red-100" : ""}`}
                  placeholder="至少 6 位密码"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                {errors.password ? (
                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.password}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">密码将加密存储, 首次登录后建议用户立即修改</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 套餐配置 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">套餐配置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {planOptions.map((plan) => (
                  <button
                    key={plan.value}
                    onClick={() => setForm({ ...form, plan: plan.value })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.plan === plan.value
                        ? plan.value === "free"
                          ? "border-border bg-muted/25"
                          : plan.value === "pro"
                          ? "border-blue-500/60 bg-blue-500/10 shadow-sm shadow-blue-500/10"
                          : "border-amber-500/60 bg-amber-500/10 shadow-sm shadow-amber-500/10"
                        : "border-border/60 hover:border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-bold ${
                        form.plan === plan.value
                          ? plan.value === "free" ? "text-foreground/80" : plan.value === "pro" ? "text-blue-400" : "text-amber-400"
                          : "text-muted-foreground"
                      }`}>{plan.label}</p>
                      {form.plan === plan.value && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="h-10 px-6 font-semibold rounded-lg shadow-md shadow-blue-500/20 gap-2"
              onClick={handleSave}
            >
              {saved ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-400" />正在创建...</>
              ) : (
                <><Save className="h-4 w-4" />创建用户</>
              )}
            </Button>
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="h-10 px-6 rounded-lg border-border">
                取消
              </Button>
            </Link>
            {saved && <span className="text-xs text-emerald-400">刚刚保存, 已同步至云端</span>}
          </div>
        </div>

        {/* 右侧: 说明 */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">创建说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-center font-bold">1</div>
                <p>用户创建后会收到一封激活邮件, 需点击链接激活账号</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-center font-bold">2</div>
                <p>初始密码由管理员设定, 建议用户在首次登录后立即修改</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-center font-bold">3</div>
                <p>套餐配额按自然月统计, 月末重置</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "批量导入用户", icon: UserPlus },
                { label: "邀请链接注册", icon: Mail },
                { label: "导入 CSV 用户", icon: UserPlus },
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/25 hover:bg-muted/40 text-xs font-medium text-foreground/80 transition-colors text-left"
                >
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {item.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
