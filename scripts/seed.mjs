// Seed an admin account. Works against a local file or Turso (via env).
// Usage: npm run seed
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import fs from "fs";

const url =
  process.env.TURSO_DATABASE_URL ||
  `file:${(process.env.DATA_DIR || "data").replace(/\/$/, "")}/app.db`;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (url.startsWith("file:")) {
  const dir = url.slice("file:".length).replace(/\/[^/]*$/, "");
  if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
const db = createClient(authToken ? { url, authToken } : { url });

await db.execute(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL, password_hash TEXT, name TEXT,
  provider TEXT NOT NULL DEFAULT 'email', role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'free', blocked INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'ro', theme TEXT NOT NULL DEFAULT 'dark',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

const email = (process.env.ADMIN_EMAIL || "admin@smartai.local").toLowerCase();
const password = process.env.ADMIN_PASSWORD || "admin123";
const hash = await bcrypt.hash(password, 10);

const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] });
if (existing.rows.length) {
  await db.execute({
    sql: "UPDATE users SET role='admin', password_hash=? WHERE email=?",
    args: [hash, email],
  });
  console.log(`✓ Cont admin actualizat: ${email}`);
} else {
  await db.execute({
    sql: "INSERT INTO users (email, password_hash, name, role, plan) VALUES (?, ?, 'Administrator', 'admin', 'premium')",
    args: [email, hash],
  });
  console.log(`✓ Cont admin creat: ${email} / ${password}`);
}
console.log("Autentifică-te la /login și accesează /admin.");
