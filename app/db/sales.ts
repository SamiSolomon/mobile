// src/data/sales.ts
import { openDatabaseSync } from "expo-sqlite";
import { Product, ProductRow } from "./product";

export const db = openDatabaseSync("alem.db");

// --- Types ---
export type Sale = {
  id?: number;
  customerName?: string;
  totalCents: number;
  paidCents: number;
  isCredit: boolean;
  createdAt?: string;
};

export type SaleItem = {
  id?: number;
  saleId: number;
  productId: number;
  dozens: number;
  lineTotalCents: number;
};

export type ProductForSale = Product & {
  default_selling_price: number; // per dozen in cents
  stock_pieces: number;
  pack_size: number; // e.g., 12
};

export type CartLine = {
  productId: number;
  name: string;
  pack_size: number;
  price_per_dozen_cents: number;
  qty_pieces: number;
};


// --- DB Initialization ---
export function initDB(): void {

  db.execSync(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerName TEXT,
      totalCents INTEGER NOT NULL,
      paidCents INTEGER NOT NULL,
      isCredit INTEGER NOT NULL,
      createdAt TEXT
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      dozens INTEGER NOT NULL,
      lineTotalCents INTEGER NOT NULL,
      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id)
    );
  `);
}

// --- Utility ---
export function lineTotalCents(qty_pieces: number, pricePerDozen: number, pack_size: number): number {
  return Math.round((qty_pieces / pack_size) * pricePerDozen);
}

// --- Delete sale and revert stock correctly ---
export function deleteSaleAndRevertStock(saleId: number) {
  // Get all sale items
  const items = db.getAllSync<SaleItem>(
    `SELECT * FROM sale_items WHERE saleId = ?`,
    [saleId]
  );

  // Update stockPieces (correct column) instead of non-existent 'stock'
  const updateStmt = db.prepareSync(
    `UPDATE products SET stockPieces = stockPieces + ? WHERE id = ?`
  );

  for (const it of items) {
    updateStmt.executeSync([it.dozens, it.productId]);
  }

  // Delete sale, sale_items will cascade if foreign key ON DELETE CASCADE
  const deleteStmt = db.prepareSync(`DELETE FROM sales WHERE id = ?`);
  deleteStmt.executeSync([saleId]);
}

// --- Create sale correctly ---
export function createSale(
  sale: Sale,
  items: Omit<SaleItem, "saleId">[]
): number {
  const now = new Date().toISOString();
  const stmt = db.prepareSync(`
    INSERT INTO sales (customerName, totalCents, paidCents, isCredit, createdAt)
    VALUES (?, ?, ?, ?, ?);
  `);

  const result = stmt.executeSync([
    sale.customerName ?? null,
    sale.totalCents,
    sale.paidCents,
    sale.isCredit ? 1 : 0,
    now,
  ]);

  const saleId = result.lastInsertRowId!;

  const itemStmt = db.prepareSync(`
    INSERT INTO sale_items (saleId, productId, dozens, lineTotalCents)
    VALUES (?, ?, ?, ?);
  `);

   const updateStockStmt = db.prepareSync(`
    UPDATE products SET stockPieces = stockPieces - ? WHERE id = ?
  `);

  for (const it of items) {
    itemStmt.executeSync([saleId, it.productId, it.dozens, it.lineTotalCents]);
    // Subtract the actual quantity sold from stockPieces
    updateStockStmt.executeSync([it.dozens, it.productId]);

  }

  return saleId;
}

export function getSalesWithDetails() {
  const sales = db.getAllSync<Sale>(`SELECT * FROM sales ORDER BY id DESC`);
  return sales.map((s) => {
    if (!s.id) throw new Error("Sale ID missing");

    const items = db.getAllSync<SaleItem>(`SELECT * FROM sale_items WHERE saleId = ?`, [s.id]);
    const detailedItems = items.map((it) => {
      const product = db.getFirstSync<Product>(`SELECT * FROM products WHERE id = ?`, [it.productId]);
      return { ...it, product: product! };
    });

    return { ...s, items: detailedItems };
  });
}



// --- Product Query for Sales ---
export function getProductsForSale(query: string): ProductRow[] {
  const q = query.trim().toLowerCase();

  const rows = q
    ? db.getAllSync<Product>(
        `SELECT * FROM products WHERE LOWER(name) LIKE ? ORDER BY id DESC;`,
        [`%${q}%`]
      )
    : db.getAllSync<Product>(
        `SELECT * FROM products ORDER BY id DESC;`
      );

  return rows.map((p) => ({
    ...p,
    dozensAvailable: p.stockPieces,
  }));
}

export const listRecentSales = getSalesWithDetails;

export function listCreditSales() {
  return getSalesWithDetails().filter((s) => s.isCredit);
}

