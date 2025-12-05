import React, { FC, JSX, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { CartLine, ProductForSale } from "../app/db/sales";
import { money } from "../app/(tabs)/sales"; // assuming you'll export this from SalesScreen
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ListHeaderProps {
  search: string;
  setSearch: (text: string) => void;
  suggestions: ProductForSale[];
  handleSelectSuggestion: (p: ProductForSale) => void;
  products: ProductForSale[];
  renderProductItem: (item: ProductForSale) => JSX.Element;
  setProducts: (products: ProductForSale[]) => void;
  combinedLines: CartLine[];
  renderCombinedCartItem: (item: CartLine) => JSX.Element;
  clearAllCarts: () => void;
  totalCents: number;
  handleSearchProduct: () => void;
}

const ListHeader: FC<ListHeaderProps> = ({
  search,
  setSearch,
  suggestions,
  handleSelectSuggestion,
  products,
  renderProductItem,
  setProducts,
  combinedLines,
  renderCombinedCartItem,
  clearAllCarts,
  totalCents,
  handleSearchProduct,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.headerContainer}>
      {/* 🔍 Search bar + add button */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
            <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search products..."
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={handleSearchProduct}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          {/* 🔽 Suggestions dropdown */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionBox}>
              {suggestions.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handleSelectSuggestion(p)}
                  style={styles.suggestionItem}
                >
                  <Text>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Pressable onPress={handleSearchProduct} style={styles.searchBtn}>
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text style={{ color: "white", fontWeight: "600" }}>Add</Text>
        </Pressable>
      </View>

      {/* 📦 Selected Products */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Selected Products</Text>
        {products.length === 0 ? (
          <Text style={styles.muted}>No products selected.</Text>
        ) : (
          products.map((item, index) => (
            <React.Fragment key={item.id}>
              {renderProductItem(item)}
              {index < products.length - 1 && <View style={{ height: 8 }} />}
            </React.Fragment>
          ))
        )}
        {products.length > 0 && (
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
            <TouchableOpacity onPress={() => setProducts([])} style={styles.deleteAllBtn}>
              <Text style={styles.deleteText}>Delete All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.lineBreak} />

      {/* 🛒 Carts */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardTitle}>Carts ({combinedLines.length})</Text>
          <TouchableOpacity onPress={clearAllCarts}>
            <Text style={styles.deleteText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        {combinedLines.length === 0 ? (
          <Text style={styles.muted}>No items in cart.</Text>
        ) : (
          combinedLines.map(renderCombinedCartItem)
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{money(totalCents)}</Text>
        </View>
      </View>

      <View style={styles.lineBreak} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: { padding: 16 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB", // gray default
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: "#fff",
  },
  searchBoxFocused: {
    borderColor: "#16A34A", // green when focused
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 6,
    color: "#111827",
  },

  searchBtn: {
   backgroundColor: "#16A34A",
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontWeight: "700", fontSize: 16, marginBottom: 8 },
  deleteText: { color: "red", fontWeight: "700" },
  deleteAllBtn: { padding: 4, alignSelf: "flex-end" },
  muted: { color: "#999", fontStyle: "italic", padding: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  totalLabel: { fontWeight: "700", fontSize: 16 },
  totalValue: { fontWeight: "700", fontSize: 16 },
  lineBreak: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  suggestionBox: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    zIndex: 999,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

export default ListHeader;
