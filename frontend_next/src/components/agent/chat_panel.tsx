/**
 * chat_panel.tsx
 * 作者: wuhao
 * 日期: 2026-04-10
 * 描述: Agent 对话主面板
 */

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/stores/agent.store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";
import { Bot, Image as ImageIcon, Send, Square, Trash2, X, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export function ChatPanel() {
  const {
    messages,
    isStreaming,
    totalTokens,
    completionTokens,
    promptTokens,
    sendMessage,
    abortStream,
    clearMessages,
  } = useAgentStore();

  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && images.length === 0) return;
    if (isStreaming) return;

    const content = input.trim();
    const imageList = [...images];
    setInput("");
    setImages([]);

    await sendMessage(content, imageList);
    inputRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setImages((prev) => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10">
              <Bot className="h-10 w-10 text-blue-500 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">开始对话</h2>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              输入消息与 AI 助手对话, 支持上传图片（Vision 多模态）和调用工具. 试试发送「北京天气怎么样? 」
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {["北京天气怎么样", "帮我翻译 Hello World", "1+1等于多少", "搜索 AI 发展趋势"].map((tip) => (
                <button
                  key={tip}
                  onClick={() => setInput(tip)}
                  className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex mb-4 group ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 relative ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.role === "tool"
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-sm"
                  : "bg-muted"
              }`}
            >
              {msg.role === "tool" && msg.toolName && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-orange-200/50 dark:border-orange-700/30">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">T</div>
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">工具: {msg.toolName}</span>
                  <div className={`ml-auto w-2 h-2 rounded-full ${msg.toolSuccess === false ? "bg-red-400" : "bg-emerald-400"}`} />
                  {msg.toolSuccess === false && <span className="text-xs text-red-500">执行失败</span>}
                </div>
              )}

              {images && (msg.images || []).map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  alt="uploaded"
                  width={512}
                  height={512}
                  unoptimized
                  className="max-w-full rounded-lg mb-2 max-h-48 object-contain"
                />
              ))}

              <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, ref, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match;
                      return !isInline ? (
                        <div className="relative group/code rounded-md overflow-hidden my-4">
                          <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/80 text-slate-400 text-xs border-b border-slate-700/50">
                            <span className="font-mono">{match?.[1] || "code"}</span>
                            <button
                              type="button"
                              title="复制代码"
                              aria-label="复制代码"
                              onClick={() => {
                                navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
                                setCopiedId(`code-${msg.id}-${String(children).substring(0, 10)}`);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
                            >
                              {copiedId === `code-${msg.id}-${String(children).substring(0, 10)}` ? (
                                <><Check className="h-3.5 w-3.5 text-emerald-400" /> 已复制</>
                              ) : (
                                <><Copy className="h-3.5 w-3.5" /> 复制代码</>
                              )}
                            </button>
                          </div>
                          <SyntaxHighlighter
                            {...props}
                            style={vscDarkPlus as any}
                            language={match?.[1] || "text"}
                            PreTag="div"
                            className="!m-0 !rounded-none text-[13px] !bg-slate-900"
                            showLineNumbers={false}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-xs mx-0.5">{children}</code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>

              {msg.role === "assistant" && !isStreaming && msg.content && (
                <button
                  type="button"
                  title="复制内容"
                  aria-label="复制内容"
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className={`absolute -right-10 top-2 p-1.5 rounded-lg border bg-background/50 backdrop-blur-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 ${
                    copiedId === msg.id ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                  }`}
                >
                  {copiedId === msg.id ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start mb-4 px-2">
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
              <span className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">正在思考中...</span>
            </div>
          </div>
        )}

        {(totalTokens > 0 || isStreaming) && (
          <div className="flex items-center gap-3 text-xs px-2 py-1.5 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 mt-2 mx-2">
            {isStreaming && (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">流式响应中</span>
              </span>
            )}
            {!isStreaming && totalTokens > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">输出:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{completionTokens}</span>
                </span>
                <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                <span className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">提示:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{promptTokens}</span>
                </span>
                <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  合计: {totalTokens}
                </span>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </ScrollArea>

      <div className="px-4 py-2 border-t border-border">
        {images.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <Image
                  src={img}
                  alt={`upload-${i}`}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  title="删除图片"
                  aria-label="删除图片"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            id="image-upload"
            aria-label="上传图片"
            title="上传图片"
            onChange={handleImageUpload}
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Button variant="ghost" size="icon" type="button">
              <ImageIcon className="h-5 w-5" />
            </Button>
          </label>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入消息..."
            className="flex-1 min-h-[44px] max-h-32 resize-none rounded-lg border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-tight"
            rows={1}
          />

          {isStreaming ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={abortStream}
              title="中断响应"
            >
              <Square className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() && images.length === 0}
              title="发送消息"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={clearMessages}
            title="清空对话"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

