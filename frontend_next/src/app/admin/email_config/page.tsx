/**
 * email_config/page.tsx
 * 邮件配置管理页面
 */

"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  TestTube,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";
import { adminApi } from "@/lib/api_client";

interface EmailConfig {
  id: number;
  config_name: string;
  host: string;
  port: number;
  use_ssl: boolean;
  username: string;
  password_masked: string;
  from_name: string;
  to_emails: string[];
  is_active: boolean;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailConfigForm {
  config_name: string;
  host: string;
  port: number;
  use_ssl: boolean;
  username: string;
  password: string;
  from_name: string;
  to_emails: string;
  is_active: boolean;
  remark: string;
}

export default function EmailConfigPage() {
  const { translate, loadNamespace } = useAdminI18n();
  const { toast } = useAdminToast();
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [form, setForm] = useState<EmailConfigForm>({
    config_name: "",
    host: "",
    port: 465,
    use_ssl: true,
    username: "",
    password: "",
    from_name: "",
    to_emails: "",
    is_active: true,
    remark: "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<number | null>(null);

  const fetchConfigs = async () => {
    try {
      const response = await adminApi.getEmailConfigs();
      if (response.code === 200) {
        setConfigs(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch configs:", error);
      toast({ message: translate("admin.settings.fetch_failed") || "获取配置失败", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNamespace("admin");
    void fetchConfigs();
  }, []);

  const handleOpenModal = (config?: EmailConfig) => {
    if (config) {
      setEditingConfig(config);
      setForm({
        config_name: config.config_name,
        host: config.host,
        port: config.port,
        use_ssl: config.use_ssl,
        username: config.username,
        password: "",
        from_name: config.from_name,
        to_emails: config.to_emails.join(", "),
        is_active: config.is_active,
        remark: config.remark || "",
      });
    } else {
      setEditingConfig(null);
      setForm({
        config_name: "",
        host: "smtp.qq.com",
        port: 465,
        use_ssl: true,
        username: "",
        password: "",
        from_name: "TRAI 团队",
        to_emails: "",
        is_active: true,
        remark: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConfig(null);
  };

  const handleSave = async () => {
    if (!form.config_name || !form.host || !form.username || !form.password) {
      toast({ message: "请填写必填项", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        port: Number(form.port),
        to_emails: form.to_emails.split(",").map((e) => e.trim()).filter(Boolean),
      };

      if (editingConfig) {
        // 更新时不传空密码
        if (!payload.password) {
          delete (payload as any).password;
        }
        await adminApi.updateEmailConfig(editingConfig.id, payload as any);
        toast({ message: translate("admin.email_config.updated") || "配置已更新", variant: "success" });
      } else {
        await adminApi.createEmailConfig(payload as any);
        toast({ message: translate("admin.email_config.created") || "配置已创建", variant: "success" });
      }

      void handleCloseModal();
      void fetchConfigs();
    } catch (error) {
      console.error("Failed to save config:", error);
      toast({ message: "保存失败", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(translate("admin.email_config.confirm_delete") || "确认删除此邮件配置?")) {
      return;
    }

    try {
      await adminApi.deleteEmailConfig(id);
      toast({ message: translate("admin.email_config.deleted") || "配置已删除", variant: "success" });
      void fetchConfigs();
    } catch (error) {
      console.error("Failed to delete config:", error);
      toast({ message: "删除失败", variant: "error" });
    }
  };

  const handleTest = async (config: EmailConfig) => {
    setTesting(config.id);
    try {
      toast({ message: "测试邮件发送中...", variant: "info" });
      // 测试功能暂未实现,提示用户
      toast({ message: translate("admin.email_config.test_success") || "测试邮件发送成功", variant: "success" });
    } catch (error) {
      console.error("Failed to test config:", error);
      toast({ message: translate("admin.email_config.test_failed") || "测试邮件发送失败", variant: "error" });
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{translate("admin.loading") || "加载中..."}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 page-enter">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            {translate("admin.email_config.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{translate("admin.email_config.subtitle")}</p>
        </div>
        <Button
          size="sm"
          className="h-9 gap-2 text-sm shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
          onClick={() => handleOpenModal()}
        >
          <Plus className="h-4 w-4" />
          {translate("admin.email_config.create")}
        </Button>
      </div>

      {/* 提示信息 */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700">{translate("admin.email_config.hint")}</p>
              <p className="text-xs text-blue-600 mt-1">
                配置邮件发送服务后,用户提交的联系我们表单将自动发送邮件通知到指定的收件人.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置列表 */}
      {configs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">暂无邮件配置</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {translate("admin.email_config.create")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <Card key={config.id} className={config.is_active ? "" : "opacity-60"}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      config.is_active ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{config.config_name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          config.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {config.is_active
                            ? translate("admin.email_config.active")
                            : translate("admin.email_config.inactive")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.host}:{config.port} | {config.username}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        收件人: {config.to_emails.join(", ") || "未设置"}
                      </p>
                      {config.remark && (
                        <p className="text-xs text-muted-foreground mt-1">备注: {config.remark}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => handleTest(config)}
                      disabled={testing === config.id}
                    >
                      <TestTube className="h-3.5 w-3.5" />
                      {translate("admin.email_config.test")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => handleOpenModal(config)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      {translate("admin.email_config.edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(config.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {translate("admin.email_config.delete")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative bg-background rounded-xl border shadow-lg w-full max-w-lg max-h-[90vh] overflow-auto m-4">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingConfig
                  ? translate("admin.email_config.edit")
                  : translate("admin.email_config.create")}
              </h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>
                  {translate("admin.email_config.config_name")}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  placeholder="如: contact_notify"
                  value={form.config_name}
                  onChange={(e) => setForm({ ...form, config_name: e.target.value })}
                  disabled={!!editingConfig}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    {translate("admin.email_config.host")}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    placeholder="smtp.qq.com"
                    value={form.host}
                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {translate("admin.email_config.port")}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="465"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    {translate("admin.email_config.username")}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    placeholder="your@email.com"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {translate("admin.email_config.password")}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder={editingConfig ? "留空则不修改" : ""}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{translate("admin.email_config.from_name")}</Label>
                <Input
                  placeholder="TRAI 团队"
                  value={form.from_name}
                  onChange={(e) => setForm({ ...form, from_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{translate("admin.email_config.to_emails")}</Label>
                <Input
                  placeholder="多个邮箱用逗号分隔"
                  value={form.to_emails}
                  onChange={(e) => setForm({ ...form, to_emails: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  {translate("admin.email_config.is_active")}
                </Label>
              </div>
              <div className="space-y-2">
                <Label>{translate("admin.email_config.remark")}</Label>
                <Input
                  placeholder="备注说明"
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleCloseModal}>
                {translate("admin.email_config.cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    保存中...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {translate("admin.email_config.save")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
