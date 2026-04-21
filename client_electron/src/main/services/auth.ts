/**
 * 文件名: auth.ts
 * 作者: wuhao
 * 日期: 2026-04-13 21:15:00
 * 描述: 客户端用户认证服务层
 */
import log from 'electron-log'
import { BrowserWindow } from 'electron'
import { config_store } from '../platform/config_store'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'
import { api_client } from '../platform/api_client'

export const auth_service = {
  /**
   * 用户登录
   * @param params - 登录参数（用户名/密码等）
   * @returns 登录结果, 包含 access_token
   */
  async login(params: any) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.auth_login)
      log.info(`login request to: ${url}`)
      const res = await api_client.post(url, params)

      // 登录成功后持久化 token
      if (res.data?.access_token) {
        config_store.set('access_token', res.data.access_token)
      }
      if (res.data?.refresh_token) {
        config_store.set('refresh_token', res.data.refresh_token)
      }

      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('login failed:', error.response?.data || error.message)

      // 处理不同类型的错误
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          error: '连接超时, 请检查:\n1. 后端服务是否已启动\n2. 服务地址是否正确\n3. 网络连接是否正常'
        }
      }

      if (error.code === 'ECONNREFUSED' || error.message?.includes('refused')) {
        return {
          success: false,
          error: '无法连接到服务器, 请检查:\n1. 后端服务是否已启动\n2. 服务地址和端口是否正确'
        }
      }

      if (error.response?.status === 401) {
        return {
          success: false,
          error: '用户名或密码错误'
        }
      }

      return {
        success: false,
        error: error.response?.data?.detail?.message || error.message || '登录失败, 请检查网络或服务器配置'
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
        error: error.response?.data?.detail?.message || '注册失败, 请检查网络或服务器配置' 
      }
    }
  },

  /**
   * 获取当前登录用户信息 (自动登录用)
   */
  async get_current_user() {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.auth_me)
      const res = await api_client.get(url)
      return { success: true, data: res.data }
    } catch (error: any) {
      return { success: false, error: error.message }
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
   * 企业微信扫码登录
   * @returns 登录结果
   */
  async wecom_login(): Promise<{ success: boolean; data?: any; error?: string }> {
    return new Promise(async (resolve) => {
      try {
        const url = ApiUrl.build_api_url(ApiEndpoints.auth_wecom_url)
        log.info(`Fetching wecom login url: ${url}`)
        const res = await api_client.get(url)
        if (!res.data?.url) {
          resolve({ success: false, error: '获取企业微信登录链接失败' })
          return
        }

        const wecom_url = res.data.url
        log.info(`Opening WeCom login window: ${wecom_url}`)

        const win = new BrowserWindow({
          width: 800,
          height: 600,
          title: '企业微信登录',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        })

        // 监听重定向, 拦截 token
        win.webContents.on('will-redirect', (event, navigationUrl) => {
          log.info(`WeCom window redirected to: ${navigationUrl}`)
          try {
            const urlObj = new URL(navigationUrl)
            const accessToken = urlObj.searchParams.get('access_token')
            const refreshToken = urlObj.searchParams.get('refresh_token')
            const error = urlObj.searchParams.get('error')

            if (accessToken && refreshToken) {
              log.info('Successfully intercepted WeCom tokens')
              event.preventDefault()
              config_store.set('access_token', accessToken)
              config_store.set('refresh_token', refreshToken)
              
              // 解析 JWT payload (基础版, 也可以让渲染进程去解析)
              let username = 'wecom_user'
              let role = 'user'
              try {
                const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString())
                if (payload.username) username = payload.username
                if (payload.role) role = payload.role
              } catch (e) {
                log.error('Failed to parse JWT token', e)
              }

              win.close()
              resolve({
                success: true,
                data: {
                  user: { username, role, email: `${username}@trai.local` },
                  access_token: accessToken,
                  refresh_token: refreshToken
                }
              })
            } else if (error) {
              event.preventDefault()
              win.close()
              resolve({ success: false, error: `企业微信登录失败: ${error}` })
            }
          } catch (e) {
            log.error('Error handling redirect URL', e)
          }
        })

        win.on('closed', () => {
          resolve({ success: false, error: '登录窗口已关闭' })
        })

        await win.loadURL(wecom_url)
      } catch (error: any) {
        log.error('wecom_login failed:', error.response?.data || error.message)
        resolve({
          success: false,
          error: error.response?.data?.detail?.message || error.message || '获取登录链接失败'
        })
      }
    })
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
      config_store.set('refresh_token', '')
      return { success: true }
    }
  }
}
