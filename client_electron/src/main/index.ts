/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-13 19:35:00
 * 描述: Electron 主进程入口点，集成 Tray 托盘与 Win11 Fluent 窗口样式
 */
import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { register_ipc_handlers } from './ipc/index'

log.info('app starting...')

let tray: Tray | null = null
let main_window: BrowserWindow | null = null
// 是否真正退出应用的标记
let is_quitting = false

const create_window = () => {
  main_window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    // 隐藏原生边框，保留系统控制按钮 (Win11 风格)
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#202020',
      symbolColor: '#ffffff',
      height: 36
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 拦截关闭事件，转为隐藏窗口
  main_window.on('close', (event) => {
    if (!is_quitting) {
      event.preventDefault()
      main_window?.hide()
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    main_window.loadURL(process.env.VITE_DEV_SERVER_URL)
    // main_window.webContents.openDevTools()
  } else {
    main_window.loadFile(join(__dirname, '../index.html'))
  }
}

const create_tray = () => {
  // 生成一个简单的蓝色方块作为托盘默认图标
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZKAQMFKon2EQjP7//x+bAQSsIC4OwhkGTYMRHhgNRkMzEBoQ/P8PRkMzjBvAAHWTEkL/I1U0AwA3oQ8g3HjK8AAAAABJRU5ErkJggg=='
  )
  tray = new Tray(icon)
  const context_menu = Menu.buildFromTemplate([
    { label: '显示主界面', click: () => main_window?.show() },
    { type: 'separator' },
    { 
      label: '完全退出', 
      click: () => {
        is_quitting = true
        app.quit()
      } 
    }
  ])
  tray.setToolTip('TRAI Desktop')
  tray.setContextMenu(context_menu)
  
  // 双击托盘显示窗口
  tray.on('double-click', () => {
    main_window?.show()
  })
}

app.whenReady().then(() => {
  register_ipc_handlers()
  create_window()
  create_tray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      create_window()
    } else {
      main_window?.show()
    }
  })
})

app.on('before-quit', () => {
  is_quitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
