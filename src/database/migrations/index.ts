export const migrations = [
  {
    version: 1,
    name: 'initial',
    sql: `
      DROP TABLE IF EXISTS files;
      DROP TABLE IF EXISTS progress;
      
      CREATE TABLE files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE,
        filename TEXT,
        size_bytes INTEGER,
        duration_ms INTEGER,
        category TEXT,
        title_id INTEGER,
        poster_url TEXT, 
        review_status TEXT DEFAULT 'confirmed',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE progress (
        file_id INTEGER PRIMARY KEY,
        position_ms INTEGER DEFAULT 0,
        duration_ms INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `
  }
];