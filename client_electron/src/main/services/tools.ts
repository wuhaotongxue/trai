/**
 * 文件名: tools.ts
 * 作者: wuhao
 * 日期: 2026-04-14 08:12:51
 * 描述: 客户端工具服务层，提供文件转换和压缩等功能
 */
import axios from 'axios'
import log from 'electron-log'
import fs from 'fs'
import path from 'path'
import { config_store } from '../platform/config_store'

const get_api_base_url = () => {
  return config_store.get('api_url', 'http://127.0.0.1:5666')
}

// 创建 axios 实例并配置请求拦截器
const api_client = axios.create()

api_client.interceptors.request.use((config) => {
  const token = config_store.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const tools_service = {
  /**
   * 将本地 Markdown 文件转换为 PDF
   */
  async convert_md_to_pdf(file_path: string) {
    try {
      const url = `${get_api_base_url()}/api/tools/md_to_pdf`
      const form_data = new FormData()
      
      const file_buffer = await fs.promises.readFile(file_path)
      const filename = path.basename(file_path)
      form_data.append('file', new Blob([file_buffer]), filename)
      
      const res = await api_client.post(url, form_data)
      
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('convert_md_to_pdf failed:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail?.message || '文件转换失败' 
      }
    }
  },

  /**
   * 压缩本地图片
   */
  async compress_image(file_path: string, quality: number = 60, target_size_kb?: number) {
    try {
      const url = `${get_api_base_url()}/api/tools/compress_image`
      const form_data = new FormData()
      
      const file_buffer = await fs.promises.readFile(file_path)
      const filename = path.basename(file_path)
      form_data.append('file', new Blob([file_buffer]), filename)
      form_data.append('quality', quality.toString())
      if (target_size_kb) form_data.append('target_size_kb', target_size_kb.toString())
      
      const res = await api_client.post(url, form_data)
      
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('compress_image failed:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail?.message || '图片压缩失败' 
      }
    }
  },

  /**
   * 将多个本地文件压缩为 ZIP
   */
  async compress_files_to_zip(file_paths: string[]) {
    try {
      const url = `${get_api_base_url()}/api/tools/compress_zip`
      const form_data = new FormData()
      
      for (const file_path of file_paths) {
        const file_buffer = await fs.promises.readFile(file_path)
        const filename = path.basename(file_path)
        form_data.append('files', new Blob([file_buffer]), filename)
      }
      
      const res = await api_client.post(url, form_data)
      
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('compress_files_to_zip failed:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail?.message || 'ZIP 压缩失败' 
      }
    }
  },

  /**
   * 转换本地图片格式
   */
  async convert_image(file_path: string, target_format: string, sizes?: number[], width?: number, height?: number, target_size_kb?: number) {
    try {
      const url = `${get_api_base_url()}/api/tools/convert_image`
      const form_data = new FormData()
      
      const file_buffer = await fs.promises.readFile(file_path)
      const filename = path.basename(file_path)
      form_data.append('file', new Blob([file_buffer]), filename)
      form_data.append('target_format', target_format)
      if (sizes && sizes.length > 0) {
        form_data.append('sizes', sizes.join(','))
      }
      if (width) form_data.append('width', width.toString())
      if (height) form_data.append('height', height.toString())
      if (target_size_kb) form_data.append('target_size_kb', target_size_kb.toString())
      
      const res = await api_client.post(url, form_data)
      
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('convert_image failed:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.detail?.message || '图片转换失败' 
      }
    }
  }
}
