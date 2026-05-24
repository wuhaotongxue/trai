/**
 * 文件名: WorkflowEditor.tsx
 * 作者: wuhao
 * 日期: 2026-05-24 15:00:00
 * 描述: 类似 Dify 的拖拽式工作流编排画布 (占位与基础骨架)
 */

import React, { useState } from 'react';

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
        className="flex-1 relative overflow-hidden bg-[#0B101E]"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="absolute top-4 left-4 text-slate-500 text-sm pointer-events-none">
          将左侧节点拖拽到此处进行工作流编排
        </div>
        
        {/* 渲染节点 */}
        {nodes.map((node) => (
          <div 
            key={node.id}
            className="absolute p-4 rounded-lg border shadow-lg cursor-pointer hover:ring-2 hover:ring-cyan-500/50"
            style={{ 
              left: node.position.x, 
              top: node.position.y,
              backgroundColor: '#1E293B',
              borderColor: node.type === 'LLM' ? '#22D3EE' : node.type === 'KnowledgeRetrieval' ? '#34D399' : '#FBBF24',
              minWidth: '200px'
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm">{node.data.label as string}</span>
              <button 
                className="text-slate-500 hover:text-red-400"
                onClick={() => setNodes(nodes.filter(n => n.id !== node.id))}
                aria-label="删除节点"
                title="删除节点"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-400">
              {node.id}
            </div>
            {/* 模拟连线锚点 */}
            <div className="absolute -left-2 top-1/2 w-3 h-3 bg-slate-600 rounded-full border border-[#0F172A]"></div>
            <div className="absolute -right-2 top-1/2 w-3 h-3 bg-slate-600 rounded-full border border-[#0F172A]"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
