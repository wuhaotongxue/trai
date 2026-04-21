/**
 * 文件名: api_url.ts
 * 作者: wuhao
 * 日期: 2026-04-16 10:41:41
 * 描述: 客户端 API 地址治理, 统一管理 base_url 与 URL 拼接逻辑.
 */
import { config_store } from './config_store'

/**
 * API 地址工具类
 * 统一管理 base_url 与 URL 拼接逻辑
 */
export class ApiUrl {
  /**
   * 获取 API 基础地址
   * @returns API 基础地址
   */
  static get_api_base_url(): string {
    const raw = String(config_store.get('api_url', 'http://192.168.98.72:5666')).trim()
    if (!raw) return 'http://192.168.98.72:5666'
    return raw.replace(/\/+$/, '')
  }

  /**
   * 构建完整的 API 地址
   * @param path API 路径
   * @returns 完整的 API 地址
   */
  static build_api_url(path: string): string {
    const base = ApiUrl.get_api_base_url()
    const normalized_path = path.startsWith('/') ? path : `/${path}`
    return `${base}${normalized_path}`
  }

  /**
   * 根据环境变量构建 API 基础地址
   * @returns API 基础地址
   */
  static build_api_base_url_by_env(): string {
    const raw = String(process.env.VITE_API_URL || '').trim()
    if (!raw) return ApiUrl.get_api_base_url()
    return raw.replace(/\/+$/, '')
  }
}
