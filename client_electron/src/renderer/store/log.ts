/**
 * 文件名: log.ts
 * 作者: wuhao
 * 日期: 2026-04-18
 * 描述: 全局日志存储
 */
import { create } from 'zustand'

/**
 * 日志状态接口
 * @property logs 日志列表
 * @property show_logs 是否显示日志
 * @property add_log 添加日志
 * @property clear_logs 清空日志
 * @property toggle_logs 切换日志显示
 */
interface LogState {
  logs: string[]
  show_logs: boolean
  add_log: (message: string) => void
  clear_logs: () => void
  toggle_logs: () => void
}

/**
 * 日志状态管理 hook
 */
export const use_log_store = create<LogState>((set) => ({
  logs: [],
  show_logs: false,
  /**
   * 添加日志
   * @param message 日志消息
   */
  add_log: (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    set((state) => ({
      logs: [...state.logs, `[${timestamp}] ${message}`]
    }))
  },
  /**
   * 清空日志
   */
  clear_logs: () => {
    set({ logs: [] })
  },
  /**
   * 切换日志显示
   */
  toggle_logs: () => {
    set((state) => ({
      show_logs: !state.show_logs
    }))
  }
}))