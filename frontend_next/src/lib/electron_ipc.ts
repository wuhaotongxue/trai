/**
 * electron_ipc.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: IPC communication service for Electron desktop client
 */

interface IPCChannel {
  domain: string;
  action: string;
}

type IPCResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

class ElectronIPCService {
  private isElectron: boolean;

  constructor() {
    this.isElectron = typeof window !== "undefined" && window.process?.versions?.electron !== undefined;
  }

  private buildChannel(channel: IPCChannel): string {
    return `${channel.domain}:${channel.action}`;
  }

  async invoke<T = unknown>(channel: IPCChannel, ...args: unknown[]): Promise<IPCResponse<T>> {
    if (!this.isElectron) {
      console.warn("[ElectronIPC] Not running in Electron environment");
      return { success: false, error: "Not in Electron environment" };
    }

    try {
      const channelName = this.buildChannel(channel);

      if (window.electronAPI?.ipcRenderer?.invoke) {
        const result = await window.electronAPI.ipcRenderer.invoke(channelName, ...args);
        return result as IPCResponse<T>;
      }

      return { success: false, error: "IPC not available" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "IPC invoke failed";
      console.error(`[ElectronIPC] Error on ${this.buildChannel(channel)}:`, error);
      return { success: false, error: errorMessage };
    }
  }

  on(channel: IPCChannel, callback: (...args: unknown[]) => void): () => void {
    if (!this.isElectron || !window.electronAPI?.ipcRenderer?.on) {
      return () => {};
    }

    const channelName = this.buildChannel(channel);
    const unsubscribe = window.electronAPI.ipcRenderer.on(channelName, callback);
    return unsubscribe;
  }
}

export const ipcService = new ElectronIPCService();

export interface ElectronAPI {
  ipcRenderer?: {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  };

  platform?: {
    getOSInfo: () => Promise<{ platform: string; arch: string; version: string }>;
    getAppVersion: () => Promise<string>;
    getAppPath: (name?: string) => Promise<string>;
  };

  fs?: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    stat: (path: string) => Promise<{ size: number; mtime: number }>;
  };

  shell?: {
    openExternal: (url: string) => Promise<void>;
    showItemInFolder: (path: string) => Promise<void>;
  };

  notification?: {
    show: (options: { title: string; body: string; icon?: string }) => Promise<void>;
  };

  clipboard?: {
    readText: () => Promise<string>;
    writeText: (text: string) => Promise<void>;
    readImage: () => Promise<string | null>;
    writeImage: (imageData: string) => Promise<void>;
  };

  updater?: {
    checkForUpdates: () => Promise<{ hasUpdate: boolean; version: string }>;
    downloadUpdate: () => Promise<void>;
    quitAndInstall: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export default ipcService;
