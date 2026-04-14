/**
 * 文件名: agent.ts
 * 作者: wuhao
 * 日期: 2026-04-14 08:45:00
 * 描述: 客户端 Agent 对话服务层
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

export const agent_service = {
  /**
   * 发送消息给 Agent
   */
  async chat(session_id: string, message: string) {
    try {
      const url = `${get_api_base_url()}/api/agent/chat`
      const payload = {
        session_id,
        message,
        stream: false,
        role: 'user'
      }
      
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('agent_chat failed:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail?.message || '对话请求失败' 
      }
    }
  }
}
