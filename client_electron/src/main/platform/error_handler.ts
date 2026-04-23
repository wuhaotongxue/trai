/**
 * 文件名: error_handler.ts
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: 错误处理模块
 */
import log from 'electron-log'

/**
 * 错误类型
 */
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

/**
 * 错误信息
 */
export interface AppError {
  type: ErrorType
  message: string
  originalError?: Error
  metadata?: Record<string, any>
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * 处理错误
   * @param error - 错误对象
   * @param metadata - 附加元数据
   */
  handleError(error: any, metadata?: Record<string, any>): AppError {
    let appError: AppError

    // 网络错误
    if (error.message && (error.message.includes('Network') || error.message.includes('network'))) {
      appError = {
        type: ErrorType.NETWORK,
        message: '网络连接失败，请检查网络设置',
        originalError: error,
        metadata
      }
    }
    // 认证错误
    else if (error.response && error.response.status === 401) {
      appError = {
        type: ErrorType.AUTHENTICATION,
        message: '身份认证失败，请重新登录',
        originalError: error,
        metadata
      }
    }
    // 验证错误
    else if (error.response && error.response.status === 400) {
      appError = {
        type: ErrorType.VALIDATION,
        message: error.response.data?.message || '参数验证失败',
        originalError: error,
        metadata
      }
    }
    // 服务器错误
    else if (error.response && error.response.status >= 500) {
      appError = {
        type: ErrorType.SERVER,
        message: '服务器内部错误，请稍后重试',
        originalError: error,
        metadata
      }
    }
    // 客户端错误
    else if (error instanceof Error) {
      appError = {
        type: ErrorType.CLIENT,
        message: error.message,
        originalError: error,
        metadata
      }
    }
    // 未知错误
    else {
      appError = {
        type: ErrorType.UNKNOWN,
        message: '未知错误',
        originalError: error instanceof Error ? error : new Error(String(error)),
        metadata
      }
    }

    // 记录错误
    log.error(`[error] ${appError.type}: ${appError.message}`, appError.originalError, appError.metadata)

    return appError
  }

  /**
   * 捕获并处理异步函数中的错误
   * @param fn - 异步函数
   * @param metadata - 附加元数据
   */
  async catchAsync<T>(fn: () => Promise<T>, metadata?: Record<string, any>): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const result = await fn()
      return { success: true, data: result }
    } catch (error) {
      const appError = this.handleError(error, metadata)
      return { success: false, error: appError }
    }
  }
}

/**
 * 全局错误处理器实例
 */
export const error_handler = ErrorHandler.getInstance()
