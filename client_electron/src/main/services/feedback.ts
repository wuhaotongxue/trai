/**
 * 文件名: feedback.ts
 * 作者: wuhao
 * 日期: 2026-04-14 13:35:00
 * 描述: 用户反馈服务
 */
import axios from 'axios'
import log from 'electron-log'
import { config_store } from '../platform/config_store'

const get_api_base_url = () => {
  return config_store.get('api_url', 'http://127.0.0.1:5666')
}

const api_client = axios.create()

api_client.interceptors.request.use((config) => {
  const token = config_store.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const feedback_service = {
  async submit(data: { type: string, title: string, content: string, contact?: string }) {
    try {
      const url = `${get_api_base_url()}/api/system/feedback/submit`
      const res = await api_client.post(url, data)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('feedback submit failed:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail?.message || error.response?.data?.msg || '反馈提交失败，请检查网络或服务器配置' 
      }
    }
  }
}
