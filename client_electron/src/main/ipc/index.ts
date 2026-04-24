/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: IPC 处理器注册模块
 */
import { ipcMain } from 'electron'
import log from 'electron-log'
import { get_system_info, get_system_metrics } from '../platform/index'
import { config_store } from '../platform/config_store'
import { auth_service } from '../services/auth'
import { tools_service } from '../services/tools'
import { agent_service } from '../services/agent'
import { feedback_service } from '../services/feedback'
import { knowledge_base_service } from '../services/knowledge_base'
import { i18n_service } from '../services/i18n'
import { main_window } from '../index'

/**
 * IPC 请求缓存系统
 */
interface CacheItem {
  data: any
  timestamp: number
}

const cache: Record<string, CacheItem> = {}
const CACHE_TTL = 5000 // 缓存有效期，单位毫秒

/**
 * 生成缓存键
 */
const generateCacheKey = (channel: string, args: any[]): string => {
  return `${channel}:${JSON.stringify(args)}`
}

/**
 * 缓存包装器
 */
const withCache = <T extends (...args: any[]) => Promise<any>>(channel: string, fn: T): T => {
  return (async (...args: any[]) => {
    const cacheKey = generateCacheKey(channel, args)
    const now = Date.now()
    
    // 检查缓存
    const cachedItem = cache[cacheKey]
    if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
      log.info(`[cache] hit for ${channel}`)
      return cachedItem.data
    }
    
    // 执行函数
    const result = await fn(...args)
    
    // 更新缓存
    cache[cacheKey] = {
      data: result,
      timestamp: now
    }
    
    return result
  }) as T
}

/**
 * 注册所有 IPC 处理器
 * 包括系统配置、用户认证、工具、Agent、AI生成、反馈、知识库等模块
 */
