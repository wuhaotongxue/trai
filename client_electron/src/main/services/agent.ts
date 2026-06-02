/**
 * 文件名: agent.ts
 * 作者: wuhao
 * 日期: 2026-04-14 08:45:00
 * 描述: 客户端 Agent 对话服务层
 */
import axios, { CancelTokenSource } from 'axios'
import log from 'electron-log'
import { ApiEndpoints } from '../platform/api_endpoints'
import { ApiUrl } from '../platform/api_url'
import { api_client } from '../platform/api_client'
import { local_db } from './local_db'

// 保存每个 session_id 对应的 CancelToken, 用于中止请求
const active_requests: Record<string, CancelTokenSource> = {}

export const agent_service = {
  /**
   * 停止正在进行的对话生成
   * @param session_id - 会话 ID
   * @returns 停止结果
   */
  stop_chat(session_id: string) {
    if (active_requests[session_id]) {
      active_requests[session_id].cancel('User aborted the generation.')
      delete active_requests[session_id]
      log.info(`Aborted chat request for session: ${session_id}`)
      return { success: true }
    }
    return { success: false, error: 'No active request found for this session.' }
  },

  /**
   * 发送消息给 Agent（流式响应）
   * @param session_id - 会话 ID
   * @param message - 用户消息内容
   * @param agent_id - Agent ID（可选）
   * @param knowledge_base_id - 知识库 ID（可选）
   * @param files - 上传的文件（可选）
   * @param event_sender - 事件发送回调函数（可选）
   * @returns 对话响应结果
   */
  async chat(session_id: string, message: string, agent_id?: string, knowledge_base_id?: string, files?: Array<{ name: string; type: string; data: string }>, event_sender?: (event: string, data: any) => void) {
    try {
      // 停止上一个同一 session 的请求（如果存在）
      if (active_requests[session_id]) {
        active_requests[session_id].cancel('Canceled due to new request.')
      }
      
      const cancel_source = axios.CancelToken.source()
      active_requests[session_id] = cancel_source

      const url = ApiUrl.build_api_url(ApiEndpoints.agent_chat)
      const payload: any = {
        session_id,
        message,
        stream: true,
        role: 'user'
      }
      if (agent_id) payload.agent_id = agent_id
      if (knowledge_base_id) payload.knowledge_base_id = knowledge_base_id
      if (files && files.length > 0) payload.files = files

      log.info('Agent Chat Payload:', payload)
      
      // Save user message to local db
      const crypto = require('crypto')
      const msg_id = crypto.randomUUID()
      local_db.save_message(msg_id, session_id, 'user', message)
      // Update session locally
      local_db.save_session(session_id, null)
      
      const res = await api_client.post(url, payload, { 
        responseType: 'stream',
        cancelToken: cancel_source.token 
      })
      
      return new Promise((resolve) => {
        let final_data: any = { content: '', reasoning_content: '' }
        let buffer = ''
        
        res.data.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf8')
          
          let newline_index
          while ((newline_index = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newline_index).trim()
            buffer = buffer.slice(newline_index + 1)
            
            if (line.startsWith('data: ')) {
              const data_str = line.slice(6).trim()
              if (data_str === '[DONE]') {
                delete active_requests[session_id]
                
                // Save bot reply to local db
                const crypto = require('crypto')
                const reply_id = crypto.randomUUID()
                local_db.save_message(reply_id, session_id, 'assistant', final_data.content)
                
                resolve({ success: true, data: final_data })
                return
              }
              try {
                const parsed = JSON.parse(data_str)
                if (parsed.type === 'token' && parsed.content) {
                  final_data.content += parsed.content
                } else if (parsed.type === 'reasoning' && parsed.content) {
                  final_data.reasoning_content += parsed.content
                }
                
                if (event_sender) {
                  // 将 session_id 注入到 chunk 数据中, 便于前端区分
                  event_sender('agent:chat:chunk', { ...parsed, session_id })
                }
              } catch (e) {
                // ignore parse error for incomplete JSON in single line (rare but possible if bad format)
              }
            }
          }
        })
        
        res.data.on('end', () => {
          delete active_requests[session_id]
          resolve({ success: true, data: final_data })
        })
        
        res.data.on('error', (err: any) => {
          delete active_requests[session_id]
          log.error('Stream error:', err)
          resolve({ success: false, error: err.message })
        })
      })

    } catch (error: any) {
      delete active_requests[session_id]
      if (axios.isCancel(error)) {
        return { success: false, error: 'canceled', is_canceled: true }
      }
      log.error('agent_chat failed:', error.message)
      return { 
        success: false, 
        error: error.message || '对话请求失败' 
      }
    }
  },

  /**
   * 文生图（文本生成图片）
   * @param prompt - 提示词
   * @param model - 模型名称, 默认使用 FLUX.1-dev
   * @returns 生成结果
   */
  async generate_image(prompt: string, model: string = "AI-ModelScope/FLUX.1-dev") {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_image)
      const payload = { prompt, model }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('generate_image failed:', error.message)
      return { success: false, error: error.message || '图片生成失败' }
    }
  },

  /**
   * 图生图（图片生成图片）
   * @param prompt - 提示词
   * @param image_url - 原图 URL
   * @returns 生成结果
   */
  async generate_image_to_image(prompt: string, image_url: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_image_to_image)
      const payload = { prompt, image_url }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('generate_image_to_image failed:', error.message)
      return { success: false, error: error.message || '图生图生成失败' }
    }
  },

  /**
   * AI 音乐生成（异步轮询）
   * @param prompt - 提示词
   * @returns 生成结果
   */
  async generate_music(prompt: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_music)
      const payload = { prompt }
      const res = await api_client.post(url, payload)
      
      if (!res.data?.task_id) {
        return { success: false, error: '任务创建失败' }
      }
      
      const task_id = res.data.task_id
      log.info(`Music generation task created: ${task_id}`)
      
      // 轮询任务状态
      const max_retries = 60
      const poll_interval = 3000 // 3秒间隔
      
      for (let i = 0; i < max_retries; i++) {
        await new Promise(resolve => setTimeout(resolve, poll_interval))
        
        const status_url = ApiUrl.build_api_url(`${ApiEndpoints.ai_generate_music}/status/${task_id}`)
        // 状态查询接口是公开的，不携带认证token避免401错误
        const status_res = await api_client.get(status_url, { headers: { Authorization: undefined } })
        
        const status = status_res.data?.status
        const music_url = status_res.data?.music_url
        
        if (status === 'completed' && music_url) {
          return { success: true, data: { music_url, task_id } }
        }
        
        if (status === 'failed') {
          const error_msg = status_res.data?.error || '生成失败'
          return { success: false, error: error_msg }
        }
        
        if (status === 'cancelled') {
          return { success: false, error: '任务已取消' }
        }
        
        log.info(`Music generation in progress (${i + 1}/${max_retries}): ${status_res.data?.progress || 'processing'}`)
      }
      
      return { success: false, error: '生成超时，请重试' }
    } catch (error: any) {
      log.error('generate_music failed:', error.message)
      return { success: false, error: error.message || '音乐生成失败' }
    }
  },

  /**
   * AI 视频生成
   * @param prompt - 提示词
   * @returns 生成结果
   */
  async generate_video(prompt: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_video)
      const payload = { prompt }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data }
    } catch (error: any) {
      log.error('generate_video failed:', error.message)
      return { success: false, error: error.message || '视频生成失败' }
    }
  },

  /**
   * 获取 Agent 列表
   * @returns Agent 列表
   */
  async get_agents() {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_management_list)
      const res = await api_client.get(url)
      return { success: true, data: res.data.data.agents }
    } catch (error: any) {
      log.error('get_agents failed:', error.message)
      return { success: false, error: error.message || '获取 Agent 列表失败' }
    }
  },

  /**
   * 注册新 Agent
   * @param name - Agent 名称
   * @param description - Agent 描述
   * @param model - 使用的模型
   * @param system_prompt - 系统提示词
   * @param icon - Agent 图标（可选）
   * @param category - Agent 分类（可选）
   * @returns 注册结果
   */
  async register_agent(name: string, description: string, model: string, system_prompt: string, icon?: string, category?: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_management_register)
      const payload: any = { name, description, model, system_prompt }
      if (icon) payload.icon = icon
      if (category) payload.category = category
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('register_agent failed:', error.message)
      return { success: false, error: error.message || '注册 Agent 失败' }
    }
  },

  /**
   * 更新 Agent
   * @param agent_id - Agent ID
   * @param name - Agent 名称
   * @param description - Agent 描述
   * @param model - 使用的模型
   * @param system_prompt - 系统提示词
   * @param icon - Agent 图标
   * @param category - Agent 分类（可选）
   * @returns 更新结果
   */
  async update_agent(agent_id: string, name: string, description: string, model: string, system_prompt: string, icon: string, category?: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_management_update)
      const payload: any = { agent_id, name, description, model, system_prompt, icon }
      if (category) payload.category = category
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('update_agent failed:', error.message)
      return { success: false, error: error.message || '更新 Agent 失败' }
    }
  },

  /**
   * 启停 Agent（启动或停止）
   * @param agent_id - Agent ID
   * @param action - 动作类型: 'start' 或 'stop'
   * @returns 操作结果
   */
  async toggle_agent(agent_id: string, action: 'start' | 'stop') {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_management_toggle)
      const payload = { agent_id, action }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('toggle_agent failed:', error.message)
      return { success: false, error: error.message || '启停 Agent 失败' }
    }
  },

  /**
   * 检测 Agent 状态
   * @param agent_id - Agent ID
   * @returns Agent 状态信息
   */
  async check_agent(agent_id: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_management_check)
      const payload = { agent_id }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('check_agent failed:', error.message)
      return { success: false, error: error.message || '检测 Agent 状态失败' }
    }
  },

  /**
   * 提交 ComfyUI 任务
   * @param prompt - ComfyUI 工作流提示词
   * @returns 任务提交结果
   */
  async generate_comfyui(prompt: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_comfyui)
      const payload = { prompt }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('generate_comfyui failed:', error.message)
      return { success: false, error: error.message || '提交 ComfyUI 任务失败' }
    }
  },

  /**
   * AI 周报生成
   * @param template_base64 - 模板文件 Base64
   * @param template_name - 模板名称
   * @param description - 周报内容描述
   * @returns 生成的周报
   */
  async generate_report(template_base64: string, template_name: string, description: string) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.ai_generate_report)
      const payload = { template_base64, template_name, description }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('generate_report failed:', error.message)
      // TODO: 后端接口就绪后移除模拟响应
      // fallback mock
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ 
            success: true, 
            data: `# 基于 ${template_name} 生成的周报\n\n## 本周工作总结\n\n- ${description.replace(/\n/g, '\n- ')}\n\n## 下周计划\n\n- 继续推进当前进度...` 
          })
        }, 3000)
      })
    }
  },

  /**
   * 获取可用工具列表
   * @returns 工具列表
   */
  async get_tool_list() {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_tool_list)
      const res = await api_client.get(url)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('get_tool_list failed:', error.message)
      return { success: false, error: error.message || '获取工具列表失败' }
    }
  },

  /**
   * 调用工具
   * @param tool_name - 工具名称
   * @param tool_params - 工具参数
   * @returns 工具执行结果
   */
  async call_tool(tool_name: string, tool_params: Record<string, any>) {
    try {
      const url = ApiUrl.build_api_url(ApiEndpoints.agent_tool_call)
      const payload = { tool_name, tool_params }
      const res = await api_client.post(url, payload)
      return { success: true, data: res.data.data }
    } catch (error: any) {
      log.error('call_tool failed:', error.message)
      return { success: false, error: error.message || '工具调用失败' }
    }
  },

  /**
   * 读取本地文件
   * @param file_path - 文件路径
   * @returns 文件内容
   */
  async read_file(file_path: string) {
    try {
      const { readFile } = await import('fs/promises')
      const content = await readFile(file_path, 'utf-8')
      log.info(`Read file: ${file_path}`)
      return { success: true, data: content }
    } catch (error: any) {
      log.error('read_file failed:', error.message)
      return { success: false, error: error.message || '读取文件失败' }
    }
  },

  /**
   * 写入本地文件
   * @param file_path - 文件路径
   * @param content - 文件内容
   * @param encoding - 编码格式，默认 utf-8
   * @returns 写入结果
   */
  async write_file(file_path: string, content: string, encoding: string = 'utf-8') {
    try {
      const { writeFile } = await import('fs/promises')
      await writeFile(file_path, content, encoding)
      log.info(`Write file: ${file_path}`)
      return { success: true, data: { message: '文件写入成功', path: file_path } }
    } catch (error: any) {
      log.error('write_file failed:', error.message)
      return { success: false, error: error.message || '写入文件失败' }
    }
  },

  /**
   * 追加内容到本地文件
   * @param file_path - 文件路径
   * @param content - 追加内容
   * @returns 追加结果
   */
  async append_file(file_path: string, content: string) {
    try {
      const { appendFile } = await import('fs/promises')
      await appendFile(file_path, content, 'utf-8')
      log.info(`Append file: ${file_path}`)
      return { success: true, data: { message: '内容追加成功', path: file_path } }
    } catch (error: any) {
      log.error('append_file failed:', error.message)
      return { success: false, error: error.message || '追加内容失败' }
    }
  },

  /**
   * 删除本地文件
   * @param file_path - 文件路径
   * @returns 删除结果
   */
  async delete_file(file_path: string) {
    try {
      const { unlink } = await import('fs/promises')
      await unlink(file_path)
      log.info(`Delete file: ${file_path}`)
      return { success: true, data: { message: '文件删除成功', path: file_path } }
    } catch (error: any) {
      log.error('delete_file failed:', error.message)
      return { success: false, error: error.message || '删除文件失败' }
    }
  },

  /**
   * 列出目录内容
   * @param dir_path - 目录路径
   * @returns 目录内容列表
   */
  async list_directory(dir_path: string) {
    try {
      const { readdir, stat } = await import('fs/promises')
      const files = await readdir(dir_path)
      const result = []
      
      for (const file of files) {
        const full_path = `${dir_path}/${file}`
        const stats = await stat(full_path)
        result.push({
          name: file,
          path: full_path,
          is_directory: stats.isDirectory(),
          size: stats.size,
          modified_at: stats.mtime.toISOString()
        })
      }
      
      log.info(`List directory: ${dir_path}`)
      return { success: true, data: result }
    } catch (error: any) {
      log.error('list_directory failed:', error.message)
      return { success: false, error: error.message || '读取目录失败' }
    }
  },

  /**
   * 创建目录
   * @param dir_path - 目录路径
   * @param recursive - 是否递归创建，默认 true
   * @returns 创建结果
   */
  async create_directory(dir_path: string, recursive: boolean = true) {
    try {
      const { mkdir } = await import('fs/promises')
      await mkdir(dir_path, { recursive })
      log.info(`Create directory: ${dir_path}`)
      return { success: true, data: { message: '目录创建成功', path: dir_path } }
    } catch (error: any) {
      log.error('create_directory failed:', error.message)
      return { success: false, error: error.message || '创建目录失败' }
    }
  },

  /**
   * 浏览器截图
   * @param url - 目标网址
   * @param output_path - 输出路径
   * @param options - 截图选项
   * @returns 截图结果
   */
  async browser_screenshot(url: string, output_path: string, options: any = {}) {
    try {
      let puppeteer
      try {
        puppeteer = await import('puppeteer')
      } catch {
        return { success: false, error: 'puppeteer 未安装，请先安装依赖: pnpm add puppeteer' }
      }
      
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'networkidle2' })
      
      const screenshot_options = {
        path: output_path,
        fullPage: options.fullPage || false,
        quality: options.quality || 100,
        ...(options.viewport && { viewport: options.viewport })
      }
      
      await page.screenshot(screenshot_options)
      await browser.close()
      
      log.info(`Browser screenshot: ${url} -> ${output_path}`)
      return { success: true, data: { message: '截图成功', path: output_path } }
    } catch (error: any) {
      log.error('browser_screenshot failed:', error.message)
      return { success: false, error: error.message || '截图失败' }
    }
  },

  /**
   * 浏览器页面内容抓取
   * @param url - 目标网址
   * @returns 页面内容
   */
  async browser_scrape(url: string) {
    try {
      let puppeteer
      try {
        puppeteer = await import('puppeteer')
      } catch {
        return { success: false, error: 'puppeteer 未安装，请先安装依赖: pnpm add puppeteer' }
      }
      
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'networkidle2' })
      
      const content = await page.content()
      const title = await page.title()
      const text = await page.evaluate(() => document.body.textContent)
      
      await browser.close()
      
      log.info(`Browser scrape: ${url}`)
      return { success: true, data: { url, title, content, text } }
    } catch (error: any) {
      log.error('browser_scrape failed:', error.message)
      return { success: false, error: error.message || '抓取失败' }
    }
  },

  /**
   * 执行命令行
   * @param command - 命令
   * @param cwd - 工作目录
   * @returns 命令执行结果
   */
  async execute_command(command: string, cwd?: string) {
    try {
      const { exec } = await import('child_process')
      return new Promise((resolve) => {
        exec(command, { cwd, timeout: 60000 }, (error, stdout, stderr) => {
          if (error) {
            log.error('execute_command failed:', error.message)
            resolve({ success: false, error: error.message, stderr })
          } else {
            log.info(`Execute command: ${command}`)
            resolve({ success: true, data: { stdout, stderr } })
          }
        })
      })
    } catch (error: any) {
      log.error('execute_command failed:', error.message)
      return { success: false, error: error.message || '命令执行失败' }
    }
  }
}
