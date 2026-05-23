/* eslint-disable */
/**
 * use_electron_window.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Custom hook for Electron window management and native OS features
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { ElectronAPI } from "@/lib/electron_ipc";

interface WindowState {
  isMaximized: boolean;
  isFullscreen: boolean;
  isFocused: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  appVersion: string;
  isElectron: boolean;
}

export function useElectronWindow() {
  const [windowState, setWindowState] = useState<WindowState>({
    isMaximized: false,
    isFullscreen: false,
    isFocused: true,
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  });

  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    platform: "",
    arch: "",
    version: "",
    appVersion: "",
    isElectron: false,
  });

  useEffect(() => {
    const checkElectronEnvironment = async () => {
      const isElectron =
        typeof window !== "undefined" &&
        window.process?.versions?.electron !== undefined;

      if (isElectron && window.electronAPI) {
        try {
          const osInfo = await window.electronAPI.platform?.getOSInfo();
          const appVersion = await window.electronAPI.platform?.getAppVersion();

          setSystemInfo({
            platform: osInfo?.platform || "unknown",
            arch: osInfo?.arch || "unknown",
            version: osInfo?.version || "unknown",
            appVersion: appVersion || "unknown",
            isElectron: true,
          });
        } catch (error) {
          console.error("[useElectronWindow] Failed to get system info:", error);
          setSystemInfo((prev) => ({ ...prev, isElectron: true }));
        }
      }
    };

    checkElectronEnvironment();
  }, []);

  const minimize = useCallback(() => {
    if (!window.electronAPI) return;

    console.log("[useElectronWindow] Minimize requested");
  }, []);

  const maximize = useCallback(() => {
    if (!window.electronAPI) return;

    setWindowState((prev) => ({
      ...prev,
      isMaximized: !prev.isMaximized,
    }));
  }, []);

  const close = useCallback(() => {
    if (!window.electronAPI) return;

    console.log("[useElectronWindow] Close requested");
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!window.electronAPI) return;

    setWindowState((prev) => ({
      ...prev,
      isFullscreen: !prev.isFullscreen,
    }));
  }, []);

  const openExternalLink = useCallback(async (url: string) => {
    if (!window.electronAPI?.shell) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      await window.electronAPI.shell.openExternal(url);
    } catch (error) {
      console.error("[useElectronWindow] Failed to open external link:", error);
    }
  }, []);

  const showNotification = useCallback(
    async (title: string, body: string, icon?: string) => {
      if (!window.electronAPI?.notification) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon });
        }
        return;
      }

      try {
        await window.electronAPI.notification.show({ title, body, icon });
      } catch (error) {
        console.error("[useElectronWindow] Failed to show notification:", error);
      }
    },
    []
  );

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    if (window.electronAPI?.clipboard) {
      try {
        await window.electronAPI.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.error("[useElectronWindow] Failed to copy to clipboard:", error);
        return false;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error("[useElectronWindow] Fallback copy failed:", error);
      return false;
    }
  }, []);

  const readFromClipboard = useCallback(async (): Promise<string | null> => {
    if (window.electronAPI?.clipboard) {
      try {
        return await window.electronAPI.clipboard.readText();
      } catch (error) {
        console.error("[useElectronWindow] Failed to read from clipboard:", error);
        return null;
      }
    }

    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      console.error("[useElectronWindow] Fallback read failed:", error);
      return null;
    }
  }, []);

  return {
    windowState,
    systemInfo,
    minimize,
    maximize,
    close,
    toggleFullscreen,
    openExternalLink,
    showNotification,
    copyToClipboard,
    readFromClipboard,
    isElectron: systemInfo.isElectron,
  };
}
