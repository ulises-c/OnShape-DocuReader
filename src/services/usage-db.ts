import Database from "better-sqlite3";
import type { UsageEntry } from "../types/usage.d.ts";

export class UsageDatabase {
  private db: Database.Database;

  constructor(dbPath = ".data/api-usage.db") {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        user_id TEXT,
        response_time INTEGER,
        status INTEGER,
        cached BOOLEAN DEFAULT 0
      );
      
      CREATE INDEX IF NOT EXISTS idx_timestamp ON api_requests(timestamp);
      CREATE INDEX IF NOT EXISTS idx_endpoint ON api_requests(endpoint);
      CREATE INDEX IF NOT EXISTS idx_user_id ON api_requests(user_id);
    `);
  }

  logRequest(entry: UsageEntry) {
    const stmt = this.db.prepare(`
      INSERT INTO api_requests (endpoint, method, user_id, response_time, status, cached)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      entry.endpoint,
      entry.method,
      entry.userId,
      entry.responseTime,
      entry.status,
      entry.cached ? 1 : 0
    );
  }

  getStats(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    return {
      total: this.db
        .prepare(
          "SELECT COUNT(*) as count FROM api_requests WHERE timestamp > ?"
        )
        .get(since),
      byEndpoint: this.db
        .prepare(
          "SELECT endpoint, COUNT(*) as count FROM api_requests WHERE timestamp > ? GROUP BY endpoint ORDER BY count DESC"
        )
        .all(since),
      byUser: this.db
        .prepare(
          "SELECT user_id, COUNT(*) as count FROM api_requests WHERE timestamp > ? GROUP BY user_id"
        )
        .all(since),
      avgResponseTime: this.db
        .prepare(
          "SELECT AVG(response_time) as avg FROM api_requests WHERE timestamp > ?"
        )
        .get(since),
      cacheHitRate: this.db
        .prepare(
          "SELECT SUM(cached) * 1.0 / COUNT(*) as rate FROM api_requests WHERE timestamp > ?"
        )
        .get(since),
    };
  }
}
