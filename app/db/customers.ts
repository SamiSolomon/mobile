import { openDatabaseSync } from "expo-sqlite";

const db = openDatabaseSync("alem.db");

export type Customer = {
  id?: number;
  name: string;
  phone?: string;
  balanceCents: number;  // positive = they owe us, negative = we owe them
  createdAt?: string;
};

export function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      balanceCents INTEGER DEFAULT 0,
      createdAt TEXT
    );
  `);
}

export function insertCustomer(c: Customer): number {
  const now = new Date().toISOString();
  const stmt = db.prepareSync(`
    INSERT INTO customers (name, phone, balanceCents, createdAt)
    VALUES (?, ?, ?, ?);
  `);

  const result = stmt.executeSync([c.name, c.phone ?? null, c.balanceCents ?? 0, now]);
  return result.lastInsertRowId!;
}

export function getCustomers(): Customer[] {
  return db.getAllSync<Customer>(`SELECT * FROM customers ORDER BY id DESC;`);
}
