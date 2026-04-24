/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-17 14:30:00
 * 描述: Under development placeholder page for disabled routes.
 */
import React from 'react'
import { Wrench } from 'lucide-react'
import { t } from '@/i18n'

const UnderDevelopment: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', boxSizing: 'border-box', backgroundColor: 'var(--ui_panel)' }}>
      <div className="drag-region" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Wrench size={22} color="var(--ui_accent)" />
        <h1 style={{ margin: 0, fontSize: '18px', color: 'var(--ui_text)', fontWeight: 600 }}>{t('under_development')}</h1>
      </div>

      <div className="no-drag-region" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          className="anim-fade-in-scale"
          style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: 'var(--ui_panel)',
            border: '1px solid var(--ui_border)',
            borderRadius: 'var(--ui_radius_xl)',
            padding: '32px 28px',
            textAlign: 'center'
          }}
        >
          <div style={{ width: '72px', height: '72px', margin: '0 auto 14px', borderRadius: '999px', backgroundColor: 'var(--ui_accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(14, 165, 233, 0.25)' }}>
            <Wrench size={30} color="white" />
          </div>
          <div style={{ fontSize: '18px', color: 'var(--ui_text)', fontWeight: 700, marginBottom: '8px' }}>
            {t('coming_soon')}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ui_text_muted)', lineHeight: 1.7 }}>
            {t('try_ai_chat_kb')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnderDevelopment
