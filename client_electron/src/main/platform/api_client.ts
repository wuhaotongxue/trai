/**
 * 文件名: api_client.ts
 * 作者: wuhao
 * 日期: 2026-04-19 02:20:00
 * 描述: 共享的 API 客户端，带有完整的请求和响应拦截器
 */
import axios from 'axios'
import log from 'electron-log'
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { config_store } from './config_store'

// 创建共享的 axios 实例
export const api_client = axios.create({
  timeout: 10000, // 10 秒超时
  timeoutErrorMessage: '请求超时，请检查网络连接或服务器状态'
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
