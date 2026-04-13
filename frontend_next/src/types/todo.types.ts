/**
 * todo.types.ts
 * 作者: wuhao
 * 日期: 2026-04-09
 * 描述: TODO 模块类型定义
 */

export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  priority: Priority;
  module: string;
  description: string;
  startTime: string | null;
  completeTime: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
}

export interface Module {
  id: string;
  name: string;
  status: 'active' | 'pending';
  description: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string }> = {
  high: { label: '高', color: 'text-red-600', bgColor: 'bg-red-100' },
  medium: { label: '中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  low: { label: '低', color: 'text-green-600', bgColor: 'bg-green-100' },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  in_progress: { label: '进行中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100' },
};
