/**
 * page.tsx
 * 消息通知页面
 */

"use client";

import { useState } from "react";
import {
  Bell,
  Send,
  CheckCircle2,
  Trash2,
  Plus,
  Edit2,
  Eye,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const notifications = [
  { id: 1, title: "系统将于 4 月 12 日维护", time: "2026-04-09 10:00", sent: 1284, read: 891, status: "已发送" },
  { id: 2, title: "新功能上线：Agent 工具市场", time: "2026-04-07 14:30", sent: 2156, read: 1802, status: "已发送" },
  { id: 3, title: "积分系统升级公告", time: "2026-04-05 09:15", sent: 980, read: 654, status: "草稿" },
  { id: 4, title: "VIP 用户专属福利通知", time: "2026-04-03 16:00", sent: 312, read: 298, status: "已发送" },
];

export default function NotificationsPage() {
  const [draft, setDraft] = useState({ title: "", content: "" });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">消息通知</h1>
          <p className="text-sm text-slate-500 mt-0.5">向用户推送系统公告与运营通知</p>
        </div>
        <Button size="sm" className="h-9 gap-2 text-sm shadow-sm">
          <Plus className="h-3.5 w-3.5" />
          新建通知
        </Button>
      </div>

      {/* 发送通知表单 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">快速发送通知</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">通知标题</Label>
            <Input className="h-9 rounded-lg" placeholder="输入通知标题..." />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">通知内容</Label>
            <textarea
              className="w-full min-h-[100px] rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              placeholder="输入通知内容..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-9 gap-2 text-sm shadow-sm">
              <Send className="h-3.5 w-3.5" />
              发送给所有用户
            </Button>
            <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-slate-200">
              保存草稿
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 发送历史 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">发送历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">标题</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">发送时间</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">发送量</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">已读</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">状态</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">操作</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} className="border-b border-slate-50 hover:bg-blue-50/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 text-sm">{n.title}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">{n.time}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{n.sent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{n.read.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        n.status === "已发送" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}