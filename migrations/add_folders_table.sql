CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  owner_type INTEGER,
  created_at TEXT,
  modified_at TEXT,
  fetched_at TEXT DEFAULT (datetime('now')),
  microversion TEXT
);

CREATE INDEX IF NOT EXISTS idx_folders_fetched ON folders(fetched_at);
