/**
 * 客户端翻译统一导出
 */

import { CLIENT_ZH } from "./zh";
import { CLIENT_EN } from "./en";

export const CLIENT_TRANSLATIONS = {
  zh: CLIENT_ZH,
  en: CLIENT_EN,
} as const;

export type ClientLocale = keyof typeof CLIENT_TRANSLATIONS;
