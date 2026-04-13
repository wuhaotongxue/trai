/**
 * 文件名: auth.ts
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 客户端用户认证状态管理
 */
import { create } from 'zustand'

export interface UserInfo {
  username: string
  email: string
  role: string
}

interface AuthState {
  is_authenticated: boolean
  user: UserInfo | null
  login: (user_info: UserInfo) => void
  logout: () => void
}

export const use_auth_store = create<AuthState>((set) => ({
  is_authenticated: false,
  user: null,
  login: (user_info) => set({ is_authenticated: true, user: user_info }),
  logout: () => set({ is_authenticated: false, user: null })
}))
