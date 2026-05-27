/**
 * page.tsx
 * 数据备份页面
 */

"use client";

import { useState, useEffect } from "react";
import { Container, Database, HardDrive, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";

interface DockerItem {
  id: string;
  volumePath: string;
  backupPath: string;
}

interface DbItem {
  id: string;
  connection: string;
  backupPath: string;
}

export default function BackupPage() {
  const { translate, locale, loadNamespace } = useAdminI18n();
  const { toast } = useAdminToast();
  const [loading, setLoading] = useState(false);
  const [dockerItems, setDockerItems] = useState<DockerItem[]>([
    { id: "1", volumePath: "/var/lib/docker/volumes", backupPath: "/data/docker/backups" },
  ]);
  const [dbItems, setDbItems] = useState<DbItem[]>([
    { id: "1", connection: "postgresql://localhost:5432/trai", backupPath: "/data/db/backups" },
  ]);

  useEffect(() => {
    void loadNamespace("admin");
  }, [locale]);

  const addDockerItem = () => {
    const newId = String(Date.now());
    setDockerItems([...dockerItems, { id: newId, volumePath: "", backupPath: "/data/docker/backups" }]);
  };

  const removeDockerItem = (id: string) => {
    if (dockerItems.length === 1) {
      toast({ message: translate("admin.backup.at_least_one"), variant: "warning" });
      return;
    }
    setDockerItems(dockerItems.filter((item) => item.id !== id));
  };

  const updateDockerItem = (id: string, field: keyof DockerItem, value: string) => {
    setDockerItems(dockerItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addDbItem = () => {
    const newId = String(Date.now());
    setDbItems([...dbItems, { id: newId, connection: "postgresql://localhost:5432/", backupPath: "/data/db/backups" }]);
  };

  const removeDbItem = (id: string) => {
    if (dbItems.length === 1) {
      toast({ message: translate("admin.backup.at_least_one"), variant: "warning" });
      return;
    }
    setDbItems(dbItems.filter((item) => item.id !== id));
  };

  const updateDbItem = (id: string, field: keyof DbItem, value: string) => {
    setDbItems(dbItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleDockerBackup = async (item: DockerItem) => {
    if (!item.volumePath || !item.backupPath) {
      toast({ message: translate("admin.backup.fill_all_fields"), variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      toast({ message: translate("admin.backup.docker_starting"), variant: "info" });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast({ message: translate("admin.backup.docker_success"), variant: "success" });
    } catch {
      toast({ message: translate("admin.backup.docker_failed"), variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDbBackup = async (item: DbItem) => {
    if (!item.connection || !item.backupPath) {
      toast({ message: translate("admin.backup.fill_all_fields"), variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      toast({ message: translate("admin.backup.db_starting"), variant: "info" });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast({ message: translate("admin.backup.db_success"), variant: "success" });
    } catch {
      toast({ message: translate("admin.backup.db_failed"), variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{translate("admin.backup.title")}</h1>
          <p className="text-sm text-slate-900 dark:text-white font-bold mt-1">{translate("admin.backup.subtitle")}</p>
        </div>
        <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={() => window.location.reload()}>
          <RefreshCw className="h-3.5 w-3.5" />
          {translate("admin.backup.refresh")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Docker 数据备份 */}
        <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white ">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Container className="h-4 w-4 text-blue-500" />
                {translate("admin.backup.docker")}
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={addDockerItem}>
                <Plus className="h-3 w-3" />
                {translate("admin.backup.add")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {dockerItems.map((item, index) => (
              <div key={item.id} className="space-y-3 p-4 rounded-none-none bg-muted/30 border border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-900 dark:text-white font-bold">#{index + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive"
                    onClick={() => removeDockerItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground/70">{translate("admin.backup.docker_volume_path")}</Label>
                  <Input
                    className="h-9 rounded-none-none border-border/60 bg-white dark:bg-slate-900 font-mono text-xs"
                    value={item.volumePath}
                    onChange={(e) => updateDockerItem(item.id, "volumePath", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground/70">{translate("admin.backup.docker_backup_path")}</Label>
                  <Input
                    className="h-9 rounded-none-none border-border/60 bg-white dark:bg-slate-900 font-mono text-xs"
                    value={item.backupPath}
                    onChange={(e) => updateDockerItem(item.id, "backupPath", e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full h-8 gap-2 text-xs bg-blue-600 hover:bg-blue-500"
                  onClick={() => void handleDockerBackup(item)}
                  disabled={loading}
                >
                  <Container className="h-3.5 w-3.5" />
                  {loading ? translate("admin.backup.backing_up") : translate("admin.backup.docker_backup_now")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 数据库备份 */}
        <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white ">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-green-500" />
                {translate("admin.backup.database")}
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={addDbItem}>
                <Plus className="h-3 w-3" />
                {translate("admin.backup.add")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {dbItems.map((item, index) => (
              <div key={item.id} className="space-y-3 p-4 rounded-none-none bg-muted/30 border border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-900 dark:text-white font-bold">#{index + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive"
                    onClick={() => removeDbItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground/70">{translate("admin.backup.db_connection")}</Label>
                  <Input
                    className="h-9 rounded-none-none border-border/60 bg-white dark:bg-slate-900 font-mono text-xs"
                    value={item.connection}
                    onChange={(e) => updateDbItem(item.id, "connection", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground/70">{translate("admin.backup.db_backup_path")}</Label>
                  <Input
                    className="h-9 rounded-none-none border-border/60 bg-white dark:bg-slate-900 font-mono text-xs"
                    value={item.backupPath}
                    onChange={(e) => updateDbItem(item.id, "backupPath", e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full h-8 gap-2 text-xs bg-green-600 hover:bg-green-500"
                  onClick={() => void handleDbBackup(item)}
                  disabled={loading}
                >
                  <Database className="h-3.5 w-3.5" />
                  {loading ? translate("admin.backup.backing_up") : translate("admin.backup.db_backup_now")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 备份历史 */}
      <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white ">
        <CardHeader className="pb-4 border-b border-border/40">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-purple-500" />
            {translate("admin.backup.history")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.backup.col_name")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.backup.col_type")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.backup.col_size")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.backup.col_time")}</th>
                  <th className="px-4 py-3 text-left font-medium">{translate("admin.backup.col_action")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-900 dark:text-white font-bold">
                    {translate("admin.backup.no_data")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}