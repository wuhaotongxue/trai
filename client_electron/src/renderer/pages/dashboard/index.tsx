/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 仪表盘页面组件
 */
import React, { useState, useEffect } from 'react'

interface SystemInfo {
  platform: string
  arch: string
  release: string
  total_mem: number
  free_mem: number
}

const Dashboard: React.FC = () => {
  const [sys_info, set_sys_info] = useState<SystemInfo | null>(null)

  useEffect(() => {
    window.electron_api.get_system_info().then((res) => {
      if (res.success && res.data) {
        set_sys_info(res.data)
      } else {
        console.error('获取系统信息失败')
      }
    })
  }, [])

  return (
    <div>
      <h1 style={{ color: '#f8fafc', marginTop: 0 }}>工作台</h1>
      <p style={{ color: '#94a3b8' }}>欢迎来到 TRAI 桌面客户端</p>
      
      <div style={{
        marginTop: '24px',
        padding: '24px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        border: '1px solid #334155'
      }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', color: '#e2e8f0' }}>系统环境信息</h2>
        {sys_info ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '6px' }}>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>系统平台</div>
              <div style={{ color: '#f8fafc', fontSize: '16px' }}>{sys_info.platform}</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '6px' }}>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>CPU 架构</div>
              <div style={{ color: '#f8fafc', fontSize: '16px' }}>{sys_info.arch}</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '6px' }}>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>内核版本</div>
              <div style={{ color: '#f8fafc', fontSize: '16px' }}>{sys_info.release}</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '6px' }}>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>总内存</div>
              <div style={{ color: '#f8fafc', fontSize: '16px' }}>{(sys_info.total_mem / 1024 / 1024 / 1024).toFixed(2)} GB</div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>加载中...</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
