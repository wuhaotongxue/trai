/**
 * 文件名: admin.ts
 * 作者: wuhao
 * 日期: 2026-05-24 16:30:00
 * 描述: 客户端管理员服务
 */
import { api_client } from '../platform/api_client'
import { ApiEndpoints } from '../platform/api_endpoints'

export class AdminService {
  /**
   * 获取大屏统计数据
   */
  async get_api_usage(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = ApiEndpoints.admin_dashboard_api_usage
      const res = await api_client.get(url)
      return { success: true, data: res.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message || '获取大屏统计数据失败'
      }
    }
  }
}

export const admin_service = new AdminService()
