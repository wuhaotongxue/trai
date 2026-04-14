interface Window {
  electron_api: {
    get_system_info: () => Promise<{ success: boolean; data?: any; error?: string }>;
    config_get: (key: string, default_value?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    config_set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    auth_login: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    auth_register: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    auth_logout: () => Promise<{ success: boolean; error?: string }>;
    tools_convert_md_to_pdf: (file_path: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    tools_compress_image: (file_path: string, quality?: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    tools_compress_files_to_zip: (file_paths: string[]) => Promise<{ success: boolean; data?: any; error?: string }>;
    tools_convert_image: (file_path: string, target_format: string, sizes?: number[]) => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_chat: (session_id: string, message: string, agent_id?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_stop: (session_id: string) => Promise<{ success: boolean; error?: string }>;
    ai_generate_image: (prompt: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    ai_generate_image_to_image: (prompt: string, image_url: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    ai_generate_music: (prompt: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    ai_generate_video: (prompt: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_management_list: () => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_management_register: (name: string, description: string, model: string, system_prompt: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    agent_management_toggle: (agent_id: string, action: 'start' | 'stop') => Promise<{ success: boolean; data?: any; error?: string }>;
    feedback_submit: (data: { type: string, title: string, content: string, contact?: string }) => Promise<{ success: boolean; data?: any; error?: string }>;
    on_agent_chat_chunk?: (callback: (event: any, chunk: any) => void) => (() => void);
  }
}
