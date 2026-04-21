/**
 * 文件名: api_client.ts
 * 作者: wuhao
 * 日期: 2026-04-19 02:20:00
 * 描述: 共享的 API 客户端, 带有完整的请求和响应拦截器
 */
import axios from 'axios'
import log from 'electron-log'
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { config_store } from './config_store'
import { ApiUrl } from './api_url'
import { ApiEndpoints } from './api_endpoints'

let is_refreshing = false
let refresh_subscribers: ((token: string | null) => void)[] = []

function on_refreshed(token: string | null) {
  refresh_subscribers.forEach((cb) => cb(token))
  refresh_subscribers = []
}

function add_refresh_subscriber(cb: (token: string | null) => void) {
  refresh_subscribers.push(cb)
}

// 创建共享的 axios 实例
export const api_client = axios.create({
  timeout: 10000, // 10 秒超时
  timeoutErrorMessage: '请求超时, 请检查网络连接或服务器状态'
})

// 请求拦截器 - 添加 Token
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
    const original_request = error.config

    if (error.response?.status === 401 && !original_request._retry) {
      // 避免无限循环
      original_request._retry = true

      const refresh_token = config_store.get('refresh_token')
      
      // 如果没有刷新令牌, 或者当前请求本身就是刷新令牌的请求
      if (!refresh_token || original_request.url?.includes('/auth/refresh') || original_request.url?.includes('/auth/login')) {
        return handle_logout_redirect(error)
      }

      if (!is_refreshing) {
        is_refreshing = true
        try {
          log.info('Token expired, attempting to refresh token...')
          const refresh_url = ApiUrl.build_api_url(ApiEndpoints.auth_refresh)
          
          // 注意这里需要直接用 axios 发请求, 避免触发自身的拦截器死循环
          const res = await axios.post(refresh_url, { refresh_token })
          
          if (res.data?.access_token) {
            const new_access_token = res.data.access_token
            const new_refresh_token = res.data.refresh_token
            
            // 保存新令牌
            config_store.set('access_token', new_access_token)
            if (new_refresh_token) {
              config_store.set('refresh_token', new_refresh_token)
            }
            
            log.info('Token refresh successful')
            is_refreshing = false
            on_refreshed(new_access_token)
            
            // 重试原请求
            original_request.headers.Authorization = `Bearer ${new_access_token}`
            return api_client(original_request)
          } else {
            throw new Error('Refresh token response invalid')
          }
        } catch (refresh_error) {
          log.error('Token refresh failed:', refresh_error)
          is_refreshing = false
          on_refreshed(null) // 刷新失败时通知所有挂起的请求
          return handle_logout_redirect(error)
        }
      } else {
        // 正在刷新时, 将其他请求挂起
        return new Promise((resolve, reject) => {
          add_refresh_subscriber((token: string | null) => {
            if (token) {
              original_request.headers.Authorization = `Bearer ${token}`
              resolve(api_client(original_request))
            } else {
              reject(error)
            }
          })
        })
      }
    }
    return Promise.reject(error)
  }
)

async function handle_logout_redirect(error: any) {
  log.warn('Token expired or invalid, showing re-login prompt')
  
  // 清理无效 token
  config_store.set('access_token', '')
  config_store.set('refresh_token', '')
  
  // 获取当前窗口
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    // 显示提示对话框
    const result = await dialog.showMessageBox(win, {
      type: 'warning',
      title: '登录已过期',
      message: '您的登录已过期, 请重新登录',
      detail: 'Token 有效期 30 分钟, 过期后需要重新登录以继续使用',
      buttons: ['去登录'],
      defaultId: 0
    })
    
    if (result.response === 0) {
      // 通知渲染进程跳转到登录页面
      win.webContents.send('auth:need-login')
    }
  }
  return Promise.reject(error)
}
