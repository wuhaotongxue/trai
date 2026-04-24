/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-25 03:16:00
 * 描述: TRAI 桌面客户端国际化模块主入口
 */

// Re-export types
export type { Locale } from './types'

// Re-export functions
export { t, use_t, get_locale, set_locale } from './store'
export { use_locale } from './store'

// Re-export animated components
export { AnimatedTranslation, Trans, TranslationWrapper } from './animated_translation'
