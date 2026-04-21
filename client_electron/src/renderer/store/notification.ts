/**
 * 文件名: notification.ts
 * 作者: wuhao
 * 日期: 2026-04-19 02:30:00
 * 描述: 全局通知状态管理
 */
import { create } from 'zustand'

interface NotificationStore {
  /** 是否显示通知 */
  is_visible: boolean
  /** 通知消息内容 */
  message: string
  /**
   * 显示通知
   * @param message - 通知消息
   * @param auto_hide_ms - 自动隐藏的毫秒数, 默认为 2000ms, 设为 0 不自动隐藏
   */
  show: (message: string, auto_hide_ms?: number) => void
  /** 隐藏通知 */
  hide: () => void
}

export const use_notification_store = create<NotificationStore>((set) => ({
  is_visible: false,
  message: '',
  show: (message, auto_hide_ms = 2000) => {
    set({ is_visible: true, message })
    // 自动隐藏
    if (auto_hide_ms > 0) {
      setTimeout(() => {
        set({ is_visible: false, message: '' })
      }, auto_hide_ms)
    }
  },
  hide: () => set({ is_visible: false, message: '' })
}))
