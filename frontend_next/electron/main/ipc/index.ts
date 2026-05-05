/**
 * index.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Main entry point for IPC handlers - registers all channels
 */

import { registerWindowHandlers } from "./handlers/window_handlers";
import { registerFilesystemHandlers } from "./handlers/filesystem_handlers";
import {
  registerShellHandlers,
  registerClipboardHandlers,
  registerNotificationHandlers,
} from "./handlers/shell_clipboard_handlers";
import { registerMultimodalHandlers } from "./handlers/multimodal_handlers";

export function registerAllIPCHandlers(): void {
  log.info("[IPC] Registering all IPC handlers...");

  registerWindowHandlers();
  registerFilesystemHandlers();
  registerShellHandlers();
  registerClipboardHandlers();
  registerNotificationHandlers();
  registerMultimodalHandlers();

  log.info("[IPC] All IPC handlers registered successfully");
}

export { ipcRegistry } from "./ipc_handler_registry";
export { IPCChannel, IPCRequest, IPCResponse } from "./ipc_channels";
