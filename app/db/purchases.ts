import { openDatabaseSync } from "expo-sqlite";

const db = openDatabaseSync("alem.db");

export type Purchase = {
  id?: number;
  productId: number;
  quantityPieces: number;   // number of pieces purchased
  costPerDozen: number;     // landed cost (per dozen)
  createdAt?: string;
};

export function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL,
      quantityPieces INTEGER NOT NULL,
      costPerDozen REAL NOT NULL,
      createdAt TEXT,
      FOREIGN KEY (productId) REFERENCES products(id)
    );
  `);
}

export function insertPurchase(p: Purchase): number {
  const now = new Date().toISOString();
  const stmt = db.prepareSync(`
    INSERT INTO purchases (productId, quantityPieces, costPerDozen, createdAt)
    VALUES (?, ?, ?, ?);
  `);

  const result = stmt.executeSync([p.productId, p.quantityPieces, p.costPerDozen, now]);
  return result.lastInsertRowId!;
}

export function getPurchases(): Purchase[] {
  return db.getAllSync<Purchase>(`SELECT * FROM purchases ORDER BY id DESC;`);
}
