import { useEffect, useState, useCallback } from 'react';
import { getProductsWithStock, ProductRow } from '../app/db/product';

export function useProducts() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = await getProductsWithStock();
    setProducts(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { products, refresh, loading };
}
