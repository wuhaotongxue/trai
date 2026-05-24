/**
 * 文件名: PluginMarketplace.tsx
 * 作者: wuhao
 * 日期: 2026-05-24 15:40:00
 * 描述: 插件系统应用市场界面 (支持平滑动画与玻璃拟态)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  icon: string;
  installed: boolean;
}

const MOCK_PLUGINS: Plugin[] = [
  { id: '1', name: 'Web Search', description: '赋予智能体联网搜索最新信息的能力。', author: 'TRAI 官方', icon: '🌐', installed: true },
  { id: '2', name: 'Code Interpreter', description: '在安全的沙盒环境中执行 Python 代码。', author: 'TRAI 官方', icon: '💻', installed: false },
  { id: '3', name: 'Excel Data Analyzer', description: '自动解析并生成 Excel 报表与可视化图表。', author: 'DataTeam', icon: '📊', installed: false },
  { id: '4', name: 'GitHub Integration', description: '直接读取或提交代码到 GitHub 仓库。', author: 'DevOps', icon: '🐙', installed: false },
];

export const PluginMarketplace: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>(MOCK_PLUGINS);
  const [search, setSearch] = useState('');

  const toggleInstall = (id: string) => {
    setPlugins(plugins.map(p => p.id === id ? { ...p, installed: !p.installed } : p));
  };

  const filteredPlugins = plugins.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.includes(search));

  return (
    <div className="flex flex-col h-full w-full bg-[#080818] text-slate-200 overflow-hidden">
      {/* 顶部标题栏 (玻璃拟态) */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 backdrop-blur-md bg-[#0F172A]/80 border-b border-slate-800 p-6"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          插件市场 (Plugins)
        </h1>
        <p className="text-sm text-slate-400 mt-2">为您的智能体安装扩展能力与工具。</p>
        
        <div className="mt-4 relative max-w-md">
          <input
            type="text"
            placeholder="搜索插件..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1E293B]/50 border border-slate-700 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            aria-label="搜索插件"
            title="搜索插件"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        </div>
      </motion.div>

      {/* 插件列表区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          <AnimatePresence>
            {filteredPlugins.map(plugin => (
              <motion.div
                key={plugin.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}
                className={cn(
                  "relative flex flex-col p-5 rounded-xl border backdrop-blur-sm transition-all duration-300",
                  plugin.installed 
                    ? "bg-indigo-900/10 border-indigo-500/30" 
                    : "bg-[#1E293B]/40 border-slate-700/50 hover:border-slate-500"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-2xl border border-slate-700 shadow-inner">
                      {plugin.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">{plugin.name}</h3>
                      <p className="text-xs text-slate-500">by {plugin.author}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-slate-400 flex-1 leading-relaxed">
                  {plugin.description}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    plugin.installed ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-400"
                  )}>
                    {plugin.installed ? '✓ 已安装' : '未安装'}
                  </span>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleInstall(plugin.id)}
                    type="button"
                    aria-label={plugin.installed ? "卸载插件" : "安装插件"}
                    title={plugin.installed ? "卸载插件" : "安装插件"}
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                      plugin.installed
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20"
                    )}
                  >
                    {plugin.installed ? '卸载' : '安装'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredPlugins.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64 text-slate-500"
          >
            <span className="text-4xl mb-4">📭</span>
            <p>没有找到匹配的插件</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
