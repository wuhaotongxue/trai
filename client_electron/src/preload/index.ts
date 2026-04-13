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
  auth_logout: () => ipcRenderer.invoke('auth:logout')
})
