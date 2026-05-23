/* eslint-disable */
/**
 * 文件名: hooks/use_websocket.ts
 * 作者: wuhao
 * 日期: 2026-05-04 20:30:00
 * 描述: WebSocket客户端Hook, 实现实时消息推送和自动重连
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Cookies from "js-cookie";

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error" | "reconnecting";

interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  message_id?: string;
}

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onMessage,
    onStatusChange,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const getWebSocketUrl = useCallback(() => {
    if (url) return url;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;

    return `${protocol}//${host}/api_trai/v1/ws/chat`;
  }, [url]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("reconnecting");
    onStatusChange?.("reconnecting");

    try {
      const token = Cookies.get("token");
      const wsUrl = `${getWebSocketUrl()}?token=${token || ""}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setStatus("connected");
        onStatusChange?.("connected");
        reconnectCountRef.current = 0;
        console.log("[WebSocket] Connected");
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setStatus("error");
        onStatusChange?.("error");
        console.error("[WebSocket] Error occurred");
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;

        setStatus("disconnected");
        onStatusChange?.("disconnected");

        console.log(`[WebSocket] Disconnected. Code: ${event.code}, Reason: ${event.reason}`);

        if (
          event.code !== 1000 &&
          reconnectCountRef.current < reconnectAttempts
        ) {
          reconnectCountRef.current++;
          console.log(
            `[WebSocket] Reconnecting... Attempt ${reconnectCountRef.current}/${reconnectAttempts}`
          );

          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("[WebSocket] Connection failed:", error);
      setStatus("error");
      onStatusChange?.("error");
    }
  }, [getWebSocketUrl, reconnectAttempts, reconnectInterval, onMessage, onStatusChange]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }

    setStatus("disconnected");
    onStatusChange?.("disconnected");
  }, [onStatusChange]);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload: WebSocketMessage = {
        type: message.type as string || "message",
        data: message,
        timestamp: new Date().toISOString(),
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      wsRef.current.send(JSON.stringify(payload));
      return true;
    }

    console.warn("[WebSocket] Cannot send message, not connected");
    return false;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    isConnected: status === "connected",
  };
}
