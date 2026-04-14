'use client';

/**
 * task-card.tsx
 * 作者: wuhao
 * 日期: 2026-04-09
 * 描述: 任务卡片组件
 */

import { MoreHorizontal, Play, CheckCircle2, Trash2, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import type { Task } from '@/types/todo.types';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/todo.types';

interface TaskCardProps {
  task: Task;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onStart, onComplete, onDelete }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">{task.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {task.status === 'pending' && (
                <DropdownMenuItem onClick={() => onStart(task.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  开始
                </DropdownMenuItem>
              )}
              {task.status !== 'completed' && (
                <DropdownMenuItem onClick={() => onComplete(task.id)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  完成
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={`${priority.bgColor} ${priority.color} text-xs`}>
            {priority.label}
          </Badge>
          <Badge variant="outline" className={`${status.bgColor} ${status.color} text-xs`}>
            {status.label}
          </Badge>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {task.startTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{task.startTime}</span>
            </div>
          )}
          {task.completeTime && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{task.completeTime}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
