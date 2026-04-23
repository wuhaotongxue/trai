/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-17 14:30:00
 * 描述: Under development placeholder page for disabled routes.
 */
import React from 'react'
import { Wrench } from 'lucide-react'

const UnderDevelopment: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', boxSizing: 'border-box', backgroundColor: 'var(--ui_bg)' }}>
      <div className="drag-region" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Wrench size={22} color="var(--ui_accent)" />
        <h1 style={{ margin: 0, fontSize: '18px', color: 'var(--ui_text)', fontWeight: 600 }}>功能开发中</h1>
      </div>

      <div className="no-drag-region" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: 'var(--ui_panel)',
            border: '1px solid var(--ui_border)',
            borderRadius: '12px',
            padding: '32px 28px',
            textAlign: 'center'
          }}
        >
          <div style={{ width: '72px', height: '72px', margin: '0 auto 14px', borderRadius: '999px', backgroundColor: 'var(--ui_accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={30} color="white" />
          </div>
          <div style={{ fontSize: '18px', color: 'var(--ui_text)', fontWeight: 700, marginBottom: '8px' }}>
            正在开发中, 敬请期待
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ui_text_muted)', lineHeight: 1.7 }}>
            当前功能暂未开放, 你可以先使用 AI 对话和知识库管理.
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnderDevelopment
