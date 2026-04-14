/**
 * use_toast.ts
 * Toast 通知 Hook（情感化中文文案规范）
 * "Loading..." -> "正在为您极速构建中..."
 * "Saved" -> "刚刚保存, 已同步至云端"
 */

import { useState, useCallback } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  title?: string;
}

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (opts: {
      title?: string;
      message: string;
      variant?: ToastVariant;
      duration?: number;
    }) => {
      const id = `toast-${++toastIdCounter}`;
      const newToast: Toast = {
        id,
        title: opts.title,
        message: opts.message,
        variant: opts.variant || "info",
      };
      setToasts((prev) => [...prev, newToast]);

      const duration = opts.duration ?? 3500;
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

export const toastMessages = {
  saved: "刚刚保存, 已同步至云端",
  created: "创建成功, 资源已就绪",
  updated: "更新完成, 数据已刷新",
  deleted: "删除成功, 资源已移除",
  sent: "发送成功, 对方已收到",
  loginSuccess: "登录成功, 欢迎回来",
  logoutSuccess: "已退出登录, 期待再会",

  saveFailed: "保存失败, 请检查网络后重试 (Error 500)",
  createFailed: "创建失败, 请稍后重试",
  deleteFailed: "删除失败, 该资源可能已被删除",
  networkError: "网络连接出现波动, 请检查网络后重试",
  authFailed: "身份验证失败, 请重新登录",
  serverError: "服务器开小差了, 稍后会自动恢复",
  uploadFailed: "上传失败, 文件可能过大或格式不支持",

  quotaWarning: "配额已使用超过 80%, 建议尽快升级套餐",
  unsavedChanges: "当前有未保存的修改, 确定要离开吗",
  deleteConfirm: "此操作不可撤销, 确定要继续吗",

  loading: "正在为您极速处理中...",
  refreshing: "正在刷新最新数据...",
  syncing: "正在同步中, 请稍候...",
  processing: "正在处理中, 预计还需要一些时间...",
};

