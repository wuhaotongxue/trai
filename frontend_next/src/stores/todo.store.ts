/**
 * todo.store.ts
 * 作者: wuhao
 * 日期: 2026-04-09
 * 描述: TODO 状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus, Priority } from '@/types/todo.types';

/**
 * TODO 状态管理接口
 * @property tasks - 任务列表
 * @property filterModule - 模块过滤条件
 * @property filterPriority - 优先级过滤条件
 * @property filterStatus - 状态过滤条件
 * @property searchQuery - 搜索关键词
 */
interface TodoStore {
  /** 任务列表 */
  tasks: Task[];
  /** 模块过滤条件 */
  filterModule: string | null;
  /** 优先级过滤条件 */
  filterPriority: Priority | null;
  /** 状态过滤条件 */
  filterStatus: TaskStatus | null;
  /** 搜索关键词 */
  searchQuery: string;

  // Actions
  /**
   * 添加任务
   * @param task - 任务信息(不包含自动生成的字段)
   */
  addTask: (task: Omit<Task, 'id' | 'startTime' | 'completeTime'>) => void;
  /**
   * 更新任务
   * @param id - 任务 ID
   * @param updates - 更新字段
   */
  updateTask: (id: string, updates: Partial<Task>) => void;
  /**
   * 删除任务
   * @param id - 任务 ID
   */
  deleteTask: (id: string) => void;
  /**
   * 开始任务
   * @param id - 任务 ID
   */
  startTask: (id: string) => void;
  /**
   * 完成任务
   * @param id - 任务 ID
   */
  completeTask: (id: string) => void;
  /**
   * 设置过滤条件
   * @param filter - 过滤条件
   */
  setFilter: (filter: { module?: string | null; priority?: Priority | null; status?: TaskStatus | null }) => void;
  /**
   * 设置搜索关键词
   * @param query - 搜索关键词
   */
  setSearchQuery: (query: string) => void;

  // Computed
  /**
   * 获取过滤后的任务
   * @returns 过滤后的任务列表
   */
  getFilteredTasks: () => Task[];
  /**
   * 获取指定状态的任务
   * @param status - 任务状态
   * @returns 指定状态的任务列表
   */
  getTasksByStatus: (status: TaskStatus) => Task[];
  /**
   * 获取模块进度
   * @param module - 模块 ID
   * @returns 模块进度信息(总数,完成数,完成百分比)
   */
  getModuleProgress: (module: string) => { total: number; completed: number; percentage: number };
}

/**
 * 初始任务数据
 */
