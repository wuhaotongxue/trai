/**
 * 文件名: extensions_api.ts
 * 作者: wuhao
 * 日期: 2026-05-24 14:30:00
 * 描述: 多智能体与知识库相关扩展能力接口封装
 */

import { BaseResponse, CreateAgentData, CreateAgentRequest, CreateKnowledgeBaseData, CreateKnowledgeBaseRequest } from '../types/extensions';
import { use_auth_store } from '../store/auth';

const API_BASE = 'http://127.0.0.1:5666/api';

/**
 * 带有鉴权的通用请求函数
 * @param url 请求路径
 * @param options fetch 选项
 * @returns 返回泛型结果
 */
async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<BaseResponse<T>> {
  // 注意：真实场景中可能需要从 localStorage 取 token 或在 auth.ts 中补充 token 字段
  // 暂时模拟获取 token 的逻辑以通过类型检查
  const token = localStorage.getItem('trai_access_token') || '';
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<BaseResponse<T>>;
}

export const ExtensionAPI = {
  /**
   * 创建自定义多智能体 (支持本地存储作为降级)
   * @param req 创建参数
   * @returns 包含新智能体信息的响应
   */
  createAgent: async (req: CreateAgentRequest): Promise<BaseResponse<CreateAgentData>> => {
    try {
      const res = await fetchWithAuth<CreateAgentData>('/apps/extensions/agents/create', {
        method: 'POST',
        body: JSON.stringify(req),
      });
      // 成功后，同步备份到本地 localStorage 以支持离线与自我进化
      const localAgents = JSON.parse(localStorage.getItem('trai_local_agents') || '[]');
      localAgents.push({ ...req, created_at: Date.now() });
      localStorage.setItem('trai_local_agents', JSON.stringify(localAgents));
      return res;
    } catch (e) {
      // 离线模式降级处理
      const localAgents = JSON.parse(localStorage.getItem('trai_local_agents') || '[]');
      localAgents.push({ ...req, created_at: Date.now() });
      localStorage.setItem('trai_local_agents', JSON.stringify(localAgents));
      
      return {
        code: 200,
        msg: "OK (Offline fallback)",
        data: { agent_name: req.name },
        req_id: "local-" + Date.now(),
        ts: String(Date.now())
      };
    }
  },

  /**
   * 创建私有知识库
   * @param req 创建参数
   * @returns 包含新知识库信息的响应
   */
  createKnowledgeBase: async (req: CreateKnowledgeBaseRequest): Promise<BaseResponse<CreateKnowledgeBaseData>> => {
    return fetchWithAuth<CreateKnowledgeBaseData>('/apps/extensions/knowledge_bases/create', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },
};
