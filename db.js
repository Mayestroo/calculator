const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'tannarx.db');

const db = new Database(DB_PATH);

// Pragmas for performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL CHECK(category IN ('korpus', 'led', 'blok')),
      name TEXT NOT NULL,
      spec TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'metr',
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      material_name TEXT NOT NULL,
      spec TEXT NOT NULL DEFAULT '',
      old_price REAL NOT NULL,
      new_price REAL NOT NULL,
      changed_by TEXT NOT NULL DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      telegram_id TEXT DEFAULT '',
      user_name TEXT DEFAULT '',
      korpus_data TEXT NOT NULL,
      led_data TEXT NOT NULL,
      blok_data TEXT NOT NULL,
      extra_data TEXT NOT NULL,
      settings_data TEXT NOT NULL,
      material_usd REAL NOT NULL,
      brak_usd REAL NOT NULL,
      tannarx_usd REAL NOT NULL,
      tannarx_uzs REAL NOT NULL,
      sotish_usd REAL NOT NULL,
      sotish_uzs REAL NOT NULL,
      partiya_tannarx_usd REAL NOT NULL,
      partiya_tushum_usd REAL NOT NULL,
      partiya_foyda_usd REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      telegram_id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      username TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'menejer' CHECK(role IN ('admin', 'menejer')),
      is_allowed INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = {
  db,
  initDatabase
};
