/**
 * 文件名: stats_card.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 09:00:53
 * 描述: stats_card.tsx 的页面或组件实现
 */
'use client';

/**
 * stats_card.tsx
 * 作者: wuhao
 * 日期: 2026-04-09
 * 描述: 统计卡片组件
 */

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  total?: number;
  icon: LucideIcon;
  gradient: string;
  textColor: string;
}

export function StatsCard({ title, value, total, icon: Icon, gradient, textColor }: StatsCardProps) {
  const percentage = total ? Math.round((value / total) * 100) : null;

  return (
    <Card className="overflow-hidden">
      <div className={gradient} style={{ height: '4px' }} />
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-bold ${textColor}`}>{value}</span>
              {percentage !== null && (
                <span className="text-sm text-muted-foreground">/ {total}</span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-none ${gradient} bg-opacity-20`}>
            <Icon className={`h-6 w-6 ${textColor}`} />
          </div>
        </div>
        {percentage !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>进度</span>
              <span>{percentage}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-none overflow-hidden">
              <div
                className={`h-full ${gradient.replace('bg-opacity-20', '100')}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

