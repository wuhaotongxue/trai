/**
 * preload.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Preload script exposing secure APIs via contextBridge to renderer process
 */

import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  // IPC Communication
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
      const validChannels = [
        "window:minimize",
        "window:maximize",
        "window:close",
        "window:toggleFullscreen",
        "window:setBounds",
        "app:getVersion",
        "app:getOsInfo",
        "fs:readFile",
        "fs:writeFile",
        "fs:exists",
        "fs:stat",
        "fs:delete",
        "fs:listDir",
        "fs:selectFile",
        "fs:selectFolder",
        "shell:openExternal",
        "shell:showItemInFolder",
        "shell:openPath",
        "clipboard:readText",
        "clipboard:writeText",
        "clipboard:readImage",
        "clipboard:writeImage",
        "notification:show",
        "notification:requestPermission",
        "multimodal:analyzeImage",
        "multimodal:transcribeAudio",
        "multimodal:parsePdf",
        "multimodal:extractVideoThumbnail",
        "multimodal:getVideoMetadata",
        "updater:checkForUpdates",
        "updater:downloadUpdate",
        "updater:quitAndInstall",
        "settings:get",
        "settings:set",
        "auth:storeToken",
        "auth:getToken",
        "auth:clearToken",
        "db:execute",
        "db:query",
      ];

      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }

      console.warn(`[Preload] Blocked IPC channel: ${channel}`);
      return Promise.reject(new Error(`Channel ${channel} is not allowed`));
    },

    on: (
      channel: string,
      callback: (...args: unknown[]) => void
    ): (() => void) => {
      const validChannels = [
        "_window:stateChanged",
        "_fs:watch",
        "_fs:unwatch",
        "_clipboard:changed",
        "_updater:updateAvailable",
        "_updater:downloadProgress",
        "_updater:updateDownloaded",
        "_updater:error",
        "_settings:changed",
      ];

      if (!validChannels.includes(channel)) {
        console.warn(`[Preload] Blocked listener channel: ${channel}`);
        return () => {};
      }

      const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
        callback(...args);

      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
  },

  // Platform Information
  platform: {
    getOSInfo: (): Promise<{ platform: string; arch: string; version: string }> =>
      ipcRenderer.invoke("app:getOsInfo") as Promise<{
        platform: string;
        arch: string;
        version: string;
      }>,

    getAppVersion: (): Promise<string> =>
      ipcRenderer.invoke("app:getVersion") as Promise<string>,

    getAppPath: (name?: string): Promise<string> =>
      ipcRenderer.invoke("app:getAppPath", name) as Promise<string>,
  },

  // File System Operations
  fs: {
    readFile: (filePath: string): Promise<string> =>
      ipcRenderer.invoke("fs:readFile", filePath) as Promise<string>,

    writeFile: (filePath: string, content: string): Promise<void> =>
      ipcRenderer.invoke("fs:writeFile", { path: filePath, content }) as Promise<void>,

    exists: (filePath: string): Promise<boolean> =>
      ipcRenderer.invoke("fs:exists", filePath) as Promise<boolean>,

    stat: (filePath: string): Promise<{ size: number; mtime: number }> =>
      ipcRenderer.invoke("fs:stat", filePath) as Promise<{ size: number; mtime: number }>,

    selectFile: (): Promise<string | null> =>
      ipcRenderer.invoke("fs:selectFile") as Promise<string | null>,

    selectFolder: (): Promise<string | null> =>
      ipcRenderer.invoke("fs:selectFolder") as Promise<string | null>,
  },

  // Shell Operations
  shell: {
    openExternal: (url: string): Promise<void> =>
      ipcRenderer.invoke("shell:openExternal", url) as Promise<void>,

    showItemInFolder: (path: string): Promise<void> =>
      ipcRenderer.invoke("shell:showItemInFolder", path) as Promise<void>,
  },

  // Clipboard Operations
  clipboard: {
    readText: (): Promise<string> =>
      ipcRenderer.invoke("clipboard:readText") as Promise<string>,

    writeText: (text: string): Promise<void> =>
      ipcRenderer.invoke("clipboard:writeText", text) as Promise<void>,

    readImage: (): Promise<string | null> =>
      ipcRenderer.invoke("clipboard:readImage") as Promise<string | null>,

    writeImage: (imageDataUrl: string): Promise<void> =>
      ipcRenderer.invoke("clipboard:writeImage", imageDataUrl) as Promise<void>,
  },

  // Notification System
  notification: {
    show: (options: {
      title: string;
      body: string;
      icon?: string;
    }): Promise<void> =>
      ipcRenderer.invoke("notification:show", options) as Promise<void>,
  },

  // Auto Updater
  updater: {
    checkForUpdates: (): Promise<{ hasUpdate: boolean; version: string }> =>
      ipcRenderer.invoke(
        "updater:checkForUpdates"
      ) as Promise<{ hasUpdate: boolean; version: string }>,

    downloadUpdate: (): Promise<void> =>
      ipcRenderer.invoke("updater:downloadUpdate") as Promise<void>,

    quitAndInstall: (): Promise<void> =>
      ipcRenderer.invoke("updater:quitAndInstall") as Promise<void>,

    onUpdateAvailable: (
      callback: (info: {
        version: string;
        releaseDate: string;
      }) => void
    ): (() => void) => {
      const wrapper = (_event: Electron.IpcRendererEvent, info: unknown) =>
        callback(info as { version: string; releaseDate: string });
      ipcRenderer.on("_updater:updateAvailable", wrapper);
      return () => ipcRenderer.removeListener("_updater:updateAvailable", wrapper);
    },

    onDownloadProgress: (
      callback: (progress: {
        percent: number;
        bytesPerSecond: number;
        transferred: number;
        total: number;
      }) => void
    ): (() => void) => {
      const wrapper = (_event: Electron.IpcRendererEvent, progress: unknown) =>
        callback(progress as {
          percent: number;
          bytesPerSecond: number;
          transferred: number;
          total: number;
        });
      ipcRenderer.on("_updater:downloadProgress", wrapper);
      return () => ipcRenderer.removeListener("_updater:downloadProgress", wrapper);
    },
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;
