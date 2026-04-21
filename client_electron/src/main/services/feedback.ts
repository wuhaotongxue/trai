/**
 * 文件名: feedback.ts
 * 作者: wuhao
 * 日期: 2026-04-14 13:35:00
 * 描述: 用户反馈服务
 */
import log from 'electron-log'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'
import { api_client } from '../platform/api_client'

export const feedback_service = {
  /**
   * 提交用户反馈
   * @param data - 反馈数据
   * @param data.type - 反馈类型
   * @param data.title - 反馈标题
   * @param data.content - 反馈内容
   * @param data.contact - 联系方式（可选）
   * @returns 提交结果
   */
  async submit(data: { type: string, title: string, content: string, contact?: string }) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.system_feedback_submit)
      const res = await api_client.post(url, data)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('feedback submit failed:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail?.message || error.response?.data?.msg || '反馈提交失败, 请检查网络或服务器配置' 
      }
    }
  }
}
