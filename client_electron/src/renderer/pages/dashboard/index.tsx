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
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', color: '#ffffff', fontWeight: '600' }}>系统环境信息</h2>
        {sys_info ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '4px' }}>系统平台</div>
              <div style={{ color: '#ffffff', fontSize: '16px' }}>{sys_info.platform}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '4px' }}>CPU 架构</div>
              <div style={{ color: '#ffffff', fontSize: '16px' }}>{sys_info.arch}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '4px' }}>内核版本</div>
              <div style={{ color: '#ffffff', fontSize: '16px' }}>{sys_info.release}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '4px' }}>总内存</div>
              <div style={{ color: '#ffffff', fontSize: '16px' }}>{(sys_info.total_mem / 1024 / 1024 / 1024).toFixed(2)} GB</div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>加载中...</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
