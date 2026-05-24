/**
 * 文件名: AISettingsModal.tsx
 * 作者: wuhao
 * 日期: 2026-05-24 14:50:00
 * 描述: AI 模型与知识库配置弹窗 (支持百炼和本地)
 */

import React, { useState, useEffect } from 'react';
import { use_log_store } from '../../store/log';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState<'dashscope' | 'local'>('local');
  const [apiKey, setApiKey] = useState('');
  const [localModel, setLocalModel] = useState('paraphrase-multilingual-MiniLM-L12-v2');
  const { add_log } = use_log_store();

  useEffect(() => {
    // 初始化时加载本地存储的配置
    const savedProvider = localStorage.getItem('ai_provider') as 'dashscope' | 'local' | null;
    if (savedProvider) setProvider(savedProvider);
    setApiKey(localStorage.getItem('dashscope_api_key') || '');
    setLocalModel(localStorage.getItem('local_embedding_model') || 'paraphrase-multilingual-MiniLM-L12-v2');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ai_provider', provider);
    if (provider === 'dashscope') {
      localStorage.setItem('dashscope_api_key', apiKey);
    } else {
      localStorage.setItem('local_embedding_model', localModel);
    }
    
    add_log(`[Renderer] AI 配置已更新为: ${provider}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0F172A] p-6 rounded-lg w-[480px] border border-slate-700">
        <h2 className="text-xl font-bold mb-4 text-slate-100">AI 与知识库引擎配置</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">引擎模式</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  value="local"
                  checked={provider === 'local'}
                  onChange={() => setProvider('local')}
                  className="text-cyan-500 bg-[#1E293B] border-slate-600 focus:ring-cyan-500"
                />
                <span>本地模型 (完全离线)</span>
              </label>
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  value="dashscope"
                  checked={provider === 'dashscope'}
                  onChange={() => setProvider('dashscope')}
                  className="text-cyan-500 bg-[#1E293B] border-slate-600 focus:ring-cyan-500"
                />
                <span>阿里百炼 (DashScope)</span>
              </label>
            </div>
          </div>

          {provider === 'dashscope' && (
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-1">
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#1E293B] border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="sk-xxxxxxxxxxxxxxxx"
                required
              />
            </div>
          )}

          {provider === 'local' && (
            <div>
              <label htmlFor="localModel" className="block text-sm font-medium text-slate-300 mb-1">
                本地向量模型名称
              </label>
              <input
                id="localModel"
                type="text"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                className="w-full bg-[#1E293B] border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="例如: paraphrase-multilingual-MiniLM-L12-v2"
                required
              />
            </div>
          )}

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
              className="px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded"
            >
              保存配置
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
