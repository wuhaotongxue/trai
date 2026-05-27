/**
 * todo.types.ts
 * 作者: wuhao
 * 日期: 2026-04-09
 * 描述: TODO 模块类型定义
 */

/**
 * 任务优先级类型
 */
export type Priority = 'high' | 'medium' | 'low';
/**
 * 任务状态类型
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/**
 * 任务接口
 * @property id - 任务 ID
 * @property name - 任务名称
 * @property status - 任务状态
 * @property priority - 任务优先级
 * @property module - 所属模块
 * @property description - 任务描述
 * @property startTime - 开始时间
 * @property completeTime - 完成时间
 * @property plannedStart - 计划开始时间
 * @property plannedEnd - 计划结束时间
 * @property actualStart - 实际开始时间
 * @property actualEnd - 实际结束时间
 */
export interface Task {
  /** 任务 ID */
  id: string;
  /** 任务名称 */
  name: string;
  /** 任务状态 */
  status: TaskStatus;
  /** 任务优先级 */
  priority: Priority;
  /** 所属模块 */
  module: string;
  /** 任务描述 */
  description: string;
  /** 开始时间 */
  startTime: string | null;
  /** 完成时间 */
  completeTime: string | null;
  /** 计划开始时间 */
  plannedStart: string | null;
  /** 计划结束时间 */
  plannedEnd: string | null;
  /** 实际开始时间 */
  actualStart: string | null;
  /** 实际结束时间 */
  actualEnd: string | null;
}

/**
 * 模块接口
 * @property id - 模块 ID
 * @property name - 模块名称
 * @property status - 模块状态
 * @property description - 模块描述
 */
export interface Module {
  /** 模块 ID */
  id: string;
  /** 模块名称 */
  name: string;
  /** 模块状态 */
  status: 'active' | 'pending';
  /** 模块描述 */
  description: string;
}

/**
 * TODO 统计信息接口
 * @property total - 任务总数
 * @property completed - 已完成任务数
 * @property inProgress - 进行中任务数
 * @property pending - 待处理任务数
 */
export interface TodoStats {
  /** 任务总数 */
  total: number;
  /** 已完成任务数 */
  completed: number;
  /** 进行中任务数 */
  inProgress: number;
  /** 待处理任务数 */
  pending: number;
}

/**
 * 优先级配置常量
 */
export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string }> = {
  high: { label: '高', color: 'text-red-600', bgColor: 'bg-red-100' },
  medium: { label: '中', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  low: { label: '低', color: 'text-green-600', bgColor: 'bg-green-100' },
};

/**
 * 状态配置常量
 */
export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  in_progress: { label: '进行中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100' },
};
