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
  const [update_status, set_update_status] = useState<string>('')
  const [is_checking, set_is_checking] = useState(false)
  const [has_update, set_has_update] = useState(false)
  const [current_version, set_current_version] = useState('')

  useEffect(() => {
    const load_config = async () => {
      if (window.electron_api?.config_get) {
        const res = await window.electron_api.config_get('api_url', 'http://127.0.0.1:5666')
        if (res.success) {
          set_api_url(res.data)
        }
      }
    }
    
    const load_version = async () => {
      if (window.electron_api?.app_get_version) {
        try {
          const v = await window.electron_api.app_get_version()
          set_current_version(v)
        } catch (e) {
          console.error('Failed to get app version', e)
        }
      }
    }
    
    load_config()
    load_version()
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

  const check_update = async () => {
    if (!window.electron_api?.app_check_update) return
    
    set_is_checking(true)
    set_update_status('正在检查更新...')
    set_has_update(false)
    
    try {
      const res = await window.electron_api.app_check_update()
      if (res.success && res.data) {
        set_has_update(true)
        set_update_status(`发现新版本: ${res.data.updateInfo.version}`)
      } else {
        set_update_status('当前已经是最新版本')
      }
    } catch (err) {
      set_update_status('检查更新失败, 请稍后再试')
      console.error(err)
    } finally {
      set_is_checking(false)
    }
  }

  const install_update = async () => {
    if (window.electron_api?.app_install_update) {
      set_update_status('正在准备重启安装...')
      await window.electron_api.app_install_update()
    }
  }

  return (
    <div>
      <h1 style={{ color: '#202020', marginTop: 0 }}>系统设置</h1>
      <p style={{ color: 'rgba(0, 0, 0, 0.6)' }}>配置各项参数</p>
      
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

      <div style={{ marginTop: '24px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.05)', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', color: '#202020', fontWeight: '600' }}>系统更新</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <div style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.7)' }}>
            当前版本: <span style={{ fontWeight: '500', color: '#202020' }}>v{current_version || '未知'}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={check_update}
              disabled={is_checking}
              style={{
                padding: '10px 16px',
                backgroundColor: is_checking ? '#f3f2f1' : '#ffffff',
                color: is_checking ? '#a19f9d' : '#202020',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '6px',
                cursor: is_checking ? 'not-allowed' : 'pointer',
                fontWeight: 'normal'
              }}
            >
              {is_checking ? '检查中...' : '检查更新'}
            </button>
            
            {has_update && (
              <button 
                onClick={install_update}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#0078d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'normal'
                }}
              >
                立即重启并安装
              </button>
            )}
          </div>
          
          {update_status && (
            <span style={{ 
              color: has_update ? '#0078d4' : 'rgba(0, 0, 0, 0.6)', 
              fontSize: '13px' 
            }}>
              {update_status}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
