// Central entry to initialize all tables at app start
import { initDB as initProducts } from "./product";
import { initDB as initSales } from "./sales";
import { initDB as initPurchases } from "./purchases";
import { initDB as initCustomers } from "./customers";

export function initializeDatabase() {
  initProducts();
  initSales();
  initPurchases();
  initCustomers();
}
