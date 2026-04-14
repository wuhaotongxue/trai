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

export const auth_service = {
  async login(params: any) {
    try {
      const url = `${get_api_base_url()}/api/auth/login`
      const res = await axios.post(url, params)
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
      const res = await axios.post(url, params)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('register failed:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail?.message || '注册失败，请检查网络或服务器配置' 
      }
    }
  }
}
