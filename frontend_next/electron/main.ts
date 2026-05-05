/**
 * main.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Electron main process entry point - initializes all services and creates main window
 */

import {
  app,
  BrowserWindow,
  globalShortcut,
  nativeTheme,
  screen,
} from "electron";
import path from "path";
import log from "electron-log";

// Import services
import { registerAllIPCHandlers, ipcRegistry } from "./ipc/index";
import {
  initializeAllServices,
  settingsService,
  loggingService,
} from "./services/index";
import { menuManager } from "./services/menu_manager";
import { autoUpdaterService } from "./services/auto_updater_service";
import { systemIntegrationService } from "./services/system_integration";

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function createMainWindow(): BrowserWindow {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  const windowBounds = settingsService.get("windowBounds");

  mainWindow = new BrowserWindow({
    width: windowBounds.width || Math.min(1200, screenWidth - 100),
    height: windowBounds.height || Math.min(800, screenHeight - 100),
    x: windowBounds.x || undefined,
    y: windowBounds.y || undefined,
    minWidth: 900,
    minHeight: 600,

    title: "TRAI AI Assistant",
    icon: path.join(__dirname, "../assets/icon.png"),

    webPreferences: {
      preload: path.join(__dirname, "./preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: !isDev,
    },

    frame: false,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: "#0F172A",

    show: false,
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // Window state management
  mainWindow.on("resize", () => saveWindowState());
  mainWindow.on("move", () => saveWindowState());
  mainWindow.on("maximize", () => saveWindowState());
  mainWindow.on("unmaximize", () => saveWindowState());

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();

      const startupBehavior = settingsService.get("startupBehavior");

      switch (startupBehavior) {
        case "tray":
          mainWindow?.hide();
          break;
        case "minimize":
          mainWindow?.minimize();
          break;
        default:
          mainWindow?.destroy();
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  return mainWindow;
}

function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    const bounds = mainWindow.getBounds();
    settingsService.set("windowBounds", {
      ...bounds,
      isMaximized: mainWindow.isMaximized(),
    });
  } catch (error) {
    log.error("[Main] Failed to save window state:", error);
  }
}

async function initializeApp(): Promise<void> {
  try {
    log.info("[Main] Initializing TRAI Electron App...");

    // Initialize services
    await initializeAllServices();

    // Register IPC handlers
    registerAllIPCHandlers();
    ipcRegistry.setMainWindow(mainWindow!);

    // Setup auto updater
    autoUpdaterService.setMainWindow(mainWindow!);

    // Create menus
    menuManager.createApplicationMenu();
    menuManager.createContextMenu(mainWindow!);
    systemIntegrationService.initializeSystemTray();

    // Register file associations and protocol handlers
    systemIntegrationService.registerFileAssociations();
    systemIntegrationService.registerProtocolHandler("trai");

    // Setup auto-login
    systemIntegrationService.setupAutoLogin({
      enabled: settingsService.get("telemetryEnabled"),
    });

    // Apply theme
    applyTheme(settingsService.get("theme"));

    // Register global shortcuts
    registerGlobalShortcuts();

    // Handle deep links
    handleDeepLinks();

    log.info("[Main] Application initialized successfully");
  } catch (error) {
    log.error("[Main] Initialization failed:", error);
    throw error;
  }
}

function applyTheme(theme: string): void {
  switch (theme) {
    case "light":
      nativeTheme.themeSource = "light";
      break;
    case "dark":
      nativeTheme.themeSource = "dark";
      break;
    default:
      nativeTheme.themeSource = "system";
  }

  log.debug(`[Main] Theme applied: ${theme}`);
}

function registerGlobalShortcuts(): void {
  // Cmd/Ctrl+N for new chat
  globalShortcut.register("CommandOrControl+N", () => {
    mainWindow?.webContents.send("menu:newChat");
  });

  // Cmd/Ctrl+, for settings
  globalShortcut.register("CommandOrCtrl+Comma", () => {
    mainWindow?.webContents.send("menu:openSettings");
  });

  // Cmd/Ctrl+Shift+D for toggle devtools
  globalShortcut.register("CommandOrControl+Shift+D", () => {
    mainWindow?.webContents.toggleDevTools();
  });

  log.info("[Main] Global shortcuts registered");
}

function handleDeepLinks(): void {
  // Handle protocol links on macOS
  app.on("open-url", (_event, url) => {
    systemIntegrationService.handleDeepLink(url);
  });

  // Handle file opens on macOS
  app.on("open-file", (_event, filePath) => {
    systemIntegrationService.handleOpenFile(filePath);
  });
}

// App lifecycle events
app.whenReady().then(async () => {
  try {
    mainWindow = createMainWindow();
    await initializeApp();
  } catch (error) {
    log.error("[Main] Failed to start application:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
  globalShortcut.unregisterAll();
  ipcRegistry.cleanup();
  systemIntegrationService.destroy();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
    ipcRegistry.setMainWindow(mainWindow);
  } else {
    mainWindow?.show();
  }
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

export { mainWindow };
