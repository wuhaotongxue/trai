/**
 * system_integration.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: System integration service - tray, auto-start, file associations, deep links
 */

import {
  app,
  BrowserWindow,
  nativeImage,
  shell,
  dialog,
  Tray,
} from "electron";
import path from "path";
import fs from "fs";
import log from "electron-log";

interface AutoStartOptions {
  enabled: boolean;
  minimized?: boolean;
  startHidden?: boolean;
}

class SystemIntegrationService {
  private tray: Tray | null = null;

  initializeSystemTray(): Tray {
    const iconPath = this.getTrayIconPath();
    let trayIcon: Electron.NativeImage;

    try {
      trayIcon = nativeImage.createFromPath(iconPath);

      if (trayIcon.isEmpty()) {
        throw new Error("Tray icon file not found");
      }
    } catch (error) {
      log.warn("[System] Using default tray icon");
      trayIcon = this.createDefaultTrayIcon();
    }

    // Resize icon for different DPI settings
    const resizedIcon = trayIcon.resize({ width: 16, height: 16 });

    this.tray = new Tray(resizedIcon);

    this.setupTrayTooltip();
    this.setupTrayEvents();

    log.info("[System] System tray initialized");
    return this.tray;
  }

  setupAutoLogin(options: AutoStartOptions): void {
    app.setLoginItemSettings({
      openAtLogin: options.enabled,
      path: process.execPath,
      args: options.minimized ? ["--minimized"] : [],
      openAsHidden: options.startHidden ?? false,
    });

    log.info(`[System] Auto-login ${options.enabled ? "enabled" : "disabled"}`);
  }

  isAutoLoginEnabled(): boolean {
    const loginSettings = app.getLoginItemSettings();
    return loginSettings.openAtLogin;
  }

  registerFileAssociations(): void {
    if (process.platform === "win32") {
      this.registerWindowsFileTypes();
    } else if (process.platform === "darwin") {
      this.registerMacOSFileTypes();
    } else if (process.platform === "linux") {
      this.registerLinuxFileTypes();
    }

    log.info("[System] File associations registered");
  }

  registerProtocolHandler(protocol: string): void {
    if (app.isDefaultProtocolClient(protocol)) {
      log.info(`[System] Protocol '${protocol}' already registered`);
      return;
    }

    const success = app.setAsDefaultProtocolClient(protocol);

    if (success) {
      log.info(`[System] Protocol handler registered: ${protocol}`);
    } else {
      log.error(`[System] Failed to register protocol: ${protocol}`);
    }
  }

  handleDeepLink(url: string): void {
    try {
      const parsedUrl = new URL(url);
      const action = parsedUrl.pathname.replace("/", "");
      const params = Object.fromEntries(parsedUrl.searchParams);

      log.info(`[System] Deep link received: ${action}`, params);

      switch (action) {
        case "chat":
          this.handleChatDeepLink(params);
          break;
        case "open":
          this.handleOpenDeepLink(params);
          break;
        case "settings":
          this.emitToRenderer("menu:openSettings");
          break;
        default:
          log.warn(`[System] Unknown deep link action: ${action}`);
      }
    } catch (error) {
      log.error("[System] Failed to parse deep link:", error);
    }
  }

  handleOpenFile(filePath: string): void {
    const ext = path.extname(filePath).toLowerCase();
    const supportedExtensions = [
      ".png", ".jpg", ".jpeg", ".gif", ".webp",
      ".mp3", ".wav", ".ogg", ".m4a",
      ".mp4", ".webm",
      ".pdf", ".doc", ".docx", ".txt", ".md",
    ];

    if (!supportedExtensions.includes(ext)) {
      dialog.showErrorBox(
        "Unsupported File Type",
        `Cannot open file: ${filePath}\n\nSupported types: ${supportedExtensions.join(", ")}`
      );
      return;
    }

    log.info(`[System] Opening file: ${filePath}`);

    this.emitToRenderer("file:selected", {
      filePath,
      fileType: ext,
    });
  }

