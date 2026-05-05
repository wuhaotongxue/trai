/**
 * logging_service.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Structured logging service with multiple transports and log levels
 */

import log from "electron-log";
import { app } from "electron";
import fs from "fs";
import path from "path";

enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
  VERBOSE = "verbose",
  SILLY = "silly",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  error?: Error;
}

class LoggingService {
  private logDir: string;

  constructor() {
    this.logDir = path.join(app.getPath("logs"));
    this.initialize();
  }

  private initialize(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    log.transports.file.level = "silly";
    log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
    log.transports.file.format = ({ level, date, message }) =>
      `[${date.toISOString()}] [${level.toUpperCase()}] ${message}`;

    log.transports.console.level = process.env.NODE_ENV === "development" ? "debug" : "warn";
    log.transports.console.format = ({ level, message }) => `[${level}] ${message}`;

    log.catchErrors({
      showDialog: false,
      onError: (error) => {
        this.error("Uncaught Exception", { error });
      },
    });

    log.info("[Logging] Service initialized");
  }

  error(category: string, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      data,
    };

    log.error(`[${category}] ${message}`, data);
  }

  warn(category: string, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      category,
      message,
      data,
    };

    log.warn(`[${category}] ${message}`, data);
  }

  info(category: string, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category,
      message,
      data,
    };

    log.info(`[${category}] ${message}`, data);
  }

  debug(category: string, message: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        category,
        message,
        data,
      };

      log.debug(`[${category}] ${message}`, data);
    }
  }

  getLogFilePath(): string {
    return path.join(this.logDir, "trai.log");
  }

  getErrorLogFilePath(): string {
    return path.join(this.logDir, "trai_error.log");
  }
}

export const loggingService = new LoggingService();
export type { LogEntry, LogLevel };
export default loggingService;
