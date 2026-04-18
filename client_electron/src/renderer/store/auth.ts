/**
 * 文件名: auth.ts
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 客户端用户认证状态管理
 */
import { create } from 'zustand'

/**
 * 用户信息接口
 * @property username 用户名
 * @property email 邮箱
 * @property role 角色
 */
export interface UserInfo {
  username: string
  email: string
  role: string
}

/**
 * 认证状态接口
 * @property is_authenticated 是否已认证
 * @property user 用户信息
 * @property login 登录
 * @property logout 登出
 */
interface AuthState {
  is_authenticated: boolean
  user: UserInfo | null
  login: (user_info: UserInfo) => void
  logout: () => void
}

/**
 * 认证状态管理 hook
 */
export const use_auth_store = create<AuthState>((set) => ({
  is_authenticated: false,
  user: null,
  /**
   * 登录
   * @param user_info 用户信息
   */
  login: (user_info) => set({ is_authenticated: true, user: user_info }),
  /**
   * 登出
   */
  logout: () => set({ is_authenticated: false, user: null })
}))
