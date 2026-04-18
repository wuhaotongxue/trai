/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 仪表盘页面组件 - 三段式布局
 */
import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Monitor, Cpu, HardDrive, ChevronRight, Zap, Clock, Star } from 'lucide-react'

interface SystemInfo {
  platform: string
  arch: string
  release: string
  total_mem: number
  free_mem: number
}

interface DashboardItem {
  id: string
  name: string
  icon: React.ReactNode
  category: string
}

const Dashboard: React.FC = () => {
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [active_category, set_active_category] = useState<string>('system')
  const [active_item, set_active_item] = useState<string>('overview')
  const [sys_info, set_sys_info] = useState<SystemInfo | null>(null)

  const dashboard_items: DashboardItem[] = [
    { id: 'overview', name: '系统概览', icon: <Monitor size={16} />, category: 'system' },
    { id: 'hardware', name: '硬件信息', icon: <Cpu size={16} />, category: 'system' },
    { id: 'memory', name: '内存状态', icon: <HardDrive size={16} />, category: 'system' }
  ]

  const filtered_items = dashboard_items.filter(item => item.category === active_category)

  useEffect(() => {
    window.electron_api.get_system_info().then((res) => {
      if (res.success && res.data) {
        set_sys_info(res.data)
      } else {
        console.error('获取系统信息失败')
      }
    })
  }, [])

  const format_bytes = (bytes: number) => {
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
  }

  const render_content = () => {
    switch (active_item) {
      case 'overview':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 20px 0', color: '#202020', fontWeight: '600' }}>系统概览</h2>
            {sys_info ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Monitor size={16} color="#64748b" />
                    <div style={{ color: '#64748b', fontSize: '12px' }}>系统平台</div>
                  </div>
                  <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: 600 }}>{sys_info.platform}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Cpu size={16} color="#64748b" />
                    <div style={{ color: '#64748b', fontSize: '12px' }}>CPU 架构</div>
                  </div>
                  <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: 600 }}>{sys_info.arch}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <HardDrive size={16} color="#64748b" />
                    <div style={{ color: '#64748b', fontSize: '12px' }}>总内存</div>
                  </div>
                  <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: 600 }}>{format_bytes(sys_info.total_mem)}</div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                加载中...
              </div>
            )}
          </div>
        )
      case 'hardware':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 20px 0', color: '#202020', fontWeight: '600' }}>硬件信息</h2>
            {sys_info ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>系统详情</div>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>操作系统</span>
                    <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>{sys_info.platform}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>CPU 架构</span>
                    <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>{sys_info.arch}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>内核版本</span>
                    <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 500 }}>{sys_info.release}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                加载中...
              </div>
            )}
          </div>
        )
      case 'memory':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 20px 0', color: '#202020', fontWeight: '600' }}>内存状态</h2>
            {sys_info ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>总内存</span>
                    <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{format_bytes(sys_info.total_mem)}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#0ea5e9', borderRadius: '4px' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>可用内存</span>
                    <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{format_bytes(sys_info.free_mem)}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${(sys_info.free_mem / sys_info.total_mem) * 100}%`, 
                        height: '100%', 
                        backgroundColor: '#10b981', 
                        borderRadius: '4px' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                加载中...
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard size={20} color="#0ea5e9" />
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>工作台</h1>
        </div>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ 
          width: is_left_sidebar_open ? '200px' : '0px', 
          minWidth: is_left_sidebar_open ? '180px' : '0px',
          maxWidth: is_left_sidebar_open ? '250px' : '0px',
          opacity: is_left_sidebar_open ? 1 : 0,
          backgroundColor: '#f1f5f9', 
          borderRight: is_left_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', paddingLeft: '8px' }}>仪表盘</div>
            <button
              onClick={() => set_active_category('system')}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: active_category === 'system' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: active_category === 'system' ? '#0ea5e9' : '#475569',
                fontWeight: active_category === 'system' ? '600' : 'normal',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <Monitor size={16} />
              系统信息
            </button>
          </div>
        </div>

        <div style={{ 
          width: is_middle_sidebar_open ? '220px' : '0px', 
          minWidth: is_middle_sidebar_open ? '200px' : '0px',
          maxWidth: is_middle_sidebar_open ? '300px' : '0px',
          opacity: is_middle_sidebar_open ? 1 : 0,
          backgroundColor: '#ffffff', 
          borderRight: is_middle_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', paddingLeft: '8px' }}>
              查看项目
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filtered_items.map(item => (
              <button
                key={item.id}
                onClick={() => set_active_item(item.id)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: active_item === item.id ? '#f0f9ff' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: active_item === item.id ? '#0ea5e9' : '#475569',
                  fontWeight: active_item === item.id ? '600' : 'normal',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.icon}
                  {item.name}
                </div>
                {active_item === item.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div className="no-drag-region" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff' }}>
            {render_content()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
