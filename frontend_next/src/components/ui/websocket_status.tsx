 
/**
 * websocket_status.tsx
 * Author: wuhao
 * Date: 2026-05-04
 * Description: WebSocket connection status indicator component
 */

"use client";

import { useWebSocket } from "@/hooks/use_websocket";
import { Wifi, WifiOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebSocketStatusProps {
  onMessage?: (message: { type: string; data: Record<string, unknown>; timestamp: string }) => void;
  showButton?: boolean;
  className?: string;
}

export function WebSocketStatusIndicator({
  onMessage,
  showButton = true,
  className = "",
}: WebSocketStatusProps) {
  const { status, connect, disconnect, isConnected, sendMessage } = useWebSocket({
    autoConnect: true,
    reconnectAttempts: 10,
    onMessage,
  });

  const statusConfig = {
    connecting: {
      icon: Loader2,
      color: "text-amber-500",
      bgClass: "bg-amber-500/10 border-amber-500/20",
      label: "Connecting...",
      animate: "animate-spin",
    },
    connected: {
      icon: Wifi,
      color: "text-emerald-500",
      bgClass: "bg-emerald-500/10 border-emerald-500/20",
      label: "Connected",
      animate: "",
    },
    disconnected: {
      icon: WifiOff,
      color: "text-slate-400",
      bgClass: "bg-slate-500/10 border-slate-500/20",
      label: "Disconnected",
      animate: "",
    },
    error: {
      icon: WifiOff,
      color: "text-red-500",
      bgClass: "bg-red-500/10 border-red-500/20",
      label: "Error",
      animate: "",
    },
    reconnecting: {
      icon: RefreshCw,
      color: "text-amber-500",
      bgClass: "bg-amber-500/10 border-amber-500/20",
      label: "Reconnecting...",
      animate: "animate-spin",
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${config.bgClass} ${config.color} ${className}`}
      role="status"
      aria-label={`WebSocket ${config.label}`}
    >
      <IconComponent className={`h-3.5 w-3.5 ${config.animate}`} />
      <span>{config.label}</span>

      {showButton && (status === "disconnected" || status === "error") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={connect}
          className="h-5 px-2 text-xs ml-1 hover:bg-white/10"
          aria-label="Reconnect WebSocket"
        >
          Reconnect
        </Button>
      )}

      {showButton && isConnected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnect}
          className="h-5 px-2 text-xs ml-1 hover:bg-white/10"
          aria-label="Disconnect WebSocket"
        >
          Disconnect
        </Button>
      )}
    </div>
  );
}

export type { UseWebSocketOptions, WebSocketStatus } from "@/hooks/use_websocket";
