/**
 * filesystem_handlers.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: IPC handlers for file system operations with security validation
 */

import { dialog, fs } from "electron";
import path from "path";
import { ipcRegistry } from "../ipc_handler_registry";
import { IPCChannel } from "../ipc_channels";
import log from "electron-log";

const ALLOWED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".mp4",
  ".webm",
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".json",
  ".csv",
];

function validateFilePath(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

function sanitizePath(inputPath: string): string {
  const normalized = path.normalize(inputPath);

  if (normalized.includes("..")) {
    throw new Error("Path traversal detected");
  }

  return normalized;
}

export function registerFilesystemHandlers(): void {
  ipcRegistry.register<string, string>(
    IPCChannel.FS_READ_FILE,
    async (event, filePath) => {
      const safePath = sanitizePath(filePath);

      if (!validateFilePath(safePath)) {
        throw new Error(`File type not allowed: ${path.extname(safePath)}`);
      }

      try {
        const content = await fs.promises.readFile(safePath, "utf-8");
        return content;
      } catch (error) {
        throw new Error(`Failed to read file: ${safePath}`);
      }
    },
    "Read text file content"
  );

  ipcRegistry.register<{ path: string; content: string }, void>(
    IPCChannel.FS_WRITE_FILE,
    async (event, { path: filePath, content }) => {
      const safePath = sanitizePath(filePath);

      if (!validateFilePath(safePath)) {
        throw new Error(`File type not allowed: ${path.extname(safePath)}`);
      }

      await fs.promises.writeFile(safePath, content, "utf-8");
      log.info(`[FS] File written: ${safePath}`);
    },
    "Write content to file"
  );

  ipcRegistry.register<string, boolean>(
    IPCChannel.FS_EXISTS,
    async (event, filePath) => {
      const safePath = sanitizePath(filePath);
      return await fs.promises.access(safePath).then(
        () => true,
        () => false
      );
    },
    "Check if file or directory exists"
  );

  ipcRegistry.register<string, { size: number; mtime: number }>(
    IPCChannel.FS_STAT,
    async (event, filePath) => {
      const safePath = sanitizePath(filePath);
      const stats = await fs.promises.stat(safePath);
      return {
        size: stats.size,
        mtime: stats.mtimeMs,
      };
    },
    "Get file/directory metadata"
  );

  ipcRegistry.register<string, void>(
    IPCChannel.FS_DELETE,
    async (event, filePath) => {
      const safePath = sanitizePath(filePath);
      await fs.promises.unlink(safePath);
      log.info(`[FS] File deleted: ${safePath}`);
    },
    "Delete a file"
  );

  ipcRegistry.register<string, string[]>(
    IPCChannel.FS_LIST_DIR,
    async (event, dirPath) => {
      const safePath = sanitizePath(dirPath);
      const files = await fs.promises.readdir(safePath);
      return files;
    },
    "List directory contents"
  );

  ipcDialogHandlers();
}

function ipcDialogHandlers(): void {
  ipcDialogHandler(IPCChannel.FS_SELECT_FILE, {
    title: "Select File",
    properties: ["openFile"],
    filters: [
      {
        name: "All Supported Files",
        extensions: ALLOWED_EXTENSIONS.map((e) => e.replace(".", "")),
      },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  ipcDialogHandler(IPCChannel.FS_SELECT_FOLDER, {
    title: "Select Folder",
    properties: ["openDirectory"],
  });
}

function ipcDialogHandler(
  channel: IPCChannel,
  options: Electron.OpenDialogOptions
): void {
  ipcRegistry.register<unknown, string | null>(
    channel,
    async () => {
      const win = ipcRegistry.getMainWindow();

      if (!win || win.isDestroyed()) {
        return null;
      }

      const result = await dialog.showOpenDialog(win, options);

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }

      return null;
    },
    `Show ${channel.includes("Folder") ? "folder" : "file"} selection dialog`
  );
}
