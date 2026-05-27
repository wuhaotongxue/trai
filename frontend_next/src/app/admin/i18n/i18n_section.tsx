/**
 * i18n_section.tsx
 * 渲染一个可折叠的 namespace 分区：头 + 叶子行列表
 */

"use client";

import React from "react";
import { Check, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

type FlatEntry = {
  compositeKey: string;
  leafKey: string;
  zh: string | null;
  en: string | null;
};

type Props = {
  groupLabel: string;       // 客户端 / 前端 / 管理端
  nsLabel: string;          // namespace 中文名
  nsKey: string;            // namespace 原始名
  leaves: FlatEntry[];
  isCollapsed: boolean;
  onToggle: () => void;
  viewMode: "table" | "split";
  editMap: Record<string, string>;
  onValueChange: (locale: string, compositeKey: string, value: string) => void;
  onSaveOne: (locale: string, compositeKey: string, value: string) => Promise<void>;
  onDelete: (compositeKey: string) => Promise<void>;
  onCancelEdit: (zhMapKey: string, enMapKey: string) => void;
};

export default function I18nSection({
  groupLabel,
  nsLabel,
  leaves,
  isCollapsed,
  onToggle,
  viewMode,
  editMap,
  onValueChange,
  onSaveOne,
  onDelete,
  onCancelEdit,
}: Props) {
  return (
    <div>
      {/* 二级 namespace 行 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 py-2 px-5 bg-muted/30 hover:bg-muted/50 border-b border-border/25 transition-colors text-left"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-900 dark:text-white font-bold transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
        />
        <span className="text-[10px] text-violet-600 font-semibold shrink-0">{groupLabel}</span>
        <span className="text-slate-900 dark:text-white font-bold/30 text-[10px] shrink-0">›</span>
        <span className="text-xs font-semibold text-foreground">{nsLabel}</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono ml-1">
          {leaves.length}
        </Badge>
      </button>

      {/* 叶子行 */}
      {!isCollapsed && leaves.map((entry) => {
        const zhMapKey = `zh|${entry.compositeKey}`;
        const enMapKey = `en|${entry.compositeKey}`;
        const zhVal = editMap[zhMapKey] ?? entry.zh ?? "";
        const enVal = editMap[enMapKey] ?? entry.en ?? "";
        const isZhEditing = zhMapKey in editMap;
        const isEnEditing = enMapKey in editMap;

        if (viewMode === "table") {
          return (
            <div key={entry.compositeKey} className="group grid grid-cols-12 gap-3 px-10 py-3 items-start hover:bg-muted/30 transition-colors border-b border-border/20">
              {/* 键 */}
              <div className="col-span-4 flex flex-col gap-0.5 min-w-0">
                <p className="text-xs font-mono font-medium text-foreground truncate">{entry.leafKey}</p>
                <p className="text-[10px] text-slate-900 dark:text-white font-bold/40 truncate">
                  {groupLabel} › {nsLabel}
                </p>
              </div>

              {/* 中文 */}
              <div className="col-span-4">
                <textarea
                  className={`min-h-[36px] max-h-[100px] w-full px-2.5 py-1.5 rounded-none-none border text-sm font-mono resize-none focus:ring-1 ${isZhEditing ? "border-blue-500/50 bg-blue-500/5" : "border-border/60 bg-white dark:bg-slate-900 focus:border-blue-500/30"}`}
                  value={zhVal}
                  onChange={(e) => onValueChange("zh", entry.compositeKey, e.target.value)}
                  placeholder="中文..."
                  rows={2}
                />
              </div>

              {/* 英文 */}
              <div className="col-span-3">
                <textarea
                  className={`min-h-[36px] max-h-[100px] w-full px-2.5 py-1.5 rounded-none-none border text-sm font-mono resize-none focus:ring-1 ${isEnEditing ? "border-emerald-500/50 bg-cyan-500/5" : "border-border/60 bg-white dark:bg-slate-900 focus:border-emerald-500/30"}`}
                  value={enVal}
                  onChange={(e) => onValueChange("en", entry.compositeKey, e.target.value)}
                  placeholder="English..."
                  rows={2}
                />
              </div>

              {/* 操作 */}
              <div className="col-span-1 flex items-center gap-1 justify-end pt-0.5">
                {(isZhEditing || isEnEditing) && (
                  <>
                    <button onClick={() => { if (isZhEditing) void onSaveOne("zh", entry.compositeKey, zhVal); if (isEnEditing) void onSaveOne("en", entry.compositeKey, enVal); }} className="w-7 h-7 rounded-none-none flex items-center justify-center text-cyan-600 hover:bg-cyan-500/10" title="保存">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onCancelEdit(zhMapKey, enMapKey)} className="w-7 h-7 rounded-none-none flex items-center justify-center text-slate-900 dark:text-white font-bold hover:bg-muted" title="取消">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                <button onClick={() => void onDelete(entry.compositeKey)} className="w-7 h-7 rounded-none-none flex items-center justify-center text-red-400/60 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all" title="删除">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        }

        // split 视图
        return (
          <div key={entry.compositeKey} className="px-10 py-4 border-b border-border/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 flex-1">
                <p className="text-[10px] text-slate-900 dark:text-white font-bold/40">{groupLabel} › {nsLabel}</p>
                <span className="text-slate-900 dark:text-white font-bold/30 text-[10px]">›</span>
                <span className="text-sm font-mono font-medium">{entry.leafKey}</span>
              </div>
              {(isZhEditing || isEnEditing) && (
                <>
                  <button onClick={() => { if (isZhEditing) void onSaveOne("zh", entry.compositeKey, zhVal); if (isEnEditing) void onSaveOne("en", entry.compositeKey, enVal); }} className="w-7 h-7 rounded-none-none flex items-center justify-center text-cyan-600 hover:bg-cyan-500/10">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onCancelEdit(zhMapKey, enMapKey)} className="w-7 h-7 rounded-none-none flex items-center justify-center text-slate-900 dark:text-white font-bold hover:bg-muted">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button onClick={() => void onDelete(entry.compositeKey)} className="w-7 h-7 rounded-none-none flex items-center justify-center text-red-400/60 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-blue-500 uppercase mb-1.5">🇨🇳 中文</p>
                <textarea
                  className={`w-full min-h-[60px] px-3 py-2 rounded-none-none border text-sm font-mono resize-none focus:ring-1 ${isZhEditing ? "border-blue-500/50 bg-blue-500/5" : "border-border/60 bg-white dark:bg-slate-900 focus:border-blue-500/30"}`}
                  value={zhVal}
                  onChange={(e) => onValueChange("zh", entry.compositeKey, e.target.value)}
                  placeholder="中文..."
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-cyan-500 uppercase mb-1.5">🇺🇸 English</p>
                <textarea
                  className={`w-full min-h-[60px] px-3 py-2 rounded-none-none border text-sm font-mono resize-none focus:ring-1 ${isEnEditing ? "border-emerald-500/50 bg-cyan-500/5" : "border-border/60 bg-white dark:bg-slate-900 focus:border-emerald-500/30"}`}
                  value={enVal}
                  onChange={(e) => onValueChange("en", entry.compositeKey, e.target.value)}
                  placeholder="English..."
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
