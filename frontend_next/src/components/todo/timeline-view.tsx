'use client';

/**
 * timeline-view.tsx
 * 作者: wuhao
 * 日期: 2026-04-09
 * 描述: 时间线流程视图组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/todo.types';
import type { Task } from '@/types/todo.types';
import { MODULES } from '@/stores/todo.store';
import { Circle, CheckCircle2, Clock, Play } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
}

function TaskNode({
  task,
  isLast,
}: {
  task: Task;
  isLast: boolean;
}) {
  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];

  const statusIcon = {
    pending: <Circle className="h-4 w-4 text-gray-400" />,
    in_progress: <Play className="h-4 w-4 text-blue-500" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  }[task.status];

  const statusBorderColor = {
    pending: 'border-l-gray-300',
    in_progress: 'border-l-blue-500',
    completed: 'border-l-green-500',
  }[task.status];

  return (
    <div className={`flex gap-4 ${isLast ? '' : 'pb-8'}`}>
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-background border-2 flex items-center justify-center shrink-0 z-10">
          {statusIcon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2 min-h-[80px]" />}
      </div>
      <div
        className={`flex-1 border-l-4 ${statusBorderColor} pl-4 py-2 -ml-[1px]`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{task.name}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="secondary"
                className={`${priority.bgColor} ${priority.color} text-[10px] py-0`}
              >
                {priority.label}
              </Badge>
              <Badge
                variant="outline"
                className={`${status.bgColor} ${status.color} text-[10px] py-0`}
              >
                {status.label}
              </Badge>
            </div>
          </div>
          {task.startTime && (
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">
                {task.status === 'completed' ? '完成' : '开始'}
              </div>
              <div className="text-xs font-medium">{task.startTime}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TimelineView({ tasks }: TimelineViewProps) {
  const tasksByModule = MODULES.map((module) => ({
    module,
    tasks: tasks.filter((t) => t.module === module.id),
  })).filter((m) => m.tasks.length > 0);

  const moduleColors: Record<string, string> = {
    'backend-core': 'from-pink-500 to-purple-500',
    'backend-application': 'from-red-500 to-pink-500',
    'backend-domain': 'from-orange-500 to-red-500',
    'backend-infrastructure': 'from-yellow-500 to-orange-500',
    'frontend-init': 'from-blue-500 to-cyan-500',
    'frontend-pages': 'from-cyan-500 to-teal-500',
    'frontend-components': 'from-teal-500 to-green-500',
    'frontend-features': 'from-green-500 to-emerald-500',
    'desktop-client': 'from-emerald-500 to-green-600',
    electron: 'from-green-600 to-emerald-700',
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          项目流程时间线
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-8">
            {tasksByModule.map(({ module, tasks }) => (
              <div key={module.id}>
                <div
                  className={`mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${
                    moduleColors[module.id] ||
                    'from-gray-500 to-gray-600'
                  } text-white`}
                >
                  {module.name}
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-white/20 text-white border-0 text-[10px]"
                  >
                    {tasks.length}
                  </Badge>
                </div>
                <div className="ml-2">
                  {tasks.map((task, index) => (
                    <TaskNode
                      key={task.id}
                      task={task}
                      isLast={index === tasks.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
