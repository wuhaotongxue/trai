/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 设置页面组件
 */
import React from 'react'

const Settings: React.FC = () => {
  return (
    <div>
      <h1 style={{ color: '#f8fafc', marginTop: 0 }}>系统设置</h1>
      <p style={{ color: '#94a3b8' }}>配置客户端的各项参数</p>
      
      <div style={{ marginTop: '24px', backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', padding: '24px' }}>
        <p style={{ color: '#94a3b8', margin: 0 }}>暂无可用设置项</p>
      </div>
    </div>
  )
}

export default Settings
