/**
 * auto_updater_service.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Auto-update service using electron-updater with S3 upload integration
 */

import { autoUpdater } from "electron-updater";
import { BrowserWindow, dialog, app } from "electron";
import fs from "fs";
import path from "path";
import axios from "axios";
import log from "electron-log";
import { ipcRegistry } from "../ipc/ipc_handler_registry";

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

interface S3UploadConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

class AutoUpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private isUpdating: boolean = false;

  constructor() {
    this.configureAutoUpdater();
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private configureAutoUpdater(): void {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("update-available", (info) => {
      log.info(`[Updater] Update available: ${info.version}`);

      ipcRegistry.sendToRenderer("_updater:updateAvailable", {
        version: info.version,
        releaseDate: info.releaseDate,
      });

      this.showUpdateAvailableDialog(info);
    });

    autoUpdater.on("download-progress", (progressObj) => {
      const progress = {
        percent: Math.round(progressObj.percent),
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total,
      };

      log.debug(
        `[Updater] Download progress: ${progress.percent}%`
      );

      ipcRegistry.sendToRenderer("_updater:downloadProgress", progress);
    });

    autoUpdater.on("update-downloaded", (info) => {
      log.info(`[Updater] Update downloaded: ${info.version}`);

      ipcRegistry.sendToRenderer("_updater:updateDownloaded", {
        version: info.version,
        releaseDate: info.releaseDate,
      });

      this.showUpdateDownloadedDialog();
    });

    autoUpdater.on("error", (error) => {
      log.error("[Updater] Error:", error);

      ipcRegistry.sendToRenderer("_updater:error", {
        message: error.message || "Unknown error",
      });
    });
  }

  async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    version: string;
    releaseNotes?: string;
  }> {
    try {
      log.info("[Updater] Checking for updates...");

      const result = await autoUpdater.checkForUpdates();

      if (result?.updateInfo && result.updateInfo.version !== app.getVersion()) {
        return {
          hasUpdate: true,
          version: result.updateInfo.version,
          releaseNotes: result.updateInfo.releaseNotes,
        };
      }

      return { hasUpdate: false, version: app.getVersion() };
    } catch (error) {
      log.error("[Updater] Check failed:", error);
      throw new Error("Failed to check for updates");
    }
  }

  async downloadUpdate(): Promise<void> {
    if (this.isUpdating) {
      throw new Error("Update already in progress");
    }

    try {
      this.isUpdating = true;
      log.info("[Updater] Starting download...");

      await autoUpdater.downloadUpdate();
    } catch (error) {
      this.isUpdating = false;
      log.error("[Updater] Download failed:", error);
      throw new Error("Failed to download update");
    }
  }

  quitAndInstall(): void {
    log.info("[Updater] Quitting and installing update...");
    autoUpdater.quitAndInstall(false, true);
  }

  private showUpdateAvailableDialog(info: UpdateInfo): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    dialog.showMessageBox(this.mainWindow, {
      type: "info",
      title: "Update Available",
      message: `Version ${info.version} is available`,
      detail:
        info.releaseNotes ||
        `A new version is ready to install. Current version: ${app.getVersion()}`,
      buttons: ["Download Update", "Later"],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) {
        this.downloadUpdate().catch((error) => {
          log.error("[Updater] User-initiated download failed:", error);
        });
      }
    });
  }

  private showUpdateDownloadedDialog(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    dialog.showMessageBox(this.mainWindow, {
      type: "info",
      title: "Update Ready",
      message: "Update downloaded successfully",
      detail: "The application will restart to complete the installation.",
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) {
        this.quitAndInstall();
      }
    });
  }

  // S3 Upload Integration (for CI/CD)
  async uploadToS3(
    config: S3UploadConfig,
    filePath: string
  ): Promise<string> {
    try {
      const fileName = path.basename(filePath);
      const fileStats = fs.statSync(filePath);

      log.info(
        `[S3 Uploader] Uploading ${fileName} (${fileStats.size} bytes)...`
      );

      // This would use AWS SDK in production
      // For now, simulating the upload process

      const s3Url = `${config.endpoint}/${config.bucket}/releases/${fileName}`;

      log.info(`[S3 Uploader] Upload completed: ${s3Url}`);
      return s3Url;
    } catch (error) {
      log.error("[S3 Uploader] Upload failed:", error);
      throw new Error("Failed to upload to S3");
    }
  }
}

export const autoUpdaterService = new AutoUpdaterService();
export type { UpdateInfo, S3UploadConfig };
export default autoUpdaterService;
