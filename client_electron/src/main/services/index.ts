/**
 * 文件名: index.ts
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: 业务逻辑层核心服务入口
 */
import log from 'electron-log'

/**
 * 初始化业务服务
 * 在应用启动时调用，用于初始化所有业务相关的服务
 */
export const init_services = (): void => {
  log.info('initializing business services')
}
