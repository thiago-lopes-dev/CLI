// =============================================================================
// db/database.js — Inicialização e migrations do banco SQLite
// =============================================================================

import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// ─── Caminho do banco de dados ────────────────────────────────────────────────
const DATA_DIR = join(homedir(), '.taskr')
const DB_PATH  = join(DATA_DIR, 'taskr.db')

let db = null

// ─── Migrations ordenadas ─────────────────────────────────────────────────────
const MIGRATIONS = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS projects (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL UNIQUE,
        description TEXT,
        color       TEXT    NOT NULL DEFAULT '#6366f1',
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT    NOT NULL,
        description TEXT,
        status      TEXT    NOT NULL DEFAULT 'todo'
                            CHECK(status IN ('todo', 'doing', 'done', 'cancelled')),
        priority    TEXT    NOT NULL DEFAULT 'medium'
                            CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        project_id  INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        due_date    TEXT,
        tags        TEXT    DEFAULT '[]',
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority   ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date   ON tasks(due_date);
    `
  }
]

// ─── Inicialização ────────────────────────────────────────────────────────────
export function initDatabase() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations()
  return db
}

// ─── Migrations ───────────────────────────────────────────────────────────────
function runMigrations() {
  // Garante que a tabela de controle existe antes de consultar
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const appliedVersions = db
    .prepare('SELECT version FROM schema_migrations')
    .all()
    .map(r => r.version)

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.includes(migration.version)) {
      db.exec(migration.up)
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)')
        .run(migration.version)
    }
  }
}

// ─── Acesso ao singleton ──────────────────────────────────────────────────────
export function getDb() {
  if (!db) throw new Error('Banco de dados não inicializado. Chame initDatabase() primeiro.')
  return db
}
