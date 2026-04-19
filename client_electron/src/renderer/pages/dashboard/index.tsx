/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 仪表盘页面组件 - 自适应三段式布局
 */
import React, { useState, useEffect } from 'react'
import { Monitor, Cpu, HardDrive, ChevronRight, LayoutDashboard, Activity } from 'lucide-react'
import ThreePanelLayout from '@/components/layout/ThreePanelLayout'

interface SystemInfo {
  platform: string
  arch: string
  release: string
  total_mem: number
  free_mem: number
}

interface SystemMetrics {
  ts: number
  cpu_usage_percent: number
  mem_usage_percent: number
  total_mem: number
  free_mem: number
  uptime_sec: number
  process_rss: number
  process_heap_used: number
  process_heap_total: number
}

interface DashboardItem {
  id: string
  name: string
  icon: React.ReactNode
  category: string
}

const clamp_percent = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

const format_percent = (value: number): string => `${clamp_percent(value).toFixed(1)}%`

const format_bytes = (bytes: number): string => {
  if (!Number.isFinite(bytes)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = Math.max(0, bytes)
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`
}

const format_gb = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'

const should_ellipsis = (text: string): boolean => {
  return text.replace(/\s+/g, '').length > 4
}

const build_line_path = (
  values: number[],
  width: number,
  height: number,
  padding: { left: number; right: number; top: number; bottom: number }
): string => {
  const data = values.length > 0 ? values : [0]
  const w = Math.max(1, width - padding.left - padding.right)
  const h = Math.max(1, height - padding.top - padding.bottom)
  const step = data.length > 1 ? w / (data.length - 1) : w
  let d = ''
  for (let i = 0; i < data.length; i += 1) {
    const x = padding.left + step * i
    const y = padding.top + (1 - clamp_percent(data[i]) / 100) * h
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
  }
  return d
}

const MiniLineChart: React.FC<{ values: number[]; stroke: string; seq: number }> = ({ values, stroke, seq }) => {
  const width = 260
  const height = 72
  const padding = { left: 30, right: 8, top: 8, bottom: 18 }
  const d = build_line_path(values, width, height, padding)
  const plot_left = padding.left
  const plot_right = width - padding.right
  const plot_top = padding.top
  const plot_bottom = height - padding.bottom

  const y_for_percent = (p: number) => plot_top + (1 - p / 100) * (plot_bottom - plot_top)
  const y_100 = y_for_percent(100)
  const y_50 = y_for_percent(50)
  const y_0 = y_for_percent(0)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={`M ${plot_left} ${plot_bottom} L ${plot_right} ${plot_bottom}`} stroke="#e2e8f0" strokeWidth="1" />
      <path d={`M ${plot_left} ${y_50} L ${plot_right} ${y_50}`} stroke="#f1f5f9" strokeWidth="1" />
      <path d={`M ${plot_left} ${plot_top} L ${plot_right} ${plot_top}`} stroke="#f8fafc" strokeWidth="1" />

      <text x="2" y={y_100 + 4} fontSize="10" fill="#64748b">100</text>
      <text x="6" y={y_50 + 4} fontSize="10" fill="#64748b">50</text>
      <text x="12" y={y_0 + 4} fontSize="10" fill="#64748b">0</text>

      <path
        key={seq}
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={100}
        style={{
          strokeDasharray: 100,
          strokeDashoffset: 100,
          animation: 'dash 0.6s ease forwards'
        }}
      />
    </svg>
  )
}

const Dashboard: React.FC = () => {
  const [active_category, set_active_category] = useState<string>('system')
  const [active_item, set_active_item] = useState<string>('overview')
  const [sys_info, set_sys_info] = useState<SystemInfo | null>(null)
  const [metrics, set_metrics] = useState<SystemMetrics | null>(null)
  const [cpu_series, set_cpu_series] = useState<number[]>([])
  const [mem_series, set_mem_series] = useState<number[]>([])
  const [chart_seq, set_chart_seq] = useState<number>(0)

  const dashboard_items: DashboardItem[] = [
    { id: 'overview', name: '系统概览', icon: <Monitor size={16} />, category: 'system' },
    { id: 'performance', name: '性能监控', icon: <Activity size={16} />, category: 'system' },
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

  useEffect(() => {
    let is_active = true

    const tick = async () => {
      try {
        const res = await window.electron_api.get_system_metrics()
        if (!is_active) return
        if (res.success && res.data) {
          const next: SystemMetrics = res.data as SystemMetrics
          set_metrics(next)
          set_cpu_series(prev => [...prev, clamp_percent(next.cpu_usage_percent)].slice(-60))
          set_mem_series(prev => [...prev, clamp_percent(next.mem_usage_percent)].slice(-60))
          set_chart_seq(v => v + 1)
        }
      } catch {
        if (!is_active) return
      }
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => {
      is_active = false
      window.clearInterval(timer)
    }
  }, [])

  const left_panel = (
    <>
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
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          gap: '8px',
          marginBottom: '4px',
          transition: 'all 0.2s'
        }}
      >
        <Monitor size={16} />
        <span style={{ whiteSpace: 'nowrap' }}>系统信息</span>
      </button>
    </>
  )

  const middle_panel = (
    <>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            {item.icon}
            <span
              style={
                should_ellipsis(item.name)
                  ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                  : { whiteSpace: 'nowrap' }
              }
            >
              {item.name}
            </span>
          </div>
          {active_item === item.id && <ChevronRight size={14} />}
        </button>
      ))}
    </>
  )

  const render_content = () => {
    switch (active_item) {
      case 'overview':
        return (
          <div style={{ padding: '24px' }}>
            <style>{`@keyframes dash { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }`}</style>
            <h2 style={{ fontSize: '14px', margin: '0 0 20px 0', color: '#202020', fontWeight: '600' }}>系统概览</h2>
            {sys_info ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Monitor size={16} color="#64748b" />
                    <div style={{ color: '#64748b', fontSize: '12px' }}>系统平台</div>
                  </div>
                  <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{sys_info.platform}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Cpu size={16} color="#64748b" />
                    <div style={{ color: '#64748b', fontSize: '12px' }}>CPU 架构</div>
                  </div>
                  <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{sys_info.arch}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <HardDrive size={16} color="#64748b" />
                    <div style={{ color: '#64748b', fontSize: '12px' }}>总内存</div>
                  </div>
                  <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{format_gb(sys_info.total_mem)}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Activity size={16} color="#64748b" />
                    <div style={{ color: '#64748b', fontSize: '12px' }}>CPU 使用率</div>
                  </div>
                  <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
                    {metrics ? format_percent(metrics.cpu_usage_percent) : '0.0%'}
                  </div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <HardDrive size={16} color="#64748b" />
                    <div style={{ color: '#64748b', fontSize: '12px' }}>内存使用率</div>
                  </div>
                  <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
                    {metrics ? format_percent(metrics.mem_usage_percent) : '0.0%'}
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
      case 'performance':
        return (
          <div style={{ padding: '24px' }}>
            <style>{`@keyframes dash { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }`}</style>
            <h2 style={{ fontSize: '14px', margin: '0 0 20px 0', color: '#202020', fontWeight: '600' }}>性能监控</h2>
            {metrics ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} color="#0ea5e9" />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>CPU</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{format_percent(metrics.cpu_usage_percent)}</div>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ width: `${clamp_percent(metrics.cpu_usage_percent)}%`, height: '100%', backgroundColor: '#0ea5e9' }} />
                  </div>
                  <MiniLineChart values={cpu_series} stroke="#0ea5e9" seq={chart_seq} />
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HardDrive size={16} color="#10b981" />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>内存</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{format_percent(metrics.mem_usage_percent)}</div>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ width: `${clamp_percent(metrics.mem_usage_percent)}%`, height: '100%', backgroundColor: '#10b981' }} />
                  </div>
                  <MiniLineChart values={mem_series} stroke="#10b981" seq={chart_seq} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#64748b', fontSize: '12px' }}>
                    <span>可用 {format_gb(metrics.free_mem)}</span>
                    <span>总计 {format_gb(metrics.total_mem)}</span>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LayoutDashboard size={16} color="#64748b" />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>进程内存</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>RSS</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{format_bytes(metrics.process_rss)}</div>
                    </div>
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Heap Used</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{format_bytes(metrics.process_heap_used)}</div>
                    </div>
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Heap Total</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{format_bytes(metrics.process_heap_total)}</div>
                    </div>
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Uptime</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{Math.floor(metrics.uptime_sec)} s</div>
                    </div>
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
      case 'hardware':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '14px', margin: '0 0 20px 0', color: '#202020', fontWeight: '600' }}>硬件信息</h2>
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
            <h2 style={{ fontSize: '14px', margin: '0 0 20px 0', color: '#202020', fontWeight: '600' }}>内存状态</h2>
            {sys_info ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>总内存</span>
                    <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{format_gb(metrics?.total_mem ?? sys_info.total_mem)}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#0ea5e9', borderRadius: '4px' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>可用内存</span>
                    <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{format_gb(metrics?.free_mem ?? sys_info.free_mem)}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${((metrics?.free_mem ?? sys_info.free_mem) / (metrics?.total_mem ?? sys_info.total_mem)) * 100}%`,
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
    <ThreePanelLayout
      title="概览"
      titleIcon={<LayoutDashboard size={20} color="#0ea5e9" />}
      leftPanelTitle="功能"
      leftPanel={left_panel}
      middlePanelTitle={active_category === 'system' ? '系统信息' : '项目'}
      middlePanel={middle_panel}
      rightPanelTitle={filtered_items.find(i => i.id === active_item)?.name || '详情'}
      contentPadding="32px"
    >
      <div style={{ flex: 1, height: '100%', backgroundColor: '#ffffff', borderRadius: '16px', padding: '36px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', boxSizing: 'border-box', overflow: 'auto', minWidth: 0 }}>
        {render_content()}
      </div>
    </ThreePanelLayout>
  )
}

export default Dashboard
