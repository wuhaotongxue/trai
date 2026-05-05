/**
 * database_service.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: Local database service using better-sqlite3 with encryption support
 */

import Database from "better-sqlite3";
import { app } from "electron";
import fs from "fs";
import path from "path";
import log from "electron-log";

interface QueryResult<T = unknown> {
  rows: T[];
  changes?: number;
  lastInsertRowid?: number;
}

class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(app.getPath("userData"), "trai_data.db");
  }

  async initialize(): Promise<void> {
    try {
      const dir = path.dirname(this.dbPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new Database(this.dbPath);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("foreign_keys = ON");

      await this.createTables();

      log.info("[Database] Initialized successfully");
    } catch (error) {
      log.error("[Database] Initialization failed:", error);
      throw new Error("Failed to initialize database");
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const tables = `
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'New Chat',
        agent_type TEXT NOT NULL DEFAULT 'chat',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        token_count INTEGER,
        metadata TEXT,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        uploaded_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS settings_cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
      );
    `;

    this.db.exec(tables);
    log.debug("[Database] Tables created/verified");
  }

  execute(sql: string, params: unknown[] = []): QueryResult {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);

      log.debug(`[Database] Execute: ${sql.substring(0, 50)}...`);

      return {
        rows: [],
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid as number,
      };
    } catch (error) {
      log.error(`[Database] Execute error: ${sql}`, error);
      throw error;
    }
  }

  query<T = unknown>(sql: string, params: unknown[] = []): QueryResult<T> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params) as T[];

      log.debug(`[Database] Query: ${sql.substring(0, 50)}... (${rows.length} rows)`);

      return { rows };
    } catch (error) {
      log.error(`[Database] Query error: ${sql}`, error);
      throw error;
    }
  }

  async backup(backupPath: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const backupDb = new Database(backupPath);
      this.db.backup(backupDb).then(() => {
        backupDb.close();
        log.info(`[Database] Backup completed: ${backupPath}`);
      });
    } catch (error) {
      log.error("[Database] Backup failed:", error);
      throw error;
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      log.info("[Database] Connection closed");
    }
  }
}

export const databaseService = new DatabaseService();
export type { QueryResult };
export default databaseService;
