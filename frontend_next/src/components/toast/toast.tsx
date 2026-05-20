/**
 * toast.tsx
 * Toast 通知组件
 * 情感化中文文案, 轻微 Y 轴入场动画
 */

"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ToastVariant } from "./use_toast";

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  onDismiss: () => void;
}

const variantConfig: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2;
    bg: string;
    border: string;
    iconColor: string;
    titleColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bg: "bg-card",
    border: "border-l-4 border-l-emerald-500",
    iconColor: "text-emerald-500",
    titleColor: "text-foreground",
  },
  error: {
    icon: XCircle,
    bg: "bg-card",
    border: "border-l-4 border-l-red-500",
    iconColor: "text-red-500",
    titleColor: "text-foreground",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-card",
    border: "border-l-4 border-l-amber-500",
    iconColor: "text-amber-500",
    titleColor: "text-foreground",
  },
  info: {
    icon: Info,
    bg: "bg-card",
    border: "border-l-4 border-l-blue-500",
    iconColor: "text-blue-500",
    titleColor: "text-foreground",
  },
};

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const config = variantConfig[toast.variant];
  const Icon = config.icon;
  const ariaLive = toast.variant === "error" ? "assertive" : "polite";

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const content = (
    <div
      role="alert"
      className={`
        flex items-start gap-3 p-4 rounded-xl shadow-lg
        border border-border
        ${config.bg} ${config.border}
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        max-w-sm w-full
      `}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`text-sm font-semibold ${config.titleColor}`}>{toast.title}</p>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="关闭通知"
        className="flex-shrink-0 p-1 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  return ariaLive === "assertive" ? (
    <div aria-live="assertive">{content}</div>
  ) : (
    <div aria-live="polite">{content}</div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="通知列表"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-h-[calc(100vh-48px)] overflow-y-auto"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto animate-slide-up">
          <ToastItem toast={t} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}

// 全局 Toast 状态管理器(跨组件共享)
let globalSetToasts: React.Dispatch<React.SetStateAction<ToastItem[]>> | null = null;

export function registerToastState(
  setter: React.Dispatch<React.SetStateAction<ToastItem[]>>
) {
  globalSetToasts = setter;
}

export function globalToast(opts: {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}) {
  if (!globalSetToasts) return;
  const id = `toast-${Date.now()}`;
  globalSetToasts((prev) => [...prev, { ...opts, variant: opts.variant || 'info', id, onDismiss: () => globalSetToasts!((p) => p.filter((t) => t.id !== id)) }]);
  setTimeout(() => {
    globalSetToasts!((p) => p.filter((t) => t.id !== id));
  }, opts.duration ?? 3500);
}
