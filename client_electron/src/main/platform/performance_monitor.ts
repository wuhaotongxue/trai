/**
 * 文件名: performance_monitor.ts
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: 性能监控模块
 */
import log from 'electron-log'

/**
 * 性能指标记录
 */
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private startTime: number = Date.now()

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * 记录性能指标
   * @param name - 指标名称
   * @param value - 指标值
   * @param metadata - 附加元数据
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    }
    this.metrics.push(metric)
    log.info(`[performance] ${name}: ${value}ms`, metadata)
  }

  /**
   * 记录操作耗时
   * @param name - 操作名称
   * @param fn - 要执行的函数
   * @param metadata - 附加元数据
   */
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      this.recordMetric(name, duration, metadata)
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.recordMetric(name, duration, { ...metadata, error: (error as Error).message })
      throw error
    }
  }

  /**
   * 获取应用启动时间
   */
  getStartupTime(): number {
    return Date.now() - this.startTime
  }

  /**
   * 导出性能指标
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * 清空性能指标
   */
  clearMetrics(): void {
    this.metrics = []
  }
}

/**
 * 全局性能监控实例
 */
export const performance_monitor = PerformanceMonitor.getInstance()
