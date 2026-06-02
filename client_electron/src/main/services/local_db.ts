import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import log from 'electron-log'

class LocalDBService {
  private db: Database.Database | null = null

  init() {
    try {
      const dbPath = join(app.getPath('userData'), 'trai_local_cache.db')
      log.info(`[LocalDB] initializing at ${dbPath}`)
      this.db = new Database(dbPath)
      
      // Initialize tables
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          title TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          session_id TEXT,
          role TEXT,
          content TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );
      `)
      log.info('[LocalDB] initialized successfully')
    } catch (err) {
      log.error('[LocalDB] initialization failed:', err)
    }
  }

  save_session(session_id: string, title: string | null) {
    if (!this.db) return
    try {
      const stmt = this.db.prepare(`
        INSERT INTO sessions (id, title, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET 
        title = COALESCE(excluded.title, sessions.title),
        updated_at = CURRENT_TIMESTAMP
      `)
      stmt.run(session_id, title)
    } catch (err) {
      log.error('[LocalDB] save_session failed:', err)
    }
  }

  save_message(id: string, session_id: string, role: string, content: string) {
    if (!this.db) return
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO messages (id, session_id, role, content) 
        VALUES (?, ?, ?, ?)
      `)
      stmt.run(id, session_id, role, content)
    } catch (err) {
      log.error('[LocalDB] save_message failed:', err)
    }
  }

  get_sessions() {
    if (!this.db) return []
    try {
      const stmt = this.db.prepare('SELECT id as session_id, title, created_at, updated_at FROM sessions ORDER BY updated_at DESC')
      return stmt.all()
    } catch (err) {
      log.error('[LocalDB] get_sessions failed:', err)
      return []
    }
  }

  get_session_messages(session_id: string) {
    if (!this.db) return []
    try {
      const stmt = this.db.prepare('SELECT id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC')
      return stmt.all(session_id)
    } catch (err) {
      log.error('[LocalDB] get_session_messages failed:', err)
      return []
    }
  }
  
  delete_session(session_id: string) {
    if (!this.db) return
    try {
      this.db.prepare('DELETE FROM sessions WHERE id = ?').run(session_id)
    } catch (err) {
      log.error('[LocalDB] delete_session failed:', err)
    }
  }
}

export const local_db = new LocalDBService()
