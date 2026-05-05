/**
 * ipc_handler_registry.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Centralized IPC handler registration and management system
 */

import { BrowserWindow, ipcMain, WebContents } from "electron";
import { IPCChannel, IPCRequest, IPCResponse } from "./ipc_channels";
import log from "electron-log";

type IPCHandler<T = unknown, R = unknown> = (
  event: Electron.IpcMainInvokeEvent,
  payload: T
) => Promise<R>;

interface HandlerRegistration {
  channel: IPCChannel;
  handler: IPCHandler;
  description: string;
}

class IPCHandlerRegistry {
  private handlers: Map<IPCChannel, HandlerRegistration> = new Map();
  private mainWindow: BrowserWindow | null = null;

  register<T = unknown, R = unknown>(
    channel: IPCChannel,
    handler: IPCHandler<T, R>,
    description = ""
  ): void {
    if (this.handlers.has(channel)) {
      log.warn(`[IPC] Channel ${channel} already registered, overwriting`);
      this.unregister(channel);
    }

    const wrappedHandler: IPCHandler<T, R> = async (event, payload) => {
      const startTime = Date.now();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      try {
        log.info(`[IPC] [${requestId}] ${channel} -> START`);

        if (!this.validateSender(event.sender)) {
          throw new Error("Unauthorized sender");
        }

        const result = await handler(event, payload);

        const duration = Date.now() - startTime;
        log.info(
          `[IPC] [${requestId}] ${channel} -> SUCCESS (${duration}ms)`
        );

        return result as R;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const duration = Date.now() - startTime;

        log.error(
          `[IPC] [${requestId}] ${channel} -> ERROR (${duration}ms): ${errorMessage}`
        );

        throw error;
      }
    };

    ipcMain.handle(channel, wrappedHandler);
    this.handlers.set(channel, { channel, handler: wrappedHandler, description });

    log.info(`[IPC] Registered: ${channel} - ${description}`);
  }

  unregister(channel: IPCChannel): boolean {
    const existed = this.handlers.has(channel);
    if (existed) {
      ipcMain.removeHandler(channel);
      this.handlers.delete(channel);
      log.info(`[IPC] Unregistered: ${channel}`);
    }
    return existed;
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  sendToRenderer(channel: string, data?: unknown): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      log.warn(`[IPC] Cannot send to renderer: main window not available`);
      return;
    }

    try {
      this.mainWindow.webContents.send(channel, data);
      log.debug(`[IPC] Sent to renderer: ${channel}`);
    } catch (error) {
      log.error(`[IPC] Failed to send to renderer: ${channel}`, error);
    }
  }

  getAllRegisteredChannels(): IPCChannel[] {
    return Array.from(this.handlers.keys());
  }

  private validateSender(sender: WebContents): boolean {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return false;
    }

    return sender.id === this.mainWindow.webContents.id;
  }

  cleanup(): void {
    for (const channel of this.handlers.keys()) {
      this.unregister(channel);
    }
    this.handlers.clear();
    log.info("[IPC] All handlers cleaned up");
  }
}

export const ipcRegistry = new IPCHandlerRegistry();
export default ipcRegistry;
