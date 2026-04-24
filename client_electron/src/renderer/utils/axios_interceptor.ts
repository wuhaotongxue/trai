/**
 * 文件名: axios_interceptor.ts
 * 作者: wuhao
 * 日期: 2026-04-19 00:40:00
 * 描述: axios 拦截器, 处理 401 认证过期
 */
import axios from 'axios'

/**
 * 拦截器是否已设置
 */
let interceptor_set = false

/**
 * 是否正在处理 401 重登录中（防止重复触发）
 */
let is_relogging = false

/**
 * 当前 API 基础地址
 */
let api_base_url = 'http://127.0.0.1:5666'

/**
 * 获取 axios 实例（带 baseURL）
 */
export const get_axios_instance = () => {
  const instance = axios.create({
    baseURL: api_base_url,
  })
  return instance
}

/**
 * 初始化 API 基础地址（从配置读取）
 */
export const init_api_base_url = async () => {
  if (window.electron_api?.config_get) {
    try {
      const res = await window.electron_api.config_get('api_url', 'http://127.0.0.1:5666')
      if (res.success && res.data) {
        api_base_url = res.data
        axios.defaults.baseURL = api_base_url
        console.info('[api] API baseURL set to:', api_base_url)
      }
    } catch (e) {
      console.warn('[api] Failed to load api_url config, using default')
    }
  }
}

/**
 * 获取当前 API 基础地址
 */
export const get_api_base_url = () => api_base_url

/**
 * 判断是否为初始化接口（这些接口 401 不应该触发刷新页面）
 */
const is_init_api = (url: string | undefined): boolean => {
  if (!url) return false
  const init_patterns = [
    '/auth/me',
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
  ]
  return init_patterns.some((pattern) => url.includes(pattern))
}

/**
 * 处理登录过期 - 清除状态并刷新页面让路由守卫处理跳转
 */
const handle_auth_expired = () => {
  // 防止重复触发
  if (is_relogging) return
  is_relogging = true

  console.warn('[api] 401 unauthorized, handling relogin...')

  // 清除认证状态
  use_auth_store.getState().logout()

  // 清除 token
  if (window.electron_api?.config_set) {
    window.electron_api.config_set('access_token', null).catch(() => {})
  }

  // 延迟刷新，等待状态更新完成
  setTimeout(() => {
    window.location.reload()
  }, 100)
}

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
        baseURL: config.baseURL,
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

      // 只对非初始化接口的 401 处理
      if (error.response?.status === 401 && !is_init_api(error.config?.url)) {
        handle_auth_expired()
      }

      return Promise.reject(error)
    }
  )
}

// 延迟导入避免循环依赖
import { use_auth_store } from '@/store/auth'
