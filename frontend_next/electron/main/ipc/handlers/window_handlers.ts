/**
 * window_handlers.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: IPC handlers for window management operations
 */

import { BrowserWindow, screen } from "electron";
import { ipcRegistry } from "./ipc_handler_registry";
import { IPCChannel } from "./ipc_channels";

interface WindowBounds {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function registerWindowHandlers(): void {
  ipcRegistry.register(
    IPCChannel.WINDOW_MINIMIZE,
    async () => {
      const win = ipcRegistry.getMainWindow();
      if (win && !win.isDestroyed()) {
        win.minimize();
        return true;
      }
      return false;
    },
    "Minimize main window"
  );

  ipcRegistry.register(
    IPCChannel.WINDOW_MAXIMIZE,
    async () => {
      const win = ipcRegistry.getMainWindow();
      if (win && !win.isDestroyed()) {
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
        return win.isMaximized();
      }
      return false;
    },
    "Toggle maximize/restore"
  );

  ipcRegistry.register(
    IPCChannel.WINDOW_CLOSE,
    async () => {
      const win = ipcRegistry.getMainWindow();
      if (win && !win.isDestroyed()) {
        win.close();
        return true;
      }
      return false;
    },
    "Close main window"
  );

  ipcRegistry.register(
    IPCChannel.WINDOW_TOGGLE_FULLSCREEN,
    async () => {
      const win = ipcRegistry.getMainWindow();
      if (win && !win.isDestroyed()) {
        win.setFullScreen(!win.isFullScreen());
        return win.isFullScreen();
      }
      return false;
    },
    "Toggle fullscreen mode"
  );

  ipcRegistry.register<WindowBounds, boolean>(
    IPCChannel.WINDOW_SET_BOUNDS,
    async (event, bounds) => {
      const win = ipcRegistry.getMainWindow();
      if (win && !win.isDestroyed()) {
        const currentBounds = win.getBounds();

        win.setBounds({
          x: bounds.x ?? currentBounds.x,
          y: bounds.y ?? currentBounds.y,
          width: bounds.width ?? currentBounds.width,
          height: bounds.height ?? currentBounds.height,
        });

        return true;
      }
      return false;
    },
    "Set window position and size"
  );
}
