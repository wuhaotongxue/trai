/**
 * 文件名: agent.ts
 * 作者: wuhao
 * 日期: 2026-04-14 08:45:00
 * 描述: 客户端 Agent 对话服务层
 */
import axios from 'axios'
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

export const agent_service = {
  /**
   * 发送消息给 Agent (流式)
   */
  async chat(session_id: string, message: string, event_sender?: (event: string, data: any) => void) {
    try {
      const url = `${get_api_base_url()}/api/agent/chat`
      const payload = {
        session_id,
        message,
        stream: true,
        role: 'user'
      }
      
      const res = await api_client.post(url, payload, { responseType: 'stream' })
      
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
                  event_sender('agent:chat:chunk', parsed)
                }
              } catch (e) {
                // ignore parse error for incomplete JSON in single line (rare but possible if bad format)
              }
            }
          }
        })
        
        res.data.on('end', () => {
          resolve({ success: true, data: final_data })
        })
        
        res.data.on('error', (err: any) => {
          log.error('Stream error:', err)
          resolve({ success: false, error: err.message })
        })
      })

    } catch (error: any) {
      log.error('agent_chat failed:', error.message)
      return { 
        success: false, 
        error: error.message || '对话请求失败' 
      }
    }
  }
}
