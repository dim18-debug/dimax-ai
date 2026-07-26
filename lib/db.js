import { createClient } from "@libsql/client";
import fs from "fs";

// Single shared client across hot-reloads / warm serverless invocations.
const globalForDb = globalThis;

function createDb() {
  // Cloud (Turso) when env is set, otherwise a local SQLite file for dev.
  const url =
    process.env.TURSO_DATABASE_URL ||
    `file:${(process.env.DATA_DIR || "data").replace(/\/$/, "")}/app.db`;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  // Local file mode needs the parent directory to exist.
  if (url.startsWith("file:")) {
    const dir = url.slice("file:".length).replace(/\/[^/]*$/, "");
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  return createClient(authToken ? { url, authToken } : { url });
}

function client() {
  return globalForDb.__dimaxDb || (globalForDb.__dimaxDb = createDb());
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name         TEXT,
  provider     TEXT NOT NULL DEFAULT 'email',
  role         TEXT NOT NULL DEFAULT 'user',
  plan         TEXT NOT NULL DEFAULT 'free',
  blocked      INTEGER NOT NULL DEFAULT 0,
  language     TEXT NOT NULL DEFAULT 'ro',
  theme        TEXT NOT NULL DEFAULT 'dark',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS conversations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  title       TEXT NOT NULL DEFAULT 'Conversație nouă',
  saved       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role            TEXT NOT NULL,
  content         TEXT NOT NULL,
  feedback        INTEGER NOT NULL DEFAULT 0,
  reported        INTEGER NOT NULL DEFAULT 0,
  tokens          INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS usage (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_key  TEXT NOT NULL,
  day       TEXT NOT NULL,
  count     INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_key, day)
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  plan       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  price      REAL NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS payments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  amount     REAL NOT NULL,
  currency   TEXT NOT NULL DEFAULT 'EUR',
  status     TEXT NOT NULL DEFAULT 'paid',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  email      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS errors (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  message    TEXT NOT NULL,
  context    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_msg_conv  ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_usage_key ON usage(user_key, day);
`;

// Run the schema once per process (idempotent; CREATE ... IF NOT EXISTS).
async function migrate() {
  await client().executeMultiple(SCHEMA);
}
export function ensureMigrated() {
  if (!globalForDb.__dimaxMigrated) globalForDb.__dimaxMigrated = migrate();
  return globalForDb.__dimaxMigrated;
}

// ---- async query helpers (SQLite dialect, ? placeholders) ----
export async function one(sql, params = []) {
  await ensureMigrated();
  const rs = await client().execute({ sql, args: params });
  return rs.rows[0];
}
export async function many(sql, params = []) {
  await ensureMigrated();
  const rs = await client().execute({ sql, args: params });
  return rs.rows;
}
export async function run(sql, params = []) {
  await ensureMigrated();
  const rs = await client().execute({ sql, args: params });
  return { lastInsertRowid: rs.lastInsertRowid != null ? Number(rs.lastInsertRowid) : null, rowsAffected: rs.rowsAffected };
}

// ---- settings key/value JSON store ----
export async function getSetting(key, fallback = null) {
  const row = await one("SELECT value FROM settings WHERE key = ?", [key]);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}
export async function setSetting(key, value) {
  await run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, JSON.stringify(value)]
  );
}
export async function logError(message, context = "") {
  try {
    await run("INSERT INTO errors (message, context) VALUES (?, ?)", [
      String(message).slice(0, 500),
      String(context).slice(0, 500),
    ]);
  } catch {
    /* ignore logging failures */
  }
}
