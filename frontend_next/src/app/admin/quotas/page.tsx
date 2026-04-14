/**
 * page.tsx
 * 配额配置页面
 */

"use client";

import { useState } from "react";
import { CheckCircle2, Cpu, Edit2, Plus, Star, Trash2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const plans = [
  {
    name: "免费版",
    color: "from-slate-400 to-slate-500",
    bg: "bg-slate-50",
    text: "text-muted-foreground",
    price: "¥0",
    desc: "适合体验用户",
    features: ["50 次 Agent 调用/月", "单次 10 轮对话", "基础 Vision 支持", "文件上传 10MB"],
    limits: { agent_calls: 50, sessions: 20, messages_per_session: 10, upload_size: 10, image_gen: 5 },
  },
  {
    name: "Pro",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-400",
    price: "¥99/月",
    desc: "适合个人开发者",
    popular: true,
    features: ["500 次 Agent 调用/月", "无限对话轮次", "完整 Vision + 流式", "文件上传 100MB", "优先客服支持"],
    limits: { agent_calls: 500, sessions: -1, messages_per_session: -1, upload_size: 100, image_gen: 50 },
  },
  {
    name: "VIP",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    text: "text-amber-400",
    price: "¥299/月",
    desc: "适合企业团队",
    features: ["无限 Agent 调用", "无限对话轮次", "完整 Vision + 流式", "文件上传 1GB", "专属客户成功经理", "SLA 99.9%"],
    limits: { agent_calls: -1, sessions: -1, messages_per_session: -1, upload_size: 1024, image_gen: 200 },
  },
];

export default function QuotasPage() {
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState({ agent_calls: "50", sessions: "20", messages: "10" });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">配额配置</h1>
        <p className="text-sm text-muted-foreground mt-0.5">管理各套餐的调用额度与服务限制</p>
      </div>

      {/* 套餐卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`border-0 shadow-sm overflow-hidden ${plan.popular ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
          >
            <div className={`h-1.5 bg-gradient-to-r ${plan.color}`} />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                </div>
                {plan.popular && (
                  <span className="text-xs bg-blue-500/15 text-blue-400 font-medium px-2 py-0.5 rounded-full">热门</span>
                )}
              </div>
              <p className={`text-lg font-bold mt-1 ${plan.text}`}>{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-foreground/80">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
              <Button size="sm" className="w-full h-9 mt-2 text-sm gap-2" variant={plan.popular ? "default" : "outline"}>
                <Edit2 className="h-3.5 w-3.5" />
                编辑配额
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快速配置区 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">快速配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">修改默认全局配额限制, 影响所有未自定义的用户</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground/80">Agent 调用上限</Label>
              <Input className="h-9 rounded-lg" defaultValue="50" />
              <p className="text-xs text-muted-foreground">次/用户/月</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground/80">每日会话上限</Label>
              <Input className="h-9 rounded-lg" defaultValue="20" />
              <p className="text-xs text-muted-foreground">-1 表示不限制</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground/80">单会话消息数</Label>
              <Input className="h-9 rounded-lg" defaultValue="10" />
              <p className="text-xs text-muted-foreground">轮次限制</p>
            </div>
          </div>
          <Button size="sm" className="h-9 gap-2 text-sm shadow-sm">保存全局配置</Button>
        </CardContent>
      </Card>
    </div>
  );
}
