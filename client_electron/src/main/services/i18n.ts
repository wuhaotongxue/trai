/**
 * 文件名: i18n.ts
 * 作者: wuhao
 * 日期: 2026-04-24 16:30:00
 * 描述: 客户端国际化服务, 调用后端 API 获取翻译
 */
import log from 'electron-log'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'
import { api_client } from '../platform/api_client'

export type Locale = 'zh' | 'en'

interface TranslationsResponse {
  translations: Record<string, string>
  locale: string
}

/**
 * 默认翻译（当后端不可用时回退）
 */
const default_translations: Record<Locale, Record<string, string>> = {
  zh: {
    app_name: 'TRAI',
    loading: '正在加载应用...',
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    close: '关闭',
    refresh: '刷新',
    clear: '清除',
    logout: '退出',
    version: '版本',
    collapse: '收起',
    expand: '展开',
    search: '搜索',
    upload: '上传',
    download: '下载',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    rename: '重命名',
    move: '移动',
  },
  en: {
    app_name: 'TRAI',
    loading: 'Loading application...',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    refresh: 'Refresh',
    clear: 'Clear',
    logout: 'Logout',
    version: 'Version',
    collapse: 'Collapse',
    expand: 'Expand',
    search: 'Search',
    upload: 'Upload',
    download: 'Download',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    rename: 'Rename',
    move: 'Move',
  },
}

/**
 * i18n 服务（主进程使用）
 */
export const i18n_service = {
  /**
   * 从后端获取翻译
   * @param locale 语言代码
   * @returns 翻译字典或 null
   */
  async get_translations(locale: Locale): Promise<Record<string, string> | null> {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.i18n_public.replace('{locale}', locale))
      log.info(`Fetching translations for locale: ${locale} from ${url}`)
      const res = await api_client.get(url)

      if (res.data?.translations) {
        log.info(`Successfully fetched ${Object.keys(res.data.translations).length} translations for ${locale}`)
        return res.data.translations as Record<string, string>
      }
      return null
    } catch (error: any) {
      log.warn(`Failed to fetch translations for ${locale}:`, error.message)
      return null
    }
  },

  /**
   * 获取所有语言的翻译
   * @returns 包含所有语言翻译的对象
   */
  async get_all_translations(): Promise<{ zh: Record<string, string>; en: Record<string, string> }> {
    const [zh_trans, en_trans] = await Promise.all([
      this.get_translations('zh'),
      this.get_translations('en'),
    ])

    return {
      zh: zh_trans || default_translations.zh,
      en: en_trans || default_translations.en,
    }
  },
}