const INITIAL_TASKS: Task[] = [
  // Backend Core
  { id: '1', name: 'run.py 应用入口', status: 'completed', priority: 'high', module: 'backend_core', description: 'FastAPI 实例,生命周期管理', startTime: '2026-04-01', completeTime: '2026-04-01', plannedStart: '2026-04-01', plannedEnd: '2026-04-02', actualStart: '2026-04-01', actualEnd: '2026-04-01' },
  { id: '2', name: 'api/main.py FastAPI 配置', status: 'completed', priority: 'high', module: 'backend_core', description: 'CORS,请求限流,异常处理', startTime: '2026-04-02', completeTime: '2026-04-03', plannedStart: '2026-04-02', plannedEnd: '2026-04-03', actualStart: '2026-04-02', actualEnd: '2026-04-03' },
  { id: '3', name: 'api/middleware.py 中间件', status: 'in_progress', priority: 'high', module: 'backend_core', description: '请求日志,认证,请求 ID', startTime: '2026-04-04', completeTime: null, plannedStart: '2026-04-04', plannedEnd: '2026-04-05', actualStart: '2026-04-04', actualEnd: null },
  { id: '4', name: 'api/routers/system/health.py 健康检查', status: 'pending', priority: 'high', module: 'backend_core', description: '/health 接口', startTime: null, completeTime: null, plannedStart: '2026-04-06', plannedEnd: '2026-04-06', actualStart: null, actualEnd: null },
  { id: '5', name: 'api/routers/system/monitor.py 监控接口', status: 'pending', priority: 'high', module: 'backend_core', description: '系统状态,内存,CPU', startTime: null, completeTime: null, plannedStart: '2026-04-07', plannedEnd: '2026-04-08', actualStart: null, actualEnd: null },
  { id: '6', name: 'api/routers/ai/chat.py AI 对话', status: 'pending', priority: 'medium', module: 'backend_core', description: 'OpenAI/Claude 对接', startTime: null, completeTime: null, plannedStart: '2026-04-09', plannedEnd: '2026-04-11', actualStart: null, actualEnd: null },
  { id: '7', name: 'api/routers/ai/image.py AI 绘图', status: 'pending', priority: 'medium', module: 'backend_core', description: 'DALL-E/Midjourney', startTime: null, completeTime: null, plannedStart: '2026-04-12', plannedEnd: '2026-04-14', actualStart: null, actualEnd: null },
  { id: '8', name: 'api/routers/media/access.py 媒体访问', status: 'pending', priority: 'medium', module: 'backend_core', description: 'Presigned URL 生成', startTime: null, completeTime: null, plannedStart: '2026-04-15', plannedEnd: '2026-04-16', actualStart: null, actualEnd: null },
  { id: '9', name: 'api/routers/media/upload.py 媒体上传', status: 'pending', priority: 'medium', module: 'backend_core', description: 'S3 上传', startTime: null, completeTime: null, plannedStart: '2026-04-17', plannedEnd: '2026-04-18', actualStart: null, actualEnd: null },
  { id: '10', name: 'api/routers/admin/users.py 用户管理', status: 'pending', priority: 'low', module: 'backend_core', description: '后台用户 CRUD', startTime: null, completeTime: null, plannedStart: '2026-04-19', plannedEnd: '2026-04-21', actualStart: null, actualEnd: null },
  { id: '11', name: 'api/routers/admin/settings.py 系统设置', status: 'pending', priority: 'low', module: 'backend_core', description: '配置管理', startTime: null, completeTime: null, plannedStart: '2026-04-22', plannedEnd: '2026-04-23', actualStart: null, actualEnd: null },

  // Backend Application
  { id: '12', name: '用例基类设计', status: 'pending', priority: 'medium', module: 'backend_application', description: '统一用例接口', startTime: null, completeTime: null, plannedStart: '2026-04-24', plannedEnd: '2026-04-25', actualStart: null, actualEnd: null },
  { id: '13', name: 'AI 对话用例', status: 'pending', priority: 'medium', module: 'backend_application', description: 'ChatUseCase', startTime: null, completeTime: null, plannedStart: '2026-04-26', plannedEnd: '2026-04-28', actualStart: null, actualEnd: null },
  { id: '14', name: 'AI 绘图用例', status: 'pending', priority: 'medium', module: 'backend_application', description: 'ImageUseCase', startTime: null, completeTime: null, plannedStart: '2026-04-29', plannedEnd: '2026-05-01', actualStart: null, actualEnd: null },
  { id: '15', name: '媒体上传用例', status: 'pending', priority: 'medium', module: 'backend_application', description: 'MediaUploadUseCase', startTime: null, completeTime: null, plannedStart: '2026-05-02', plannedEnd: '2026-05-03', actualStart: null, actualEnd: null },

  // Backend Domain
  { id: '16', name: '用户实体', status: 'pending', priority: 'medium', module: 'backend_domain', description: 'User Entity', startTime: null, completeTime: null, plannedStart: '2026-05-04', plannedEnd: '2026-05-05', actualStart: null, actualEnd: null },
  { id: '17', name: 'AI 会话实体', status: 'pending', priority: 'medium', module: 'backend_domain', description: 'ChatSession Entity', startTime: null, completeTime: null, plannedStart: '2026-05-06', plannedEnd: '2026-05-07', actualStart: null, actualEnd: null },
  { id: '18', name: '媒体资源实体', status: 'pending', priority: 'medium', module: 'backend_domain', description: 'MediaResource Entity', startTime: null, completeTime: null, plannedStart: '2026-05-08', plannedEnd: '2026-05-09', actualStart: null, actualEnd: null },

  // Backend Infrastructure
  { id: '19', name: 'S3 存储适配器', status: 'completed', priority: 'low', module: 'backend_infrastructure', description: 'AWS S3 / MinIO', startTime: '2026-04-09', completeTime: '2026-04-09', plannedStart: '2026-04-01', plannedEnd: '2026-04-03', actualStart: '2026-04-01', actualEnd: '2026-04-03' },
  { id: '20', name: 'Redis 缓存', status: 'pending', priority: 'low', module: 'backend_infrastructure', description: '会话缓存,限流', startTime: null, completeTime: null, plannedStart: '2026-05-10', plannedEnd: '2026-05-12', actualStart: null, actualEnd: null },
  { id: '21', name: 'PostgreSQL 连接', status: 'pending', priority: 'low', module: 'backend_infrastructure', description: '数据持久化', startTime: null, completeTime: null, plannedStart: '2026-05-13', plannedEnd: '2026-05-15', actualStart: null, actualEnd: null },
  { id: '22', name: 'AI 服务适配器', status: 'pending', priority: 'low', module: 'backend_infrastructure', description: 'OpenAI/Claude 封装', startTime: null, completeTime: null, plannedStart: '2026-05-16', plannedEnd: '2026-05-18', actualStart: null, actualEnd: null },

  // Frontend Init
  { id: '23', name: '项目脚手架', status: 'completed', priority: 'high', module: 'frontend_init', description: 'create-next-app 初始化', startTime: '2026-04-01', completeTime: '2026-04-01', plannedStart: '2026-04-01', plannedEnd: '2026-04-01', actualStart: '2026-04-01', actualEnd: '2026-04-01' },
  { id: '24', name: 'TypeScript 配置', status: 'completed', priority: 'high', module: 'frontend_init', description: 'tsconfig,严格模式', startTime: '2026-04-02', completeTime: '2026-04-02', plannedStart: '2026-04-02', plannedEnd: '2026-04-02', actualStart: '2026-04-02', actualEnd: '2026-04-02' },
  { id: '25', name: 'Tailwind CSS 配置', status: 'completed', priority: 'high', module: 'frontend_init', description: '主题定制', startTime: '2026-04-03', completeTime: '2026-04-03', plannedStart: '2026-04-03', plannedEnd: '2026-04-03', actualStart: '2026-04-03', actualEnd: '2026-04-03' },
  { id: '26', name: '目录结构', status: 'in_progress', priority: 'high', module: 'frontend_init', description: 'FSD 架构', startTime: '2026-04-04', completeTime: null, plannedStart: '2026-04-04', plannedEnd: '2026-04-05', actualStart: '2026-04-04', actualEnd: null },

  // Frontend Pages
  { id: '27', name: 'Landing 页', status: 'pending', priority: 'high', module: 'frontend_pages', description: '首页/落地页', startTime: null, completeTime: null, plannedStart: '2026-04-06', plannedEnd: '2026-04-08', actualStart: null, actualEnd: null },
  { id: '28', name: 'Dashboard 页', status: 'pending', priority: 'high', module: 'frontend_pages', description: '主工作台', startTime: null, completeTime: null, plannedStart: '2026-04-09', plannedEnd: '2026-04-11', actualStart: null, actualEnd: null },
  { id: '29', name: 'AI 对话页', status: 'pending', priority: 'high', module: 'frontend_pages', description: 'Chat 界面', startTime: null, completeTime: null, plannedStart: '2026-04-12', plannedEnd: '2026-04-15', actualStart: null, actualEnd: null },
  { id: '30', name: 'AI 绘图页', status: 'pending', priority: 'high', module: 'frontend_pages', description: 'Image 生成', startTime: null, completeTime: null, plannedStart: '2026-04-16', plannedEnd: '2026-04-18', actualStart: null, actualEnd: null },
  { id: '31', name: 'Admin 管理页', status: 'pending', priority: 'medium', module: 'frontend_pages', description: '用户/系统管理', startTime: null, completeTime: null, plannedStart: '2026-04-19', plannedEnd: '2026-04-21', actualStart: null, actualEnd: null },
  { id: '32', name: 'Monitor 监控页', status: 'pending', priority: 'medium', module: 'frontend_pages', description: '系统监控', startTime: null, completeTime: null, plannedStart: '2026-04-22', plannedEnd: '2026-04-23', actualStart: null, actualEnd: null },

  // Frontend Components
  { id: '33', name: '基础组件', status: 'pending', priority: 'medium', module: 'frontend_components', description: 'Button/Input/Modal', startTime: null, completeTime: null, plannedStart: '2026-04-24', plannedEnd: '2026-04-26', actualStart: null, actualEnd: null },
  { id: '34', name: 'AI 对话组件', status: 'pending', priority: 'medium', module: 'frontend_components', description: 'ChatBubble/InputArea', startTime: null, completeTime: null, plannedStart: '2026-04-27', plannedEnd: '2026-04-29', actualStart: null, actualEnd: null },
  { id: '35', name: '媒体上传组件', status: 'pending', priority: 'medium', module: 'frontend_components', description: 'FileUpload/Preview', startTime: null, completeTime: null, plannedStart: '2026-04-30', plannedEnd: '2026-05-02', actualStart: null, actualEnd: null },

  // Frontend Features
  { id: '36', name: '用户认证', status: 'pending', priority: 'medium', module: 'frontend_features', description: '登录/注册/JWT', startTime: null, completeTime: null, plannedStart: '2026-05-03', plannedEnd: '2026-05-06', actualStart: null, actualEnd: null },
  { id: '37', name: '国际化 i18n', status: 'pending', priority: 'medium', module: 'frontend_features', description: '中英文切换', startTime: null, completeTime: null, plannedStart: '2026-05-07', plannedEnd: '2026-05-08', actualStart: null, actualEnd: null },
  { id: '38', name: '暗黑模式', status: 'pending', priority: 'medium', module: 'frontend_features', description: '主题切换', startTime: null, completeTime: null, plannedStart: '2026-05-09', plannedEnd: '2026-05-10', actualStart: null, actualEnd: null },

  // Desktop Client
  { id: '39', name: '项目脚手架', status: 'pending', priority: 'high', module: 'desktop_client', description: 'PyQt6 安装配置', startTime: null, completeTime: null, plannedStart: '2026-05-11', plannedEnd: '2026-05-12', actualStart: null, actualEnd: null },
  { id: '40', name: '主窗口设计', status: 'pending', priority: 'high', module: 'desktop_client', description: 'Win11 Fluent UI 风格', startTime: null, completeTime: null, plannedStart: '2026-05-13', plannedEnd: '2026-05-15', actualStart: null, actualEnd: null },
  { id: '41', name: '目录结构', status: 'pending', priority: 'high', module: 'desktop_client', description: 'DDD 5 层架构', startTime: null, completeTime: null, plannedStart: '2026-05-16', plannedEnd: '2026-05-17', actualStart: null, actualEnd: null },
  { id: '42', name: 'AI 对话界面', status: 'pending', priority: 'high', module: 'desktop_client', description: '本地 Chat 界面', startTime: null, completeTime: null, plannedStart: '2026-05-18', plannedEnd: '2026-05-21', actualStart: null, actualEnd: null },
  { id: '43', name: '本地模型调用', status: 'pending', priority: 'high', module: 'desktop_client', description: 'Ollama/Copilot', startTime: null, completeTime: null, plannedStart: '2026-05-22', plannedEnd: '2026-05-25', actualStart: null, actualEnd: null },
  { id: '44', name: '文件管理', status: 'pending', priority: 'medium', module: 'desktop_client', description: '本地文件操作', startTime: null, completeTime: null, plannedStart: '2026-05-26', plannedEnd: '2026-05-28', actualStart: null, actualEnd: null },
  { id: '45', name: '系统托盘', status: 'pending', priority: 'medium', module: 'desktop_client', description: '最小化到托盘', startTime: null, completeTime: null, plannedStart: '2026-05-29', plannedEnd: '2026-05-30', actualStart: null, actualEnd: null },

  // Electron
  { id: '46', name: '项目脚手架', status: 'pending', priority: 'high', module: 'electron', description: 'electron-forge 初始化', startTime: null, completeTime: null, plannedStart: '2026-05-11', plannedEnd: '2026-05-12', actualStart: null, actualEnd: null },
  { id: '47', name: '主进程配置', status: 'pending', priority: 'high', module: 'electron', description: 'Main Process', startTime: null, completeTime: null, plannedStart: '2026-05-13', plannedEnd: '2026-05-14', actualStart: null, actualEnd: null },
  { id: '48', name: '渲染进程配置', status: 'pending', priority: 'high', module: 'electron', description: 'Renderer Process', startTime: null, completeTime: null, plannedStart: '2026-05-15', plannedEnd: '2026-05-16', actualStart: null, actualEnd: null },
  { id: '49', name: 'IPC 通道设计', status: 'pending', priority: 'high', module: 'electron', description: '进程通信', startTime: null, completeTime: null, plannedStart: '2026-05-17', plannedEnd: '2026-05-19', actualStart: null, actualEnd: null },
  { id: '50', name: '窗口管理', status: 'pending', priority: 'high', module: 'electron', description: '多窗口,最大化', startTime: null, completeTime: null, plannedStart: '2026-05-20', plannedEnd: '2026-05-22', actualStart: null, actualEnd: null },
  { id: '51', name: 'AI 对话界面', status: 'pending', priority: 'high', module: 'electron', description: 'Web 端 Chat', startTime: null, completeTime: null, plannedStart: '2026-05-23', plannedEnd: '2026-05-26', actualStart: null, actualEnd: null },
  { id: '52', name: '自动更新', status: 'pending', priority: 'medium', module: 'electron', description: 'S3 发布更新', startTime: null, completeTime: null, plannedStart: '2026-05-27', plannedEnd: '2026-05-29', actualStart: null, actualEnd: null },
  { id: '53', name: '系统托盘', status: 'pending', priority: 'medium', module: 'electron', description: '最小化托盘', startTime: null, completeTime: null, plannedStart: '2026-05-30', plannedEnd: '2026-05-31', actualStart: null, actualEnd: null },
];

