import React, { memo } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  name: string;
  pricePerDozen: number;
  costPerDozen?: number;
  stockPieces: number;
  lowStockThreshold?: number;
  onEdit: () => void;
  onSell?: () => void;
};

const ProductCard = ({
  name,
  pricePerDozen,
  costPerDozen,
  stockPieces,
  lowStockThreshold = 12,
  onEdit,
  onSell,
}: Props) => {
  const outOfStock = stockPieces === 0;
  const lowStock = stockPieces > 0 && stockPieces <= lowStockThreshold;
  const inStock = stockPieces > lowStockThreshold;

  const marginPct =
    costPerDozen && costPerDozen > 0
      ? Math.round(((pricePerDozen - costPerDozen) / pricePerDozen) * 1000) / 10
      : undefined;

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.productName}>{name}</Text>
          <View style={styles.metaContainer}>
            {outOfStock && (
              <View style={[styles.badge, styles.outBadge]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#fff" />
                <Text style={[styles.badgeText, styles.badgeTextWhite]}>Out of Stock</Text>
              </View>
            )}
            {lowStock && (
              <View style={[styles.badge, styles.lowStockBadge]}>
                <MaterialCommunityIcons name="alert-outline" size={16} color="#374151" />
                <Text style={[styles.badgeText, styles.badgeTextGray]}>Low Stock</Text>
              </View>
            )}
            {inStock && (
              <View style={[styles.badge, styles.inStockBadge]}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color="#fff" />
                <Text style={[styles.badgeText, styles.badgeTextWhite]}>In Stock</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="cube-outline" size={22} color="#6B7280" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.details}>
        <View>
          <Text style={styles.label}>Stock:</Text>
          <Text style={styles.value}>{stockPieces}</Text>
          <Text style={styles.totalPieces}>Total: {stockPieces} pieces</Text>
        </View>
        <View style={styles.priceInfo}>
          <Text style={styles.label}>Price/dozen:</Text>
          <Text style={styles.priceValue}>ETB {pricePerDozen.toFixed(2)}</Text>
          {marginPct != null && <Text style={styles.marginText}>{marginPct}% margin</Text>}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.buttonContainer}>
        <Pressable style={styles.editButton} onPress={onEdit}>
          <MaterialCommunityIcons name="pencil" size={18} color="#111827" />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.sellButton, outOfStock && styles.sellButtonDisabled]}
          onPress={!outOfStock ? onSell : undefined}
        >
          <MaterialCommunityIcons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.sellButtonText}>Sell</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default memo(ProductCard);

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  productName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  metaContainer: { flexDirection: "row", marginTop: 8, gap: 8, flexWrap: "wrap" },

  // badges
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 6,
  },
  inStockBadge: { backgroundColor: "#16A34A" }, // green
  lowStockBadge: { backgroundColor: "#F3F4F6" }, // light gray
  outBadge: { backgroundColor: "#DC2626" }, // red

  // text styles
  badgeText: { fontSize: 13, fontWeight: "700" },
  badgeTextWhite: { color: "#fff" },
  badgeTextGray: { color: "#374151" },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  details: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  label: { fontSize: 13, color: "#6B7280" },
  value: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 2 },
  totalPieces: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  priceInfo: { alignItems: "flex-end" },
  priceValue: { fontSize: 18, fontWeight: "700", color: "#111827", marginTop: 2 },
  marginText: { fontSize: 12, color: "#059669", marginTop: 2, fontWeight: "600" },

  buttonContainer: { flexDirection: "row", gap: 10 },
  editButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  editText: { color: "#111827", fontWeight: "700" },
  sellButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  sellButtonDisabled: { backgroundColor: "#9CA3AF" },
  sellButtonText: { color: "white", fontWeight: "700" },
});
