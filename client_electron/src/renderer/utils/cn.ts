/**
 * 文件名: cn.ts
 * 作者: wuhao
 * 日期: 2026-05-24 15:30:00
 * 描述: Tailwind 类名合并工具
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 智能合并 Tailwind 类名，解决冲突
 * @param inputs 传入的类名数组或条件对象
 * @returns 合并后的干净类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
