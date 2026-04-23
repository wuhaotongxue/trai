/**
 * 文件名: agent.ts
 * 作者: wuhao
 * 日期: 2026-04-14 08:45:00
 * 描述: 客户端 Agent 对话服务层
 */
import axios, { CancelTokenSource } from 'axios'
import log from 'electron-log'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'
import { api_client } from '../platform/api_client'

// 保存每个 session_id 对应的 CancelToken, 用于中止请求
const active_requests: Record<string, CancelTokenSource> = {}

export const agent_service = {
  /**
   * 停止正在进行的对话生成
   * @param session_id - 会话 ID
   * @returns 停止结果
   */
  stop_chat(session_id: string) {
    if (active_requests[session_id]) {
      active_requests[session_id].cancel('User aborted the generation.')
      delete active_requests[session_id]
      log.info(`Aborted chat request for session: ${session_id}`)
      return { success: true }
    }
    return { success: false, error: 'No active request found for this session.' }
  },

  /**
   * 发送消息给 Agent（流式响应）
   * @param session_id - 会话 ID
   * @param message - 用户消息内容
   * @param agent_id - Agent ID（可选）
   * @param knowledge_base_id - 知识库 ID（可选）
   * @param event_sender - 事件发送回调函数（可选）
   * @returns 对话响应结果
   */
  async chat(session_id: string, message: string, agent_id?: string, knowledge_base_id?: string, event_sender?: (event: string, data: any) => void) {
    try {
      // 停止上一个同一 session 的请求（如果存在）
      if (active_requests[session_id]) {
        active_requests[session_id].cancel('Canceled due to new request.')
      }
      
      const cancel_source = axios.CancelToken.source()
      active_requests[session_id] = cancel_source

      const url = ApiUrl.build_api_url(ApiEndpoints.agent_chat)
      const payload: any = {
        session_id,
        message,
        stream: true,
        role: 'user'
      }
      if (agent_id) payload.agent_id = agent_id
      if (knowledge_base_id) payload.knowledge_base_id = knowledge_base_id

      log.info('Agent Chat Payload:', payload)
      
      const res = await api_client.post(url, payload, { 
        responseType: 'stream',
        cancelToken: cancel_source.token 
      })
      
      return new Promise((resolve) => {
        let final_data: any = { content: '', reasoning_content: '' }
        let buffer = ''
        
        res.data.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf8')
          
          let newline_index
          while ((newline_index = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newline_index).trim()
            buffer = buffer.slice(newline_index + 1)
            
            if (line.startsWith('data: ')) {
              const data_str = line.slice(6).trim()
              if (data_str === '[DONE]') {
                delete active_requests[session_id]
                resolve({ success: true, data: final_data })
                return
              }
              try {
                const parsed = JSON.parse(data_str)
                if (parsed.type === 'token' && parsed.content) {
                  final_data.content += parsed.content
                } else if (parsed.type === 'reasoning' && parsed.content) {
                  final_data.reasoning_content += parsed.content
                }
                
                if (event_sender) {
                  // 将 session_id 注入到 chunk 数据中, 便于前端区分
                  event_sender('agent:chat:chunk', { ...parsed, session_id })
                }
              } catch (e) {
                // ignore parse error for incomplete JSON in single line (rare but possible if bad format)
              }
            }
          }
        })
        
        res.data.on('end', () => {
          delete active_requests[session_id]
          resolve({ success: true, data: final_data })
        })
        
        res.data.on('error', (err: any) => {
          delete active_requests[session_id]
          log.error('Stream error:', err)
          resolve({ success: false, error: err.message })
        })
      })

    } catch (error: any) {
      delete active_requests[session_id]
      if (axios.isCancel(error)) {
        return { success: false, error: 'canceled', is_canceled: true }
      }
      log.error('agent_chat failed:', error.message)
      return { 
        success: false, 
        error: error.message || '对话请求失败' 
      }
    }
  },

  /**
   * 文生图（文本生成图片）
   * @param prompt - 提示词
   * @param model - 模型名称, 默认使用 FLUX.1-dev
   * @returns 生成结果
   */
  async generate_image(prompt: string, model: string = "AI-ModelScope/FLUX.1-dev") {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_image)
      const payload = { prompt, model }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('generate_image failed:', error.message)
      return { success: false, error: error.message || '图片生成失败' }
    }
  },

  /**
   * 图生图（图片生成图片）
   * @param prompt - 提示词
   * @param image_url - 原图 URL
   * @returns 生成结果
   */
  async generate_image_to_image(prompt: string, image_url: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_image_to_image)
      const payload = { prompt, image_url }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('generate_image_to_image failed:', error.message)
      return { success: false, error: error.message || '图生图生成失败' }
    }
  },

  /**
   * AI 音乐生成
   * @param prompt - 提示词
   * @returns 生成结果
   */
  async generate_music(prompt: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_music)
      const payload = { prompt }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('generate_music failed:', error.message)
      return { success: false, error: error.message || '音乐生成失败' }
    }
  },

  /**
   * AI 视频生成
   * @param prompt - 提示词
   * @returns 生成结果
   */
  async generate_video(prompt: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_video)
      const payload = { prompt }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('generate_video failed:', error.message)
      return { success: false, error: error.message || '视频生成失败' }
    }
  },

  /**
   * 获取 Agent 列表
   * @returns Agent 列表
   */
  async get_agents() {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_management_list)
      const res = await api_client.get(url)
      return { success: true, data: res.data.data.agents }
    } catch (error: any) {
      log.error('get_agents failed:', error.message)
      return { success: false, error: error.message || '获取 Agent 列表失败' }
    }
  },

  /**
   * 注册新 Agent
   * @param name - Agent 名称
   * @param description - Agent 描述
   * @param model - 使用的模型
   * @param system_prompt - 系统提示词
   * @param icon - Agent 图标（可选）
   * @param category - Agent 分类（可选）
   * @returns 注册结果
   */
  async register_agent(name: string, description: string, model: string, system_prompt: string, icon?: string, category?: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_management_register)
      const payload: any = { name, description, model, system_prompt }
      if (icon) payload.icon = icon
      if (category) payload.category = category
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('register_agent failed:', error.message)
      return { success: false, error: error.message || '注册 Agent 失败' }
    }
  },

  /**
   * 更新 Agent
   * @param agent_id - Agent ID
   * @param name - Agent 名称
   * @param description - Agent 描述
   * @param model - 使用的模型
   * @param system_prompt - 系统提示词
   * @param icon - Agent 图标
   * @param category - Agent 分类（可选）
   * @returns 更新结果
   */
  async update_agent(agent_id: string, name: string, description: string, model: string, system_prompt: string, icon: string, category?: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_management_update)
      const payload: any = { agent_id, name, description, model, system_prompt, icon }
      if (category) payload.category = category
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('update_agent failed:', error.message)
      return { success: false, error: error.message || '更新 Agent 失败' }
    }
  },

  /**
   * 启停 Agent（启动或停止）
   * @param agent_id - Agent ID
   * @param action - 动作类型: 'start' 或 'stop'
   * @returns 操作结果
   */
  async toggle_agent(agent_id: string, action: 'start' | 'stop') {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_management_toggle)
      const payload = { agent_id, action }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('toggle_agent failed:', error.message)
      return { success: false, error: error.message || '启停 Agent 失败' }
    }
  },

  /**
   * 检测 Agent 状态
   * @param agent_id - Agent ID
   * @returns Agent 状态信息
   */
  async check_agent(agent_id: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_management_check)
      const payload = { agent_id }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('check_agent failed:', error.message)
      return { success: false, error: error.message || '检测 Agent 状态失败' }
    }
  },

  /**
   * 提交 ComfyUI 任务
   * @param prompt - ComfyUI 工作流提示词
   * @returns 任务提交结果
   */
  async generate_comfyui(prompt: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_comfyui)
      const payload = { prompt }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('generate_comfyui failed:', error.message)
      return { success: false, error: error.message || '提交 ComfyUI 任务失败' }
    }
  },

  /**
   * AI 周报生成
   * @param template_base64 - 模板文件 Base64
   * @param template_name - 模板名称
   * @param description - 周报内容描述
   * @returns 生成的周报
   */
  async generate_report(template_base64: string, template_name: string, description: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_report)
      const payload = { template_base64, template_name, description }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('generate_report failed:', error.message)
      // TODO: 后端接口就绪后移除模拟响应
      // fallback mock
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ 
            success: true, 
            data: `# 基于 ${template_name} 生成的周报\n\n## 本周工作总结\n\n- ${description.replace(/\n/g, '\n- ')}\n\n## 下周计划\n\n- 继续推进当前进度...` 
          })
        }, 3000)
      })
    }
  }
}
