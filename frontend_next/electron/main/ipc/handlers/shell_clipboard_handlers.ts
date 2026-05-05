/**
 * shell_clipboard_handlers.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: IPC handlers for shell operations, clipboard, and notifications
 */

import { shell, clipboard, nativeImage } from "electron";
import { ipcRegistry } from "../ipc_handler_registry";
import { IPCChannel } from "../ipc_channels";
import log from "electron-log";

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export function registerShellHandlers(): void {
  ipcRegistry.register<string, void>(
    IPCChannel.SHELL_OPEN_EXTERNAL,
    async (event, url) => {
      if (!validateUrl(url)) {
        throw new Error(`Protocol not allowed for URL: ${url}`);
      }

      await shell.openExternal(url);
      log.info(`[Shell] Opened external URL: ${url}`);
    },
    "Open URL in default browser"
  );

  ipcRegistry.register<string, void>(
    IPCChannel.SHELL_SHOW_ITEM_IN_FOLDER,
    async (event, filePath) => {
      await shell.showItemInFolder(filePath);
      log.info(`[Shell] Showed item in folder: ${filePath}`);
    },
    "Reveal file in file explorer"
  );

  ipcRegistry.register<string, void>(
    IPCChannel.SHELL_OPEN_PATH,
    async (event, filePath) => {
      await shell.openPath(filePath);
      log.info(`[Shell] Opened path: ${filePath}`);
    },
    "Open file with associated application"
  );
}

export function registerClipboardHandlers(): void {
  ipcRegistry.register<unknown, string>(
    IPCChannel.CLIPBOARD_READ_TEXT,
    async () => {
      return clipboard.readText();
    },
    "Read text from clipboard"
  );

  ipcRegistry.register<string, void>(
    IPCChannel.CLIPBOARD_WRITE_TEXT,
    async (event, text) => {
      clipboard.writeText(text);
      log.debug("[Clipboard] Text written to clipboard");
    },
    "Write text to clipboard"
  );

  ipcRegistry.register<unknown, string | null>(
    IPCChannel.CLIPBOARD_READ_IMAGE,
    async () => {
      const image = clipboard.readImage();

      if (image.isEmpty()) {
        return null;
      }

      const dataUrl = image.toDataURL();
      return dataUrl;
    },
    "Read image from clipboard as base64"
  );

  ipcRegistry.register<string, void>(
    IPCChannel.CLIPBOARD_WRITE_IMAGE,
    async (event, imageDataUrl) => {
      const image = nativeImage.createFromDataURL(imageDataUrl);
      clipboard.writeImage(image);
      log.debug("[Clipboard] Image written to clipboard");
    },
    "Write image to clipboard"
  );
}

export function registerNotificationHandlers(): void {
  ipcDialogHandler(
    IPCChannel.NOTIFICATION_SHOW,
    { title: string; body?: string; icon?: string },
    async (payload) => {
      if (!Notification.isSupported()) {
        throw new Error("System notifications not supported");
      }

      new Notification({
        title: payload.title,
        body: payload.body || "",
        icon: payload.icon,
        silent: false,
      }).show();

      log.info(`[Notification] Showed: ${payload.title}`);
    }
  );

  ipcDialogHandler(IPCChannel.NOTIFICATION_REQUEST_PERMISSION, {}, async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return true;
  });
}

function ipcDialogHandler<T>(
  channel: IPCChannel,
  defaultValue: T,
  handler: (payload: T) => Promise<void>
): void {
  ipcRegistry.register<T, void>(channel, handler, `Notification operation`);
}
