/**
 * 文件名: page_transition.tsx
 * 作者: wuhao
 * 日期: 2026-04-23
 * 描述: 页面过渡动画包装组件，为子页面提供平滑的入场退场动画
 */
import React, { useEffect, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
  class_name?: string
}

/**
 * 页面过渡动画包装组件
 * 子页面切换时提供淡入 + 向上滑动的动画效果
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children, class_name = '' }) => {
  const [is_visible, set_is_visible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      set_is_visible(true)
    })
  }, [])

  return (
    <div
      className={`anim-page-in ${class_name}`}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        opacity: is_visible ? 1 : 0,
      }}
    >
      {children}
    </div>
  )
}

export default PageTransition
