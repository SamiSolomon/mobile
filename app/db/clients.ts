// src/db/client.ts
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'shopdozen.db';
const db = SQLite.openDatabase(DB_NAME);

// small uuid util for local ids (sufficient for local offline)
export function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// exec helper returning the raw result
export function execAsync(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_tx, result) => resolve(result),
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

const SCHEMA = `
PRAGMA foreign_keys = ON;

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
  purchase_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  qty_pieces INTEGER NOT NULL,
  landed_unit_cost_cents INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  total_cents INTEGER NOT NULL,
  paid_cents INTEGER NOT NULL,
  status TEXT NOT NULL,
  sold_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_lines (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  qty_pieces INTEGER NOT NULL,
  line_total_cents INTEGER NOT NULL,
  cogs_cents INTEGER NOT NULL,
  profit_cents INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
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
  customer_id TEXT NOT NULL,
  sale_id TEXT,
  type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  due_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  sale_id TEXT,
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

export async function initializeDatabase() {
  // split statements and run them
  const stmts = SCHEMA.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
  for (const s of stmts) {
    // ensure each statement executes
    // add trailing semicolon to avoid problems
    // for large schema you may want to batch; this simple loop is fine.
    await execAsync(s + ';');
  }

  // seed settings and a sample product if empty
  const rSettings = await execAsync('SELECT COUNT(*) as c FROM settings');
  // expo-sqlite result: rSettings.rows.item(0).c
  const cSettings = rSettings.rows.item(0).c ?? 0;
  if (!cSettings) {
    await execAsync('INSERT INTO settings (id, currency, low_stock_default) VALUES (1, ?, ?)', ['ETB', 12]);
  }

  const rProd = await execAsync('SELECT COUNT(*) as c FROM products');
  const cProd = rProd.rows.item(0).c ?? 0;
  if (!cProd) {
    const now = Date.now();
    await execAsync(
      `INSERT INTO products (id, name, pack_size, reorder_level, default_selling_price, avg_cost_per_piece, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), 'Eggs (dozen)', 12, 12, 0, 0, now, now]
    );
  }
}

export { db, execAsync };
