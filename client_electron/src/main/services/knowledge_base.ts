/**
 * 文件名: knowledge_base.ts
 * 作者: wuhao
 * 日期: 2026-04-16 10:36:17
 * 描述: 客户端知识库服务层, 调用后端管理接口创建知识库.
 */
import log from 'electron-log'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'
import { api_client } from '../platform/api_client'
import { performance_monitor } from '../platform/performance_monitor'
import { error_handler } from '../platform/error_handler'

/**
 * 网络请求缓存系统
 */
interface CacheItem {
  data: any
  timestamp: number
}

const cache: Record<string, CacheItem> = {}
const CACHE_TTL = 10000 // 缓存有效期，单位毫秒

/**
 * 生成缓存键
 */
const generateCacheKey = (url: string, params?: any): string => {
  return `${url}:${JSON.stringify(params || {})}`
}

/**
 * 缓存包装器
 */
const withCache = <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
  return (async (...args: any[]) => {
    // 生成缓存键
    const url = args[0] // 假设第一个参数是URL
    const params = args[1]?.params || {} // 假设第二个参数是配置对象, 其中包含params
    const cacheKey = generateCacheKey(url, params)
    const now = Date.now()
    
    // 检查缓存
    const cachedItem = cache[cacheKey]
    if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
      log.info(`[cache] hit for ${url}`)
      return cachedItem.data
    }
    
    // 执行函数
    const result = await fn(...args)
    
    // 更新缓存
    cache[cacheKey] = {
      data: result,
      timestamp: now
    }
    
    return result
  }) as T
}

/**
 * 节流函数
 */
const throttle = <T extends (...args: any[]) => Promise<any>>(fn: T, delay: number): T => {
  let lastCall = 0
  let pending: Promise<any> | null = null
  
  return (async (...args: any[]) => {
    const now = Date.now()
    if (now - lastCall < delay) {
      if (!pending) {
        pending = new Promise((resolve) => {
          setTimeout(async () => {
            lastCall = Date.now()
            const result = await fn(...args)
            pending = null
            resolve(result)
          }, delay - (now - lastCall))
        })
      }
      return pending
    }
    
    lastCall = now
    return await fn(...args)
  }) as T
}

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

// 缓存和节流配置
const cachedGet = withCache(api_client.get.bind(api_client))
const throttledGet = throttle(cachedGet, 500) // 500ms 节流

export const knowledge_base_service = {
  /**
   * 创建演示知识库
   * @param params - 知识库创建参数
   * @returns 创建结果, 包含索引ID、文件ID等信息
   */
  async demo_create(params: KnowledgeBaseDemoCreateRequest) {
    return await performance_monitor.measure('knowledge_base.demo_create', async () => {
      const result = await error_handler.catchAsync(async () => {
        const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_demo_create)
        const res = await api_client.post(url, params)
        
        // 清除相关缓存
        Object.keys(cache).forEach(cacheKey => {
          if (cacheKey.includes('admin/knowledge_base/indices')) {
            delete cache[cacheKey]
          }
        })
        
        return res.data as KnowledgeBaseDemoCreateResponse
      }, { params })
      
      return result
    })
  },

  /**
   * 获取知识库分类列表
   * @returns 分类列表
   */
  async list_categories() {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_categories)
      const res = await throttledGet(url)
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

  /**
   * 获取知识库索引列表
   * @param index_name - 可选的索引名称过滤
   * @returns 索引列表
   */
  async list_indices(index_name?: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_indices)
      const res = await throttledGet(url, { params: { index_name } })
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

  /**
   * 获取指定索引下的文件列表
   * @param index_id - 索引ID
   * @param page_number - 页码
   * @param page_size - 每页数量
   * @returns 文件列表
   */
  async list_index_files(index_id: string, page_number?: number, page_size?: number) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_index_files(index_id))
      const params: Record<string, number> = {}
      if (typeof page_number === 'number') params.page_number = page_number
      if (typeof page_size === 'number') params.page_size = page_size
      const res = await throttledGet(url, { params })
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

  /**
   * 重命名知识库索引
   * @param index_id - 索引ID
   * @param index_name - 新的索引名称
   * @returns 操作结果
   */
  async rename_index(index_id: string, index_name: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_index(index_id))
      const res = await api_client.put(url, { index_name })
      
      // 清除相关缓存
      Object.keys(cache).forEach(cacheKey => {
        if (cacheKey.includes('admin/knowledge_base/indices')) {
          delete cache[cacheKey]
        }
      })
      
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base rename_index failed:', error.response?.data || error.message)
      const msg = error.response?.data?.detail?.message || error.response?.data?.message || error.message || '重命名知识库失败'
      return { success: false, error: msg }
    }
  },

  /**
   * 删除知识库索引
   * @param index_id - 索引ID
   * @returns 操作结果
   */
  async delete_index(index_id: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_index(index_id))
      const res = await api_client.delete(url)
      
      // 清除相关缓存
      Object.keys(cache).forEach(cacheKey => {
        if (cacheKey.includes('admin/knowledge_base/indices') || cacheKey.includes(`admin/knowledge_base/index/${index_id}`)) {
          delete cache[cacheKey]
        }
      })
      
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base delete_index failed:', error.response?.data || error.message)
      const msg = error.response?.data?.detail?.message || error.response?.data?.message || error.message || '删除知识库失败'
      return { success: false, error: msg }
    }
  },

  /**
   * 删除索引中的文件
   * @param index_id - 索引ID
   * @param file_id - 文件ID
   * @returns 操作结果
   */
  async delete_index_file(index_id: string, file_id: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_index_file(index_id, file_id))
      const res = await api_client.delete(url)
      
      // 清除相关缓存
      Object.keys(cache).forEach(cacheKey => {
        if (cacheKey.includes(`admin/knowledge_base/index/${index_id}/files`)) {
          delete cache[cacheKey]
        }
      })
      
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base delete_index_file failed:', error.response?.data || error.message)
      const msg = error.response?.data?.detail?.message || error.response?.data?.message || error.message || '删除文件失败'
      return { success: false, error: msg }
    }
  },

  /**
   * 上传文本文件到知识库
   * @param index_id - 索引ID
   * @param file_name - 文件名
   * @param content - 文件内容
   * @returns 上传结果
   */
  async upload_text(index_id: string, file_name: string, content: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.admin_knowledge_base_upload_text(index_id))
      const res = await api_client.post(url, { file_name, content })
      
      // 清除相关缓存
      Object.keys(cache).forEach(cacheKey => {
        if (cacheKey.includes(`admin/knowledge_base/index/${index_id}/files`)) {
          delete cache[cacheKey]
        }
      })
      
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('knowledge base upload_text failed:', error.response?.data || error.message)
      const msg = error.response?.data?.detail?.message || error.response?.data?.message || error.message || '上传文件失败'
      return { success: false, error: msg }
    }
  }
}
