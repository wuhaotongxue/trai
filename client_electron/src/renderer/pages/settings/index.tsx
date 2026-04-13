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
      <h1 style={{ color: '#202020', marginTop: 0 }}>系统设置</h1>
      <p style={{ color: 'rgba(0, 0, 0, 0.6)' }}>配置客户端的各项参数</p>
      
      <div style={{ marginTop: '24px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.05)', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
        <p style={{ color: 'rgba(0, 0, 0, 0.5)', margin: 0 }}>暂无可用设置项</p>
      </div>
    </div>
  )
}

export default Settings
