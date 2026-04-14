/**
 * 文件名: auth.ts
 * 作者: wuhao
 * 日期: 2026-04-13 21:15:00
 * 描述: 客户端用户认证服务层
 */
import axios from 'axios'
import log from 'electron-log'
import { config_store } from '../platform/config_store'

const get_api_base_url = () => {
  return config_store.get('api_url', 'http://127.0.0.1:5666')
}

// 创建 axios 实例并配置请求拦截器
const api_client = axios.create()

api_client.interceptors.request.use((config) => {
  const token = config_store.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const auth_service = {
  async login(params: any) {
    try {
      const url = `${get_api_base_url()}/api/auth/login`
      const res = await api_client.post(url, params)
      
      // 登录成功后持久化 token
      if (res.data?.access_token) {
        config_store.set('access_token', res.data.access_token)
      }
      
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('login failed:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail?.message || '登录失败，请检查网络或服务器配置' 
      }
    }
  },

  async register(params: any) {
    try {
      const url = `${get_api_base_url()}/api/auth/register`
      const res = await api_client.post(url, params)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('register failed:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail?.message || '注册失败，请检查网络或服务器配置' 
      }
    }
  },

  async logout() {
    try {
      // 也可以在此处调用服务端的登出接口
      const url = `${get_api_base_url()}/api/auth/logout`
      await api_client.post(url).catch(() => {
        log.warn('server logout failed, but local token will be cleared anyway')
      })
    } finally {
      // 清理本地 token
      config_store.set('access_token', '')
      return { success: true }
    }
  }
}
