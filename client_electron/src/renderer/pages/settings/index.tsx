/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 设置页面组件
 */
import React, { useState, useEffect } from 'react'

const Settings: React.FC = () => {
  const [api_url, set_api_url] = useState('http://127.0.0.1:8000')
  const [saved, set_saved] = useState(false)

  useEffect(() => {
    const load_config = async () => {
      if (window.electron_api?.config_get) {
        const res = await window.electron_api.config_get('api_url', 'http://127.0.0.1:5666')
        if (res.success) {
          set_api_url(res.data)
        }
      }
    }
    load_config()
  }, [])

  const handle_save = async () => {
    if (window.electron_api?.config_set) {
      const res = await window.electron_api.config_set('api_url', api_url)
      if (res.success) {
        set_saved(true)
        setTimeout(() => set_saved(false), 2000)
      }
    }
  }

  return (
    <div>
      <h1 style={{ color: '#202020', marginTop: 0 }}>系统设置</h1>
      <p style={{ color: 'rgba(0, 0, 0, 0.6)' }}>配置客户端的各项参数</p>
      
      <div style={{ marginTop: '24px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.05)', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', color: '#202020', fontWeight: '600' }}>网络配置</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
          <label style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.7)' }}>后端 API 地址</label>
          <input 
            type="text" 
            value={api_url}
            onChange={(e) => set_api_url(e.target.value)}
            placeholder="例如: http://127.0.0.1:8000"
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              outline: 'none',
              fontSize: '14px',
              color: '#202020',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.border = '1px solid #0078d4'}
            onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.1)'}
          />
          <button 
            onClick={handle_save}
            style={{
              marginTop: '12px',
              padding: '10px 16px',
              backgroundColor: '#0078d4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'normal',
              alignSelf: 'flex-start'
            }}
          >
            保存配置
          </button>
          {saved && <span style={{ color: '#107c10', fontSize: '12px', marginTop: '8px' }}>保存成功</span>}
        </div>
      </div>
    </div>
  )
}

export default Settings
