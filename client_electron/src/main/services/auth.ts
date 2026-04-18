/**
 * 文件名: auth.ts
 * 作者: wuhao
 * 日期: 2026-04-13 21:15:00
 * 描述: 客户端用户认证服务层
 */
import axios from 'axios'
import log from 'electron-log'
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { config_store } from '../platform/config_store'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'

// 创建 axios 实例并配置请求拦截器
const api_client = axios.create()

api_client.interceptors.request.use((config) => {
  const token = config_store.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 处理 401 Token 过期
api_client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      log.warn('Token expired or invalid, showing re-login prompt')
      
      // 清理无效 token
      config_store.set('access_token', '')
      
      // 获取当前窗口
      const win = BrowserWindow.getFocusedWindow()
      if (win) {
        // 显示提示对话框
        const result = await dialog.showMessageBox(win, {
          type: 'warning',
          title: '登录已过期',
          message: '您的登录已过期，请重新登录',
          detail: 'Token 有效期 30 分钟，过期后需要重新登录以继续使用',
          buttons: ['去登录'],
          defaultId: 0
        })
        
        if (result.response === 0) {
          // 通知渲染进程跳转到登录页面
          win.webContents.send('auth:need-login')
        }
      }
    }
    return Promise.reject(error)
  }
)

export const auth_service = {
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