  getSystemInfo(): {
    platform: string;
    arch: string;
    version: string;
    appVersion: string;
    electronVersion: string;
    nodeVersion: string;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      memoryUsage: process.memoryUsage(),
    };
  }

  destroy(): void {
    if (this.tray && !this.tray.isDestroyed()) {
      this.tray.destroy();
      this.tray = null;
      log.info("[System] System tray destroyed");
    }
  }

  private getTrayIconPath(): string {
    const iconPaths = [
      path.join(__dirname, "../assets/tray-icon.png"),
      path.join(__dirname, "../../assets/tray-icon.png"),
      path.join(app.getAppPath(), "assets/tray-icon.png"),
    ];

    for (const iconPath of iconPaths) {
      if (fs.existsSync(iconPath)) {
        return iconPath;
      }
    }

    return "";
  }

  private createDefaultTrayIcon(): Electron.NativeImage {
    // Create a simple 16x16 blue circle as default icon
    const size = 16;
    const canvasSize = size * 2; // For retina displays

    // This would use a canvas library in production
    // For now, returning empty image
    return nativeImage.createEmpty();
  }

  private setupTrayTooltip(): void {
    if (!this.tray) return;

    this.tray.setToolTip("TRAI AI Assistant\n\nDouble-click to show window");

    // Update tooltip based on application state
    setInterval(() => {
      if (!this.tray || this.tray.isDestroyed()) return;

      const windows = BrowserWindow.getAllWindows();
      const visibleWindows = windows.filter((w) => w.isVisible() && !w.isMinimized());

      if (visibleWindows.length > 0) {
        this.tray.setToolTip("TRAI AI Assistant (Running)");
      } else {
        this.tray.setToolTip("TRAI AI Assistant (Minimized to Tray)");
      }
    }, 5000);
  }

  private setupTrayEvents(): void {
    if (!this.tray) return;

    this.tray.on("double-click", () => {
      this.showMainWindow();
    });

    this.tray.on("right-click", (_event, bounds) => {
      this.showTrayContextMenu(bounds.x, bounds.y);
    });
  }

  private showMainWindow(): void {
    const win = BrowserWindow.getAllWindows()[0];

    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }

      win.show();
      win.focus();
    }
  }

  private showTrayContextMenu(x: number, y: number): void {
    const { Menu } = require("electron");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show TRAI",
        click: () => this.showMainWindow(),
      },
      { type: "separator" },
      {
        label: "New Chat",
        click: () => this.emitToRenderer("menu:newChat"),
      },
      { type: "separator" },
      {
        label: `Version ${app.getVersion()}`,
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Quit TRAI",
        click: () => app.quit(),
      },
    ]);

    contextMenu.popup({ x, y });
  }

  private handleChatDeepLink(params: Record<string, string>): void {
    const message = params.message || params.q || "";

    if (message) {
      this.emitToRenderer("deepLink:newChat", { message });
    }
  }

  private handleOpenDeepLink(params: Record<string, string>): void {
    const url = params.url || params.file || "";

    if (url) {
      this.emitToRenderer("deepLink:openURL", { url });
    }
  }

  private registerWindowsFileTypes(): void {
    // Windows file type registration would be done during installer creation
    // This is handled by electron-builder's nsis configuration
    log.debug("[System] Windows file types configured via installer");
  }

  private registerMacOSFileTypes(): void {
    // macOS file type registration via Info.plist
    // Handled by electron-builder configuration
    log.debug("[System] macOS file types configured via Info.plist");
  }

  private registerLinuxFileTypes(): void {
    // Linux .desktop file and MIME type registration
    // Handled by electron-builder configuration
    log.debug("[System] Linux file types configured via .desktop file");
  }

  private emitToRenderer(channel: string, data?: unknown): void {
    const windows = BrowserWindow.getAllWindows();

    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    }
  }
}

export const systemIntegrationService = new SystemIntegrationService();
export type { AutoStartOptions };
export default systemIntegrationService;
