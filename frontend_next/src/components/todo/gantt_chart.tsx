/**
 * 文件名: gantt_chart.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 09:00:53
 * 描述: gantt_chart.tsx 的页面或组件实现
 */
'use client';

/**
 * gantt_chart.tsx
 * 作者: wuhao
 * 日期: 2026-04-09
 * 描述: 甘特图时间线组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll_area';
import { PRIORITY_CONFIG } from '@/types/todo.types';
import type { Task } from '@/types/todo.types';
import { Clock, CheckCircle2 } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
}

const DAY_WIDTH = 40;

function getDayColumns(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDayOfWeek(date: Date): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[date.getDay()];
}

function getTaskPosition(
  task: Task,
  startDate: Date
): { left: number; width: number } | null {
  const planStart = task.plannedStart ? new Date(task.plannedStart) : null;
  const planEnd = task.plannedEnd ? new Date(task.plannedEnd) : null;

  if (!planStart || !planEnd) return null;

  const startDiff = Math.floor(
    (planStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const duration = Math.ceil(
    (planEnd.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return {
    left: startDiff * DAY_WIDTH,
    width: duration * DAY_WIDTH,
  };
}

export function GanttChart({ tasks }: GanttChartProps) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);

  const days = getDayColumns(startDate, endDate);
  const todayIndex = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const hasPlannedTasks = tasks.some(
    (t) => t.plannedStart && t.plannedEnd
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            项目时间线
          </CardTitle>
          {!hasPlannedTasks && (
            <Badge variant="outline" className="text-xs">
              暂无计划任务
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <div className="flex border-b">
              <div className="w-48 shrink-0 p-2 border-r bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">
                  任务名称
                </span>
              </div>
              <div className="flex flex-1">
                {days.map((day, i) => {
                  const isToday =
                    day.toDateString() === today.toDateString();
                  return (
                    <div
                      key={i}
                      className={`relative flex-shrink-0 text-center py-2 border-r ${
                        isToday ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                      }`}
                      style={{ width: DAY_WIDTH }}
                    >
                      <div className="text-xs font-medium">
                        {formatDate(day)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatDayOfWeek(day)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {todayIndex >= 0 && todayIndex < days.length && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: 192 + todayIndex * DAY_WIDTH + DAY_WIDTH / 2 }}
              />
            )}

            <div className="relative">
              {tasks
                .filter((t) => t.plannedStart && t.plannedEnd)
                .map((task) => {
                  const position = getTaskPosition(task, startDate);
                  const priority = PRIORITY_CONFIG[task.priority];

                  return (
                    <div
                      key={task.id}
                      className="flex border-b hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-48 shrink-0 p-2 border-r">
                        <div className="flex items-center gap-2">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded border-2 border-muted-foreground/30 shrink-0" />
                          )}
                          <span className="text-sm truncate font-medium">
                            {task.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 ml-6">
                          <Badge
                            variant="secondary"
                            className={`${priority.bgColor} ${priority.color} text-[10px] py-0`}
                          >
                            {priority.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-1 relative" style={{ height: 60 }}>
                        {days.map((_, i) => (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 border-r border-border/50"
                            style={{ left: i * DAY_WIDTH }}
                          />
                        ))}

                        {todayIndex >= 0 && todayIndex < days.length && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 z-10"
                            style={{ left: todayIndex * DAY_WIDTH + DAY_WIDTH / 2 }}
                          />
                        )}

                        {position && (
                          <div
                            className={`absolute top-4 bottom-4 rounded-md px-2 py-1 text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity flex items-center ${
                              task.status === 'completed'
                                ? 'bg-green-500'
                                : task.status === 'in_progress'
                                ? 'bg-blue-500'
                                : 'bg-slate-400'
                            }`}
                            style={{
                              left: position.left,
                              width: position.width - 4,
                            }}
                          >
                            <span className="truncate">{task.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              {tasks.filter((t) => t.plannedStart && t.plannedEnd).length ===
                0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无带计划时间的任务</p>
                  <p className="text-xs mt-1">
                    为任务设置计划开始和结束日期后, 这里会显示甘特图
                  </p>
                </div>
              )}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

