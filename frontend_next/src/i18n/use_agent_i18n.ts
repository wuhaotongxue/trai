/**
 * 文件名: i18n/use_agent_i18n.ts
 * 作者: wuhao
 * 日期: 2026-05-04 21:00:00
 * 描述: Agent组件国际化自定义Hook
 */

"use client";

import { useContext } from "react";
import { I18nContext } from "@/i18n/i18n_context";
import { agentTranslations } from "./agent_en";
import { agentZhTranslations } from "./agent_zh";

type TranslationMap = typeof agentTranslations;

export function useAgentI18n() {
  const context = useContext(I18nContext);
  const locale = context?.locale || "zh";

  const translations: TranslationMap =
    locale === "zh" ? (agentZhTranslations as unknown as TranslationMap) : agentTranslations;

  const t = useCallback(
    <K extends keyof TranslationMap>(key: K): TranslationMap[K] => {
      return translations[key];
    },
    [translations]
  );

  const tc = useCallback(
    <K1 extends keyof TranslationMap, K2 extends keyof TranslationMap[K1]>(
      key1: K1,
      key2: K2
    ): TranslationMap[K1][K2] => {
      const section = translations[key1];
      if (section && typeof section === "object" && key2 in section) {
        return (section as Record<string, unknown>)[key2] as TranslationMap[K1][K2];
      }
      return String(key2) as unknown as TranslationMap[K1][K2];
    },
    [translations]
  );

  return {
    locale,
    t,
    tc,
    isZh: locale === "zh",
    isEn: locale === "en",
  };
}

function useCallback<T extends (...args: never[]) => unknown>(
  fn: T,
  deps: readonly unknown[]
): T {
  return fn;
}
