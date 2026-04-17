/**
 * 文件名: title_bar.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 19:40:00
 * 描述: Win11 风格的自定义可拖拽顶栏
 */
import React from 'react'
import { RotateCw } from 'lucide-react'

const TitleBar: React.FC = () => {
  return (
    <div
      className="drag-region"
      style={{
        height: '36px',
        width: '100%',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '16px',
        fontSize: '12px',
        color: 'rgba(0, 0, 0, 0.7)',
        boxSizing: 'border-box',
        // 因为原生 titleBarOverlay 占据了右侧，我们只负责左侧和中间的拖拽区域
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="./kity.png" alt="logo" style={{ width: '16px', height: '16px' }} />
        <span>TRAI</span>
      </div>

      <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
        <button
          className="no-drag-region"
          type="button"
          title="刷新"
          onClick={() => window.location.reload()}
          style={{
            background: 'transparent',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '6px',
            padding: '4px 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0, 0, 0, 0.65)'
          }}
        >
          <RotateCw size={14} />
        </button>
      </div>
    </div>
  )
}

export default TitleBar
