/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: 平台层服务提供操作系统级原生接口
 */
import os from 'os'
import log from 'electron-log'
import { execSync } from 'child_process'

/**
 * 系统信息接口
 * @property platform 操作系统平台
 * @property arch 系统架构
 * @property release 系统版本
 * @property total_mem 总内存（字节）
 * @property free_mem 可用内存（字节）
 */
export interface SystemInfo {
  platform: string
  arch: string
  release: string
  total_mem: number
  free_mem: number
  gpu_name: string
}

export interface SystemMetrics {
  ts: number
  cpu_usage_percent: number
  mem_usage_percent: number
  total_mem: number
  free_mem: number
  uptime_sec: number
  process_rss: number
  process_heap_used: number
  process_heap_total: number
  gpu_name: string
}

let cached_gpu_name = ''

const get_gpu_name = (): string => {
  if (cached_gpu_name) return cached_gpu_name
  try {
    if (process.platform === 'win32') {
      const output = execSync('wmic path win32_VideoController get name', {
        encoding: 'utf-8',
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      const lines = output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && line.toLowerCase() !== 'name')
      cached_gpu_name = lines.join(' / ') || 'Unknown GPU'
      return cached_gpu_name
    }
  } catch (error) {
    log.warn('failed to detect gpu name', error)
  }
  cached_gpu_name = 'Unknown GPU'
  return cached_gpu_name
}

/**
 * 获取系统信息
 * @returns 系统信息对象
 */
export const get_system_info = (): SystemInfo => {
  log.info('fetching system info from os module')
  return {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    total_mem: os.totalmem(),
    free_mem: os.freemem(),
    gpu_name: get_gpu_name(),
  }
}

let last_cpu_total: number | null = null
let last_cpu_idle: number | null = null

const sum_cpu_times = (): { total: number; idle: number } => {
  const cpus = os.cpus()
  let total = 0
  let idle = 0

  for (const cpu of cpus) {
    const t = cpu.times
    total += t.user + t.nice + t.sys + t.idle + t.irq
    idle += t.idle
  }

  return { total, idle }
}

export const get_system_metrics = (): SystemMetrics => {
  const now = Date.now()
  const total_mem = os.totalmem()
  const free_mem = os.freemem()
  const used_mem = Math.max(0, total_mem - free_mem)
  const mem_usage_percent = total_mem > 0 ? (used_mem / total_mem) * 100 : 0

  const { total, idle } = sum_cpu_times()
  let cpu_usage_percent = 0
  if (last_cpu_total !== null && last_cpu_idle !== null) {
    const delta_total = total - last_cpu_total
    const delta_idle = idle - last_cpu_idle
    if (delta_total > 0) {
      cpu_usage_percent = (1 - delta_idle / delta_total) * 100
    }
  }
  last_cpu_total = total
  last_cpu_idle = idle

  const mu = process.memoryUsage()

  return {
    ts: now,
    cpu_usage_percent: Math.min(100, Math.max(0, cpu_usage_percent)),
    mem_usage_percent: Math.min(100, Math.max(0, mem_usage_percent)),
    total_mem,
    free_mem,
    uptime_sec: os.uptime(),
    process_rss: mu.rss,
    process_heap_used: mu.heapUsed,
    process_heap_total: mu.heapTotal,
    gpu_name: get_gpu_name(),
  }
}
