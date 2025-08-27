import { openDatabaseSync } from "expo-sqlite";

// This will create (or open) a persistent DB file named "shop.db"
export type Product = {
  id?: number;
  name: string;
  unitSize: number;           // pieces per dozen-equivalent (default 12)
  pricePerDozen: number;      // selling price per dozen
  costPerDozen?: number;      // optional (for margin)
  stockPieces: number;        // total pieces in stock
  lowStockThreshold?: number; // when to show Low Stock badge
  createdAt?: string;
  updatedAt?: string;
};

const db = openDatabaseSync("shop.db");

export function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unitSize INTEGER NOT NULL,
      pricePerDozen REAL NOT NULL,
      costPerDozen REAL,
      stockPieces INTEGER NOT NULL,
      lowStockThreshold INTEGER DEFAULT 12,
      createdAt TEXT,
      updatedAt TEXT
    );
  `);
}

export function getProducts(): Product[] {
  return db.getAllSync<Product>(
    `SELECT * FROM products ORDER BY id DESC;`
  );
}

export function insertProduct(p: Product): number {
  const now = new Date().toISOString();
  const stmt = db.prepareSync(`
    INSERT INTO products 
      (name, unitSize, pricePerDozen, costPerDozen, stockPieces, lowStockThreshold, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `);

  const result = stmt.executeSync([
    p.name.trim(),
    p.unitSize,
    p.pricePerDozen,
    p.costPerDozen ?? null,
    p.stockPieces,
    p.lowStockThreshold ?? 12,
    now,
    now,
  ]);

  return result.lastInsertRowId!;
}

export function updateProduct(p: Product): void {
  if (!p.id) throw new Error("Missing product id");
  const now = new Date().toISOString();

  const stmt = db.prepareSync(`
    UPDATE products
      SET name=?, unitSize=?, pricePerDozen=?, costPerDozen=?, stockPieces=?, lowStockThreshold=?, updatedAt=?
    WHERE id=?;
  `);

  stmt.executeSync([
    p.name.trim(),
    p.unitSize,
    p.pricePerDozen,
    p.costPerDozen ?? null,
    p.stockPieces,
    p.lowStockThreshold ?? 12,
    now,
    p.id,
  ]);
}

export function deleteProduct(id: number): void {
  const stmt = db.prepareSync(`DELETE FROM products WHERE id=?;`);
  stmt.executeSync([id]);
}

