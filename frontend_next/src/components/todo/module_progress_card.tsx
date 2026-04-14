/**
 * 文件名: module_progress_card.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 09:00:53
 * 描述: module_progress_card.tsx 的页面或组件实现
 */
'use client';

/**
 * module_progress_card.tsx
 * 作者: wuhao
 * 日期: 2026-04-09
 * 描述: 模块进度卡片组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ModuleProgressCardProps {
  name: string;
  category: string;
  color: string;
  total: number;
  completed: number;
  inProgress: number;
  isActive?: boolean;
  onClick: () => void;
}

export function ModuleProgressCard({
  name,
  category,
  color,
  total,
  completed,
  inProgress,
  isActive,
  onClick,
}: ModuleProgressCardProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <div className="h-1" style={{ backgroundColor: color }} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{name}</CardTitle>
          <Badge variant="outline" style={{ borderColor: color, color }}>
            {category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl font-bold" style={{ color }}>
            {percentage}%
          </span>
          <span className="text-xs text-muted-foreground">
            {completed} / {total} 任务
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {inProgress} 进行中
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {completed} 已完成
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

