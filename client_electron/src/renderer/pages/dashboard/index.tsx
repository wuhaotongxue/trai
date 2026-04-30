/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 22:30:00
 * 描述: 仪表盘页面组件 - 自适应三段式布局
 */
import React, { useState, useEffect } from 'react'
import { Monitor, Cpu, HardDrive, ChevronRight, LayoutDashboard, Activity } from 'lucide-react'
import ThreePanelLayout from '@/components/layout/ThreePanelLayout'
import { should_ellipsis } from '@/utils/ui_text'
import { translate } from '@/i18n'

interface SystemInfo {
  platform: string
  arch: string
  release: string
  total_mem: number
  free_mem: number
  gpu_name: string
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
  gpu_name: string
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

      <text x="2" y={y_100 + 4} fontSize="10" fill="var(--ui_text_muted)">100</text>
      <text x="6" y={y_50 + 4} fontSize="10" fill="var(--ui_text_muted)">50</text>
      <text x="12" y={y_0 + 4} fontSize="10" fill="var(--ui_text_muted)">0</text>

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
    { id: 'overview', name: translate('system_overview'), icon: <Monitor size={16} />, category: 'system' },
    { id: 'performance', name: translate('performance_monitor'), icon: <Activity size={16} />, category: 'system' },
    { id: 'hardware', name: translate('hardware_info'), icon: <Cpu size={16} />, category: 'system' },
    { id: 'memory', name: translate('memory_status'), icon: <HardDrive size={16} />, category: 'system' }
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
    const timer = window.setInterval(tick, 2000)
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
          backgroundColor: active_category === 'system' ? 'var(--ui_panel)' : 'transparent',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          color: active_category === 'system' ? 'var(--ui_accent)' : 'var(--ui_text)',
          fontWeight: active_category === 'system' ? '600' : 'normal',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          gap: '8px',
          marginBottom: '4px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Monitor size={16} />
        <span style={{ whiteSpace: 'nowrap' }}>{translate('system_info_btn')}</span>
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
            backgroundColor: active_item === item.id ? 'var(--ui_accent)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: active_item === item.id ? 'white' : 'var(--ui_text)',
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
            <h2 style={{ fontSize: '16px', margin: '0 0 20px 0', color: 'var(--ui_text)', fontWeight: 600 }}>{translate('system_overview')}</h2>
            {sys_info ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                {[
                  { icon: <Monitor size={20} color="var(--ui_accent)" />, label: translate('platform'), value: sys_info.platform, bgColor: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.05))' },
                  { icon: <Cpu size={20} color="var(--ui_accent)" />, label: translate('cpu_arch'), value: sys_info.arch, bgColor: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))' },
                  { icon: <HardDrive size={20} color="var(--ui_success)" />, label: translate('total_memory'), value: format_gb(sys_info.total_mem), bgColor: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' },
                  { icon: <Cpu size={20} color="var(--ui_accent)" />, label: translate('gpu'), value: metrics?.gpu_name || sys_info.gpu_name || 'Unknown GPU', bgColor: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))' },
                  { icon: <Activity size={20} color="var(--ui_danger)" />, label: translate('cpu_usage'), value: metrics ? format_percent(metrics.cpu_usage_percent) : '0.0%', bgColor: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))' },
                  { icon: <HardDrive size={20} color="var(--ui_accent)" />, label: translate('memory_usage'), value: metrics ? format_percent(metrics.mem_usage_percent) : '0.0%', bgColor: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05))' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="ui-card"
                    style={{
                      padding: '20px',
                      background: item.bgColor,
                      border: '1px solid var(--ui_border)',
                      borderRadius: '12px',
                      animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 0.06}s both`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        backgroundColor: 'var(--ui_panel)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}>
                        {item.icon}
                      </div>
                      <div style={{ color: 'var(--ui_text_muted)', fontSize: '13px', fontWeight: 500 }}>{item.label}</div>
                    </div>
                    <div style={{ color: 'var(--ui_text)', fontSize: '15px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--ui_text_muted)' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '16px', backgroundColor: 'var(--ui_panel)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={32} color="var(--ui_text_muted)" />
                </div>
                <p style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{translate('loading_data')}</p>
              </div>
            )}
          </div>
        )
      case 'performance':
        return (
          <div style={{ padding: '24px', animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <style>{`@keyframes dash { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }`}</style>
            <h2 style={{ fontSize: '16px', margin: '0 0 20px 0', color: 'var(--ui_text)', fontWeight: 600 }}>{translate('performance_monitor')}</h2>
            {metrics ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', border: '1px solid var(--ui_border)', padding: '20px', animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={22} color="var(--ui_accent)" />
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)' }}>CPU</div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ui_accent)' }}>{format_percent(metrics.cpu_usage_percent)}</div>
                  </div>
                  <div style={{ height: '10px', backgroundColor: 'var(--ui_border)', borderRadius: '999px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{ width: `${clamp_percent(metrics.cpu_usage_percent)}%`, height: '100%', background: 'linear-gradient(90deg, var(--ui_accent), var(--ui_accent_hover))', borderRadius: '999px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                  <MiniLineChart values={cpu_series} stroke="var(--ui_accent)" seq={chart_seq} />
                </div>

                <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', border: '1px solid var(--ui_border)', padding: '20px', animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HardDrive size={22} color="var(--ui_success)" />
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)' }}>{translate('memory')}</div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ui_success)' }}>{format_percent(metrics.mem_usage_percent)}</div>
                  </div>
                  <div style={{ height: '10px', backgroundColor: 'var(--ui_border)', borderRadius: '999px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{ width: `${clamp_percent(metrics.mem_usage_percent)}%`, height: '100%', background: 'linear-gradient(90deg, var(--ui_success), var(--ui_success))', borderRadius: '999px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                  <MiniLineChart values={mem_series} stroke="var(--ui_success)" seq={chart_seq} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: 'var(--ui_text_muted)', fontSize: '13px' }}>
                    <span>{translate('available')} {format_gb(metrics.free_mem)}</span>
                    <span>{translate('total')} {format_gb(metrics.total_mem)}</span>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', border: '1px solid var(--ui_border)', padding: '20px', animation: 'fadeInScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LayoutDashboard size={22} color="var(--ui_accent)" />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)' }}>{translate('process_memory')}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                    <div style={{ backgroundColor: 'var(--ui_panel_alt)', borderRadius: '10px', border: '1px solid var(--ui_border)', padding: '14px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '6px', fontWeight: 500 }}>RSS</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ui_text)' }}>{format_bytes(metrics.process_rss)}</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--ui_panel_alt)', borderRadius: '10px', border: '1px solid var(--ui_border)', padding: '14px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '6px', fontWeight: 500 }}>Heap Used</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ui_text)' }}>{format_bytes(metrics.process_heap_used)}</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--ui_panel_alt)', borderRadius: '10px', border: '1px solid var(--ui_border)', padding: '14px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '6px', fontWeight: 500 }}>Heap Total</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ui_text)' }}>{format_bytes(metrics.process_heap_total)}</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--ui_panel_alt)', borderRadius: '10px', border: '1px solid var(--ui_border)', padding: '14px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '6px', fontWeight: 500 }}>Uptime</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ui_text)' }}>{Math.floor(metrics.uptime_sec)} s</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--ui_text_muted)' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '16px', backgroundColor: 'var(--ui_panel)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={32} color="var(--ui_text_muted)" />
                </div>
                <p style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{translate('loading_data')}</p>
              </div>
            )}
          </div>
        )
      case 'hardware':
        return (
          <div style={{ padding: '24px', animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 20px 0', color: 'var(--ui_text)', fontWeight: 600 }}>{translate('hardware_info')}</h2>
            {sys_info ? (
              <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', border: '1px solid var(--ui_border)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ui_border)', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(14, 165, 233, 0.02))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--ui_panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <Cpu size={20} color="var(--ui_accent)" />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ui_text)' }}>{translate('system_details')}</div>
                  </div>
                </div>
                <div style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--ui_border)', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--ui_panel_alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={16} color="var(--ui_text_muted)" />
                      </div>
                      <span style={{ color: 'var(--ui_text_muted)', fontSize: '14px' }}>{translate('os')}</span>
                    </div>
                    <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 500 }}>{sys_info.platform}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--ui_border)', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--ui_panel_alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Cpu size={16} color="var(--ui_text_muted)" />
                      </div>
                      <span style={{ color: 'var(--ui_text_muted)', fontSize: '14px' }}>{translate('cpu_arch')}</span>
                    </div>
                    <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 500 }}>{sys_info.arch}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--ui_border)', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--ui_panel_alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HardDrive size={16} color="var(--ui_text_muted)" />
                      </div>
                      <span style={{ color: 'var(--ui_text_muted)', fontSize: '14px' }}>{translate('kernel')}</span>
                    </div>
                    <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 500 }}>{sys_info.release}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--ui_panel_alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={16} color="var(--ui_text_muted)" />
                      </div>
                      <span style={{ color: 'var(--ui_text_muted)', fontSize: '14px' }}>{translate('gpu')}</span>
                    </div>
                    <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 500 }}>{metrics?.gpu_name || sys_info.gpu_name || 'Unknown GPU'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--ui_text_muted)' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '16px', backgroundColor: 'var(--ui_panel)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={32} color="var(--ui_text_muted)" />
                </div>
                <p style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{translate('loading_data')}</p>
              </div>
            )}
          </div>
        )
      case 'memory':
        return (
          <div style={{ padding: '24px', animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 20px 0', color: 'var(--ui_text)', fontWeight: 600 }}>{translate('memory_status')}</h2>
            {sys_info ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', border: '1px solid var(--ui_border)', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HardDrive size={24} color="var(--ui_accent)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--ui_text_muted)', marginBottom: '4px' }}>{translate('total_memory')}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ui_text)' }}>{format_gb(metrics?.total_mem ?? sys_info.total_mem)}</div>
                    </div>
                  </div>
                  <div style={{ height: '12px', backgroundColor: 'var(--ui_border)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--ui_accent), var(--ui_accent_hover))', borderRadius: '999px' }} />
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', border: '1px solid var(--ui_border)', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HardDrive size={24} color="var(--ui_success)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--ui_text_muted)', marginBottom: '4px' }}>{translate('available')}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ui_text)' }}>{format_gb(metrics?.free_mem ?? sys_info.free_mem)}</div>
                    </div>
                  </div>
                  <div style={{ height: '12px', backgroundColor: 'var(--ui_border)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${((metrics?.free_mem ?? sys_info.free_mem) / (metrics?.total_mem ?? sys_info.total_mem)) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--ui_success), var(--ui_success))',
                        borderRadius: '999px',
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--ui_text_muted)' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '16px', backgroundColor: 'var(--ui_panel)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HardDrive size={32} color="var(--ui_text_muted)" />
                </div>
                <p style={{ fontSize: '15px', margin: '0 0 8px 0' }}>{translate('loading_data')}</p>
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
      title={translate('overview')}
      titleIcon={<LayoutDashboard size={20} color="var(--ui_accent)" />}
      leftPanelTitle={translate('feature')}
      leftPanel={left_panel}
      middlePanelTitle={active_category === 'system' ? translate('system_info') : translate('project')}
      middlePanel={middle_panel}
      rightPanelTitle={filtered_items.find(i => i.id === active_item)?.name || translate('details')}
      contentPadding="32px"
    >
      <div style={{ flex: 1, backgroundColor: 'var(--ui_panel)', borderRadius: 'var(--ui_radius_lg)', padding: '36px', boxShadow: 'var(--ui_shadow_card)', border: '1px solid var(--ui_border)', overflow: 'auto', minWidth: 0, boxSizing: 'border-box' }}>
        {render_content()}
      </div>
    </ThreePanelLayout>
  )
}

export default Dashboard
