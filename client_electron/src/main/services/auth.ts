/**
 * 文件名: auth.ts
 * 作者: wuhao
 * 日期: 2026-04-13 21:15:00
 * 描述: 客户端用户认证服务层
 */
import log from 'electron-log'
import { config_store } from '../platform/config_store'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'
import { api_client } from '../platform/api_client'

export const auth_service = {
  /**
   * 用户登录
   * @param params - 登录参数（用户名/密码等）
   * @returns 登录结果，包含 access_token
   */
  async login(params: any) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.auth_login)
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

  /**
   * 用户注册
   * @param params - 注册参数（用户名/密码等）
   * @returns 注册结果
   */
  async register(params: any) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.auth_register)
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

  /**
   * 修改密码
   * @param params - 参数对象
   * @param params.old_password - 旧密码
   * @param params.new_password - 新密码
   * @returns 修改结果
   */
  async change_password(params: { old_password: string; new_password: string }) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.auth_password_change)
      const res = await api_client.post(url, params)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('change_password failed:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.detail?.message || error.response?.data?.message || '密码修改失败, 请检查网络或服务器配置'
      }
    }
  },

  /**
   * 用户登出
   * @returns 登出结果
   */
  async logout() {
    try {
      // 也可以在此处调用服务端的登出接口
      const url = ApiUrl.build_api_url(ApiEndpoints.auth_logout)
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
