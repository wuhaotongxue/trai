/**
 * 文件名: app.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: UI 渲染层主组件
 */
import React, { useState, useEffect } from 'react'

interface SystemInfo {
  platform: string
  arch: string
  release: string
  total_mem: number
  free_mem: number
}

// 拓展 window 对象类型
declare global {
  interface Window {
    electron_api: {
      get_system_info: () => Promise<{ success: boolean; data?: SystemInfo; error?: string }>
    }
  }
}

const App: React.FC = () => {
  const [sys_info, set_sys_info] = useState<SystemInfo | null>(null)

  useEffect(() => {
    // 渲染进程禁用直接写业务逻辑或 IPC send
    // 统一通过 preload invoke 通信
    window.electron_api.get_system_info().then((res) => {
      if (res.success && res.data) {
        set_sys_info(res.data)
      } else {
        console.error('get system info error')
      }
    })
  }, [])

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#38bdf8' }}>TRAI 桌面客户端</h1>
      <p style={{ color: '#94a3b8' }}>已按照五层架构与安全规范初始化成功</p>
      
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        border: '1px solid #334155'
      }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', color: '#e2e8f0' }}>
          系统环境信息
        </h2>
        {sys_info ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#cbd5e1' }}>
            <li style={{ padding: '4px 0' }}>平台: {sys_info.platform}</li>
            <li style={{ padding: '4px 0' }}>架构: {sys_info.arch}</li>
            <li style={{ padding: '4px 0' }}>版本: {sys_info.release}</li>
            <li style={{ padding: '4px 0' }}>内存: {(sys_info.total_mem / 1024 / 1024 / 1024).toFixed(2)} GB</li>
          </ul>
        ) : (
          <p style={{ color: '#64748b' }}>加载中...</p>
        )}
      </div>
    </div>
  )
}

export default App
