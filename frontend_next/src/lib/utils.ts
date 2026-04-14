/**
 * 文件名: utils.ts
 * 作者: wuhao
 * 日期: 2026-04-14 09:00:53
 * 描述: utils.ts 的页面或组件实现
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
