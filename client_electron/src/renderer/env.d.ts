/**
 * 文件名: env.d.ts
 * 作者: wuhao
 * 日期: 2026-04-19 01:30:00
 * 描述: Electron 类型定义文件
 * 说明: 定义 window.electron_api 的 TypeScript 类型声明
 */
interface Window {
  electron_api: {
    get_system_info: () => Promise<{ success: boolean; data?: any; error?: string }>;
    config_get: (key: string, default_value?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    config_set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    auth_login: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    auth_register: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    auth_change_password: (params: { old_password: string; new_password: string }) => Promise<{ success: boolean; data?: any; error?: string }>;
    auth_logout: () => Promise<{ success: boolean; error?: string }>;
    tools_convert_md_to_pdf: (file_path: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    tools_compress_image: (file_path: string, quality?: number, target_size_kb?: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    tools_compress_files_to_zip: (file_paths: string[]) => Promise<{ success: boolean; data?: any; error?: string }>;
    tools_convert_image: (file_path: string, target_format: string, sizes?: number[], width?: number, height?: number, target_size_kb?: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_chat: (session_id: string, message: string, agent_id?: string, knowledge_base_id?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_stop: (session_id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    ai_generate_image: (prompt: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    ai_generate_image_to_image: (prompt: string, image_url: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    ai_generate_music: (prompt: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    ai_generate_video: (prompt: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    ai_generate_comfyui: (prompt: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_management_list: () => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_management_register: (name: string, description: string, model: string, system_prompt: string, icon?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_management_toggle: (agent_id: string, action: 'start' | 'stop') => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_management_check: (agent_id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_management_update: (agent_id: string, name: string, description: string, model: string, system_prompt: string, icon?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    feedback_submit: (data: { type: string; title: string; content: string; contact?: string; attachments?: any[] }) => Promise<{ success: boolean; data?: any; error?: string }>;
    kb_demo_create?: (params: { content?: string | null; file_name?: string | null; index_name?: string | null }) => Promise<{ success: boolean; data?: any; error?: string }>;
    kb_list_categories: () => Promise<{ success: boolean; data?: any; error?: string }>;
    kb_list_indices: (index_name?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    kb_list_index_files: (index_id: string, page_number?: number, page_size?: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    kb_rename_index: (index_id: string, index_name: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    kb_delete_index: (index_id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    kb_delete_index_file: (index_id: string, file_id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    kb_upload_text?: (index_id: string, file_name: string, content: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    on_agent_chat_chunk?: (callback: (event: any, chunk: any) => void) => (() => void);
    ai_generate_report?: (file_data: any, filename: string, description: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    app_get_version?: () => Promise<string>;
    app_check_update?: () => Promise<{ success: boolean; data?: any; error?: string }>;
    app_install_update?: () => Promise<{ success: boolean; error?: string }>;
    // 通用 IPC 事件监听
    on: (channel: string, callback: (...args: any[]) => void) => void;
    off: (channel: string, callback: (...args: any[]) => void) => void;
  }
}

declare module '*.css'
