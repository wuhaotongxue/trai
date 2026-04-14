/**
 * 文件名: agent.ts
 * 作者: wuhao
 * 日期: 2026-04-14 08:45:00
 * 描述: 客户端 Agent 对话服务层
 */
import axios, { CancelTokenSource } from 'axios'
import log from 'electron-log'
import { config_store } from '../platform/config_store'

const get_api_base_url = () => {
  return config_store.get('api_url', 'http://127.0.0.1:5666')
}

const api_client = axios.create()

api_client.interceptors.request.use((config) => {
  const token = config_store.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 保存每个 session_id 对应的 CancelToken，用于中止请求
const active_requests: Record<string, CancelTokenSource> = {}

export const agent_service = {
  /**
   * 停止生成
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
   * 发送消息给 Agent (流式)
   */
  async chat(session_id: string, message: string, event_sender?: (event: string, data: any) => void) {
    try {
      // 停止上一个同一 session 的请求（如果存在）
      if (active_requests[session_id]) {
        active_requests[session_id].cancel('Canceled due to new request.')
      }
      
      const cancel_source = axios.CancelToken.source()
      active_requests[session_id] = cancel_source

      const url = `${get_api_base_url()}/api/agent/chat`
      const payload = {
        session_id,
        message,
        stream: true,
        role: 'user'
      }
      
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
                  // 将 session_id 注入到 chunk 数据中，便于前端区分
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
  }
}
