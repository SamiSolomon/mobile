 // src/db/client.ts
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'shopdozen.db';

// Use openDatabaseAsync for the modern API
const dbPromise = SQLite.openDatabaseAsync(DB_NAME);
let _db: SQLite.SQLiteDatabase | null = null; // To hold the resolved database instance

// Function to get the initialized database instance
 async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await dbPromise;
  }
  return _db;
}

// small uuid util for local ids
export function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Execute SQL that doesn't return data (INSERT, UPDATE, DELETE, CREATE)
async function execAsync(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
  const db = await getDb();
  return db.runAsync(sql, params);
}

// Query multiple rows
async function allAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  return db.getAllAsync<T>(sql, params);
}

// Query single row
 async function getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
  const db = await getDb();
  return db.getFirstAsync<T>(sql, params);
}

// Full database schema (all tables intact)
const SCHEMA = `
PRAGMA foreign_keys = ON; -- Ensure foreign keys are enabled at the start of schema

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pack_size INTEGER NOT NULL DEFAULT 12,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  default_selling_price INTEGER NOT NULL DEFAULT 0,
  avg_cost_per_piece INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  supplier_name TEXT,
  purchased_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_lines (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  qty_pieces INTEGER NOT NULL,
  landed_unit_cost_cents INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id), -- customer_id can be null if not associated with a specific customer
  total_cents INTEGER NOT NULL,
  paid_cents INTEGER NOT NULL,
  status TEXT NOT NULL,
  sold_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_lines (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  qty_pieces INTEGER NOT NULL,
  line_total_cents INTEGER NOT NULL,
  cogs_cents INTEGER NOT NULL,
  profit_cents INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  type TEXT NOT NULL,
  qty_pieces INTEGER NOT NULL,
  ref_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  sale_id TEXT REFERENCES sales(id),
  type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  due_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL, -- if a sale is deleted, payment record might still be relevant
  amount_cents INTEGER NOT NULL,
  method TEXT NOT NULL,
  paid_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id=1),
  currency TEXT DEFAULT 'ETB',
  low_stock_default INTEGER DEFAULT 12
);
`;

// Initialize DB
export async function initializeDatabase() {
  const db = await getDb();

  // Execute all schema statements in one go for atomicity and simplicity with new API
  await db.execAsync(SCHEMA);

  // Seed settings if not exists
  const rSettings = await getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM settings');
  if (!rSettings?.c) {
    await execAsync('INSERT INTO settings (id, currency, low_stock_default) VALUES (1, ?, ?)', [
      'ETB',
      12
    ]);
  }
}

// Export functions for interaction, and a way to get the db instance if direct access is needed
export  { execAsync, allAsync, getFirstAsync, getDb };