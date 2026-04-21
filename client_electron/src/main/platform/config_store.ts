/**
 * 文件名: config_store.ts
 * 作者: wuhao
 * 日期: 2026-04-13 21:00:00
 * 描述: Platform Layer 层的配置文件存储服务, 使用本地 JSON 文件持久化配置
 */
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import log from 'electron-log'

/**
 * 配置存储类
 * 使用本地 JSON 文件持久化存储应用配置
 */
class ConfigStore {
  /**
   * 配置文件路径
   */
  private config_path: string
  /**
   * 配置数据对象
   */
  private data: Record<string, any> = {}

  /**
   * 构造函数
   * 初始化配置存储, 加载已保存的配置
   */
  constructor() {
    // 配置文件保存在用户数据的漫游目录下, 通常在 AppData/Roaming/TRAI
    this.config_path = path.join(app.getPath('userData'), 'config.json')
    this.load()
  }

  /**
   * 从文件加载配置
   */
  private load(): void {
    try {
      if (fs.existsSync(this.config_path)) {
        const file_content = fs.readFileSync(this.config_path, 'utf-8')
        this.data = JSON.parse(file_content)
        log.info(`已加载配置文件: ${this.config_path}`)
      } else {
        log.info('配置文件不存在, 将使用默认配置')
      }
    } catch (error) {
      log.error('读取配置文件失败', error)
    }
  }

  /**
   * 保存配置到文件
   */
  private save(): void {
    try {
      fs.writeFileSync(this.config_path, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (error) {
      log.error('保存配置文件失败', error)
    }
  }

  /**
   * 获取配置项
   * @param key 配置键名
   * @param default_value 默认值
   * @returns 配置值
   */
  public get(key: string, default_value: any = null): any {
    return this.data[key] !== undefined ? this.data[key] : default_value
  }

  /**
   * 设置配置项
   * @param key 配置键名
   * @param value 配置值
   */
  public set(key: string, value: any): void {
    this.data[key] = value
    this.save()
  }
}

/**
 * 配置存储单例
 */
export const config_store = new ConfigStore()
