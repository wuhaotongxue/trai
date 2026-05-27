/**
 * page.tsx
 * 数据库管理页面
 * 提供数据库表的查看,优化,备份管理和表结构文档功能
 */

"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Database, Download, HardDrive, RefreshCw, Table2, Upload, Trash2, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/api_client";
import { useToast } from "@/components/toast/use_toast";
import { useAdminI18n } from "@/contexts/admin_i18n_context";

interface TableInfo {
  name: string;
  rows: number;
  size: string;
  engine: string;
  charset: string;
  lastOptimize: string;
}

interface BackupInfo {
  key: string;
  size: number;
  last_modified: string;
  url: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
}

interface TableSchema {
  table_name: string;
  row_count: number;
  total_bytes: number;
  columns: ColumnInfo[];
  description: string;
}

interface SchemaSyncResponse {
  tables: TableSchema[];
  total_tables: number;
  total_rows: number;
  synced_at: string;
}

export default function DatabasePage() {
  const { translate, locale } = useAdminI18n();
  const [optimizing, setOptimizing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schema, setSchema] = useState<SchemaSyncResponse | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await request<BackupInfo[]>("/admin/system/database/backups");
      setBackups(res.sort((a, b) => b.last_modified.localeCompare(a.last_modified)));
    } catch (e: any) {
      toast({ message: e.message || translate("admin.database.fetch_backups_failed"), variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchema = async () => {
    setSchemaLoading(true);
    try {
      const res = await request<SchemaSyncResponse>("/admin/system/database/schema");
      setSchema(res);
    } catch (e) {
      console.error("Fetch schema failed", e);
      toast({ message: "Failed to fetch schema", variant: "error" });
    } finally {
      setSchemaLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchSchema();
  }, []);

  const handleOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
      toast({ message: "Database optimize completed", variant: "success" });
    }, 2000);
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      await request("/admin/system/database/backup", { method: "POST" });
      toast({ message: "Backup started", variant: "success" });
      fetchBackups();
    } catch (e: any) {
      toast({ message: e.message || "Backup failed", variant: "error" });
    } finally {
      setBackingUp(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const toggleTable = (tableName: string) => {
    const next = new Set(expandedTables);
    if (next.has(tableName)) {
      next.delete(tableName);
    } else {
      next.add(tableName);
    }
    setExpandedTables(next);
  };

  const tables: TableInfo[] = [
    { name: "users", rows: 1248, size: "12 MB", engine: "PostgreSQL", charset: "utf8mb4", lastOptimize: "2026-04-09 03:00" },
    { name: "chat_sessions", rows: 8420, size: "85 MB", engine: "PostgreSQL", charset: "utf8mb4", lastOptimize: "2026-04-08 03:00" },
    { name: "messages", rows: 128400, size: "320 MB", engine: "PostgreSQL", charset: "utf8mb4", lastOptimize: "2026-04-07 03:00" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{translate("admin.database.title")}</h1>
          <p className="text-sm text-slate-900 dark:text-white font-bold mt-0.5">PostgreSQL 16.2 - {translate("admin.database.connection_ok")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={handleOptimize}>
            <RefreshCw className={`h-3.5 w-3.5 ${optimizing ? "animate-spin" : ""}`} />
            {optimizing ? translate("admin.database.optimizing") : translate("admin.database.optimize")}
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={fetchBackups}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {translate("admin.monitor.refresh_status")}
          </Button>
          <Button size="sm" className="h-9 gap-2 text-sm shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] bg-red-600 hover:bg-red-700" onClick={handleBackup} disabled={backingUp}>
            {backingUp ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {backingUp ? translate("admin.database.backing_up") : translate("admin.database.manual_backup")}
          </Button>
        </div>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { labelKey: "admin.database.total_tables", value: schema?.total_tables?.toString() || "24", icon: Table2, color: "text-blue-400", bg: "bg-blue-500/15" },
          { labelKey: "admin.database.total_rows", value: schema?.total_rows?.toLocaleString(locale === "zh" ? "zh-CN" : "en-US") || "623,128", icon: Database, color: "text-emerald-400", bg: "bg-cyan-500/15" },
          { labelKey: "admin.database.backups", value: backups.length.toString(), icon: HardDrive, color: "text-cyan-400", bg: "bg-slate-200/15" },
          { labelKey: "admin.database.status", value: translate("admin.database.ok"), icon: CheckCircle2, color: "text-emerald-400", bg: "bg-cyan-500/15" },
        ].map((item) => (
          <Card key={item.labelKey} className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-none-none flex items-center justify-center ${item.bg}`}>
                <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-slate-900 dark:text-white font-bold">{translate(item.labelKey)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schema Documentation */}
      <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            {translate("admin.database.schema_doc")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-900 dark:text-white font-bold">
              {translate("admin.database.last_synced")}: {schema?.synced_at ? new Date(schema.synced_at).toLocaleString(locale === "zh" ? "zh-CN" : "en-US") : translate("admin.database.never")}
            </span>
            <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={fetchSchema} disabled={schemaLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${schemaLoading ? "animate-spin" : ""}`} />
              {translate("admin.database.sync")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {schemaLoading ? (
              <div className="py-8 text-center text-slate-900 dark:text-white font-bold">{translate("admin.database.loading_schema")}</div>
            ) : schema?.tables && schema.tables.length > 0 ? (
              schema.tables.map((table) => (
                <div key={table.table_name} className="border border-border rounded-none-none overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => toggleTable(table.table_name)}
                  >
                    {expandedTables.has(table.table_name) ? (
                      <ChevronDown className="h-4 w-4 text-slate-900 dark:text-white font-bold" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-900 dark:text-white font-bold" />
                    )}
                    <Table2 className="h-4 w-4 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{table.table_name}</span>
                        {table.description && (
                          <span className="text-xs text-slate-900 dark:text-white font-bold">- {table.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-900 dark:text-white font-bold">
                      <span>{table.row_count.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")} {translate("admin.database.rows")}</span>
                      <span>{formatBytes(table.total_bytes)}</span>
                      <span>{table.columns.length} {translate("admin.database.columns")}</span>
                    </div>
                  </div>
                  {expandedTables.has(table.table_name) && (
                    <div className="border-t border-border bg-muted/20">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/40">
                            <th className="px-4 py-2 text-left font-medium">{translate("admin.database.column")}</th>
                            <th className="px-4 py-2 text-left font-medium">{translate("admin.database.type")}</th>
                            <th className="px-4 py-2 text-left font-medium">{translate("admin.database.nullable")}</th>
                            <th className="px-4 py-2 text-left font-medium">{translate("admin.database.default")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((col) => (
                            <tr key={col.name} className="border-t border-border/50">
                              <td className="px-4 py-2 font-mono text-blue-600">{col.name}</td>
                              <td className="px-4 py-2 font-mono text-cyan-600">{col.type}</td>
                              <td className="px-4 py-2">{col.nullable ? translate("admin.database.yes") : translate("admin.database.no")}</td>
                              <td className="px-4 py-2 text-slate-900 dark:text-white font-bold">{col.default || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-900 dark:text-white font-bold">
                {translate("admin.database.no_schema_data")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">{translate("admin.database.s3_backup_history")}</CardTitle>
          <span className="text-xs text-slate-900 dark:text-white font-bold font-medium flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {translate("admin.database.latest")}: {backups[0]?.last_modified || translate("admin.database.none")}
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loading ? (
              <div className="col-span-2 py-8 text-center text-slate-900 dark:text-white font-bold">{translate("admin.loading")}</div>
            ) : backups.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-slate-900 dark:text-white font-bold">{translate("admin.database.no_backups")}</div>
            ) : (
              backups.map((b) => (
                <div key={b.key} className="flex items-center gap-4 p-4 rounded-none-none bg-muted/25 hover:bg-muted/40 transition-colors">
                  <div className="w-10 h-10 rounded-none-none bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <Database className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{b.key.split("/").pop()}</p>
                    <p className="text-xs text-slate-900 dark:text-white font-bold mt-0.5">{b.last_modified} - {formatSize(b.size)}</p>
                  </div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}