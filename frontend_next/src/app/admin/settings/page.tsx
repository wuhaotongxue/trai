/**
 * page.tsx
 * 系统设置页面
 */

"use client";

import { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Database,
  Key,
  Globe,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tab = "general" | "security" | "notifications" | "advanced";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: "general" as Tab, label: "基础配置", icon: Settings },
    { id: "security" as Tab, label: "安全设置", icon: Shield },
    { id: "notifications" as Tab, label: "通知配置", icon: Bell },
    { id: "advanced" as Tab, label: "高级设置", icon: Database },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">系统设置</h1>
        <p className="text-sm text-slate-500 mt-0.5">配置 TRAI 管理后台的各项参数</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* 基础配置 */}
      {tab === "general" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">基础配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">系统名称</Label>
                <Input className="h-9 rounded-lg" defaultValue="TRAI 管理后台" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">系统版本</Label>
                <Input className="h-9 rounded-lg" defaultValue="v2.0.0" disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">API 地址</Label>
                <Input className="h-9 rounded-lg" defaultValue="http://localhost:8000" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">环境模式</Label>
                <Input className="h-9 rounded-lg" defaultValue="development" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">时区</Label>
                <Input className="h-9 rounded-lg" defaultValue="Asia/Shanghai (UTC+8)" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">默认语言</Label>
                <Input className="h-9 rounded-lg" defaultValue="zh-CN" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={handleSave}>
                {saved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
                {saved ? "已保存" : "保存配置"}
              </Button>
              {saved && <span className="text-xs text-emerald-600">刚刚保存, 已同步至云端</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "security" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">安全设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">当前管理员密码</Label>
                <Input className="h-9 rounded-lg" type="password" defaultValue="••••••••" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">新密码</Label>
                <Input className="h-9 rounded-lg" type="password" placeholder="留空则不修改" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">会话超时（分钟）</Label>
                <Input className="h-9 rounded-lg" defaultValue="30" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">失败登录锁定次数</Label>
                <Input className="h-9 rounded-lg" defaultValue="5" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={handleSave}>
                {saved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
                {saved ? "已保存" : "保存安全设置"}
              </Button>
              {saved && <span className="text-xs text-emerald-600">刚刚保存, 已同步至云端</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "notifications" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">通知配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "用户注册通知", desc: "有新用户注册时发送邮件通知" },
              { label: "系统异常告警", desc: "服务异常时发送告警" },
              { label: "配额不足提醒", desc: "用户接近配额上限时提醒" },
              { label: "每日数据报告", desc: "每日自动发送数据报告" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-10 h-5 bg-slate-200 peer-checked:bg-blue-500 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={handleSave}>
                {saved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
                {saved ? "已保存" : "保存通知设置"}
              </Button>
              {saved && <span className="text-xs text-emerald-600">刚刚保存, 已同步至云端</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "advanced" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">高级设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">数据库连接</Label>
                <Input className="h-9 rounded-lg" defaultValue="postgresql://localhost:5432/trai" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Redis 连接</Label>
                <Input className="h-9 rounded-lg" defaultValue="redis://localhost:6379" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">OpenAI API Key</Label>
                <Input className="h-9 rounded-lg" type="password" defaultValue="sk-••••••••••••" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">日志级别</Label>
                <Input className="h-9 rounded-lg" defaultValue="INFO" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={handleSave}>
                {saved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
                {saved ? "已保存" : "保存高级配置"}
              </Button>
              {saved && <span className="text-xs text-emerald-600">刚刚保存, 已同步至云端</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}