/**
 * 文件名: knowledge_base.ts
 * 作者: wuhao
 * 日期: 2026-04-16 10:36:17
 * 描述: 客户端知识库服务层, 调用后端管理接口创建知识库.
 */
import axios from 'axios'
import log from 'electron-log'
import { config_store } from '../platform/config_store'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'

const api_client = axios.create()

api_client.interceptors.request.use((config) => {
  const token = config_store.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface KnowledgeBaseDemoCreateRequest {
  content?: string | null
  file_name?: string | null
  index_name?: string | null
}

export interface KnowledgeBaseDemoCreateResponse {
  index_id: string
  index_name: string
  file_id: string
  file_name: string
  job_id: string
  job_status: string
}

export const knowledge_base_service = {
  async demo_create(params: KnowledgeBaseDemoCreateRequest) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_demo_create)
      const res = await api_client.post(url, params)
      return { success: true, data: res.data as KnowledgeBaseDemoCreateResponse }
    } catch (error: any) {
      log.error('knowledge base demo_create failed:', error.response?.data || error.message)
      const msg =
        error.response?.data?.detail?.message ||
        error.response?.data?.message ||
        error.message ||
        '创建知识库失败, 请检查网络或服务器配置'
      return { success: false, error: msg }
    }
  },

  async list_categories() {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_categories)
      const res = await api_client.get(url)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base list_categories failed:', error.response?.data || error.message)
      const msg =
        error.response?.data?.detail?.message ||
        error.response?.data?.message ||
        error.message ||
        '获取知识库分类失败, 请检查网络或服务器配置'
      return { success: false, error: msg }
    }
  },

  async list_indices(index_name?: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_indices)
      const res = await api_client.get(url, { params: { index_name } })
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base list_indices failed:', error.response?.data || error.message)
      const msg =
        error.response?.data?.detail?.message ||
        error.response?.data?.message ||
        error.message ||
        '获取知识库列表失败, 请检查网络或服务器配置'
      return { success: false, error: msg }
    }
  },

  async list_index_files(index_id: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_index_files(index_id))
      const res = await api_client.get(url)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base list_index_files failed:', error.response?.data || error.message)
      const msg =
        error.response?.data?.detail?.message ||
        error.response?.data?.message ||
        error.message ||
        '获取知识库文件失败, 请检查网络或服务器配置'
      return { success: false, error: msg }
    }
  },

  async rename_index(index_id: string, index_name: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_index(index_id))
      const res = await api_client.put(url, { index_name })
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base rename_index failed:', error.response?.data || error.message)
      const msg = error.response?.data?.detail?.message || error.response?.data?.message || error.message || '重命名知识库失败'
      return { success: false, error: msg }
    }
  },

  async delete_index(index_id: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_index(index_id))
      const res = await api_client.delete(url)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base delete_index failed:', error.response?.data || error.message)
      const msg = error.response?.data?.detail?.message || error.response?.data?.message || error.message || '删除知识库失败'
      return { success: false, error: msg }
    }
  },

  async delete_index_file(index_id: string, file_id: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_index_file(index_id, file_id))
      const res = await api_client.delete(url)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base delete_index_file failed:', error.response?.data || error.message)
      const msg = error.response?.data?.detail?.message || error.response?.data?.message || error.message || '删除文件失败'
      return { success: false, error: msg }
    }
  },

  async upload_text(index_id: string, file_name: string, content: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_upload_text(index_id))
      const res = await api_client.post(url, { file_name, content })
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base upload_text failed:', error.response?.data || error.message)
      const msg = error.response?.data?.detail?.message || error.response?.data?.message || error.message || '上传文件失败'
      return { success: false, error: msg }
    }
  }
}
