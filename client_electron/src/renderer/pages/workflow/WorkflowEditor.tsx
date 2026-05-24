/**
 * 文件名: WorkflowEditor.tsx
 * 作者: wuhao
 * 日期: 2026-05-24 15:00:00
 * 描述: 类似 Dify 的拖拽式工作流编排画布 (占位与基础骨架)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义节点类型
interface Node {
  id: string;
  type: 'LLM' | 'KnowledgeRetrieval' | 'CodeExecution' | 'Output';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [draggedType, setDraggedType] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedType(type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type) return;

    // 简单计算放置位置 (实际应用中需要根据画布偏移量计算)
    const position = {
      x: e.clientX - 250, // 减去左侧边栏宽度
      y: e.clientY - 60,  // 减去顶部导航高度
    };

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: type as Node['type'],
      position,
      data: { label: `${type} 节点` },
    };

    setNodes((nds) => [...nds, newNode]);
    setDraggedType(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="flex h-full w-full bg-[#080818] text-slate-200">
      {/* 左侧节点选择区 */}
      <div className="w-64 border-r border-slate-800 bg-[#0F172A] p-4 flex flex-col">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">组件节点库</h3>
        
        <div className="space-y-3">
          <div 
            className="p-3 bg-[#1E293B] border border-slate-700 rounded cursor-grab hover:border-cyan-500 transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, 'LLM')}
          >
            <div className="font-medium text-cyan-400">大模型 (LLM)</div>
            <div className="text-xs text-slate-500 mt-1">调用大语言模型生成回复</div>
          </div>
          
          <div 
            className="p-3 bg-[#1E293B] border border-slate-700 rounded cursor-grab hover:border-cyan-500 transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, 'KnowledgeRetrieval')}
          >
            <div className="font-medium text-emerald-400">知识检索 (RAG)</div>
            <div className="text-xs text-slate-500 mt-1">从知识库检索相关上下文</div>
          </div>

          <div 
            className="p-3 bg-[#1E293B] border border-slate-700 rounded cursor-grab hover:border-cyan-500 transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, 'CodeExecution')}
          >
            <div className="font-medium text-amber-400">代码执行</div>
            <div className="text-xs text-slate-500 mt-1">运行 Python/JS 沙箱代码</div>
          </div>
        </div>
      </div>

      {/* 右侧画布区 */}
      <div 
        className="flex-1 relative overflow-hidden bg-[#0B101E] bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:20px_20px]"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 text-slate-500 text-sm pointer-events-none backdrop-blur-sm bg-[#0F172A]/50 px-4 py-2 rounded-full border border-slate-800"
        >
          ✨ 将左侧节点拖拽到此处进行工作流编排
        </motion.div>
        
        {/* 渲染节点 */}
        <AnimatePresence>
          {nodes.map((node) => (
            <motion.div 
              key={node.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              whileHover={{ scale: 1.02 }}
              whileDrag={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}
              drag
              dragMomentum={false}
              onDragEnd={(e, info) => {
                setNodes(nodes.map(n => 
                  n.id === node.id 
                    ? { ...n, position: { x: n.position.x + info.offset.x, y: n.position.y + info.offset.y } }
                    : n
                ));
              }}
              className="absolute p-4 rounded-xl border shadow-xl cursor-grab active:cursor-grabbing backdrop-blur-md"
              style={{ 
                left: node.position.x, 
                top: node.position.y,
                backgroundColor: 'rgba(30, 41, 59, 0.8)', // 玻璃拟态背景
                borderColor: node.type === 'LLM' ? 'rgba(34, 211, 238, 0.5)' : node.type === 'KnowledgeRetrieval' ? 'rgba(52, 211, 153, 0.5)' : 'rgba(251, 191, 36, 0.5)',
                minWidth: '220px'
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{
                    backgroundColor: node.type === 'LLM' ? '#22D3EE' : node.type === 'KnowledgeRetrieval' ? '#34D399' : '#FBBF24'
                  }}></span>
                  {node.data.label as string}
                </span>
                <button 
                  className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                  onClick={() => setNodes(nodes.filter(n => n.id !== node.id))}
                  aria-label="删除节点"
                  title="删除节点"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded font-mono">
                {node.id}
              </div>
              {/* 模拟连线锚点 */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-700 rounded-full border-2 border-[#0F172A] hover:bg-cyan-400 transition-colors"></div>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-700 rounded-full border-2 border-[#0F172A] hover:bg-cyan-400 transition-colors"></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
