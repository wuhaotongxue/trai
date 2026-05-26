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

/**
 * 视频生成与字幕处理相关类型
 */
export interface VideoGenerationRequest {
  prompt: string;
  model?: string;
  frames?: number;
  resolution?: string;
}

export interface VideoGenerationData {
  task_id: string;
  status: string;
  video_url?: string;
  public_url?: string;
  object_key?: string;
}

export interface TranscribeHistoryItem {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  source_audio_url: string;
  md_url?: string;
  txt_url?: string;
  pdf_url?: string;
  result_text?: string;
}

export interface TranscribeHistoryResponse {
  items: TranscribeHistoryItem[];
  total: number;
  page: number;
  page_size: number;
}
