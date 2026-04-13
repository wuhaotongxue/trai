/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: 平台层服务提供操作系统级原生接口
 */
import os from 'os'
import log from 'electron-log'

export interface SystemInfo {
  platform: string
  arch: string
  release: string
  total_mem: number
  free_mem: number
}

export const get_system_info = (): SystemInfo => {
  log.info('fetching system info from os module')
  return {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    total_mem: os.totalmem(),
    free_mem: os.freemem(),
  }
}
