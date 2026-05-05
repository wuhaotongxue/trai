/**
 * index.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Main entry point for all main process services
 */

import { settingsService } from "./settings_service";
import { authService } from "./auth_service";
import { databaseService } from "./database_service";
import { loggingService } from "./logging_service";

export async function initializeAllServices(): Promise<void> {
  log.info("[Services] Initializing all services...");

  await databaseService.initialize();

  log.info("[Services] All services initialized successfully");
}

export {
  settingsService,
  authService,
  databaseService,
  loggingService,
};

export type { AppSettings } from "./settings_service";
export type { AuthToken } from "./auth_service";
export type { QueryResult } from "./database_service";
export type { LogEntry, LogLevel } from "./logging_service";
