/**
 * 文件名: tools.ts
 * 作者: wuhao
 * 日期: 2026-04-14 08:12:51
 * 描述: 客户端工具服务层, 提供文件转换和压缩等功能
 */
import log from 'electron-log'
import fs from 'fs'
import path from 'path'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'
import { api_client } from '../platform/api_client'

export const tools_service = {
  /**
   * 将本地 Markdown 文件转换为 PDF
   * @param file_path - Markdown 文件路径
   * @returns 转换结果
   */
  async convert_md_to_pdf(file_path: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.tools_md_to_pdf)
      const form_data = new FormData()

      const file_buffer = await fs.promises.readFile(file_path)
      const filename = path.basename(file_path)
      const base_dir = path.dirname(file_path)

      form_data.append('file', new Blob([file_buffer]), filename)
      // 额外传递文件所在目录, 用于解析相对路径的图片
      form_data.append('base_dir', base_dir)

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
   * @param file_path - 图片文件路径
   * @param quality - 压缩质量 0-100, 默认为 60
   * @param target_size_kb - 目标文件大小 KB（可选）
   * @returns 压缩结果
   */
  async compress_image(file_path: string, quality: number = 60, target_size_kb?: number) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.tools_compress_image)
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
   * @param file_paths - 文件路径数组
   * @returns 压缩结果
   */
  async compress_files_to_zip(file_paths: string[]) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.tools_compress_zip)
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
   * @param file_path - 图片文件路径
   * @param target_format - 目标格式（如 'png', 'jpg'）
   * @param sizes - 缩放尺寸（可选）
   * @param width - 目标宽度（可选）
   * @param height - 目标高度（可选）
   * @param target_size_kb - 目标文件大小 KB（可选）
   * @returns 转换结果
   */
  async convert_image(file_path: string, target_format: string, sizes?: number[], width?: number, height?: number, target_size_kb?: number) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.tools_convert_image)
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
