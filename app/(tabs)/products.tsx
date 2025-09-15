import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ProductCard from "../../components/productCard";
import ProductFormModal from "../../components/productform";
import { initDB, getProducts, insertProduct, updateProduct, type Product } from "../db/product";
import { router } from "expo-router";

type Filter = "all" | "low" | "out";

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    (async () => {
            initDB();
      await refresh();
    })();
  }, []);

  async function refresh() {
    const list = await getProducts();
    setProducts(list);
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setModalOpen(true);
  }

  function handleSubmit(form: any) {
    if (form.id) {
      updateProduct(form);
    } else {
      insertProduct(form);
    }
    setModalOpen(false);
    setEditing(null);
     refresh();
  }

  // Derived lists
  const filtered = useMemo(() => {
    let data = products;
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(p => p.name.toLowerCase().includes(q));
    }
    if (filter === "low") {
      data = data.filter(p => p.stockPieces > 0 && p.stockPieces <= (p.lowStockThreshold ?? 12));
    } else if (filter === "out") {
      data = data.filter(p => p.stockPieces === 0);
    }
    return data;
  }, [products, query, filter]);

  const counts = useMemo(() => {
    const low = products.filter(p => p.stockPieces > 0 && p.stockPieces <= (p.lowStockThreshold ?? 12)).length;
    const out = products.filter(p => p.stockPieces === 0).length;
    return { all: products.length, low, out };
  }, [products]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Products</Text>
      <Text style={styles.subtitle}>{products.length} product{products.length === 1 ? "" : "s"} in inventory</Text>

      {/* Search + Add */}
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search products..."
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        <Pressable onPress={openAdd} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      {/* Filter chips */}
      <View style={styles.chips}>
        <Chip label={`All (${counts.all})`} active={filter==="all"} onPress={()=>setFilter("all")} />
        <Chip label={`Low Stock (${counts.low})`} active={filter==="low"} onPress={()=>setFilter("low")} />
        <Chip label={`Out of Stock (${counts.out})`} active={filter==="out"} onPress={()=>setFilter("out")} />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item)=>String(item.id)}
        renderItem={({ item }) => (
          <ProductCard
            name={item.name}
            pricePerDozen={item.pricePerDozen}
            costPerDozen={item.costPerDozen}
            stockPieces={item.stockPieces}
            lowStockThreshold={item.lowStockThreshold}
            onEdit={()=>openEdit(item)}
            onSell={()=>{ router.push('/(tabs)/sales')}}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 24 }}>
            <Text style={{ color: "#6B7280" }}>
              No products yet. Tap <Text style={{ fontWeight: "700" }}>Add</Text> to create your first product.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* Add/Edit Modal */}
      <ProductFormModal
        visible={modalOpen}
        initial={editing ?? undefined}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

/** Small chip pill */
function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginTop: 8, marginHorizontal: 16 },
  subtitle: { fontSize: 14, color: "#6B7280", marginHorizontal: 16, marginBottom: 12 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 12 },
  search: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB",
    paddingHorizontal: 10, height: 44,
  },
  searchInput: { flex: 1, fontSize: 16 },
  addButton: {
    backgroundColor: "#16A34A", height: 44, paddingHorizontal: 16,
    borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  chips: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#F3F4F6", borderRadius: 999 },
  chipActive: { backgroundColor: "#E0F2FE", borderColor: "#0284C7" },
  chipText: { color: "#374151", fontSize: 12 },
  chipTextActive: { color: "#075985", fontWeight: "700" },
});