export const register_ipc_handlers = (): void => {
  log.info('registering ipc handlers...')

  // ===================== 系统和配置 =====================
  ipcMain.handle('system:get_info', withCache('system:get_info', async () => {
    try {
      const info = get_system_info()
      return { success: true, data: info }
    } catch (error) {
      log.error('failed to get system info', error)
      return { success: false, error: 'failed to get system info' }
    }
  }))

  ipcMain.handle('system:get_metrics', withCache('system:get_metrics', async () => {
    try {
      const metrics = get_system_metrics()
      return { success: true, data: metrics }
    } catch (error) {
      log.error('failed to get system metrics', error)
      return { success: false, error: 'failed to get system metrics' }
    }
  }))

  // 提供给渲染进程获取配置的接口
  ipcMain.handle('config:get', withCache('config:get', async (_, key: string, default_value: any) => {
    try {
      return { success: true, data: config_store.get(key, default_value) }
    } catch (error) {
      log.error('failed to get config', error)
      return { success: false, error: 'failed to get config' }
    }
  }))

  // 提供给渲染进程保存配置的接口
  ipcMain.handle('config:set', async (_, key: string, value: any) => {
    try {
      config_store.set(key, value)
      
      // 如果是主题配置变更，更新窗口标题栏颜色
      if (key === 'ui:theme' && main_window) {
        const is_dark_theme = value === 'dark'
        main_window.setTitleBarOverlay({
          color: is_dark_theme ? '#1e1e1e' : '#ffffff',
          symbolColor: is_dark_theme ? '#ffffff' : '#333333',
          height: 36
        })
      }
      
      // 清除相关缓存
      if (key === 'ui:theme') {
        // 清除配置相关的缓存
        Object.keys(cache).forEach(cacheKey => {
          if (cacheKey.startsWith('config:')) {
            delete cache[cacheKey]
          }
        })
      }
      
      return { success: true }
    } catch (error) {
      log.error('failed to set config', error)
      return { success: false, error: 'failed to set config' }
    }
  })

  // ===================== 窗口控制 =====================
  ipcMain.handle('window:minimize', async () => {
    if (main_window) {
      main_window.minimize()
      return { success: true }
    }
    return { success: false, error: 'window not found' }
  })

  ipcMain.handle('window:maximize', async () => {
    if (main_window) {
      if (main_window.isMaximized()) {
        main_window.unmaximize()
      } else {
        main_window.maximize()
      }
      return { success: true, is_maximized: main_window.isMaximized() }
    }
    return { success: false, error: 'window not found' }
  })

  ipcMain.handle('window:close', async () => {
    if (main_window) {
      main_window.close()
      return { success: true }
    }
    return { success: false, error: 'window not found' }
  })

  ipcMain.handle('window:is_maximized', async () => {
    if (main_window) {
      return { success: true, is_maximized: main_window.isMaximized() }
    }
    return { success: false, error: 'window not found' }
  })

  // ===================== 批处理 =====================
  ipcMain.handle('batch:execute', async (_, batch: Array<{ id: string, method: string, params: any[] }>) => {
    try {
      const results = await Promise.all(
        batch.map(async (item) => {
          try {
            // 根据方法名执行对应的处理函数
            // 这里需要根据实际的处理函数映射来实现
            // 由于我们没有维护处理函数的映射表，这里只做一个简单的示例
            log.info(`[batch] executing ${item.method} with params`, item.params)
            // 实际项目中，这里应该有一个处理函数的映射表
            // 然后根据 method 调用对应的函数
            return { id: item.id, result: { success: true, data: `Mock result for ${item.method}` } }
          } catch (error) {
            log.error(`[batch] error executing ${item.method}`, error)
            return { id: item.id, result: { success: false, error: (error as Error).message } }
          }
        })
      )
      return { success: true, data: results }
    } catch (error) {
      log.error('failed to execute batch', error)
      return { success: false, error: 'failed to execute batch' }
    }
  })

  // ===================== 用户认证 =====================
  ipcMain.handle('auth:login', async (_, params: any) => {
    return await auth_service.login(params)
  })

  ipcMain.handle('auth:wecom_login', async () => {
    return await auth_service.wecom_login()
  })

  ipcMain.handle('auth:me', async () => {
    return await auth_service.get_current_user()
  })

  ipcMain.handle('auth:register', async (_, params: any) => {
    return await auth_service.register(params)
  })

  ipcMain.handle('auth:change_password', async (_, params: { old_password: string; new_password: string }) => {
    return await auth_service.change_password(params)
  })

  ipcMain.handle('auth:logout', async () => {
    return await auth_service.logout()
  })

  // ===================== 工具 =====================
  ipcMain.handle('tools:convert_md_to_pdf', async (_, file_path: string) => {
    return await tools_service.convert_md_to_pdf(file_path)
  })

  ipcMain.handle('tools:compress_image', async (_, file_path: string, quality?: number, target_size_kb?: number) => {
    return await tools_service.compress_image(file_path, quality, target_size_kb)
  })

  ipcMain.handle('tools:compress_files_to_zip', async (_, file_paths: string[]) => {
    return await tools_service.compress_files_to_zip(file_paths)
  })

  ipcMain.handle('tools:convert_image', async (_, file_path: string, target_format: string, sizes?: number[], width?: number, height?: number, target_size_kb?: number) => {
    return await tools_service.convert_image(file_path, target_format, sizes, width, height, target_size_kb)
  })

  ipcMain.handle('tools:convert_word_to_pdf', async (_, file_path: string) => {
    return await tools_service.convert_word_to_pdf(file_path)
  })

  ipcMain.handle('tools:convert_pdf_to_word', async (_, file_path: string) => {
    return await tools_service.convert_pdf_to_word(file_path)
  })

  ipcMain.handle('tools:convert_excel', async (_, file_path: string, target_format: string) => {
    return await tools_service.convert_excel(file_path, target_format)
  })

  // ===================== Agent =====================
  ipcMain.handle('agent:chat', async (event, session_id: string, message: string, agent_id?: string, knowledge_base_id?: string, files?: Array<{ name: string; type: string; data: string }>) => {
  return await agent_service.chat(session_id, message, agent_id, knowledge_base_id, files, (evt, data) => {
    event.sender.send(evt, data)
  })
})

  ipcMain.handle('agent:stop', async (_, session_id: string) => {
    return agent_service.stop_chat(session_id)
  })

  // ===================== AI Generation =====================
  ipcMain.handle('ai:generate_image', async (_, prompt: string) => {
    return agent_service.generate_image(prompt)
  })

  ipcMain.handle('ai:generate_image_to_image', async (_, prompt: string, image_url: string) => {
    return agent_service.generate_image_to_image(prompt, image_url)
  })

  ipcMain.handle('ai:generate_music', async (_, prompt: string) => {
    return agent_service.generate_music(prompt)
  })

  ipcMain.handle('ai:generate_video', async (_, prompt: string) => {
    return agent_service.generate_video(prompt)
  })

  ipcMain.handle('ai:generate_comfyui', async (_, prompt: string) => {
    return agent_service.generate_comfyui(prompt)
  })

  ipcMain.handle('ai:generate_report', async (_, template_base64: string, template_name: string, description: string) => {
    // 调用 agent_service 中即将实现的 generate_report 方法
    return agent_service.generate_report(template_base64, template_name, description)
  })

  // ===================== Agent Management =====================
  ipcMain.handle('agent:management:list', async () => {
    return agent_service.get_agents()
  })

  ipcMain.handle('agent:management:register', async (_, name: string, description: string, model: string, system_prompt: string, icon?: string, category?: string) => {
    return agent_service.register_agent(name, description, model, system_prompt, icon, category)
  })

  ipcMain.handle('agent:management:update', async (_, agent_id: string, name: string, description: string, model: string, system_prompt: string, icon: string, category?: string) => {
    return agent_service.update_agent(agent_id, name, description, model, system_prompt, icon, category)
  })

  ipcMain.handle('agent:management:toggle', async (_, agent_id: string, action: 'start' | 'stop') => {
    return agent_service.toggle_agent(agent_id, action)
  })

  ipcMain.handle('agent:management:check', async (_, agent_id: string) => {
    return agent_service.check_agent(agent_id)
  })

  // ===================== 系统反馈 =====================
  ipcMain.handle('feedback:submit', async (_, data: { type: string, title: string, content: string, contact?: string }) => {
    return await feedback_service.submit(data)
  })

  // ===================== 知识库 =====================
  ipcMain.handle('kb:demo_create', async (_, params: { content?: string | null, file_name?: string | null, index_name?: string | null }) => {
    return await knowledge_base_service.demo_create(params)
  })

  ipcMain.handle('kb:list_categories', async () => {
    return await knowledge_base_service.list_categories()
  })

  ipcMain.handle('kb:list_indices', async (_, index_name?: string) => {
    return await knowledge_base_service.list_indices(index_name)
  })

  ipcMain.handle('kb:list_index_files', async (_, index_id: string, page_number?: number, page_size?: number) => {
    return await knowledge_base_service.list_index_files(index_id, page_number, page_size)
  })

  ipcMain.handle('kb:rename_index', async (_, index_id: string, index_name: string) => {
    return await knowledge_base_service.rename_index(index_id, index_name)
  })

  ipcMain.handle('kb:delete_index', async (_, index_id: string) => {
    return await knowledge_base_service.delete_index(index_id)
  })

  ipcMain.handle('kb:delete_index_file', async (_, index_id: string, file_id: string) => {
    return await knowledge_base_service.delete_index_file(index_id, file_id)
  })

  ipcMain.handle('kb:upload_text', async (_, index_id: string, file_name: string, content: string) => {
    return await knowledge_base_service.upload_text(index_id, file_name, content)
  })

  // ===================== 媒体播放 =====================
  ipcMain.handle('media:select-files', async () => {
    const { dialog } = require('electron')

    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '媒体文件', extensions: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'mp4', 'avi', 'mov', 'wmv', 'mkv'] },
        { name: '音频文件', extensions: ['mp3', 'wav', 'flac', 'ogg', 'm4a'] },
        { name: '视频文件', extensions: ['mp4', 'avi', 'mov', 'wmv', 'mkv'] }
      ]
    })

    if (result.canceled) {
      return { success: false, files: [] }
    }

    const files = result.filePaths.map(path => ({
      path,
      name: path.split('\\').pop() || ''
    }))

    return { success: true, files }
  })

  ipcMain.handle('media:select-folder', async () => {
    const { dialog } = require('electron')
    const { readdirSync, statSync } = require('fs')
    const { join } = require('path')

    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (result.canceled) {
      return { success: false, files: [] }
    }

    const folder_path = result.filePaths[0]
    const files = []

    // 递归遍历文件夹
    const traverse_folder = (dir: string) => {
      const items = readdirSync(dir)
      for (const item of items) {
        const item_path = join(dir, item)
        const stat = statSync(item_path)
        if (stat.isDirectory()) {
          traverse_folder(item_path)
        } else if (stat.isFile()) {
          // 检查文件扩展名
          const ext = item.toLowerCase().split('.').pop()
          if (['mp3', 'wav', 'flac', 'ogg', 'm4a', 'mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(ext || '')) {
            files.push({
              path: item_path,
              name: item
            })
          }
        }
      }
    }

    traverse_folder(folder_path)
    return { success: true, files }
  })

  // ===================== 媒体处理 =====================
  ipcMain.handle('media:transcribe-audio', async (_, file_path: string, language: string = 'zh') => {
    try {
      const { read_file } = require('fs/promises')
      
      // TODO: 调用后端语音识别 API
      // 这里可以集成 Whisper、Azure Speech 等语音识别服务
      log.info('transcribing audio:', file_path, 'language:', language)
      
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 返回模拟结果
      return {
        success: true,
        data: {
          transcript: `这是音频文件 "${file_path.split('\\').pop()}" 的语音识别结果。\n\n在实际应用中，这里会显示真实的语音识别文本。支持中文、英文、日文、韩文等多种语言。`,
          language: language,
          duration: 120000
        }
      }
    } catch (error) {
      log.error('transcribe audio failed:', error)
      return {
        success: false,
        error: (error as Error).message
      }
    }
  })

  ipcMain.handle('media:generate-subtitles', async (_, file_path: string, language: string = 'zh', orientation: 'vertical' | 'horizontal' = 'horizontal') => {
    try {
      log.info('generating subtitles:', file_path, 'language:', language, 'orientation:', orientation)
      
      // TODO: 调用字幕生成 API
      // 可以根据视频格式（竖屏/横屏）调整字幕样式和位置
      
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 返回模拟字幕
      const subtitles = [
        { start: 0, end: 3000, text: '欢迎观看这个视频' },
        { start: 3000, end: 6000, text: '这是一个字幕生成的示例' },
        { start: 6000, end: 9000, text: `支持${orientation === 'vertical' ? '竖屏' : '横屏'}格式` },
        { start: 9000, end: 12000, text: '可以自动生成时间轴' }
      ]
      
      return {
        success: true,
        data: {
          subtitles,
          orientation
        }
      }
    } catch (error) {
      log.error('generate subtitles failed:', error)
      return {
        success: false,
        error: (error as Error).message
      }
    }
  })

  ipcMain.handle('media:translate-subtitles', async (_, subtitles: any[], source_lang: string, target_lang: string) => {
    try {
      log.info('translating subtitles:', `from ${source_lang} to ${target_lang}`)
      
      // TODO: 调用翻译 API
      // 可以使用 DeepL、Google Translate、百度翻译等服务
      
      // 模拟翻译
      const translations = subtitles.map(sub => ({
        ...sub,
        translated_text: `[${target_lang}] ${sub.text}`
      }))
      
      return {
        success: true,
        data: {
          translated_subtitles: translations
        }
      }
    } catch (error) {
      log.error('translate subtitles failed:', error)
      return {
        success: false,
        error: (error as Error).message
      }
    }
  })

  // ===================== 国际化 =====================
  ipcMain.handle('i18n:get_translations', withCache('i18n:get_translations', async (_, locale: 'zh' | 'en') => {
    try {
      const translations = await i18n_service.get_translations(locale)
      if (translations) {
        return { success: true, data: translations }
      }
      return { success: false, error: 'Failed to fetch translations' }
    } catch (error) {
      log.error('i18n:get_translations failed:', error)
      return { success: false, error: 'Failed to fetch translations' }
    }
  }))

  ipcMain.handle('i18n:get_all_translations', withCache('i18n:get_all_translations', async () => {
    try {
      const translations = await i18n_service.get_all_translations()
      return { success: true, data: translations }
    } catch (error) {
      log.error('i18n:get_all_translations failed:', error)
      return { success: false, error: 'Failed to fetch translations' }
    }
  }))
}
