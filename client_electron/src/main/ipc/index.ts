/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: IPC 处理器注册模块
 */
import { ipcMain } from 'electron'
import log from 'electron-log'
import { get_system_info } from '../platform/index'
import { config_store } from '../platform/config_store'
import { auth_service } from '../services/auth'

export const register_ipc_handlers = (): void => {
  log.info('registering ipc handlers...')

  // ===================== 系统和配置 =====================
  ipcMain.handle('system:get_info', async () => {
    try {
      const info = get_system_info()
      return { success: true, data: info }
    } catch (error) {
      log.error('failed to get system info', error)
      return { success: false, error: 'failed to get system info' }
    }
  })

  // 提供给渲染进程获取配置的接口
  ipcMain.handle('config:get', async (_, key: string, default_value: any) => {
    try {
      return { success: true, data: config_store.get(key, default_value) }
    } catch (error) {
      log.error('failed to get config', error)
      return { success: false, error: 'failed to get config' }
    }
  })

  // 提供给渲染进程保存配置的接口
  ipcMain.handle('config:set', async (_, key: string, value: any) => {
    try {
      config_store.set(key, value)
      return { success: true }
    } catch (error) {
      log.error('failed to set config', error)
      return { success: false, error: 'failed to set config' }
    }
  })

  // ===================== 用户认证 =====================
  ipcMain.handle('auth:login', async (_, params: any) => {
    return await auth_service.login(params)
  })

  ipcMain.handle('auth:register', async (_, params: any) => {
    return await auth_service.register(params)
  })
}
