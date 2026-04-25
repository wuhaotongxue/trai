/**
 * 文件名: update_service.ts
 * 作者: wuhao
 * 日期: 2026-04-14 16:45:00
 * 描述: Electron 客户端自动更新服务
 */

import { autoUpdater, UpdateInfo } from 'electron-updater'
import log from 'electron-log'
import { ipcMain, BrowserWindow } from 'electron'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'
import { main_window } from '../index'

interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

interface UpdateStatus {
  checking: boolean
  available: boolean
  downloaded: boolean
  error: string | null
  version: string | null
  releaseNotes: string | null
}

export class UpdateService {
  private update_url: string
  private status: UpdateStatus

  constructor() {
    this.status = {
      checking: false,
      available: false,
      downloaded: false,
      error: null,
      version: null,
      releaseNotes: null
    }

    // 设置日志
    autoUpdater.logger = log
    ;(autoUpdater.logger as any).transports.file.level = 'info'

    // 这里指向后端的动态更新 API,例如 http://localhost:5666/api/client/update 或生产地址
    // 假设在生产中通过环境变量或者固定域名获取
    const base_url = ApiUrl.build_api_base_url_by_env()
    this.update_url = `${base_url}${ApiEndpoints.client_update}`

    autoUpdater.setFeedURL({
      provider: 'generic',
      url: this.update_url
    })

    // 配置更新参数
    autoUpdater.autoDownload = true  // 静默自动下载
    autoUpdater.autoInstallOnAppQuit = false  // 改为手动安装

    // 初始化并注册 IPC 处理器
    this.init()
  }

  /**
   * 发送更新状态到渲染进程
   */
  private send_to_renderer(channel: string, data: unknown) {
    if (main_window && !main_window.isDestroyed()) {
      main_window.webContents.send(channel, data)
    }
  }

  /**
   * 广播更新状态
   */
  private broadcast_status() {
    this.send_to_renderer('update:status', this.status)
  }

  public init() {
    log.info(`[UpdateService] 自动更新服务初始化, feedURL: ${this.update_url}`)

    // 检查更新出错
    autoUpdater.on('error', (err) => {
      log.error('[UpdateService] 检查更新失败', err)
      this.status.checking = false
      this.status.error = err.message || '检查更新失败'
      this.broadcast_status()
    })

    // 检查更新中
    autoUpdater.on('checking-for-update', () => {
      log.info('[UpdateService] 正在检查更新...')
      this.status.checking = true
      this.status.error = null
      this.broadcast_status()
    })

    // 发现新版本
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      log.info(`[UpdateService] 发现新版本: ${info.version}`)
      this.status.checking = false
      this.status.available = true
      this.status.downloaded = false
      this.status.version = info.version
      this.status.releaseNotes = typeof info.releaseNotes === 'string' 
        ? info.releaseNotes 
        : (info.releaseNotes as any)?.note || null
      this.broadcast_status()
    })

    // 当前已是最新版
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      log.info(`[UpdateService] 当前已经是最新版本: ${info.version}`)
      this.status.checking = false
      this.status.available = false
      this.status.version = info.version
      this.broadcast_status()
    })

    // 下载进度
    autoUpdater.on('download-progress', (progressObj: UpdateProgress) => {
      const log_message = `[UpdateService] 下载速度: ${progressObj.bytesPerSecond} - 已下载 ${progressObj.percent.toFixed(2)}%`
      log.info(log_message)
      this.send_to_renderer('update:progress', {
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      })
    })

    // 下载完成 - 弹窗询问用户是否立即重启更新
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      log.info('[UpdateService] 更新下载完毕，弹出重启提示')
      this.status.downloaded = true
      this.status.version = info.version
      this.broadcast_status()

      // 弹出对话框询问用户
      if (main_window && !main_window.isDestroyed()) {
        const response = require('electron').dialog.showMessageBoxSync(main_window, {
          type: 'info',
          title: '发现新版本',
          message: `版本 ${info.version} 已下载完成`,
          detail: '是否立即重启应用以完成更新？',
          buttons: ['立即重启', '稍后再说'],
          defaultId: 0,
          cancelId: 1
        })

        if (response === 0) {
          log.info('[UpdateService] 用户选择立即重启')
          autoUpdater.quitAndInstall()
        } else {
          log.info('[UpdateService] 用户选择稍后更新')
        }
      }
    })

    // 注册 IPC,允许渲染进程手动触发检查更新
    ipcMain.handle('app:check_update', async () => {
      try {
        this.status.checking = true
        this.status.error = null
        this.broadcast_status()
        const result = await autoUpdater.checkForUpdates()
        return { success: true, data: result }
      } catch (error) {
        this.status.checking = false
        this.status.error = String(error)
        this.broadcast_status()
        return { success: false, error: String(error) }
      }
    })

    // 注册 IPC,允许渲染进程下载更新
    ipcMain.handle('app:download_update', async () => {
      try {
        log.info('[UpdateService] 开始下载更新...')
        this.send_to_renderer('update:progress', { percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 })
        await autoUpdater.downloadUpdate()
        return { success: true }
      } catch (error) {
        log.error('[UpdateService] 下载更新失败', error)
        return { success: false, error: String(error) }
      }
    })

    // 注册 IPC,允许渲染进程手动触发安装并重启
    ipcMain.handle('app:install_update', () => {
      autoUpdater.quitAndInstall()
    })

    // 注册 IPC,允许渲染进程获取当前版本号
    ipcMain.handle('app:get_version', () => {
      return require('electron').app.getVersion()
    })

    // 注册 IPC,获取更新状态
    ipcMain.handle('app:get_update_status', () => {
      return this.status
    })

    // 启动时自动检查一次 (延迟 5 秒,避免阻塞启动)
    setTimeout(() => {
      this.check_update()
    }, 5000)
  }

  public check_update() {
    autoUpdater.checkForUpdates().catch(err => {
      log.error('[UpdateService] 启动检查更新异常', err)
      this.status.checking = false
      this.status.error = err.message || '检查更新失败'
      this.broadcast_status()
    })
  }
}
