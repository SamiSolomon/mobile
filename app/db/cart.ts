import { db } from "./clients";

// Add single piece
export async function addProductToCart(productId: number) {
  const existing = await db.getFirstAsync<any>(
    `SELECT * FROM cart WHERE product_id = ?`,
    [productId]
  );
  if (existing) {
    await db.runAsync(
      `UPDATE cart SET piece_quantity = piece_quantity + 1 WHERE product_id = ?`,
      [productId]
    );
  } else {
    await db.runAsync(
      `INSERT INTO cart (product_id, dozen_quantity, piece_quantity) VALUES (?, 0, 1)`,
      [productId]
    );
  }
}

// Add one dozen
export async function addDozenToCart(productId: number) {
  const existing = await db.getFirstAsync<any>(
    `SELECT * FROM cart WHERE product_id = ?`,
    [productId]
  );
  if (existing) {
    await db.runAsync(
      `UPDATE cart SET dozen_quantity = dozen_quantity + 1 WHERE product_id = ?`,
      [productId]
    );
  } else {
    await db.runAsync(
      `INSERT INTO cart (product_id, dozen_quantity, piece_quantity) VALUES (?, 1, 0)`,
      [productId]
    );
  }
}

// Delete product from cart
export async function deleteProductFromCombinedCart(productId: number) {
  await db.runAsync(`DELETE FROM cart WHERE product_id = ?`, [productId]);
}

// Clear all
export async function clearAllCarts() {
  await db.runAsync(`DELETE FROM cart`);
}

// Get combined items
export async function getCombinedCartItems() {
  return db.getAllAsync<any>(`
    SELECT c.product_id, p.name,
           c.dozen_quantity, c.piece_quantity
    FROM cart c
    JOIN products p ON p.id = c.product_id
  `);
}
