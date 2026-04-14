/**
 * 文件名: todo_board.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 09:00:53
 * 描述: todo_board.tsx 的页面或组件实现
 */
'use client';

/**
 * todo_board.tsx
 * 作者: wuhao
 * 日期: 2026-04-09
 * 描述: TODO 看板主视图组件
 */

import { useState } from 'react';
import { useTodoStore, MODULES } from '@/stores/todo.store';
import { TaskCard } from './task_card';
import { ModuleProgressCard } from './module_progress_card';
import { GanttChart } from './gantt_chart';
import { TimelineView } from './timeline_view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll_area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  ListTodo,
  Clock,
  CheckCircle2,
  Circle,
  X,
  LayoutGrid,
  GanttChart as GanttIcon,
  GitBranch,
} from 'lucide-react';
import type { Priority, TaskStatus } from '@/types/todo.types';

type ViewMode = 'kanban' | 'gantt' | 'timeline';

export function TodoBoard() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const {
    tasks,
    filterModule,
    filterPriority,
    filterStatus,
    searchQuery,
    setFilter,
    setSearchQuery,
    getFilteredTasks,
    getTasksByStatus,
    startTask,
    completeTask,
    deleteTask,
  } = useTodoStore();

  const filteredTasks = getFilteredTasks();
  const pendingTasks = getTasksByStatus('pending');
  const inProgressTasks = getTasksByStatus('in_progress');
  const completedTasks = getTasksByStatus('completed');

  const hasFilters = filterModule || filterPriority || filterStatus || searchQuery;

  const clearFilters = () => {
    setFilter({ module: null, priority: null, status: null });
    setSearchQuery('');
  };

  const renderKanbanColumn = (title: string, status: TaskStatus, tasks: typeof filteredTasks, icon: React.ReactNode) => (
    <Card className="flex-1 min-w-[280px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Badge variant="secondary" className="ml-1">{tasks.length}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-3 pr-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">暂无任务</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={startTask}
                  onComplete={completeTask}
                  onDelete={deleteTask}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">任务管理</h1>
          <p className="text-sm text-muted-foreground">
            管理和追踪项目进度
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="h-8"
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            看板
          </Button>
          <Button
            variant={viewMode === 'gantt' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('gantt')}
            className="h-8"
          >
            <GanttIcon className="h-4 w-4 mr-1" />
            甘特图
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            className="h-8"
          >
            <GitBranch className="h-4 w-4 mr-1" />
            时间线
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总计</p>
                <span className="text-3xl font-bold">{tasks.length}</span>
              </div>
              <ListTodo className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">进行中</p>
                <span className="text-3xl font-bold text-blue-600">{inProgressTasks.length}</span>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已完成</p>
                <span className="text-3xl font-bold text-green-600">{completedTasks.length}</span>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">待处理</p>
                <span className="text-3xl font-bold text-gray-600">{pendingTasks.length}</span>
              </div>
              <Circle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">模块进度</h2>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {MODULES.map((module) => {
            const moduleTasks = tasks.filter((t) => t.module === module.id);
            const completed = moduleTasks.filter((t) => t.status === 'completed').length;
            const inProgress = moduleTasks.filter((t) => t.status === 'in_progress').length;
            return (
              <ModuleProgressCard
                key={module.id}
                name={module.name}
                category={module.category}
                color={module.color}
                total={moduleTasks.length}
                completed={completed}
                inProgress={inProgress}
                isActive={filterModule === module.id}
                onClick={() => setFilter({ module: filterModule === module.id ? null : module.id })}
              />
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索任务..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filterPriority || 'all'}
          onValueChange={(value) => setFilter({ priority: value === 'all' ? null : (value as Priority) })}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="优先级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部优先级</SelectItem>
            <SelectItem value="high">高</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="low">低</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterStatus || 'all'}
          onValueChange={(value) => setFilter({ status: value === 'all' ? null : (value as TaskStatus) })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="in_progress">进行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterModule || 'all'}
          onValueChange={(value) => setFilter({ module: value === 'all' ? null : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="模块" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部模块</SelectItem>
            {MODULES.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            清除筛选
          </Button>
        )}

        <div className="ml-auto text-sm text-muted-foreground">
          显示 {filteredTasks.length} / {tasks.length} 个任务
        </div>
      </div>

      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {renderKanbanColumn(
            '待处理',
            'pending',
            filteredTasks.filter((t) => t.status === 'pending'),
            <Circle className="h-4 w-4 text-gray-400" />
          )}
          {renderKanbanColumn(
            '进行中',
            'in_progress',
            filteredTasks.filter((t) => t.status === 'in_progress'),
            <Clock className="h-4 w-4 text-blue-500" />
          )}
          {renderKanbanColumn(
            '已完成',
            'completed',
            filteredTasks.filter((t) => t.status === 'completed'),
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </div>
      )}

      {viewMode === 'gantt' && <GanttChart tasks={filteredTasks} />}

      {viewMode === 'timeline' && <TimelineView tasks={filteredTasks} />}
    </div>
  );
}

