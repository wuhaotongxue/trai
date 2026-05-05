/**
 * settings_service.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Application settings management service with persistence and validation
 */

import { app, safeStorage } from "electron";
import fs from "fs";
import path from "path";
import log from "electron-log";

interface AppSettings {
  // UI Preferences
  theme: "light" | "dark" | "system";
  language: string;
  fontSize: number;

  // Window State
  windowBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
  };

  // AI Settings
  defaultAgentType: string;
  maxTokens: number;
  temperature: number;

  // Privacy
  telemetryEnabled: boolean;
  crashReportingEnabled: boolean;

  // Advanced
  autoUpdateEnabled: boolean;
  startupBehavior: "minimize" | "tray" | "normal";
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  language: "en",
  fontSize: 14,
  windowBounds: {
    x: undefined as unknown as number,
    y: undefined as unknown as number,
    width: 1200,
    height: 800,
    isMaximized: false,
  },
  defaultAgentType: "chat",
  maxTokens: 4096,
  temperature: 0.7,
  telemetryEnabled: true,
  crashReportingEnabled: true,
  autoUpdateEnabled: true,
  startupBehavior: "tray",
};

class SettingsService {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };
  private settingsPath: string;
  private listeners: Array<(settings: AppSettings) => void> = [];

  constructor() {
    this.settingsPath = path.join(app.getPath("userData"), "settings.json");
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const rawData = fs.readFileSync(this.settingsPath, "utf-8");
        const parsedSettings = JSON.parse(rawData);

        this.settings = {
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
          windowBounds: {
            ...DEFAULT_SETTINGS.windowBounds,
            ...(parsedSettings.windowBounds || {}),
          },
        };

        log.info("[Settings] Loaded settings successfully");
      } else {
        await this.saveSettings();
      }
    } catch (error) {
      log.error("[Settings] Failed to load settings:", error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  async saveSettings(): Promise<void> {
    try {
      const dir = path.dirname(this.settingsPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), "utf-8");
      log.info("[Settings] Saved settings successfully");

      this.notifyListeners();
    } catch (error) {
      log.error("[Settings] Failed to save settings:", error);
      throw new Error("Failed to save settings");
    }
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  getAll(): Readonly<AppSettings> {
    return { ...this.settings };
  }

  async set<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    this.settings[key] = value;
    await this.saveSettings();
  }

  async update(partialSettings: Partial<AppSettings>): Promise<void> {
    Object.assign(this.settings, partialSettings);
    await this.saveSettings();
  }

  async resetToDefaults(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.saveSettings();
  }

  onSettingsChange(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.settings });
      } catch (error) {
        log.error("[Settings] Listener error:", error);
      }
    }
  }
}

export const settingsService = new SettingsService();
export type { AppSettings };
export default settingsService;
