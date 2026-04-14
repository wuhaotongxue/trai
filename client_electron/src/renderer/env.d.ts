interface Window {
  electron_api: {
    get_system_info: () => Promise<{ success: boolean; data?: any; error?: string }>;
    config_get: (key: string, default_value?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    config_set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    auth_login: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    auth_register: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  }
}
