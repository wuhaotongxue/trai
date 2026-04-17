/**
 * 文件名: api_url.ts
 * 作者: wuhao
 * 日期: 2026-04-16 10:41:41
 * 描述: 客户端 API 地址治理, 统一管理 base_url 与 URL 拼接逻辑.
 */
import { config_store } from './config_store'

export class ApiUrl {
  static get_api_base_url(): string {
    const raw = String(config_store.get('api_url', 'http://127.0.0.1:5666')).trim()
    if (!raw) return 'http://127.0.0.1:5666'
    return raw.replace(/\/+$/, '')
  }

  static build_api_url(path: string): string {
    const base = ApiUrl.get_api_base_url()
    const normalized_path = path.startsWith('/') ? path : `/${path}`
    return `${base}${normalized_path}`
  }

  static build_api_base_url_by_env(): string {
    const raw = String(process.env.VITE_API_URL || '').trim()
    if (!raw) return ApiUrl.get_api_base_url()
    return raw.replace(/\/+$/, '')
  }
}