/**
 * 模块配置常量
 */
const MODULES = [
  { id: 'backend_core', name: '后端 核心', category: '后端', color: '#3b82f6' },
  { id: 'backend_application', name: '后端 应用', category: '后端', color: '#06b6d4' },
  { id: 'backend_domain', name: '后端 领域', category: '后端', color: '#14b8a6' },
  { id: 'backend_infrastructure', name: '后端 基础设施', category: '后端', color: '#f59e0b' },
  { id: 'frontend_init', name: '前端 初始化', category: '前端', color: '#2563eb' },
  { id: 'frontend_pages', name: '前端 页面', category: '前端', color: '#0ea5e9' },
  { id: 'frontend_components', name: '前端 组件', category: '前端', color: '#22c55e' },
  { id: 'frontend_features', name: '前端 功能', category: '前端', color: '#10b981' },
  { id: 'desktop_client', name: '桌面客户端', category: '客户端', color: '#22c55e' },
  { id: 'electron', name: 'Electron', category: '客户端', color: '#0ea5e9' },
];

export { MODULES };

/**
 * TODO 状态管理 Hook
 * @returns TODO 状态管理对象
 */
export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      tasks: INITIAL_TASKS,
      filterModule: null,
      filterPriority: null,
      filterStatus: null,
      searchQuery: '',

      addTask: (task) => {
        const newTask: Task = {
          ...task,
          id: Date.now().toString(),
          startTime: null,
          completeTime: null,
          plannedStart: null,
          plannedEnd: null,
          actualStart: null,
          actualEnd: null,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      startTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'in_progress' as TaskStatus, startTime: new Date().toISOString().split('T')[0], actualStart: new Date().toISOString().split('T')[0] } : t
          ),
        }));
      },

      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'completed' as TaskStatus, completeTime: new Date().toISOString().split('T')[0], actualEnd: new Date().toISOString().split('T')[0] } : t
          ),
        }));
      },

      setFilter: (filter) => {
        set((state) => ({
          filterModule: filter.module !== undefined ? filter.module : state.filterModule,
          filterPriority: filter.priority !== undefined ? filter.priority : state.filterPriority,
          filterStatus: filter.status !== undefined ? filter.status : state.filterStatus,
        }));
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      getFilteredTasks: () => {
        const { tasks, filterModule, filterPriority, filterStatus, searchQuery } = get();
        return tasks.filter((task) => {
          if (filterModule && task.module !== filterModule) return false;
          if (filterPriority && task.priority !== filterPriority) return false;
          if (filterStatus && task.status !== filterStatus) return false;
          if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
        });
      },

      getTasksByStatus: (status) => {
        return get().tasks.filter((t) => t.status === status);
      },

      getModuleProgress: (module) => {
        const moduleTasks = get().tasks.filter((t) => t.module === module);
        const completed = moduleTasks.filter((t) => t.status === 'completed').length;
        return {
          total: moduleTasks.length,
          completed,
          percentage: moduleTasks.length > 0 ? Math.round((completed / moduleTasks.length) * 100) : 0,
        };
      },
    }),
    {
      name: 'trai_todo_storage',
    }
  )
);
