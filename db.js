const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || '';
const isPostgres = Boolean(DATABASE_URL && (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://')));

let sqliteDb = null;
let pgPool = null;

if (isPostgres) {
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('🐘 PostgreSQL (Neon.tech) maʼlumotlar bazasiga ulanmoqda...');
} else {
  const Database = require('better-sqlite3');
  const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'tannarx.db');
  sqliteDb = new Database(DB_PATH);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  console.log('🗄️ Mahalliy SQLite (tannarx.db) maʼlumotlar bazasiga ulandi.');
}

// Helper to convert '?' placeholders to '$1, $2...' for Postgres
function formatSqlForPg(sql) {
  let index = 1;
  let formatted = sql.replace(/\?/g, () => `$${index++}`);

  // Handle SQLite specific syntax in PostgreSQL
  formatted = formatted.replace(/INSERT OR REPLACE INTO settings \(key, value\) VALUES \(([^)]+)\)/i, 
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value');

  return formatted;
}

const db = {
  isPostgres,

  async all(sql, params = []) {
    if (isPostgres) {
      const pgSql = formatSqlForPg(sql);
      const res = await pgPool.query(pgSql, params);
      return res.rows;
    } else {
      return sqliteDb.prepare(sql).all(...params);
    }
  },

  async get(sql, params = []) {
    if (isPostgres) {
      const pgSql = formatSqlForPg(sql);
      const res = await pgPool.query(pgSql, params);
      return res.rows[0] || null;
    } else {
      return sqliteDb.prepare(sql).get(...params);
    }
  },

  async run(sql, params = []) {
    if (isPostgres) {
      let pgSql = formatSqlForPg(sql);
      // If it's an insert and doesn't have RETURNING id, append it to get lastInsertRowid
      const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql);
      if (isInsert && !/RETURNING/i.test(pgSql) && !/ON CONFLICT/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }

      const res = await pgPool.query(pgSql, params);
      const lastId = res.rows && res.rows[0] && res.rows[0].id ? res.rows[0].id : null;
      return {
        lastInsertRowid: lastId,
        changes: res.rowCount
      };
    } else {
      const res = sqliteDb.prepare(sql).run(...params);
      return {
        lastInsertRowid: res.lastInsertRowid,
        changes: res.changes
      };
    }
  },

  async exec(sql) {
    if (isPostgres) {
      await pgPool.query(sql);
    } else {
      sqliteDb.exec(sql);
    }
  }
};

async function initDatabase() {
  if (isPostgres) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL CHECK(category IN ('korpus', 'led', 'blok')),
        name VARCHAR(255) NOT NULL,
        spec VARCHAR(255) NOT NULL DEFAULT '',
        unit VARCHAR(50) NOT NULL DEFAULT 'metr',
        price DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
        material_name VARCHAR(255) NOT NULL,
        spec VARCHAR(255) NOT NULL DEFAULT '',
        old_price DOUBLE PRECISION NOT NULL,
        new_price DOUBLE PRECISION NOT NULL,
        changed_by VARCHAR(100) NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS calculations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        telegram_id VARCHAR(100) DEFAULT '',
        user_name VARCHAR(100) DEFAULT '',
        korpus_data TEXT NOT NULL,
        led_data TEXT NOT NULL,
        blok_data TEXT NOT NULL,
        extra_data TEXT NOT NULL,
        settings_data TEXT NOT NULL,
        material_usd DOUBLE PRECISION NOT NULL,
        brak_usd DOUBLE PRECISION NOT NULL,
        tannarx_usd DOUBLE PRECISION NOT NULL,
        tannarx_uzs DOUBLE PRECISION NOT NULL,
        sotish_usd DOUBLE PRECISION NOT NULL,
        sotish_uzs DOUBLE PRECISION NOT NULL,
        partiya_tannarx_usd DOUBLE PRECISION NOT NULL,
        partiya_tushum_usd DOUBLE PRECISION NOT NULL,
        partiya_foyda_usd DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        telegram_id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT '',
        username VARCHAR(255) NOT NULL DEFAULT '',
        role VARCHAR(50) NOT NULL DEFAULT 'menejer' CHECK(role IN ('admin', 'menejer')),
        is_allowed INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ PostgreSQL jadvallari muvaffaqiyatli tekshirildi/yaratildi.');
  } else {
    sqliteDb.exec(`
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
}

module.exports = {
  db,
  initDatabase,
  isPostgres
};
