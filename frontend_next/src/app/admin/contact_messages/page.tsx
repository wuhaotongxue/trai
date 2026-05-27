/**
 * contact_messages/page.tsx
 * 联系我们消息管理页面
 */

"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Eye,
  CheckCircle2,
  Reply,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";
import { adminApi } from "@/lib/api_client";

interface ContactMessage {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  type: string;
  content: string;
  attachment_urls: string[];
  status: string;
  reply_note: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  presale: "bg-blue-100 text-blue-700",
  tech: "bg-purple-100 text-purple-700",
  business: "bg-green-100 text-green-700",
  purchase: "bg-cyan-100 text-cyan-700",
  channel: "bg-cyan-100 text-cyan-700",
  other: "bg-slate-100 text-slate-700",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-cyan-100 text-cyan-700",
  processed: "bg-blue-100 text-blue-700",
  replied: "bg-green-100 text-green-700",
};

export default function ContactMessagesPage() {
  const { translate, loadNamespace } = useAdminI18n();
  const { toast } = useAdminToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyNote, setReplyNote] = useState("");

  const pageSize = 20;

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getContactMessages({
        page,
        size: pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        type: typeFilter === "all" ? undefined : typeFilter,
      });
      if (response && response.items) {
        setMessages(response.items);
        setTotal(response.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch contact messages:", error);
      toast({
        title: "获取失败",
        message: "无法获取联系人消息列表",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNamespace("admin");
    void fetchMessages();
  }, [page, statusFilter, typeFilter]);

  const handleView = (message: ContactMessage) => {
    setSelectedMessage(message);
    setReplyNote(message.reply_note || "");
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (messageId: number, status: string, note?: string) => {
    try {
      await adminApi.updateContactMessageStatus(messageId, { status, reply_note: note });
      toast({ message: translate("admin.contact_messages.updated") || "状态已更新", variant: "success" });
      void fetchMessages();
      setShowDetailModal(false);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({ message: "更新状态失败", variant: "error" });
    }
  };

  const handleDelete = async (messageId: number) => {
    if (!confirm(translate("admin.contact_messages.confirm_delete") || "确认删除此消息?")) {
      return;
    }

    try {
      await adminApi.deleteContactMessage(messageId);
      toast({ message: translate("admin.contact_messages.deleted") || "消息已删除", variant: "success" });
      void fetchMessages();
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast({ message: "删除失败", variant: "error" });
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      msg.name.toLowerCase().includes(keyword) ||
      msg.content.toLowerCase().includes(keyword) ||
      (msg.email && msg.email.toLowerCase().includes(keyword)) ||
      (msg.company && msg.company.toLowerCase().includes(keyword))
    );
  });

  const getTypeLabel = (type: string) => {
    const key = `admin.contact_messages.type.${type}`;
    return translate(key) || type;
  };

  const getStatusLabel = (status: string) => {
    const key = `admin.contact_messages.filter.${status}`;
    return translate(key) || status;
  };

  return (
    <div className="space-y-5 page-enter">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-none-none bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            {translate("admin.contact_messages.title")}
          </h1>
          <p className="text-sm text-slate-900 dark:text-white font-bold mt-1">
            {translate("admin.contact_messages.subtitle")}
          </p>
        </div>
        <div className="text-sm text-slate-900 dark:text-white font-bold">
          共 {total} 条消息
        </div>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900 dark:text-white font-bold" />
                <Input
                  placeholder="搜索姓名/邮箱/公司/内容..."
                  className="pl-9"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-900 dark:text-white font-bold" />
              <select
                className="h-10 rounded-none-none border border-input bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{translate("admin.contact_messages.filter.all")}</option>
                <option value="pending">{translate("admin.contact_messages.filter.pending")}</option>
                <option value="processed">{translate("admin.contact_messages.filter.processed")}</option>
                <option value="replied">{translate("admin.contact_messages.filter.replied")}</option>
              </select>
              <select
                className="h-10 rounded-none-none border border-input bg-background px-3 text-sm"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部类型</option>
                <option value="presale">{translate("admin.contact_messages.type.presale")}</option>
                <option value="tech">{translate("admin.contact_messages.type.tech")}</option>
                <option value="business">{translate("admin.contact_messages.type.business")}</option>
                <option value="purchase">{translate("admin.contact_messages.type.purchase")}</option>
                <option value="channel">{translate("admin.contact_messages.type.channel")}</option>
                <option value="other">{translate("admin.contact_messages.type.other")}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 消息列表 */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-slate-900 dark:text-white font-bold">{translate("admin.loading") || "加载中..."}</div>
          </CardContent>
        </Card>
      ) : filteredMessages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-slate-900 dark:text-white font-bold/30 mx-auto mb-4" />
            <p className="text-slate-900 dark:text-white font-bold">{translate("admin.contact_messages.no_messages")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <Card key={message.id} className="hover:border-blue-200 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{message.name}</span>
                        <Badge className={TYPE_COLORS[message.type] || TYPE_COLORS.other}>
                          {getTypeLabel(message.type)}
                        </Badge>
                        <Badge className={STATUS_COLORS[message.status] || STATUS_COLORS.pending}>
                          {getStatusLabel(message.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-white font-bold mt-2 line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-900 dark:text-white font-bold">
                        {message.email && <span>邮箱: {message.email}</span>}
                        {message.phone && <span>电话: {message.phone}</span>}
                        {message.company && <span>公司: {message.company}</span>}
                        <span>{message.created_at}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => handleView(message)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {translate("admin.contact_messages.view")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(message.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {translate("admin.contact_messages.delete")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分页 */}
          {total > pageSize && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                上一页
              </Button>
              <span className="text-sm text-slate-900 dark:text-white font-bold">
                第 {page} / {Math.ceil(total / pageSize)} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}

      {/* 详情弹窗 */}
      {showDetailModal && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-background rounded-none-none border shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] w-full max-w-2xl max-h-[90vh] overflow-auto m-4">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{translate("admin.contact_messages.view")}</h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowDetailModal(false)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.contact_messages.name")}</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.contact_messages.type")}</p>
                  <Badge className={TYPE_COLORS[selectedMessage.type] || TYPE_COLORS.other}>
                    {getTypeLabel(selectedMessage.type)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.contact_messages.email")}</p>
                  <p className="text-sm">{selectedMessage.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.contact_messages.phone")}</p>
                  <p className="text-sm">{selectedMessage.phone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.contact_messages.company")}</p>
                  <p className="text-sm">{selectedMessage.company || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.contact_messages.content")}</p>
                <div className="mt-1 p-3 bg-muted/50 rounded-none-none">
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>
              {selectedMessage.attachment_urls && selectedMessage.attachment_urls.length > 0 && (
                <div>
                  <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.contact_messages.attachment")}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedMessage.attachment_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-none text-sm hover:bg-blue-100"
                      >
                        附件 {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.contact_messages.created_at")}</p>
                <p className="text-sm">{selectedMessage.created_at}</p>
              </div>
              {selectedMessage.ip_address && (
                <div>
                  <p className="text-xs text-slate-900 dark:text-white font-bold">IP 地址</p>
                  <p className="text-sm">{selectedMessage.ip_address}</p>
                </div>
              )}
              <div className="border-t pt-4">
                <p className="text-xs text-slate-900 dark:text-white font-bold mb-2">{translate("admin.contact_messages.reply_note")}</p>
                <textarea
                  className="w-full p-3 border rounded-none-none text-sm resize-none"
                  rows={3}
                  placeholder="输入回复备注..."
                  value={replyNote}
                  onChange={(e) => setReplyNote(e.target.value)}
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-between">
              <Badge className={STATUS_COLORS[selectedMessage.status]}>
                {translate("admin.contact_messages.status")}: {getStatusLabel(selectedMessage.status)}
              </Badge>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedMessage.id, "processed", replyNote)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {translate("admin.contact_messages.mark_processed")}
                </Button>
                <Button
                  size="sm"
                  className="bg-slate-100 hover:from-blue-500 hover:to-indigo-500"
                  onClick={() => handleUpdateStatus(selectedMessage.id, "replied", replyNote)}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  {translate("admin.contact_messages.mark_replied")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
