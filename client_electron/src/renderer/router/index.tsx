/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 前端路由配置文件
 */
import React from 'react'
import { createHashRouter, Navigate } from 'react-router-dom'
import MainLayout from '@/components/layout/main_layout'
import Login from '@/pages/login'
import Register from '@/pages/register'
import Dashboard from '@/pages/dashboard'
import Settings from '@/pages/settings'
import Tools from '@/pages/tools'
import AgentChat from '@/pages/chat'
import TextToImage from '@/pages/ai/text_to_image'
import ImageToImage from '@/pages/ai/image_to_image'
import AiMusic from '@/pages/ai/music'
import AiVideo from '@/pages/ai/video'
import ComfyUI from '@/pages/ai/comfyui'
import AgentManagement from '@/pages/agent/management'
import Feedback from '@/pages/feedback'
import KnowledgeBasePage from '@/pages/knowledge_base'
import UnderDevelopment from '@/pages/under_development'
import { use_auth_store } from '@/store/auth'

/**
 * 需要认证的路由守卫
 * @param children 子组件
 */
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const is_authenticated = use_auth_store((state) => state.is_authenticated)
  return is_authenticated ? <>{children}</> : <Navigate to="/login" replace />
}

/**
 * 路由配置
 */
export const router = createHashRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/',
    element: (
      <AuthRoute>
        <MainLayout />
      </AuthRoute>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to="/knowledge_base" replace />
      },
      {
        path: '/dashboard',
        element: <Dashboard />
      },
      {
        path: '/knowledge_base',
        element: <KnowledgeBasePage />
      },
      {
        path: '/chat',
        element: <AgentChat />
      },
      {
        path: '/ai/text_to_image',
        element: <TextToImage />
      },
      {
        path: '/ai/image_to_image',
        element: <ImageToImage />
      },
      {
        path: '/ai/music',
        element: <AiMusic />
      },
      {
        path: '/ai/video',
        element: <AiVideo />
      },
      {
        path: '/ai/report',
        element: <UnderDevelopment />
      },
      {
        path: '/ai/comfyui',
        element: <ComfyUI />
      },
      {
        path: '/agent/management',
        element: <AgentManagement />
      },
      {
        path: '/knowledge_base',
        element: <KnowledgeBasePage />
      },
      {
        path: '/tools',
        element: <Tools />
      },
      {
        path: '/feedback',
        element: <Feedback />
      },
      {
        path: '/settings',
        element: <Settings />
      }
    ]
  }
])
