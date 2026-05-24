/**
 * 文件名: CreateAgentModal.tsx
 * 作者: wuhao
 * 日期: 2026-05-24 14:40:00
 * 描述: 创建自定义多智能体弹窗组件
 */

import React, { useState } from 'react';
import { ExtensionAPI } from '../../api/extensions_api';
import { use_log_store } from '../../store/log';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agentName: string) => void;
}

export const CreateAgentModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { add_log } = use_log_store();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const res = await ExtensionAPI.createAgent({
        name,
        system_prompt: systemPrompt,
      });

      if (res.code === 200) {
        add_log(`[Renderer] 创建智能体成功: ${res.data.agent_name}`);
        onSuccess(res.data.agent_name);
        onClose();
      } else {
        throw new Error(res.msg);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      add_log(`[Renderer] 创建智能体失败: ${errMsg}`);
      alert(`创建失败: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0F172A] p-6 rounded-lg w-[480px] border border-slate-700">
        <h2 className="text-xl font-bold mb-4 text-slate-100">创建自定义智能体</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="agentName" className="block text-sm font-medium text-slate-300 mb-1">
              智能体名称
            </label>
            <input
              id="agentName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1E293B] border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              placeholder="例如: 数据分析助手"
              required
            />
          </div>
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-slate-300 mb-1">
              系统提示词 (System Prompt)
            </label>
            <textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-[#1E293B] border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 h-32"
              placeholder="请输入智能体的角色设定与指令..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded disabled:opacity-50"
            >
              {isLoading ? '创建中...' : '确认创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
