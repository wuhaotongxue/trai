/**
 * 文件名: locale.ts
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: 客户端语言状态管理
 */
import { create } from 'zustand'
import type { Locale } from '@/i18n/types'

interface LocaleState {
  locale: Locale
  set_locale: (locale: Locale) => void
}

export const use_locale_store = create<LocaleState>((set) => ({
  locale: 'zh',
  set_locale: (locale) => set({ locale }),
}))
