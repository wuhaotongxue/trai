/**
 * 管理后台翻译统一导出
 */

import { ADMIN_ZH } from "./zh";
import { ADMIN_EN } from "./en";

export const ADMIN_TRANSLATIONS = {
  zh: ADMIN_ZH,
  en: ADMIN_EN,
} as const;

export type AdminLocale = keyof typeof ADMIN_TRANSLATIONS;
export type AdminTranslations = typeof ADMIN_TRANSLATIONS;
