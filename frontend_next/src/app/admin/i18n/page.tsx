/**
 * page.tsx
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: 国际化翻译管理页面
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  Plus,
  Search,
  Trash2,
  Download,
  Upload,
  Save,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronLast,
  Languages,
  FileJson,
  Table2,
  Columns,
  Eye,
  EyeOff,
  ArrowRight,
  SplitSquareHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminToast } from "@/contexts/admin_toast_context";
import { adminApi } from "@/lib/api_client";

type I18nItem = {
  locale: string;
  namespace: string;
  key: string;
  value: string;
  updated_at?: string | null;
};

type StatsData = {
  total: number;
  zhCount: number;
  enCount: number;
  namespaceCount: number;
  missingCount: number;
};

type ViewMode = "table" | "split";

const LOCALE_CONFIG: Record<string, { label: string; flag: string; color: string }> = {
  zh: { label: "中文", flag: "🇨🇳", color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
  en: { label: "English", flag: "🇺🇸", color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30" },
};

export default function I18nPage() {
  const { toast } = useAdminToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  // 全量数据
  const [allItems, setAllItems] = useState<I18nItem[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [total, setTotal] = useState(0);

  // 筛选
  const [filterNamespace, setFilterNamespace] = useState<string>("all");
  const [filterLocale, setFilterLocale] = useState<string>("all");
  const [searchKey, setSearchKey] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // 分页
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // 语言预览（默认中文）
  const [previewLocale, setPreviewLocale] = useState<"zh" | "en">("zh");

  // 编辑状态
  const [editMap, setEditMap] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [collapsedNs, setCollapsedNs] = useState<Record<string, boolean>>({});

  // 统计
  const stats = useMemo<StatsData>(() => {
    const zhKeys = new Set(
      allItems.filter((i) => i.locale === "zh").map((i) => `${i.namespace}.${i.key}`)
    );
    const enKeys = new Set(
      allItems.filter((i) => i.locale === "en").map((i) => `${i.namespace}.${i.key}`)
    );
    const zhCount = zhKeys.size;
    const enCount = enKeys.size;
    const allKeys = zhKeys.size + enKeys.size;
    const missingCount = Math.abs(zhKeys.size - enKeys.size);
    return {
      total: allKeys,
      zhCount,
      enCount,
      namespaceCount: namespaces.length,
      missingCount,
    };
  }, [allItems, namespaces]);

  // 加载数据
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [zhRes, enRes] = await Promise.all([
        adminApi.listI18n({ locale: "zh", limit: 500 }).catch(() => ({ total: 0, items: [], namespaces: [] })),
        adminApi.listI18n({ locale: "en", limit: 500 }).catch(() => ({ total: 0, items: [], namespaces: [] })),
      ]);

      const zhItems = zhRes.items || [];
      const enItems = enRes.items || [];
      const combined = [...zhItems, ...enItems];

      const nsSet = new Set<string>([...(zhRes.namespaces || []), ...(enRes.namespaces || [])]);
      const sortedNs = Array.from(nsSet).sort();

      setAllItems(combined);
      setNamespaces(sortedNs);
      setTotal(zhItems.length + enItems.length);
    } catch {
      toast({ message: "加载翻译失败，请检查后端接口", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 按 namespace.key 聚合双语数据
  const grouped = useMemo(() => {
    const filtered = allItems.filter((item) => {
      if (filterNamespace !== "all" && item.namespace !== filterNamespace) return false;
      if (filterLocale !== "all" && item.locale !== filterLocale) return false;
      if (searchKey) {
        const k = searchKey.toLowerCase();
        if (
          !item.key.toLowerCase().includes(k) &&
          !item.value.toLowerCase().includes(k) &&
          !`${item.namespace}.${item.key}`.toLowerCase().includes(k)
        ) return false;
      }
      return true;
    });

    const map: Record<string, { zh: string | null; en: string | null; updated_at?: string }> = {};
    for (const item of filtered) {
      const composite = `${item.namespace}.${item.key}`;
      if (!map[composite]) map[composite] = { zh: null, en: null };
      if (item.locale === "zh") map[composite].zh = item.value;
      if (item.locale === "en") map[composite].en = item.value;
      if (item.updated_at) map[composite].updated_at = item.updated_at;
    }
    return map;
  }, [allItems, filterNamespace, filterLocale, searchKey]);

  // 分页
  const groupedEntries = useMemo(() => Object.entries(grouped), [grouped]);
  const totalEntries = groupedEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedEntries = groupedEntries.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleValueChange = (locale: string, compositeKey: string, value: string) => {
    const mapKey = `${locale}|${compositeKey}`;
    setEditMap((prev) => ({ ...prev, [mapKey]: value }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let saved = 0;
    let failed = 0;

    for (const [mapKey, value] of Object.entries(editMap)) {
      const [locale, compositeKey] = mapKey.split("|");
      const lastDot = compositeKey.lastIndexOf(".");
      if (lastDot === -1) continue;
      const namespace = compositeKey.slice(0, lastDot);
      const key = compositeKey.slice(lastDot + 1);
      try {
        await adminApi.upsertI18n({ locale, namespace, key, value });
        saved++;
      } catch {
        failed++;
      }
    }

    if (failed === 0) {
      toast({ message: `已保存 ${saved} 条翻译`, variant: "success" });
      setEditMap({});
      setHasChanges(false);
      fetchAll();
    } else {
      toast({ message: `保存成功 ${saved}，失败 ${failed}`, variant: "error" });
    }
    setSaving(false);
  };

  const handleSaveOne = async (locale: string, compositeKey: string, value: string) => {
    const lastDot = compositeKey.lastIndexOf(".");
    if (lastDot === -1) return;
    const namespace = compositeKey.slice(0, lastDot);
    const key = compositeKey.slice(lastDot + 1);
    try {
      await adminApi.upsertI18n({ locale, namespace, key, value });
      const mapKey = `${locale}|${compositeKey}`;
      setEditMap((prev) => {
        const next = { ...prev };
        delete next[mapKey];
        return next;
      });
      toast({ message: "已保存", variant: "success" });
      fetchAll();
    } catch {
      toast({ message: "保存失败", variant: "error" });
    }
  };

  const handleDelete = async (compositeKey: string) => {
    const lastDot = compositeKey.lastIndexOf(".");
    if (lastDot === -1) return;
    const namespace = compositeKey.slice(0, lastDot);
    const key = compositeKey.slice(lastDot + 1);
    const confirmed = confirm(`确定要删除翻译 "${compositeKey}" 吗？`);
    if (!confirmed) return;
    const promises = [
      adminApi.deleteI18n("zh", namespace, key).catch(() => {}),
      adminApi.deleteI18n("en", namespace, key).catch(() => {}),
    ];
    await Promise.all(promises);
    toast({ message: "已删除", variant: "success" });
    fetchAll();
  };

  const handleExport = () => {
    const data: Record<string, Record<string, string>> = {};
    for (const item of allItems) {
      if (!data[item.locale]) data[item.locale] = {};
      data[item.locale][`${item.namespace}.${item.key}`] = item.value;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `i18n-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Record<string, Record<string, string>>;
      await adminApi.importI18n(data);
      toast({ message: "导入成功", variant: "success" });
      fetchAll();
    } catch {
      toast({ message: "导入失败，请检查文件格式", variant: "error" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleNamespace = (ns: string) => {
    setCollapsedNs((prev) => ({ ...prev, [ns]: !prev[ns] }));
  };

  const entries = Object.entries(grouped);

  return (
    <div className="space-y-5">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center shadow-sm">
            <Globe className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">国际化翻译管理</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              共 {stats.total} 个翻译键 · {stats.namespaceCount} 个命名空间
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 视图切换 */}
          <div className="inline-flex items-center rounded-xl border border-border bg-muted/50 p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Table2 className="h-3.5 w-3.5" /> 表格视图
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "split"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <SplitSquareHorizontal className="h-3.5 w-3.5" /> 分栏视图
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="h-3.5 w-3.5" />
            {importing ? "导入中..." : "导入"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" onClick={handleExport}>
            <FileJson className="h-3.5 w-3.5" />
            导出
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-sm"
            onClick={fetchAll}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>

          {hasChanges && (
            <Button
              size="sm"
              className="h-9 gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 shadow-sm"
              onClick={handleSaveAll}
              disabled={saving}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "保存中..." : `保存 (${Object.keys(editMap).length})`}
            </Button>
          )}

          <AddTranslationButton
            namespaces={namespaces}
            onAdd={async (data) => {
              try {
                await adminApi.upsertI18n(data);
                toast({ message: "添加成功", variant: "success" });
                fetchAll();
              } catch {
                toast({ message: "添加失败", variant: "error" });
              }
            }}
          />
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 中文 */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg shrink-0">🇨🇳</div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">中文 (zh)</p>
              <p className="text-xl font-bold text-foreground">{stats.zhCount}</p>
              <p className="text-[10px] text-muted-foreground">条翻译</p>
            </div>
          </CardContent>
        </Card>

        {/* English */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg shrink-0">🇺🇸</div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">English (en)</p>
              <p className="text-xl font-bold text-foreground">{stats.enCount}</p>
              <p className="text-[10px] text-muted-foreground">条翻译</p>
            </div>
          </CardContent>
        </Card>

        {/* 命名空间 */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Languages className="h-5 w-5 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">命名空间</p>
              <p className="text-xl font-bold text-foreground">{stats.namespaceCount}</p>
              <p className="text-[10px] text-muted-foreground">个分组</p>
            </div>
          </CardContent>
        </Card>

        {/* 翻译键总数 */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <ArrowRight className="h-5 w-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">翻译键</p>
              <p className="text-xl font-bold text-foreground">{Object.keys(grouped).length}</p>
              <p className="text-[10px] text-muted-foreground">个键</p>
            </div>
          </CardContent>
        </Card>

        {/* 缺失提示 */}
        <Card className={`border-0 shadow-sm overflow-hidden ${stats.missingCount > 0 ? "bg-amber-500/5" : ""}`}>
          <div className={`h-1 ${stats.missingCount > 0 ? "bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" : "bg-gradient-to-r from-green-500 to-emerald-500"}`} />
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stats.missingCount > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
              <Eye className={`h-5 w-5 ${stats.missingCount > 0 ? "text-amber-500" : "text-emerald-500"}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">翻译覆盖</p>
              <p className={`text-xl font-bold ${stats.missingCount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {stats.missingCount > 0 ? `${stats.missingCount} 缺失` : "完整"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {stats.missingCount > 0 ? "zh/en 不对称" : "全部双语"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选工具栏 */}
      <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-9 pl-9 pr-4 rounded-xl text-sm"
              placeholder="搜索键名或翻译值..."
              value={searchKey}
              onChange={(e) => { setSearchKey(e.target.value); setPage(1); }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground shrink-0">分组</Label>
            <Select value={filterNamespace} onValueChange={(v) => { if (v) { setFilterNamespace(v); setPage(1); } }}>
              <SelectTrigger className="h-9 w-[140px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {namespaces.map((ns) => (
                  <SelectItem key={ns} value={ns}>
                    {ns}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground shrink-0">语言</Label>
            <Select value={filterLocale} onValueChange={(v) => v && setFilterLocale(v)}>
              <SelectTrigger className="h-9 w-[120px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
            <span>第</span>
            <span className="font-bold text-foreground">{safePage}</span>
            <span>/</span>
            <span className="font-bold text-foreground">{totalPages}</span>
            <span>页，共</span>
            <span className="font-bold text-foreground">{totalEntries}</span>
            <span>条</span>
          </div>

          {/* 语言预览切换 */}
          <div className="inline-flex items-center rounded-xl border border-border bg-muted/50 p-0.5 shrink-0">
            <button
              onClick={() => setPreviewLocale("zh")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                previewLocale === "zh"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇨🇳 中文预览
            </button>
            <button
              onClick={() => setPreviewLocale("en")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                previewLocale === "en"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇺🇸 English
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 翻译内容区 */}
      <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-0 px-5 pt-5">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            翻译列表
            {hasChanges && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-xs font-normal">
                {Object.keys(editMap).length} 项待保存
              </Badge>
            )}
          </CardTitle>
          {/* 表头 */}
          {viewMode === "table" && (
            <div className="mt-4 grid grid-cols-12 gap-3 px-1">
              <div className="col-span-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">翻译键</div>
              <div className="col-span-4 text-xs font-semibold text-blue-500 uppercase tracking-wide flex items-center gap-1.5">
                🇨🇳 中文
              </div>
              <div className="col-span-3 text-xs font-semibold text-emerald-500 uppercase tracking-wide flex items-center gap-1.5">
                🇺🇸 English
              </div>
              <div className="col-span-1" />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
              加载中...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-sm gap-3">
              <Globe className="h-12 w-12 opacity-20" />
              <p className="font-medium">暂无翻译数据</p>
              <p className="text-xs">点击右上角「新增翻译」添加，或导入 JSON 批量导入</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {paginatedEntries.map(([compositeKey, vals]) => {
                const [ns, key] = (() => {
                  const lastDot = compositeKey.lastIndexOf(".");
                  return [compositeKey.slice(0, lastDot), compositeKey.slice(lastDot + 1)];
                })();
                const zhMapKey = `zh|${compositeKey}`;
                const enMapKey = `en|${compositeKey}`;
                const zhVal = editMap[zhMapKey] ?? vals.zh ?? "";
                const enVal = editMap[enMapKey] ?? vals.en ?? "";
                const isZhEditing = zhMapKey in editMap;
                const isEnEditing = enMapKey in editMap;

                return (
                  <div key={compositeKey} className="group">
                    {/* 表格视图 */}
                    {viewMode === "table" && (
                      <div className="grid grid-cols-12 gap-3 px-5 py-3 items-start hover:bg-muted/30 transition-colors">
                        {/* 键 */}
                        <div className="col-span-4 flex items-start gap-2 pt-0.5">
                          <button
                            onClick={() => toggleNamespace(ns)}
                            className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          >
                            {collapsedNs[compositeKey] ? (
                              <ChevronRight className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p className="text-xs font-mono font-medium text-foreground truncate">{key}</p>
                            <p className="text-[10px] text-muted-foreground/60 font-mono truncate">{ns}</p>
                          </div>
                        </div>

                        {/* 中文值 */}
                        <div className="col-span-4">
                          <textarea
                            className={`min-h-[36px] max-h-[100px] px-2.5 py-1.5 rounded-lg border text-sm font-mono resize-none focus:ring-1 transition-colors ${
                              isZhEditing ? "border-blue-500/50 bg-blue-500/5 focus:ring-blue-500/20" : "border-border/60 bg-background/50 focus:border-blue-500/30 focus:ring-blue-500/10"
                            }`}
                            value={zhVal}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleValueChange("zh", compositeKey, e.target.value)}
                            placeholder="中文..."
                            rows={2}
                          />
                        </div>

                        {/* 英文值 */}
                        <div className="col-span-3">
                          <textarea
                            className={`min-h-[36px] max-h-[100px] px-2.5 py-1.5 rounded-lg border text-sm font-mono resize-none focus:ring-1 transition-colors ${
                              isEnEditing ? "border-emerald-500/50 bg-emerald-500/5 focus:ring-emerald-500/20" : "border-border/60 bg-background/50 focus:border-emerald-500/30 focus:ring-emerald-500/10"
                            }`}
                            value={enVal}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleValueChange("en", compositeKey, e.target.value)}
                            placeholder="English..."
                            rows={2}
                          />
                        </div>

                        {/* 操作 */}
                        <div className="col-span-1 flex items-center gap-1 justify-end pt-0.5">
                          {(isZhEditing || isEnEditing) && (
                            <>
                              <button
                                onClick={() => {
                                  if (isZhEditing) handleSaveOne("zh", compositeKey, zhVal);
                                  if (isEnEditing) handleSaveOne("en", compositeKey, enVal);
                                }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                                title="保存"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditMap((prev) => {
                                    const next = { ...prev };
                                    if (isZhEditing) delete next[zhMapKey];
                                    if (isEnEditing) delete next[enMapKey];
                                    return next;
                                  });
                                  if (Object.keys(editMap).filter(k => k === zhMapKey || k === enMapKey).length <= 1) {
                                    setHasChanges(Object.keys(editMap).length > 1);
                                  }
                                }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                                title="取消"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(compositeKey)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/60 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                            title="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 分栏视图 */}
                    {viewMode === "split" && (
                      <div className="px-5 py-4">
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            onClick={() => toggleNamespace(ns)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {collapsedNs[compositeKey] ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          <div className="flex items-center gap-2 flex-1">
                            <Badge variant="outline" className="text-xs font-mono">{ns}</Badge>
                            <span className="text-sm font-mono font-medium">{key}</span>
                          </div>
                          <button
                            onClick={() => handleDelete(compositeKey)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {!collapsedNs[compositeKey] && (
                          <div className="grid grid-cols-2 gap-3">
                            {/* 中文 */}
                            <div className={`rounded-xl border p-3 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20`}>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-sm">🇨🇳</span>
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">中文</span>
                                {vals.zh === null && (
                                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10 ml-1">缺失</Badge>
                                )}
                              </div>
                              <textarea
                                className={`w-full rounded-lg border text-sm font-mono resize-none ${
                                  isZhEditing ? "border-blue-500/50 bg-blue-500/5" : "border-blue-500/20 bg-background/50"
                                }`}
                                value={zhVal}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleValueChange("zh", compositeKey, e.target.value)}
                                placeholder="暂无中文翻译..."
                                rows={2}
                              />
                              {isZhEditing && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-500" onClick={() => handleSaveOne("zh", compositeKey, zhVal)}>
                                    <Check className="h-3 w-3 mr-1" /> 保存
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                                    setEditMap((prev) => { const n = { ...prev }; delete n[zhMapKey]; return n; });
                                  }}>
                                    取消
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* 英文 */}
                            <div className={`rounded-xl border p-3 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20`}>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-sm">🇺🇸</span>
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">English</span>
                                {vals.en === null && (
                                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10 ml-1">缺失</Badge>
                                )}
                              </div>
                              <textarea
                                className={`w-full rounded-lg border text-sm font-mono resize-none ${
                                  isEnEditing ? "border-emerald-500/50 bg-emerald-500/5" : "border-emerald-500/20 bg-background/50"
                                }`}
                                value={enVal}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleValueChange("en", compositeKey, e.target.value)}
                                placeholder="No English translation yet..."
                                rows={2}
                              />
                              {isEnEditing && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500" onClick={() => handleSaveOne("en", compositeKey, enVal)}>
                                    <Check className="h-3 w-3 mr-1" /> 保存
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                                    setEditMap((prev) => { const n = { ...prev }; delete n[enMapKey]; return n; });
                                  }}>
                                    取消
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* 底部分页控件 */}
        {totalEntries > pageSize && (
          <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between bg-muted/10">
            <p className="text-xs text-muted-foreground">
              第 {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalEntries)} 条，共 {totalEntries} 条
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(1)} disabled={safePage === 1}>
                <ChevronLast className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs px-3 py-1 font-medium">
                {safePage} / {totalPages}
              </span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}>
                <ChevronLast className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// 新增翻译按钮（渲染在 Card 外部，防止弹窗被裁剪）
function AddTranslationButton({
  namespaces,
  onAdd,
}: {
  namespaces: string[];
  onAdd: (data: { locale: string; namespace: string; key: string; value: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState("zh");
  const [ns, setNs] = useState("");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!ns || !key) return;
    onAdd({ locale, namespace: ns, key, value });
    setOpen(false);
    setKey("");
    setValue("");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-sm border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" /> 新增翻译
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-violet-500" />
              新增翻译
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">语言</Label>
                <Select value={locale} onValueChange={(v) => v && setLocale(v)}>
                  <SelectTrigger className="h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">🇨🇳 中文</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">命名空间</Label>
                <Input
                  className="h-9 font-mono text-sm rounded-xl"
                  placeholder="例如: nav / hero / admin"
                  value={ns}
                  onChange={(e) => setNs(e.target.value)}
                  list="ns-suggestions"
                />
                <datalist id="ns-suggestions">
                  {namespaces.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">翻译键 (Key)</Label>
                <Input
                  className="h-9 font-mono text-sm rounded-xl"
                  placeholder="例如: hero.title"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">翻译值</Label>
                <textarea
                  className="min-h-[80px] rounded-xl text-sm font-mono w-full px-3 py-2 border border-input bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="输入翻译文本..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button
                size="sm"
                className="h-9 rounded-xl bg-violet-600 hover:bg-violet-500"
                onClick={handleSubmit}
                disabled={!ns || !key}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
