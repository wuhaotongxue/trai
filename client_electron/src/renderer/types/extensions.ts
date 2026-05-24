/**
 * 文件名: extensions.ts
 * 作者: wuhao
 * 日期: 2026-05-24 14:30:00
 * 描述: 客户端调用后端扩展能力 (多智能体、知识库) 的 API 类型定义
 */

export interface CreateAgentRequest {
  name: string;
  system_prompt?: string;
  tools?: string[];
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface BaseResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
  req_id: string;
  ts: string;
}

export interface CreateAgentData {
  agent_name: string;
}

export interface CreateKnowledgeBaseData {
  kb_name: string;
}
