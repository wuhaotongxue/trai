/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-30 11:20:00
 * 描述: AI 角色管理页面
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  RefreshCw,
  MessageSquare,
  Tag,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toast/use_toast";
import { adminApi } from "@/lib/api_client";
import { cn } from "@/lib/utils";

type AgentRole = {
  t_id: number;
  t_role_name: string;
  t_role_comment: string;
  t_role_keyword: string | null;
  t_style_type: string;
  t_priority: number;
  t_is_active: boolean;
  t_remark: string | null;
  t_created_at: string;
  t_updated_at: string;
};

const STYLE_TYPE_OPTIONS = [
  { value: "甜美可爱", label: "甜美可爱" },
  { value: "御姐型", label: "御姐型" },
  { value: "软萌撒娇", label: "软萌撒娇" },
  { value: "知性温柔", label: "知性温柔" },
  { value: "活泼开朗", label: "活泼开朗" },
  { value: "default", label: "默认" },
];

export default function AgentRolesPage() {
  const { toast } = useToast();

  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editRole, setEditRole] = useState<Partial<AgentRole> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listAgentRoles({});
      setRoles(data);
    } catch (e) {
      console.error("Fetch agent roles failed", e);
      toast({ message: "加载角色列表失败", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = roles.filter(
    (r) =>
      r.t_role_name.includes(searchQuery) ||
      r.t_role_comment.includes(searchQuery) ||
      (r.t_role_keyword && r.t_role_keyword.includes(searchQuery))
  );

  const handleAdd = () => {
    setEditRole({
      t_role_name: "",
      t_role_comment: "",
      t_role_keyword: "",
      t_style_type: "default",
      t_priority: 100,
      t_is_active: true,
      t_remark: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (role: AgentRole) => {
    setEditRole({ ...role });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    setSaving(true);
    try {
      await adminApi.deleteAgentRole(deletingId);
      toast({ message: "删除成功", variant: "success" });
      void fetchRoles();
    } catch (e) {
      console.error("Delete role failed", e);
      toast({ message: "删除失败", variant: "error" });
    } finally {
      setSaving(false);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    if (!editRole) return;

    // 验证
    if (!editRole.t_role_name?.trim()) {
      toast({ message: "角色名称不能为空", variant: "error" });
      return;
    }
    if (!editRole.t_role_comment?.trim()) {
      toast({ message: "角色评论不能为空", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        t_role_name: editRole.t_role_name.trim(),
        t_role_comment: editRole.t_role_comment.trim(),
        t_role_keyword: editRole.t_role_keyword?.trim() || null,
        t_style_type: editRole.t_style_type || "default",
        t_priority: editRole.t_priority || 100,
        t_is_active: editRole.t_is_active ?? true,
        t_remark: editRole.t_remark?.trim() || null,
      };

      if (editRole.t_id) {
        // 更新
        await adminApi.updateAgentRole(editRole.t_id, payload);
        toast({ message: "更新成功", variant: "success" });
      } else {
        // 创建
        await adminApi.createAgentRole(payload);
        toast({ message: "创建成功", variant: "success" });
      }
      setIsModalOpen(false);
      void fetchRoles();
    } catch (e) {
      console.error("Save role failed", e);
      toast({ message: "保存失败", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (role: AgentRole) => {
    try {
      await adminApi.updateAgentRole(role.t_id, { t_is_active: !role.t_is_active });
      void fetchRoles();
    } catch (e) {
      console.error("Toggle role status failed", e);
      toast({ message: "修改状态失败", variant: "error" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI 角色管理</h1>
            <p className="text-sm text-muted-foreground">管理发布通知时使用的 AI 角色和专属评论</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchRoles()}>
            <RefreshCw className={cn("w-4 h-4 mr-1", loading && "animate-spin")} />
            刷新
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1" />
            添加角色
          </Button>
        </div>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索角色名称、评论或关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* 角色列表 */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              加载中...
            </CardContent>
          </Card>
        ) : filteredRoles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {searchQuery ? "没有找到匹配的角色" : "暂无角色数据"}
            </CardContent>
          </Card>
        ) : (
          filteredRoles.map((role) => (
            <Card key={role.t_id} className={cn(!role.t_is_active && "opacity-60")}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{role.t_role_name}</h3>
                      <Badge variant={role.t_is_active ? "default" : "secondary"}>
                        {role.t_is_active ? "启用" : "禁用"}
                      </Badge>
                      <Badge variant="outline">{role.t_style_type}</Badge>
                      <span className="text-xs text-muted-foreground">优先级: {role.t_priority}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <MessageSquare className="inline w-3 h-3 mr-1" />
                      {role.t_role_comment}
                    </p>
                    {role.t_role_keyword && (
                      <p className="text-xs text-muted-foreground mb-2">
                        <Tag className="inline w-3 h-3 mr-1" />
                        关键词: {role.t_role_keyword}
                      </p>
                    )}
                    {role.t_remark && (
                      <p className="text-xs text-muted-foreground">
                        备注: {role.t_remark}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      更新时间: {new Date(role.t_updated_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={role.t_is_active}
                      onCheckedChange={() => handleToggleActive(role)}
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingId(role.t_id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 编辑/创建弹窗 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editRole?.t_id ? "编辑角色" : "添加角色"}</DialogTitle>
            <DialogDescription>
              {editRole?.t_id ? "修改角色信息" : "创建一个新的 AI 角色"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role_name">
                角色名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role_name"
                placeholder="如: 地理专家、小甜心、御姐"
                value={editRole?.t_role_name || ""}
                onChange={(e) => setEditRole((prev) => ({ ...prev, t_role_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_comment">
                专属评论 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role_comment"
                placeholder="如: 说到版本发布呀～这条消息已成功抵达群聊坐标！"
                value={editRole?.t_role_comment || ""}
                onChange={(e) => setEditRole((prev) => ({ ...prev, t_role_comment: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_keyword">触发关键词</Label>
              <Input
                id="role_keyword"
                placeholder="逗号分隔，如: 地理,专家,经纬度"
                value={editRole?.t_role_keyword || ""}
                onChange={(e) => setEditRole((prev) => ({ ...prev, t_role_keyword: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style_type">风格类型</Label>
                <select
                  id="style_type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={editRole?.t_style_type || "default"}
                  onChange={(e) => setEditRole((prev) => ({ ...prev, t_style_type: e.target.value }))}
                >
                  {STYLE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  value={editRole?.t_priority || 100}
                  onChange={(e) =>
                    setEditRole((prev) => ({ ...prev, t_priority: parseInt(e.target.value) || 100 }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Input
                id="remark"
                placeholder="可选备注信息"
                value={editRole?.t_remark || ""}
                onChange={(e) => setEditRole((prev) => ({ ...prev, t_remark: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={editRole?.t_is_active ?? true}
                onCheckedChange={(checked) => setEditRole((prev) => ({ ...prev, t_is_active: checked }))}
              />
              <Label htmlFor="is_active">启用此角色</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              <X className="w-4 h-4 mr-1" />
              取消
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除角色 &quot;{roles.find((r) => r.t_id === deletingId)?.t_role_name}&quot; 吗？
              此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
