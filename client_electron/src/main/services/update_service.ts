/**
 * 文件名: update_service.ts
 * 作者: wuhao
 * 日期: 2026-04-14 16:45:00
 * 描述: Electron 客户端自动更新服务
 */

import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { ipcMain } from 'electron'

export class UpdateService {
  private update_url: string

  constructor() {
    // 设置日志
    autoUpdater.logger = log
    ;(autoUpdater.logger as any).transports.file.level = 'info'

    // 这里指向后端的动态更新 API,例如 http://localhost:5666/api/client/update 或生产地址
    // 假设在生产中通过环境变量或者固定域名获取
    this.update_url = process.env.VITE_API_URL 
      ? `${process.env.VITE_API_URL}/client/update`
      : 'http://localhost:5666/api/client/update'

    autoUpdater.setFeedURL({
      provider: 'generic',
      url: this.update_url
    })

    // 配置更新参数
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
  }

  public init() {
    log.info(`[UpdateService] 自动更新服务初始化, feedURL: ${this.update_url}`)

    // 检查更新出错
    autoUpdater.on('error', (err) => {
      log.error('[UpdateService] 检查更新失败', err)
    })

    // 检查更新中
    autoUpdater.on('checking-for-update', () => {
      log.info('[UpdateService] 正在检查更新...')
    })

    // 发现新版本
    autoUpdater.on('update-available', (info) => {
      log.info(`[UpdateService] 发现新版本: ${info.version}`)
    })

    // 当前已是最新版
    autoUpdater.on('update-not-available', (info) => {
      log.info(`[UpdateService] 当前已经是最新版本: ${info.version}`)
    })

    // 下载进度
    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = `[UpdateService] 下载速度: ${progressObj.bytesPerSecond} - 已下载 ${progressObj.percent}%`
      log.info(log_message)
    })

    // 下载完成
    autoUpdater.on('update-downloaded', (info) => {
      log.info('[UpdateService] 更新下载完毕')
      // 可以在此处通过 IPC 通知渲染进程提示用户是否立即重启更新
    })

    // 注册 IPC,允许渲染进程手动触发检查更新
    ipcMain.handle('app:check_update', async () => {
      try {
        const result = await autoUpdater.checkForUpdates()
        return { success: true, data: result }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    })

    // 注册 IPC,允许渲染进程手动触发安装并重启
    ipcMain.handle('app:install_update', () => {
      autoUpdater.quitAndInstall()
    })

    // 启动时自动检查一次
    this.check_update()
  }

  public check_update() {
    autoUpdater.checkForUpdates().catch(err => {
      log.error('[UpdateService] 启动检查更新异常', err)
    })
  }
}
