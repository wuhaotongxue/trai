/**
 * 文件名: axios_interceptor.ts
 * 作者: wuhao
 * 日期: 2026-04-19 00:40:00
 * 描述: axios 拦截器, 处理 401 认证过期
 */
import axios from 'axios'
import { use_auth_store } from '@/store/auth'

/**
 * 拦截器是否已设置
 */
let interceptor_set = false

/**
 * 设置 axios 拦截器
 * 处理 401 认证过期，记录所有请求/响应日志
 */
export const setup_axios_interceptors = () => {
  if (interceptor_set) return
  interceptor_set = true

  // 请求拦截器 - 打印所有请求
  axios.interceptors.request.use(
    (config) => {
      console.info('[api] request', {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
        data: config.data,
      })
      return config
    },
    (error) => {
      console.error('[api] request error', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器 - 打印所有响应 + 401 处理
  axios.interceptors.response.use(
    (response) => {
      console.info('[api] response', {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        data: response.data,
      })
      return response
    },
    (error) => {
      console.error('[api] response error', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      if (error.response?.status === 401) {
        const should_relogin = confirm('登录已过期, 请重新登录')
        if (should_relogin) {
          use_auth_store.getState().logout()
          window.electron_api.config_set('access_token', null)
          window.location.hash = '#/login'
        }
      }
      return Promise.reject(error)
    }
  )
}
