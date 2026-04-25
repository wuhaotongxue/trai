/**
 * page.tsx
 * 消息通知页面
 */

"use client";

import { useState, useEffect } from "react";
import { Edit2, Eye, Plus, Send, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";
const mockNotifications = [
  { id: 1, title: "系统将于 4 月 12 日维护", time: "2026-04-09 10:00", sent: 1284, read: 891, status: "sent" },
  { id: 2, title: "新功能上线: Agent 工具市场", time: "2026-04-07 14:30", sent: 2156, read: 1802, status: "sent" },
  { id: 3, title: "积分系统升级公告", time: "2026-04-05 09:15", sent: 980, read: 654, status: "draft" },
  { id: 4, title: "VIP 用户专属福利通知", time: "2026-04-03 16:00", sent: 312, read: 298, status: "sent" },
];

export default function NotificationsPage() {
  const { translate, loadNamespace } = useAdminI18n();
  const { toast } = useAdminToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 初始化时加载翻译
  useEffect(() => {
    void loadNamespace('admin');
  }, []);

  const handleSendAll = () => {
    if (!title.trim() || !content.trim()) {
      toast({ message: translate("admin.notifications.fill_required"), variant: "error" });
      return;
    }
    toast({ message: translate("admin.notifications.send_success"), variant: "success" });
    setTitle("");
    setContent("");
  };

  const handleSaveDraft = () => {
    if (!title.trim()) {
      toast({ message: translate("admin.notifications.fill_title"), variant: "error" });
      return;
    }
    toast({ message: translate("admin.notifications.draft_saved"), variant: "success" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{translate("admin.notifications.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{translate("admin.notifications.subtitle")}</p>
        </div>
        <Button
          size="sm"
          className="h-9 gap-2 text-sm shadow-sm"
          onClick={() => toast({ message: translate("admin.notifications.coming_soon"), variant: "info" })}
        >
          <Plus className="h-3.5 w-3.5" />
          {translate("admin.notifications.new_btn")}
        </Button>
      </div>

      {/* 发送通知表单 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">{translate("admin.notifications.quick_send")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground/80">{translate("admin.notifications.send_title")}</Label>
            <Input
              className="h-9 rounded-lg"
              placeholder={translate("admin.notifications.send_title_placeholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground/80">{translate("admin.notifications.send_content")}</Label>
            <textarea
              className="w-full min-h-[100px] rounded-lg border border-border p-3 text-sm resize-none bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500/60 transition-all"
              placeholder={translate("admin.notifications.send_content_placeholder")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={handleSendAll}>
              <Send className="h-3.5 w-3.5" />
              {translate("admin.notifications.send_all")}
            </Button>
            <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={handleSaveDraft}>
              {translate("admin.notifications.save_draft")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 发送历史 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">{translate("admin.notifications.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.notifications.th_title")}</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.notifications.th_time")}</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.notifications.th_sent")}</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.notifications.th_read")}</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.notifications.th_status")}</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{translate("admin.notifications.th_action")}</th>
                </tr>
              </thead>
              <tbody>
                {mockNotifications.map((n) => (
                  <tr key={n.id} className="border-b border-border/40 hover:bg-muted/25 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-sm">{n.title}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground text-xs">{n.time}</td>
                    <td className="px-4 py-3 text-right text-foreground/80">{n.sent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-foreground/80">{n.read.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        n.status === "sent" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted/40 text-muted-foreground"
                      }`}>
                        {translate(n.status === "sent" ? "admin.notifications.status_sent" : "admin.notifications.status_draft")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={translate("admin.notifications.action_view")}
                          title={translate("admin.notifications.action_view")}
                          className="p-1.5 rounded-lg hover:bg-blue-500/15 text-muted-foreground hover:text-blue-400 transition-colors"
                          onClick={() => toast({ message: translate("admin.notifications.coming_soon"), variant: "info" })}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={translate("admin.notifications.action_edit")}
                          title={translate("admin.notifications.action_edit")}
                          className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => toast({ message: translate("admin.notifications.coming_soon"), variant: "info" })}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={translate("admin.notifications.action_delete")}
                          title={translate("admin.notifications.action_delete")}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors"
                          onClick={() => toast({ message: translate("admin.notifications.coming_soon"), variant: "info" })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
