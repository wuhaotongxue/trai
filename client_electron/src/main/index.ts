/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: Electron 主进程入口点
 */
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { register_ipc_handlers } from './ipc/index'

log.info('app starting...')

const create_window = () => {
  const main_window = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    main_window.loadURL(process.env.VITE_DEV_SERVER_URL)
    main_window.webContents.openDevTools()
  } else {
    main_window.loadFile(join(__dirname, '../index.html'))
  }
}

app.whenReady().then(() => {
  register_ipc_handlers()
  create_window()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      create_window()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
