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
  auth_wecom_login: () => ipcRenderer.invoke('auth:wecom_login'),
  auth_me: () => ipcRenderer.invoke('auth:me'),
  auth_register: (params: any) => ipcRenderer.invoke('auth:register', params),
  auth_change_password: (params: { old_password: string, new_password: string }) => ipcRenderer.invoke('auth:change_password', params),
  auth_logout: () => ipcRenderer.invoke('auth:logout'),
  tools_convert_md_to_pdf: (file_path: string) => ipcRenderer.invoke('tools:convert_md_to_pdf', file_path),
  tools_compress_image: (file_path: string, quality?: number, target_size_kb?: number) => ipcRenderer.invoke('tools:compress_image', file_path, quality, target_size_kb),
  tools_compress_files_to_zip: (file_paths: string[]) => ipcRenderer.invoke('tools:compress_files_to_zip', file_paths),
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
  // Agent 工具调用
  agent_tools_list: () => ipcRenderer.invoke('agent:tools:list'),
  agent_tool_call: (tool_name: string, tool_params: Record<string, any>) => ipcRenderer.invoke('agent:tool:call', tool_name, tool_params),
  // 文件操作工具
  file_read: (file_path: string) => ipcRenderer.invoke('file:read', file_path),
  file_write: (file_path: string, content: string, encoding?: string) => ipcRenderer.invoke('file:write', file_path, content, encoding),
  file_append: (file_path: string, content: string) => ipcRenderer.invoke('file:append', file_path, content),
  file_delete: (file_path: string) => ipcRenderer.invoke('file:delete', file_path),
  file_list: (dir_path: string) => ipcRenderer.invoke('file:list', dir_path),
  file_mkdir: (dir_path: string, recursive?: boolean) => ipcRenderer.invoke('file:mkdir', dir_path, recursive),
  // 浏览器工具
  browser_screenshot: (url: string, output_path: string, options?: any) => ipcRenderer.invoke('browser:screenshot', url, output_path, options),
  browser_scrape: (url: string) => ipcRenderer.invoke('browser:scrape', url),
  // 系统命令执行
  system_exec: (command: string, cwd?: string) => ipcRenderer.invoke('system:exec', command, cwd),
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
  admin_dashboard_api_usage: () => ipcRenderer.invoke('admin:dashboard_api_usage'),
  app_check_update: () => ipcRenderer.invoke('app:check_update'),
  app_download_update: () => ipcRenderer.invoke('app:download_update'),
  app_install_update: () => ipcRenderer.invoke('app:install_update'),
  app_get_version: () => ipcRenderer.invoke('app:get_version'),
  app_get_update_status: () => ipcRenderer.invoke('app:get_update_status'),
  // 更新事件监听
  on_update_status: (callback: (event: any, status: any) => void) => {
    ipcRenderer.on('update:status', callback)
    return () => { ipcRenderer.removeListener('update:status', callback) }
  },
  on_update_progress: (callback: (event: any, progress: any) => void) => {
    ipcRenderer.on('update:progress', callback)
    return () => { ipcRenderer.removeListener('update:progress', callback) }
  },
  // 窗口控制
  window_minimize: () => ipcRenderer.invoke('window:minimize'),
  window_maximize: () => ipcRenderer.invoke('window:maximize'),
  window_close: () => ipcRenderer.invoke('window:close'),
  window_is_maximized: () => ipcRenderer.invoke('window:is_maximized'),
  // 媒体播放相关
  media_select_files: () => ipcRenderer.invoke('media:select-files'),
  media_select_folder: () => ipcRenderer.invoke('media:select-folder'),
  // 媒体处理相关
  media_transcribe_audio: (file_path: string, language?: string) => ipcRenderer.invoke('media:transcribe-audio', file_path, language),
  media_generate_subtitles: (file_path: string, language?: string, orientation?: 'vertical' | 'horizontal') => ipcRenderer.invoke('media:generate-subtitles', file_path, language, orientation),
  media_translate_subtitles: (subtitles: any[], source_lang: string, target_lang: string) => ipcRenderer.invoke('media:translate-subtitles', subtitles, source_lang, target_lang),
  // 国际化相关
  i18n_get_translations: (locale: 'zh' | 'en') => ipcRenderer.invoke('i18n:get_translations', locale),
  i18n_get_all_translations: () => ipcRenderer.invoke('i18n:get_all_translations'),
  on_agent_chat_chunk: (callback: (event: any, chunk: any) => void) => {
    ipcRenderer.on('agent:chat:chunk', callback)
    return () => { ipcRenderer.removeListener('agent:chat:chunk', callback) }
  },
  on_auth_need_login: (callback: (event: any) => void) => {
    ipcRenderer.on('auth:need-login', callback)
    return () => { ipcRenderer.removeListener('auth:need-login', callback) }
  },
  on_app_quit_with_animation: (callback: (event: any) => void) => {
    ipcRenderer.on('app:quit-with-animation', callback)
    return () => { ipcRenderer.removeListener('app:quit-with-animation', callback) }
  },
})
