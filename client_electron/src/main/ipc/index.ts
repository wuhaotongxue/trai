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
import { tools_service } from '../services/tools'
import { agent_service } from '../services/agent'
import { feedback_service } from '../services/feedback'

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

  // ===================== Agent =====================
  ipcMain.handle('agent:chat', async (event, session_id: string, message: string, agent_id?: string) => {
    return await agent_service.chat(session_id, message, agent_id, (evt, data) => {
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

  // ===================== Agent Management =====================
  ipcMain.handle('agent:management:list', async () => {
    return agent_service.get_agents()
  })

  ipcMain.handle('agent:management:register', async (_, name: string, description: string, model: string, system_prompt: string) => {
    return agent_service.register_agent(name, description, model, system_prompt)
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
}
