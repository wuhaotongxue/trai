/**
 * menu_manager.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Native menu system - application menu, context menu, and tray menu
 */

import {
  Menu,
  MenuItem,
  BrowserWindow,
  app,
  shell,
  dialog,
  Tray,
  nativeImage,
} from "electron";
import log from "electron-log";

class MenuManager {
  private tray: Tray | null = null;

  createApplicationMenu(): void {
    const template = this.buildApplicationMenuTemplate();
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    log.info("[Menu] Application menu created");
  }

  private buildApplicationMenuTemplate(): Electron.MenuItemConstructorOptions[] {
    const isMac = process.platform === "darwin";

    return [
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: "about" as const },
                { type: "separator" as const },
                { role: "services" as const },
                { type: "separator" as const },
                { role: "hide" as const },
                { role: "hideOthers" as const },
                { role: "unhide" as const },
                { type: "separator" as const },
                { role: "quit" as const },
              ],
            },
          ]
        : [
            {
              label: "&File",
              submenu: [
                {
                  label: "&New Chat",
                  accelerator: "CmdOrCtrl+N",
                  click: () => this.emitToRenderer("menu:newChat"),
                },
                {
                  label: "&Open File...",
                  accelerator: "CmdOrCtrl+O",
                  click: () => this.handleOpenFile(),
                },
                { type: "separator" as const },
                {
                  label: "&Settings",
                  accelerator: "CmdOrCtrl+,",
                  click: () => this.emitToRenderer("menu:openSettings"),
                },
                { type: "separator" as const },
                isMac ? { role: "close" as const } : { role: "quit" as const },
              ],
            },
          ]),
      {
        label: "&Edit",
        submenu: [
          { role: "undo" as const },
          { role: "redo" as const },
          { type: "separator" as const },
          { role: "cut" as const },
          { role: "copy" as const },
          { role: "paste" as const },
          { role: "selectAll" as const },
        ],
      },
      {
        label: "&View",
        submenu: [
          { role: "reload" as const },
          { role: "forceReload" as const },
          { role: "toggleDevTools" as const },
          { type: "separator" as const },
          { role: "resetZoom" as const },
          { role: "zoomIn" as const },
          { role: "zoomOut" as const },
          { type: "separator" as const },
          { role: "togglefullscreen" as const },
        ],
      },
      {
        label: "&Window",
        submenu: [
          { role: "minimize" as const },
          ...(isMac
            ? [{ type: "separator" as const }, { role: "front" as const }]
            : [{ role: "close" as const }]),
        ],
      },
      {
        label: "&Help",
        submenu: [
          {
            label: "&Documentation",
            click: async () => {
              await shell.openExternal("https://docs.trai.ai");
            },
          },
          {
            label: "&Report Issue",
            click: async () => {
              await shell.openExternal(
                "https://github.com/trai/trai/issues"
              );
            },
          },
          { type: "separator" as const },
          {
            label: "&Check for Updates...",
            click: () => this.emitToRenderer("updater:checkForUpdates"),
          },
          { type: "separator" as const },
          {
            label: "&About TRAI",
            click: () => this.showAboutDialog(),
          },
        ],
      },
    ];
  }

  createContextMenu(window: BrowserWindow): void {
    window.webContents.on("context-menu", (_event, params) => {
      const menu = new Menu();

      if (params.selectionText) {
        menu.append(
          new MenuItem({
            label: "Copy",
            role: "copy",
          })
        );
        menu.append(
          new MenuItem({
            type: "separator",
          })
        );
        menu.append(
          new MenuItem({
            label: "Search with Google",
            click: () => {
              const url = `https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`;
              shell.openExternal(url);
            },
          })
        );
        menu.append(
          new MenuItem({
            label: "Search with AI",
            click: () => {
              this.emitToRenderer("context:searchAI", {
                query: params.selectionText,
              });
            },
          })
        );
      }

      if (params.linkURL) {
        if (params.selectionText) {
          menu.append(new MenuItem({ type: "separator" }));
        }
        menu.append(
          new MenuItem({
            label: "Copy Link Address",
            click: () => {
              clipboard.writeText(params.linkURL);
            },
          })
        );
        menu.append(
          new MenuItem({
            label: "Open Link in Browser",
            click: () => {
              shell.openExternal(params.linkURL);
            },
          })
        );
      }

      if (params.isEditable || params.inputFieldType) {
        if (params.selectionText || params.linkURL) {
          menu.append(new MenuItem({ type: "separator" }));
        }
        menu.append(new MenuItem({ label: "Cut", role: "cut" }));
        menu.append(new MenuItem({ label: "Paste", role: "paste" }));
        menu.append(
          new MenuItem({ type: "separator" })
        );
        menu.append(
          new MenuItem({
            label: "Select All",
            role: "selectAll",
          })
        );
      }

      if (menu.items.length > 0) {
        menu.popup({ window });
      }
    });
  }

  createTrayMenu(): Tray {
    const iconPath = path.join(__dirname, "../assets/tray-icon.png");
    let trayIcon: Electron.NativeImage;

    try {
      trayIcon = nativeImage.createFromPath(iconPath);

      if (trayIcon.isEmpty()) {
        throw new Error("Tray icon not found");
      }
    } catch (error) {
      log.warn("[Menu] Using default tray icon");
      trayIcon = nativeImage.createFromBuffer(
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA" +
            "GXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54" +
            "bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlk" +
            "Ij8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhN" +
            "UCBDb25jZW50IEludGVybmF0aW9uYWwgMjEuMSAoTWFjaW50b3NoKSI+IDxyZGY6UkRGIHhtbG5z" +
            "OnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIj4gPHJkZjpE" +
            "ZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hh" +
            "cC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1s" +
            "bnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIH" +
            "htcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiIHhtcE1NOklu" +
            "c3RhbmNlSUQ9InhtcC5paWQ6ODNCNzJCNDZBNkI2MTFFRTg0NTlDRkNGQTMwRjU2QTQiIHhtcE1NOk" +
            "RvY3VtZW50SUQ9InhtcC5kaWQ6ODNCNzJCNDhBNkI2MTFFRTg0NTlCRkNGQTMwRjU2QTQiPiA8eG1w" +
            "TU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6Y29udGVudD0iIiBzdEV2dDpzb3VyY2VE" +
            "b2M9Ii9zdmcvIiBzdEV2dDp3aGVuPSIyMDIxLTEyLTI1VDEwOjAwOjAwKzA4OjAwIiBzdEV2dDpzb2Z0" +
            "d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjEuMSAoTWFjaW50b3NoKSI+PC9yZGY6bGk+IDwvc3RS" +
            "ZWY+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1" +
            "ldGE+IDw/eHBhY2tldCBlbmQ9InciPj7/2AMBBAMAAwEBAAAAAAAAAAAAAAAGBAUIAP/tAAxBBAIBAwIB" +
            "AQAAAAAAAAABAgMEEQUHEBIhMVFBYXEyIyQf/aAAwDAQACEQMRAD8A6UUUUUAFFFFAhRRRQIUUUUAFFF" +
            "FAhRRRQIUUUUAFFFFAhRRRQIUUUUAFFFFAhRRRQIUUUUAFFFFA//2Q==",
          "base64"
        )
      );
    }

    // Resize icon for high DPI displays
    const resizedIcon = trayIcon.resize({ width: 16, height: 16 });

    this.tray = new Tray(resizedIcon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show TRAI",
        click: () => {
          const win = BrowserWindow.getAllWindows()[0];
          if (win) {
            win.show();
            win.focus();
          }
        },
      },
      { type: "separator" as const },
      {
        label: "New Chat",
        click: () => this.emitToRenderer("menu:newChat"),
      },
      { type: "separator" as const },
      {
        label: "Check for Updates...",
        click: () => this.emitToRenderer("updater:checkForUpdates"),
      },
      { type: "separator" as const },
      {
        label: "Quit TRAI",
        click: () => app.quit(),
      },
    ]);

    this.tray.setToolTip("TRAI AI Assistant");
    this.tray.setContextMenu(contextMenu);

    this.tray.on("double-click", () => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) {
        win.show();
        win.focus();
      }
    });

    log.info("[Menu] System tray created");
    return this.tray;
  }

  private showAboutDialog(): void {
    dialog.showMessageBox(BrowserWindow.getFocusedWindow()!, {
      type: "info",
      title: "About TRAI",
      message: `TRAI AI Assistant`,
      detail:
        `Version: ${app.getVersion()}\n` +
        `Platform: ${process.platform} ${process.arch}\n` +
        `Electron: ${process.versions.electron}\n` +
        `Node.js: ${process.versions.node}\n\n` +
        `Copyright © 2024-2026 TRAI Team. All rights reserved.`,
      buttons: ["OK"],
    });
  }

  private handleOpenFile(): void {
    dialog
      .showOpenDialog({
        properties: ["openFile"],
        filters: [
          {
            name: "Supported Files",
            extensions: [
              "png", "jpg", "jpeg", "gif", "webp",
              "mp3", "wav", "ogg", "m4a",
              "mp4", "webm",
              "pdf", "doc", "docx", "txt", "md",
            ],
          },
          { name: "All Files", extensions: ["*"] },
        ],
      })
      .then(({ canceled, filePaths }) => {
        if (!canceled && filePaths.length > 0) {
          this.emitToRenderer("file:selected", { filePath: filePaths[0] });
        }
      });
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

export const menuManager = new MenuManager();
export default menuManager;
