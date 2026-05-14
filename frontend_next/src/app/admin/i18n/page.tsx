/**
 * page.tsx
 * 作者: wuhao
 * 日期: 2026-04-25
 * 描述: 国际化翻译管理页面
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  Plus,
  Search,
  Download,
  Upload,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronLast,
  ChevronRight,
  Languages,
  FileJson,
  Table2,
  SplitSquareHorizontal,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import I18nSection from "./i18n_section";
import AddTranslationButton from "./add_translation_button";
import { useAdminI18n } from "@/contexts/admin_i18n_context";

type I18nItem = {
  locale: string;
  namespace: string;
  key: string;
  value: string;
  updated_at?: string | null;
};

type ViewMode = "table" | "split";

type TabKey = "all" | "client" | "frontend" | "admin";

export default function I18nPage() {
  const { toast } = useAdminToast();
  const { translate } = useAdminI18n();

  const TAB_LABELS: Record<TabKey, string> = {
    all: translate("admin.i18n.tab_all"),
    client: translate("admin.i18n.tab_client"),
    frontend: translate("admin.i18n.tab_frontend"),
    admin: translate("admin.i18n.tab_admin"),
  };

  const NS_LABEL_MAP: Record<string, string> = {
    login: translate("admin.i18n.ns_login"),
    register: translate("admin.i18n.ns_register"),
    users: translate("admin.i18n.ns_users"),
    settings: translate("admin.i18n.ns_settings"),
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  // 全量数据
  const [allItems, setAllItems] = useState<I18nItem[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);

  // 视图控制
  const [activeTab, setActiveTab] = useState<TabKey>("frontend");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchKey, setSearchKey] = useState("");
  const [page, setPage] = useState(1);

  // 编辑状态
  const [editMap, setEditMap] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // 各 tab 默认折叠（true = 折叠）
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // 加载数据
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [zhRes, enRes] = await Promise.all([
        adminApi.listI18n({ locale: "zh", limit: 500 }).catch(() => ({ total: 0, items: [], namespaces: [] })),
        adminApi.listI18n({ locale: "en", limit: 500 }).catch(() => ({ total: 0, items: [], namespaces: [] })),
      ]);
      const combined = [...(zhRes.items || []), ...(enRes.items || [])];
      const nsSet = new Set<string>([...(zhRes.namespaces || []), ...(enRes.namespaces || [])]);
      setAllItems(combined);
      setNamespaces(Array.from(nsSet).sort());
      // 加载完成后全折叠（根据实际 namespace 列表初始化所有 key 为 true）
      const initCollapsed: Record<string, boolean> = {};
      for (const ns of nsSet) {
        const parts = ns.split(".");
        const gk = parts[0];
        const nsk = parts.length >= 2 ? parts[1] : gk;
        initCollapsed[`${gk}|${nsk}`] = true;
      }
      setCollapsedGroups(initCollapsed);
    } catch {
      toast({ message: "加载翻译失败", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 聚合：compositeKey → { zh, en }
  const grouped = useMemo(() => {
    const filtered = allItems.filter((item) => {
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
    const map: Record<string, { zh: string | null; en: string | null }> = {};
    for (const item of filtered) {
      const ck = `${item.namespace}.${item.key}`;
      if (!map[ck]) map[ck] = { zh: null, en: null };
      if (item.locale === "zh") map[ck].zh = item.value;
      if (item.locale === "en") map[ck].en = item.value;
    }
    return map;
  }, [allItems, searchKey]);

  type FlatEntry = { compositeKey: string; leafKey: string; zh: string | null; en: string | null };
  const flatEntries = useMemo<FlatEntry[]>(() => {
    return Object.entries(grouped).map(([ck, vals]) => ({
      compositeKey: ck,
      leafKey: ck.split(".").pop()!,
      zh: vals.zh,
      en: vals.en,
    }));
  }, [grouped]);

  // 按分组 + namespace 二级聚合
  type Section = { groupKey: string; nsKey: string; groupLabel: string; nsLabel: string; leaves: FlatEntry[] };
  const allSections = useMemo<Section[]>(() => {
    const ORDER = ["client", "frontend", "admin"];
    const map: Record<string, Record<string, FlatEntry[]>> = {};
    for (const entry of flatEntries) {
      const parts = entry.compositeKey.split(".");
      const gk = parts[0];
      const nsk = parts.length >= 2 ? parts[1] : gk;
      if (!map[gk]) map[gk] = {};
      if (!map[gk][nsk]) map[gk][nsk] = [];
      map[gk][nsk].push(entry);
    }
    const result: Section[] = [];
    for (const [gk, nsMap] of Object.entries(map)) {
      for (const [nsk, leaves] of Object.entries(nsMap)) {
        result.push({
          groupKey: gk,
          nsKey: nsk,
          groupLabel: TAB_LABELS[gk as TabKey] || gk,
          nsLabel: NS_LABEL_MAP[nsk] || nsk,
          leaves: leaves.sort((a, b) => a.leafKey.localeCompare(b.leafKey)),
        });
      }
    }
    result.sort((a, b) => {
      const ai = ORDER.indexOf(a.groupKey);
      const bi = ORDER.indexOf(b.groupKey);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.nsKey.localeCompare(b.nsKey);
    });
    return result;
  }, [flatEntries]);

  // 当前 tab 的 sections
  const tabSections = useMemo(() => {
    if (activeTab === "all") return allSections;
    return allSections.filter((s) => s.groupKey === activeTab);
  }, [allSections, activeTab]);

  // 分页
  const PAGE_SIZE = 50;
  const totalPages = Math.max(1, Math.ceil(tabSections.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedSections = tabSections.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 各 tab 统计
  const tabStats = useMemo(() => {
    const countByTab = (tab: TabKey) => {
      if (tab === "all") return allSections.reduce((s, sec) => s + sec.leaves.length, 0);
      return allSections.filter((s) => s.groupKey === tab).reduce((s, sec) => s + sec.leaves.length, 0);
    };
    return {
      all: countByTab("all"),
      client: countByTab("client"),
      frontend: countByTab("frontend"),
      admin: countByTab("admin"),
    };
  }, [allSections]);

  // 展开/折叠
  const toggleSection = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: prev[key] !== true }));
  };

  // 事件处理
  const handleValueChange = (locale: string, compositeKey: string, value: string) => {
    setEditMap((prev) => ({ ...prev, [`${locale}|${compositeKey}`]: value }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let saved = 0, failed = 0;
    for (const [mapKey, value] of Object.entries(editMap)) {
      const [locale, compositeKey] = mapKey.split("|");
      const lastDot = compositeKey.lastIndexOf(".");
      if (lastDot === -1) continue;
      try {
        await adminApi.upsertI18n({
          locale,
          namespace: compositeKey.slice(0, lastDot),
          key: compositeKey.slice(lastDot + 1),
          value,
        });
        saved++;
      } catch { failed++; }
    }
    if (failed === 0) {
      toast({ message: `已保存 ${saved} 条`, variant: "success" });
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
    try {
      await adminApi.upsertI18n({
        locale,
        namespace: compositeKey.slice(0, lastDot),
        key: compositeKey.slice(lastDot + 1),
        value,
      });
      setEditMap((prev) => { const next = { ...prev }; delete next[`${locale}|${compositeKey}`]; return next; });
      toast({ message: "已保存", variant: "success" });
      fetchAll();
    } catch { toast({ message: "保存失败", variant: "error" }); }
  };

  const handleCancelEdit = (zhMapKey: string, enMapKey: string) => {
    setEditMap((prev) => { const next = { ...prev }; delete next[zhMapKey]; delete next[enMapKey]; return next; });
    setHasChanges(Object.keys(editMap).length > 1);
  };

  const handleDelete = async (compositeKey: string) => {
    const lastDot = compositeKey.lastIndexOf(".");
    if (lastDot === -1) return;
    if (!confirm(`删除 "${compositeKey}" ？`)) return;
    await Promise.all([
      adminApi.deleteI18n("zh", compositeKey.slice(0, lastDot), compositeKey.slice(lastDot + 1)).catch(() => {}),
      adminApi.deleteI18n("en", compositeKey.slice(0, lastDot), compositeKey.slice(lastDot + 1)).catch(() => {}),
    ]);
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
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `i18n-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = JSON.parse(await file.text()) as Record<string, Record<string, string>>;
      await adminApi.importI18n(data);
      toast({ message: "导入成功", variant: "success" });
      fetchAll();
    } catch { toast({ message: "导入失败", variant: "error" }); }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  return (
    <div className="space-y-4">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Globe className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{translate("admin.i18n.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {translate("admin.i18n.total")} {tabStats.all} {translate("admin.i18n.items")} · {translate("admin.i18n.tab_client")} {tabStats.client} / {translate("admin.i18n.tab_frontend")} {tabStats.frontend} / {translate("admin.i18n.tab_admin")} {tabStats.admin}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload className="h-3 w-3" /> {importing ? translate("admin.i18n.importing") : translate("admin.i18n.import")}
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleExport}>
            <FileJson className="h-3 w-3" /> {translate("admin.i18n.export")}
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> {translate("admin.i18n.refresh")}
          </Button>
          {hasChanges && (
            <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500" onClick={handleSaveAll} disabled={saving}>
              <Save className="h-3 w-3" /> {saving ? translate("admin.i18n.saving") : `${translate("admin.i18n.save")} (${Object.keys(editMap).length})`}
            </Button>
          )}
          <AddTranslationButton
            namespaces={namespaces}
            onAdd={async (data) => { try { await adminApi.upsertI18n(data); toast({ message: "添加成功", variant: "success" }); fetchAll(); } catch { toast({ message: "添加失败", variant: "error" }); } }}
          />
        </div>
      </div>

      {/* Tab 切换 + 统计 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center rounded-xl border bg-muted/50 p-0.5">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); setSearchKey(""); }}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {TAB_LABELS[tab]}
              <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono ml-0.5">
                {tabStats[tab]}
              </Badge>
            </button>
          ))}
        </div>

        {/* 在新标签页打开 */}
        {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
          <Button
            key={tab}
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground px-2"
            onClick={() => window.open(`/admin/i18n?tab=${tab}`, "_blank")}
          >
            <ExternalLink className="h-3 w-3" />
            {TAB_LABELS[tab]}
          </Button>
        ))}

      </div>

      {/* 搜索栏，紧贴翻译列表 Card */}
      <Card className="border-0 shadow-sm bg-card/80">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input className="h-8 pl-8 pr-3 rounded-lg text-xs" placeholder={translate("admin.i18n.search_placeholder")} value={searchKey} onChange={(e) => { setSearchKey(e.target.value); setPage(1); }} />
          </div>
          <div className="inline-flex items-center rounded-lg border bg-muted/50 p-0.5 shrink-0">
            <button onClick={() => setViewMode("table")} className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === "table" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              <Table2 className="h-3 w-3" /> {translate("admin.i18n.view_table")}
            </button>
            <button onClick={() => setViewMode("split")} className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === "split" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              <SplitSquareHorizontal className="h-3 w-3" /> {translate("admin.i18n.view_split")}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 翻译列表 */}
      <Card className="border-0 shadow-sm bg-card/80">
        <CardHeader className="pb-0 px-4 pt-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {translate("admin.i18n.translation_list")}
              {hasChanges && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-xs font-normal">
                  {Object.keys(editMap).length} {translate("admin.i18n.pending_save")}
                </Badge>
              )}
            </CardTitle>
          </div>
          {viewMode === "table" && (
            <div className="mt-3 grid grid-cols-12 gap-3 px-1">
              <div className="col-span-4 text-xs font-semibold text-muted-foreground uppercase">{translate("admin.i18n.key")}</div>
              <div className="col-span-4 text-xs font-semibold text-blue-500 uppercase">{translate("admin.i18n.chinese")}</div>
              <div className="col-span-3 text-xs font-semibold text-emerald-500 uppercase">{translate("admin.i18n.english")}</div>
              <div className="col-span-1" />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
              {translate("admin.i18n.loading")}
            </div>
          ) : tabSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-2">
              <Globe className="h-10 w-10 opacity-20" />
              <p className="font-medium">{translate("admin.i18n.no_data")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {paginatedSections.map((section) => {
                const sectionKey = `${section.groupKey}|${section.nsKey}`;
                return (
                  <I18nSection
                    key={sectionKey}
                    groupLabel={section.groupLabel}
                    nsLabel={section.nsLabel}
                    nsKey={section.nsKey}
                    leaves={section.leaves}
                    isCollapsed={collapsedGroups[sectionKey] === true}
                    onToggle={() => toggleSection(sectionKey)}
                    viewMode={viewMode}
                    editMap={editMap}
                    onValueChange={handleValueChange}
                    onSaveOne={handleSaveOne}
                    onDelete={handleDelete}
                    onCancelEdit={handleCancelEdit}
                  />
                );
              })}
            </div>
          )}
        </CardContent>

        {/* 分页 */}
        {tabSections.length > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between bg-muted/10">
            <p className="text-xs text-muted-foreground">
              {translate("admin.i18n.page")} {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, tabSections.length)} {translate("admin.i18n.items")}，{translate("admin.i18n.total")} {tabSections.length} {translate("admin.i18n.items")}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(1)} disabled={safePage === 1}><ChevronLast className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <span className="text-xs px-2 font-medium">{safePage} / {totalPages}</span>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}><ChevronLast className="h-3.5 w-3.5 rotate-180" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
