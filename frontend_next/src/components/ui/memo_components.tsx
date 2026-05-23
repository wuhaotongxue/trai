/* eslint-disable */
/**
 * memo_components.tsx
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Memoized components for performance optimization
 */

"use client";

import { memo, type ReactNode } from "react";

interface MemoMessageBubbleProps {
  content: string;
  role: "user" | "assistant" | "tool";
  timestamp?: string;
  isStreaming?: boolean;
}

export const MemoMessageBubble = memo(function MemoMessageBubble({
  content,
  role,
  timestamp,
  isStreaming,
}: MemoMessageBubbleProps) {
  return (
    <div className={`message-bubble message-${role} ${isStreaming ? "streaming" : ""}`}>
      <div className="message-content">{content}</div>
      {timestamp && (
        <time className="message-timestamp" dateTime={timestamp}>
          {new Date(timestamp).toLocaleTimeString()}
        </time>
      )}
    </div>
  );
});

interface MemoImagePreviewProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  onClick?: () => void;
}

export const MemoImagePreview = memo(function MemoImagePreview({
  src,
  alt,
  width = 200,
  height = 150,
  onClick,
}: MemoImagePreviewProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    />
  );
});

interface MemoCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export const MemoCodeBlock = memo(function MemoCodeBlock({
  code,
  language = "text",
  filename,
}: MemoCodeBlockProps) {
  return (
    <div className="code-block-wrapper">
      {filename && (
        <div className="code-block-header">
          <span className="code-block-filename">{filename}</span>
          <span className="code-block-language">{language}</span>
        </div>
      )}
      <pre className={`language-${language}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
});

interface MemoToolCallProps {
  toolName: string;
  args: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "error";
  result?: unknown;
}

export const MemoToolCall = memo(function MemoToolCall({
  toolName,
  args,
  status,
  result,
}: MemoToolCallProps) {
  const statusColors = {
    pending: "bg-amber-500",
    running: "bg-blue-500 animate-pulse",
    completed: "bg-emerald-500",
    error: "bg-red-500",
  };

  return (
    <div className="tool-call-container">
      <div className="tool-call-header">
        <span className="tool-icon">T</span>
        <span className="tool-name">{toolName}</span>
        <span className={`status-indicator ${statusColors[status]}`} />
      </div>

      {(status === "pending" || status === "running") && (
        <div className="tool-args">
          <pre>{JSON.stringify(args, null, 2)}</pre>
        </div>
      )}

      {status === "completed" && result != null && (() => {
        const resultStr = JSON.stringify(result as Record<string, unknown>, null, 2);
        return (
          <div className="tool-result">
            <pre>{resultStr}</pre>
          </div>
        );
      })()}

      {status === "error" && (
        <div className="tool-error">Tool execution failed</div>
      )}
    </div>
  );
});

interface MemoLoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const MemoLoadingSpinner = memo(function MemoLoadingSpinner({
  size = "md",
  text,
}: MemoLoadingSpinnerProps) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="loading-spinner flex items-center gap-3 justify-center py-4">
      <div className={`${sizes[size]} rounded-full border-2 border-muted border-t-primary animate-spin`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
});
