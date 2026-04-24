/**
 * 文件名: animated_translation.tsx
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: 带过渡动画的翻译文本组件，支持淡入淡出、滑动、缩放等效果
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'

type AnimationType = 'fade' | 'slide_up' | 'slide_down' | 'scale' | 'blur' | 'typewriter'

interface AnimatedTranslationProps {
  children: React.ReactNode
  animation?: AnimationType
  duration?: number
  delay?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * 带动画的翻译文本组件
 * 语言切换时会触发流畅的过渡动画
 */
export const AnimatedTranslation: React.FC<AnimatedTranslationProps> = ({
  children,
  animation = 'fade',
  duration = 250,
  delay = 0,
  className = '',
  style,
}) => {
  const [is_animating, set_is_animating] = useState(false)
  const [display_text, set_display_text] = useState(children)
  const [is_mounted, set_is_mounted] = useState(false)
  const timeout_ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prev_text_ref = useRef(children)

  useEffect(() => {
    set_is_mounted(true)
  }, [])

  useEffect(() => {
    if (children !== prev_text_ref.current && is_mounted) {
      // 文字变化时触发动画
      set_is_animating(true)

      timeout_ref.current = setTimeout(() => {
        set_display_text(children)
        set_is_animating(false)
        prev_text_ref.current = children
      }, duration)

      return () => {
        if (timeout_ref.current) {
          clearTimeout(timeout_ref.current)
        }
      }
    }
  }, [children, duration, is_mounted])

  const get_animation_styles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      transition: `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      transitionDelay: `${delay}ms`,
    }

    if (is_animating) {
      switch (animation) {
        case 'fade':
          return { ...base, opacity: 0 }
        case 'slide_up':
          return { ...base, opacity: 0, transform: 'translateY(8px)' }
        case 'slide_down':
          return { ...base, opacity: 0, transform: 'translateY(-8px)' }
        case 'scale':
          return { ...base, opacity: 0, transform: 'scale(0.9)' }
        case 'blur':
          return { ...base, opacity: 0, filter: 'blur(4px)' }
        case 'typewriter':
          return { ...base, opacity: 0 }
        default:
          return { ...base, opacity: 0 }
      }
    }

    return base
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        ...style,
        ...get_animation_styles(),
      }}
    >
      {display_text}
    </span>
  )
}

/**
 * 快捷组件：带动画的翻译文本
 */
export const Trans: React.FC<{
  t: (key: string) => string
  k: string
  animation?: AnimationType
  duration?: number
}> = ({ t, k, animation = 'fade', duration = 250 }) => (
  <AnimatedTranslation animation={animation} duration={duration}>
    {t(k)}
  </AnimatedTranslation>
)

/**
 * 全页面翻译动画包装器
 * 使用此组件包裹页面内容，语言切换时整个页面会有统一动画
 */
export const TranslationWrapper: React.FC<{
  children: React.ReactNode
  is_changing: boolean
}> = ({ children, is_changing }) => {
  const [show_children, set_show_children] = useState(true)
  const [opacity, set_opacity] = useState(1)

  useEffect(() => {
    if (is_changing) {
      // 开始切换：淡出
      set_opacity(0)
      const timer = setTimeout(() => {
        set_show_children(false)
      }, 200)
      return () => clearTimeout(timer)
    } else {
      // 切换完成：淡入
      set_show_children(true)
      requestAnimationFrame(() => {
        set_opacity(1)
      })
    }
  }, [is_changing])

  return (
    <div
      style={{
        opacity,
        transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {show_children && children}
    </div>
  )
}
