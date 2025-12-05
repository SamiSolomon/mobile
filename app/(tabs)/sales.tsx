// src/screens/SalesScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
} from "react-native";
import {
  getProductsForSale,
  createSale,
  listRecentSales,
  deleteSaleAndRevertStock,
  lineTotalCents,
  CartLine,
  ProductForSale,
  Sale,
  SaleItem,
} from "../db/sales";
import { ProductRow } from "../db/product";
import ListHeader from "../../components/listHeader";
import ListFooter from "../../components/listFooter";
import dayjs from "dayjs";

type Mode = "cash" | "credit";
const money = (cents: number) => `ETB ${(cents).toFixed(2)}`;
export { money };

function genId(prefix = "") {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

type Cart = {
  id: string;
  name: string;
  items: CartLine[];
};

// at top of SalesScreen (outside component):
const MemoListHeader = React.memo(ListHeader);
const MemoListFooter = React.memo(ListFooter);

export default function SalesScreen() {
  const content = useRef([{ key: "content" }]);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductForSale[]>([]);
  const [suggestions, setSuggestions] = useState<ProductForSale[]>([]);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [activeCartId, setActiveCartId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("cash");
  const [paid, setPaid] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [clickedProductId, setClickedProductId] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<any | null>(null); // NEW

  function rowToForSale(p: ProductRow): ProductForSale {
    return {
      ...p,
      default_selling_price: p.pricePerDozen,
      stock_pieces: p.stockPieces,
      pack_size: p.dozensAvailable,
    };
  }

  const refreshProducts = useCallback(async (query = "") => {
    if (!query) return;
    const rows = getProductsForSale(query);
    const productsForSale = rows.map(rowToForSale);
    setSuggestions(productsForSale);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      refreshProducts(search.trim());
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, refreshProducts]);

  const refreshHistory = useCallback(async () => {
    const rows = listRecentSales();
    setHistory(rows);
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Stable references
  const getActiveCart = useCallback(() => {
    return carts.find((c) => c.id === activeCartId);
  }, [carts, activeCartId]);

  const createNewCart = useCallback((name?: string) => {
    const id = genId("cart_");
    const cart: Cart = { id, name: name ?? `Cart ${carts.length + 1}`, items: [] };
    setCarts((prev) => [...prev, cart]);
    setActiveCartId(id);
    return cart;
  }, [carts, setActiveCartId]);

  const addToCartForId = useCallback((cartId: string, p: ProductForSale) => {
    const productId = p.id;
    setCarts((prev) =>
      prev.map((cart) => {
        if (cart.id !== cartId) return cart;
        const existing = cart.items.find((it) => it.productId === productId);
        if (existing) {
          return {
            ...cart,
            items: cart.items.map((it) =>
              it.productId === productId
                ? { ...it, qty_pieces: it.qty_pieces + p.pack_size }
                : it
            ),
          };
        } else {
          const line: CartLine = {
            productId: productId,
            name: p.name,
            pack_size: p.pack_size,
            price_per_dozen_cents: p.default_selling_price,
            qty_pieces: p.pack_size,
          };
          return { ...cart, items: [...cart.items, line] };
        }
      })
    );
  }, [setCarts]);

  const addToActiveCart = useCallback(
    (p: ProductForSale) => {
      const dozensAvail = Math.floor(p.stock_pieces / p.pack_size);
      if (dozensAvail <= 0) {
        Alert.alert("Out of stock", `${p.name} has no available dozens.`);
        return;
      }
      let cart = getActiveCart();
      if (!cart) cart = createNewCart();
      addToCartForId(cart.id, p);
      setClickedProductId(String(p.id));
      setTimeout(() => setClickedProductId(null), 500);
    },
    [getActiveCart, createNewCart, addToCartForId, setClickedProductId]
  );

  const handleSelectSuggestion = useCallback((p: ProductForSale) => {
    setProducts((prev) => {
      if (prev.some((prod) => prod.id === p.id)) return prev;
      return [...prev, p];
    });
    addToActiveCart(p);
    setSearch("");
    setSuggestions([]);
    Keyboard.dismiss();
  }, [addToActiveCart]);

  // Wrap this function in useCallback
  const deleteProductFromCombinedCart = useCallback((productId: number) => {
    setCarts((prev) =>
      prev.map((cart) => ({
        ...cart,
        items: cart.items.filter((item) => item.productId !== productId),
      }))
    );
  }, [setCarts]);

  const clearAllCarts = useCallback(() => {
    setCarts([]);
    setActiveCartId(null);
  }, [setCarts, setActiveCartId]);

  const combinedLines: CartLine[] = useMemo(() => {
    const map = new Map<number, CartLine>();
    for (const cart of carts) {
      for (const it of cart.items) {
        const existing = map.get(it.productId);
        if (existing) existing.qty_pieces += it.qty_pieces;
        else map.set(it.productId, { ...it });
      }
    }
    return Array.from(map.values());
  }, [carts]);

  const totalCents = useMemo(
    () =>
      combinedLines.reduce(
        (sum, l) => sum + lineTotalCents(l.qty_pieces, l.price_per_dozen_cents, l.pack_size),
        0
      ),
    [combinedLines]
  );

  useEffect(() => {
    if (mode === "cash") {
      const totalCentsNumber = Math.round(totalCents);
      setPaid(totalCentsNumber);
    }
  }, [totalCents, mode]);

  const completeSale = useCallback(async () => {
    if (combinedLines.length === 0) {
      Alert.alert("Cart empty", "Add at least one item before completing the sale.");
      return;
    }
    try {
      const totalCents = combinedLines.reduce(
        (sum, line) =>
          sum + Math.round((line.qty_pieces / line.pack_size) * line.price_per_dozen_cents),
        0
      );
      const paidCents = mode === "cash" ? Math.round(Number(paid || "0")) : 0;
      const sale: Sale = {
        customerName: customerName.trim() || undefined,
        totalCents,
        paidCents,
        isCredit: mode === "credit",
      };
      const items: Omit<SaleItem, "saleId">[] = combinedLines.map((line) => ({
        productId: line.productId,
        dozens: line.qty_pieces / line.pack_size,
        lineTotalCents: Math.round((line.qty_pieces / line.pack_size) * line.price_per_dozen_cents),
      }));
      createSale(sale, items);
      Alert.alert("Sale Complete", "Sale saved successfully.");
      clearAllCarts();
      setPaid(0);
      setCustomerName("");
      setMode("cash");
      await refreshProducts();
      await refreshHistory();
    } catch (err: any) {
      Alert.alert("Error", err.message || String(err));
    }
  }, [combinedLines, paid, mode, customerName, clearAllCarts, refreshProducts, refreshHistory]);

  const handleDeleteSale = useCallback(async (id: number) => {
    Alert.alert("Confirm", "Delete sale and revert stock?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSaleAndRevertStock(id);
          refreshProducts(search);
          refreshHistory();
        },
      },
    ]);
  }, [refreshProducts, search, refreshHistory]);

  const handleSearchProduct = useCallback(async () => {
    const q = search.trim();
    if (!q) {
      Alert.alert("Enter product name to search.");
      return;
    }
    const localMatch: ProductRow | undefined = products.find(
      (p) => p.name.toLowerCase() === q.toLowerCase()
    );
    if (localMatch) {
      addToActiveCart(rowToForSale(localMatch));
      setSearch("");
      Keyboard.dismiss();
      return;
    }
    const found = await getProductsForSale(q);
    if (!found.length) {
      Alert.alert("Not found", `No product matched "${q}"`);
      return;
    }
    const product = rowToForSale(found[0]);
    setProducts((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
    addToActiveCart(product);
    setSearch("");
    Keyboard.dismiss();
  }, [search, products, addToActiveCart]);

  const isCompleteDisabled =
    (mode === "cash" && (!paid || Number(paid) <= 0)) || combinedLines.length === 0;

  const renderProductItem = useCallback(
    (item: ProductForSale) => {
      const dozensAvail = Math.floor(item.stock_pieces);
      const disabled = dozensAvail <= 0;
      const clicked = clickedProductId === item.id.toString();
      return (
        <View key={item.id} style={styles.productCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.metaText}>{`${dozensAvail} dozens available`}</Text>
          </View>
          <Pressable
            onPress={() => addToActiveCart(item)}
            disabled={disabled}
            style={[styles.addBtn, clicked && styles.addBtnActive, disabled && styles.addBtnDisabled]}
          >
            <Text
              style={[
                styles.addBtnText,
                clicked && { color: "#fff" },
                disabled && { color: "#9aa0a6" },
              ]}
            >
              ＋
            </Text>
          </Pressable>
          <TouchableOpacity
            onPress={() => setProducts((prev) => prev.filter((p) => p.id !== item.id))}
            style={[styles.deleteBtn, { marginLeft: 8 }]}
          >
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
      );
    },
    [clickedProductId, addToActiveCart]
  );

  const renderCombinedCartItem = useCallback(
    (item: CartLine) => {
      const lineCents = lineTotalCents(item.qty_pieces, item.price_per_dozen_cents, item.pack_size);
      const dozens = item.qty_pieces / item.pack_size;
      return (
        <View key={item.productId} style={styles.cartCardItem}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.cartItemName}>{item.name}</Text>
            <TouchableOpacity onPress={() => deleteProductFromCombinedCart(item.productId)}>
              <Text style={styles.deleteText}>🗑</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.unitPrice}>ETB {(item.price_per_dozen_cents).toFixed(0)}/dozen</Text>
          <View style={styles.qtyRow}>
            <Pressable
              style={styles.qtyBtn}
              onPress={() =>
                setCarts((prev) =>
                  prev.map((cart) => ({
                    ...cart,
                    items: cart.items.map((it) =>
                      it.productId === item.productId && it.qty_pieces > item.pack_size
                        ? { ...it, qty_pieces: it.qty_pieces - item.pack_size }
                        : it
                    ),
                  }))
                )
              }
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qtyText}>{dozens} dozen</Text>
            <Pressable
              style={styles.qtyBtn}
              onPress={() =>
                setCarts((prev) =>
                  prev.map((cart) => ({
                    ...cart,
                    items: cart.items.map((it) =>
                      it.productId === item.productId
                        ? { ...it, qty_pieces: it.qty_pieces + item.pack_size }
                        : it
                    ),
                  }))
                )
              }
            >
              <Text style={styles.qtyBtnText}>＋</Text>
            </Pressable>
          </View>
          <Text style={styles.itemTotal}>ETB {(lineCents).toFixed(2)}</Text>
        </View>
      );
    },
    [deleteProductFromCombinedCart]
  );

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <FlatList
        data={content.current}
        renderItem={() => null}
        ListHeaderComponent={
          <MemoListHeader
            search={search}
            setSearch={setSearch}
            suggestions={suggestions}
            handleSelectSuggestion={handleSelectSuggestion}
            products={products}
            renderProductItem={renderProductItem}
            setProducts={setProducts}
            combinedLines={combinedLines}
            renderCombinedCartItem={renderCombinedCartItem}
            clearAllCarts={clearAllCarts}
            totalCents={totalCents}
            handleSearchProduct={handleSearchProduct}
          />
        }
        ListFooterComponent={
          <MemoListFooter
            customerName={customerName}
            setCustomerName={setCustomerName}
            mode={mode}
            setMode={setMode}
            paid={paid}
            setPaid={setPaid}
            completeSale={completeSale}
            isCompleteDisabled={isCompleteDisabled}
            history={history}
            handleDeleteSale={handleDeleteSale}
            onSelectSale={setSelectedSale} // pass modal setter
          />
        }
        keyboardShouldPersistTaps="handled"
      />

      {/* Sale Details Modal */}
      <Modal
        visible={!!selectedSale}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSale(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedSale?.customerName ?? "Cash Sale"}
            </Text>
            <Text style={styles.modalSub}>
              {dayjs(selectedSale?.createdAt).format("YYYY-MM-DD HH:mm")}
            </Text>

            <ScrollView style={{ marginTop: 12 }}>
              {selectedSale?.items.map((it: any, idx: number) => (
                <View key={it.id}>
                  <View style={styles.detailCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailName}>{it.product.name}</Text>
                      <Text style={styles.detailQty}>
                        {it.dozens} dozen × ETB {it.product.pricePerDozen.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.detailTotal}>{money(it.lineTotalCents)}</Text>
                  </View>
                  {idx < selectedSale.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Paid</Text>
                <Text style={styles.summaryValue}>
                  {money(selectedSale?.paidCents ?? 0)}
                </Text>
              </View>
            </View>

            <Pressable style={styles.closeBtn} onPress={() => setSelectedSale(null)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
  },
  productName: { fontWeight: "600", fontSize: 14 },
  metaText: { fontSize: 12, color: "#666" },
  addBtn: {
    backgroundColor: "#e0e0e0",
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  addBtnActive: { backgroundColor: "#28a745" },
  addBtnDisabled: { backgroundColor: "#ccc" },
  addBtnText: { fontWeight: "700", fontSize: 16 },
  deleteBtn: { padding: 4 },
  deleteText: { color: "red", fontWeight: "700" },
  cartCardItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 12,
  },
  unitPrice: { fontSize: 12, color: "#666", marginBottom: 4 },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  qtyBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyBtnText: { fontSize: 16, fontWeight: "700" },
  qtyText: { marginHorizontal: 12, fontSize: 14 },
  itemTotal: { fontWeight: "600", textAlign: "right", marginTop: 4 },
  cartItemName: { fontWeight: "500" },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalSub: { fontSize: 12, color: "#6B7280", marginBottom: 12 },
  detailCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  detailName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  detailQty: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  detailTotal: { fontSize: 15, fontWeight: "700", color: "#16A34A" },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 6,
  },
  summaryBox: {
    marginTop: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  summaryLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  summaryValue: { fontSize: 14, fontWeight: "700", color: "#111827" },
  closeBtn: {
    marginTop: 16,
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
