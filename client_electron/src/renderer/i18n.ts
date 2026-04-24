/**
 * 文件名: i18n.ts
 * 作者: wuhao
 * 日期: 2026-04-23 21:30:00
 * 描述: TRAI 桌面客户端国际化模块入口，支持中文与英文双语切换
 */
export type { Locale } from './i18n/types'
export type { TranslationKey } from './i18n/store'
export { translations } from './i18n/store'
export { t, use_t, get_locale, set_locale, use_locale } from './i18n/store'
export { AnimatedTranslation, Trans, TranslationWrapper } from './i18n/animated_translation'
