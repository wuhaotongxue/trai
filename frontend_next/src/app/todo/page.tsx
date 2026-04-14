/**
 * todo/page.tsx
 * 作者: wuhao
 * 日期: 2026-04-09
 * 描述: TODO 任务管理页面
 */

import { TodoBoard } from '@/components/todo/todo_board';

export default function TodoPage() {
  return (
    <main className="container py-8">
      <TodoBoard />
    </main>
  );
}
