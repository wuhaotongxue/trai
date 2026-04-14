/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: Preload 层桥接主进程和渲染进程安全通信
 */
import { contextBridge, ipcRenderer } from 'electron'

// 仅通过 invoke 暴露白名单 API
contextBridge.exposeInMainWorld('electron_api', {
  get_system_info: () => ipcRenderer.invoke('system:get_info'),
  config_get: (key: string, default_value?: any) => ipcRenderer.invoke('config:get', key, default_value),
  config_set: (key: string, value: any) => ipcRenderer.invoke('config:set', key, value),
  auth_login: (params: any) => ipcRenderer.invoke('auth:login', params),
  auth_register: (params: any) => ipcRenderer.invoke('auth:register', params),
  auth_logout: () => ipcRenderer.invoke('auth:logout'),
  tools_convert_md_to_pdf: (file_path: string) => ipcRenderer.invoke('tools:convert_md_to_pdf', file_path),
  tools_compress_image: (file_path: string, quality?: number) => ipcRenderer.invoke('tools:compress_image', file_path, quality),
  tools_compress_files_to_zip: (file_paths: string[]) => ipcRenderer.invoke('tools:compress_files_to_zip', file_paths),
  agent_chat: (session_id: string, message: string) => ipcRenderer.invoke('agent:chat', session_id, message),
  agent_stop: (session_id: string) => ipcRenderer.invoke('agent:stop', session_id),
  ai_generate_image: (prompt: string) => ipcRenderer.invoke('ai:generate_image', prompt),
  ai_generate_image_to_image: (prompt: string, image_url: string) => ipcRenderer.invoke('ai:generate_image_to_image', prompt, image_url),
  ai_generate_music: (prompt: string) => ipcRenderer.invoke('ai:generate_music', prompt),
  ai_generate_video: (prompt: string) => ipcRenderer.invoke('ai:generate_video', prompt),
  agent_management_list: () => ipcRenderer.invoke('agent:management:list'),
  agent_management_register: (name: string, description: string, model: string, system_prompt: string) => ipcRenderer.invoke('agent:management:register', name, description, model, system_prompt),
  agent_management_toggle: (agent_id: string, action: 'start' | 'stop') => ipcRenderer.invoke('agent:management:toggle', agent_id, action),
  on_agent_chat_chunk: (callback: (event: any, chunk: any) => void) => {
    ipcRenderer.on('agent:chat:chunk', callback)
    return () => { ipcRenderer.removeListener('agent:chat:chunk', callback) }
  }
})
