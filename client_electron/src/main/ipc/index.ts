/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: IPC 处理器注册模块
 */
import { ipcMain } from 'electron'
import log from 'electron-log'
import { get_system_info } from '../platform/index'

export const register_ipc_handlers = (): void => {
  log.info('registering ipc handlers...')

  ipcMain.handle('system:get_info', async () => {
    try {
      const info = get_system_info()
      return { success: true, data: info }
    } catch (error) {
      log.error('failed to get system info', error)
      return { success: false, error: 'failed to get system info' }
    }
  })
}
