/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-13 19:35:00
 * 描述: Electron 主进程入口点，集成 Tray 托盘与 Win11 Fluent 窗口样式
 */
import { app, BrowserWindow, Tray, Menu, nativeImage, dialog } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { register_ipc_handlers } from './ipc/index'
import { config_store } from './platform/config_store'
import { UpdateService } from './services/update_service'

log.info('app starting...')

// 提升 tray 变量到外层作用域，防止被 V8 垃圾回收导致托盘消失
let tray: Tray | null = null
let main_window: BrowserWindow | null = null
// 是否真正退出应用的标记
let is_quitting = false

// 保证应用单例运行 (软件唯一性)
const got_the_lock = app.requestSingleInstanceLock()

if (!got_the_lock) {
  log.warn('检测到另一个实例正在运行，即将退出并提示用户...')
  app.quit()
} else {
  app.on('second-instance', () => {
    // 当运行第二个实例时，如果主窗口存在，则使其获得焦点
    if (main_window) {
      if (main_window.isMinimized()) main_window.restore()
      main_window.show()
      main_window.focus()
    }
    // 提示用户应用已打开
    dialog.showMessageBox({
      type: 'info',
      title: 'TRAI 提示',
      message: '客户端已经在运行中',
      detail: '请在系统托盘或任务栏中查看已打开的程序。'
    })
  })

  const create_window = () => {
  // 使用 256x256 的 ICO 作为窗口和任务栏图标
  const icon_path = process.env.VITE_DEV_SERVER_URL
    ? join(__dirname, '../../public/kity_256.ico')
    : join(__dirname, '../kity_256.ico')
  const window_icon = nativeImage.createFromPath(icon_path)

  main_window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: window_icon,
    // 隐藏原生边框，保留系统控制按钮 (Win11 风格)
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f3f3f3',
      symbolColor: '#202020',
      height: 36
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 拦截关闭事件，转为隐藏窗口或退出程序
  main_window.on('close', (event) => {
    if (is_quitting) return

    event.preventDefault()
    
    const close_action = config_store.get('close_action') // 'tray' | 'quit' | undefined

    if (close_action === 'tray') {
      main_window?.hide()
    } else if (close_action === 'quit') {
      is_quitting = true
      app.quit()
    } else {
      // 提示用户选择
      if (!main_window) return
      
      dialog.showMessageBox(main_window, {
        type: 'question',
        title: '退出提示',
        message: '您点击了关闭按钮，请问是要最小化到系统托盘，还是直接退出程序？',
        buttons: ['最小化到托盘', '直接退出程序', '取消'],
        defaultId: 0,
        cancelId: 2,
        checkboxLabel: '记住我的选择，下次不再提示',
        checkboxChecked: false
      }).then((result) => {
        if (result.response === 2) {
          // 用户取消关闭
          return
        }
        
        const action = result.response === 0 ? 'tray' : 'quit'
        
        if (result.checkboxChecked) {
          config_store.set('close_action', action)
        }

        if (action === 'tray') {
          main_window?.hide()
        } else {
          is_quitting = true
          app.quit()
        }
      }).catch((err) => {
        log.error('关闭提示框出错:', err)
      })
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
  // 使用 16x16 的 ICO 作为系统托盘图标
  const icon_path = process.env.VITE_DEV_SERVER_URL
    ? join(__dirname, '../../public/kity_16.ico')
    : join(__dirname, '../kity_16.ico')
    
  const icon = nativeImage.createFromPath(icon_path)
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
  tray.setToolTip('TRAI')
  tray.setContextMenu(context_menu)
  
  // 双击托盘显示窗口
  tray.on('double-click', () => {
    main_window?.show()
  })
}

// 解决 Windows 下开发环境热重载时 GPU 缓存锁定的报错 (cache_util_win.cc(20) 拒绝访问)
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

// 设置 Windows 任务栏应用 ID，防止显示默认的 Electron 图标 (非常关键)
if (process.platform === 'win32') {
  app.setAppUserModelId('com.wuhao.trai')
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
}
