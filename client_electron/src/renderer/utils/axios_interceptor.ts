/**
 * 文件名: axios_interceptor.ts
 * 作者: wuhao
 * 日期: 2026-04-19 00:40:00
 * 描述: axios 拦截器，处理 401 认证过期
 */
import axios from 'axios'
import { use_auth_store } from '@/store/auth'

/**
 * 拦截器是否已设置
 */
let interceptor_set = false

/**
 * 设置 axios 拦截器
 * 处理 401 认证过期
 */
export const setup_axios_interceptors = () => {
  if (interceptor_set) return
  interceptor_set = true

  // 响应拦截器
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // 401 错误，提示用户重新登录
        const should_relogin = confirm('登录已过期，请重新登录')
        if (should_relogin) {
          // 清除认证状态
          use_auth_store.getState().logout()
          // 清除本地存储的 token
          window.electron_api.config_set('access_token', null)
          // 跳转到登录页
          window.location.hash = '#/login'
        }
      }
      return Promise.reject(error)
    }
  )
}

