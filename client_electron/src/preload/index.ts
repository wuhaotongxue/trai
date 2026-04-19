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
  get_system_metrics: () => ipcRenderer.invoke('system:get_metrics'),
  config_get: (key: string, default_value?: any) => ipcRenderer.invoke('config:get', key, default_value),
  config_set: (key: string, value: any) => ipcRenderer.invoke('config:set', key, value),
  auth_login: (params: any) => ipcRenderer.invoke('auth:login', params),
  auth_register: (params: any) => ipcRenderer.invoke('auth:register', params),
  auth_change_password: (params: { old_password: string, new_password: string }) => ipcRenderer.invoke('auth:change_password', params),
  auth_logout: () => ipcRenderer.invoke('auth:logout'),
  tools_convert_md_to_pdf: (file_path: string) => ipcRenderer.invoke('tools:convert_md_to_pdf', file_path),
  tools_compress_image: (file_path: string, quality?: number, target_size_kb?: number) => ipcRenderer.invoke('tools:compress_image', file_path, quality, target_size_kb),
  tools_compress_files_to_zip: (file_paths: string[]) => ipcRenderer.invoke('tools:compress_files_to_zip', file_paths),
  tools_convert_image: (file_path: string, target_format: string, sizes?: number[], width?: number, height?: number, target_size_kb?: number) => ipcRenderer.invoke('tools:convert_image', file_path, target_format, sizes, width, height, target_size_kb),
  agent_chat: (session_id: string, message: string, agent_id?: string, knowledge_base_id?: string) => ipcRenderer.invoke('agent:chat', session_id, message, agent_id, knowledge_base_id),
  agent_stop: (session_id: string) => ipcRenderer.invoke('agent:stop', session_id),
  ai_generate_image: (prompt: string) => ipcRenderer.invoke('ai:generate_image', prompt),
  ai_generate_image_to_image: (prompt: string, image_url: string) => ipcRenderer.invoke('ai:generate_image_to_image', prompt, image_url),
  ai_generate_music: (prompt: string) => ipcRenderer.invoke('ai:generate_music', prompt),
  ai_generate_video: (prompt: string) => ipcRenderer.invoke('ai:generate_video', prompt),
  ai_generate_comfyui: (prompt: string) => ipcRenderer.invoke('ai:generate_comfyui', prompt),
  ai_generate_report: (template_base64: string, template_name: string, description: string) => ipcRenderer.invoke('ai:generate_report', template_base64, template_name, description),
  agent_management_list: () => ipcRenderer.invoke('agent:management:list'),
  agent_management_register: (name: string, description: string, model: string, system_prompt: string, icon?: string) => ipcRenderer.invoke('agent:management:register', name, description, model, system_prompt, icon),
  agent_management_update: (agent_id: string, name: string, description: string, model: string, system_prompt: string, icon: string) => ipcRenderer.invoke('agent:management:update', agent_id, name, description, model, system_prompt, icon),
  agent_management_toggle: (agent_id: string, action: 'start' | 'stop') => ipcRenderer.invoke('agent:management:toggle', agent_id, action),
  agent_management_check: (agent_id: string) => ipcRenderer.invoke('agent:management:check', agent_id),
  feedback_submit: (data: { type: string, title: string, content: string, contact?: string, attachments?: { name: string, data: string }[] }) => ipcRenderer.invoke('feedback:submit', data),
  kb_demo_create: (params: { content?: string | null, file_name?: string | null, index_name?: string | null }) => ipcRenderer.invoke('kb:demo_create', params),
  kb_list_categories: () => ipcRenderer.invoke('kb:list_categories'),
  kb_list_indices: (index_name?: string) => ipcRenderer.invoke('kb:list_indices', index_name),
  kb_list_index_files: (index_id: string, page_number?: number, page_size?: number) =>
    ipcRenderer.invoke('kb:list_index_files', index_id, page_number, page_size),
  kb_rename_index: (index_id: string, index_name: string) => ipcRenderer.invoke('kb:rename_index', index_id, index_name),
  kb_delete_index: (index_id: string) => ipcRenderer.invoke('kb:delete_index', index_id),
  kb_delete_index_file: (index_id: string, file_id: string) => ipcRenderer.invoke('kb:delete_index_file', index_id, file_id),
  kb_upload_text: (index_id: string, file_name: string, content: string) => ipcRenderer.invoke('kb:upload_text', index_id, file_name, content),
  app_check_update: () => ipcRenderer.invoke('app:check_update'),
  app_install_update: () => ipcRenderer.invoke('app:install_update'),
  app_get_version: () => ipcRenderer.invoke('app:get_version'),
  on_agent_chat_chunk: (callback: (event: any, chunk: any) => void) => {
    ipcRenderer.on('agent:chat:chunk', callback)
    return () => { ipcRenderer.removeListener('agent:chat:chunk', callback) }
  },
  // 通用的 IPC 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, callback)
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  }
})
