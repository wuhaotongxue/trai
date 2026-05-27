 
/**
 * 文件名: components/agent/electron_chat_panel.tsx
 * 作者: wuhao
 * 日期: 2026-05-04 22:00:00
 * 描述: Electron桌面客户端聊天面板, 支持多模态和原生功能
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Square,
  Image as ImageIcon,
  Mic,
  MicOff,
  Paperclip,
  Settings,
  Maximize2,
  Minimize2,
  X,
  Bot,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ElectronMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  images?: string[];
  toolName?: string;
  toolSuccess?: boolean;
}

interface ElectronChatPanelProps {
  sessionId: string;
  onMessageSend?: (message: string, attachments?: File[]) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  className?: string;
  compactMode?: boolean;
}

export function ElectronChatPanel({
  sessionId,
  onMessageSend,
  onStreamStart,
  onStreamEnd,
  className = "",
  compactMode = false,
}: ElectronChatPanelProps) {
  const [messages, setMessages] = useState<ElectronMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() && attachments.length === 0) return;
    if (isStreaming) return;

    const userMessage: ElectronMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setError(null);

    try {
      setIsStreaming(true);
      onStreamStart?.();

      await onMessageSend?.(input, attachments);

      const assistantMessage: ElectronMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      console.error("[ElectronChat] Send error:", err);
    }
  }, [input, attachments, isStreaming, onMessageSend, onStreamStart]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`electron-chat-panel flex flex-col h-full bg-background ${className}`}
      role="main"
      aria-label="AI Chat Interface"
    >
      {/* Header */}
      <header className="drag-region flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3 no-drag-region">
          <Bot className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">TRAI Assistant</h1>
          <span className="px-2 py-0.5 rounded-none bg-primary/10 text-primary text-xs font-medium">
            Online
          </span>
        </div>

        <div className="flex items-center gap-2 no-drag-region">
          <button
            type="button"
            onClick={() => {}}
            className="p-2 hover:bg-muted rounded-none transition-colors"
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-none bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-600 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            role="article"
            aria-label={`${message.role} message`}
          >
            {/* Avatar */}
            {message.role !== "user" && (
              <div className="shrink-0 w-8 h-8 rounded-none bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}

            {/* Message Content */}
            <div
              className={`max-w-[80%] rounded-none px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.role === "tool" && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Tool: {message.toolName}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-none ${
                      message.toolSuccess ? "bg-cyan-500" : "bg-red-500"
                    }`}
                  />
                </div>
              )}

              {message.images && message.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {message.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Attachment ${i + 1}`}
                      className="rounded-none max-w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}

              {message.content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      code({ node, className: codeClassName, children, ...props }) {
                        const match = /language-(\w+)/.exec(codeClassName || "");
                        const language = match?.[1] || "text";

                        if (!match) {
                          return (
                            <code className="px-1.5 py-0.5 rounded bg-black/10 text-sm" {...props}>
                              {children}
                            </code>
                          );
                        }

                        return (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={language}
                            PreTag="div"
                            customStyle={{}}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              )}
            </div>

            {/* User Avatar */}
            {message.role === "user" && (
              <div className="shrink-0 w-8 h-8 rounded-none bg-cyan-500/10 flex items-center justify-center">
                <User className="h-4 w-4 text-cyan-500" />
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-background border text-xs"
              >
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-card p-4">
        <div className="flex items-end gap-3">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-muted rounded-none transition-colors shrink-0"
            aria-label="Attach files"
            title="Attach files"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
          />

          {/* Text Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            className="flex-1 min-h-[44px] max-h-32 resize-none rounded-none border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-tight"
            rows={1}
            aria-label="Message input"
          />

          {/* Voice Recording Button */}
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2 rounded-none transition-colors shrink-0 ${
              isRecording ? "bg-red-500 text-white" : "hover:bg-muted"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start voice recording"}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5 animate-pulse" />
            ) : (
              <Mic className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {/* Send/Stop Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={() => {
                setIsStreaming(false);
                onStreamEnd?.();
              }}
              className="p-2.5 rounded-none bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
              aria-label="Stop generation"
              title="Stop response"
            >
              <Square className="h-5 w-5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() && attachments.length === 0}
              className="p-2.5 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              aria-label="Send message"
              title="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
