/**
 * add_translation_button.tsx
 * 新增翻译弹窗按钮
 */

"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  namespaces: string[];
  onAdd: (data: { locale: string; namespace: string; key: string; value: string }) => Promise<void>;
};

export default function AddTranslationButton({ namespaces, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState("zh");
  const [ns, setNs] = useState("");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!ns || !key) return;
    void onAdd({ locale, namespace: ns, key, value });
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
          <div className="absolute inset-0 bg-black/40 " onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border rounded-none-none shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-violet-500" />
              新增翻译
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-900 dark:text-white font-bold">语言</Label>
                <Select value={locale} onValueChange={(v) => v && setLocale(v)}>
                  <SelectTrigger className="h-9 rounded-none-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">🇨🇳 中文</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-900 dark:text-white font-bold">命名空间</Label>
                <Input
                  className="h-9 font-mono text-sm rounded-none-none"
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
                <Label className="text-xs font-medium text-slate-900 dark:text-white font-bold">翻译键 (Key)</Label>
                <Input
                  className="h-9 font-mono text-sm rounded-none-none"
                  placeholder="例如: hero.title"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-900 dark:text-white font-bold">翻译值</Label>
                <textarea
                  className="min-h-[80px] rounded-none-none text-sm font-mono w-full px-3 py-2 border border-input bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="输入翻译文本..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="h-9 rounded-none-none" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button
                size="sm"
                className="h-9 rounded-none-none bg-violet-600 hover:bg-violet-500"
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
