/**
 * 文件名: log.ts
 * 作者: wuhao
 * 日期: 2026-04-18
 * 描述: 全局日志存储
 */
import { create } from 'zustand'

interface LogState {
  logs: string[]
  show_logs: boolean
  add_log: (message: string) => void
  clear_logs: () => void
  toggle_logs: () => void
}

export const use_log_store = create<LogState>((set) => ({
  logs: [],
  show_logs: false,
  add_log: (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    set((state) => ({
      logs: [...state.logs, `[${timestamp}] ${message}`]
    }))
  },
  clear_logs: () => {
    set({ logs: [] })
  },
  toggle_logs: () => {
    set((state) => ({
      show_logs: !state.show_logs
    }))
  }
}))