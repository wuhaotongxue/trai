/**
 * 文件名: types.ts
 * 作者: wuhao
 * 日期: 2026-04-23 23:55:00
 * 描述: AgentChat 页面共享类型定义
 */

export interface ToolStep {
  type: 'tool_start' | 'tool_result'
  tool_name: string
  content: string
  success?: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  reasoning_content?: string
  steps?: ToolStep[]
  files?: Array<{ name: string; type: string; data: string }>
}

export interface ChatSession {
  id: string
  title: string
  updated_at: number
  messages: ChatMessage[]
  agent_id?: string
  kb_id?: string
}

export interface Agent {
  id: string
  name: string
  status: string
  icon?: string
}

export interface KnowledgeBase {
  id: string
  name: string
}

export const STORAGE_KEY = 'trai_chat_sessions'
