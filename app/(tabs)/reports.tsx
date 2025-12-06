import React, {
  useEffect,
  useState,
  ComponentProps,
  useCallback,
} from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useClerk } from "@clerk/clerk-expo";
import { useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { getSalesWithDetails } from "../db/sales";

dayjs.extend(isBetween);

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
const money = (amount: number) => `ETB ${amount.toFixed(2)}`;

type Metric = {
  label: string;
  value: string;
  sub?: string;
  icon: IconName;
  color: string;
};

export default function ReportsScreen() {
  const { signOut } = useClerk();
  const [sales, setSales] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [range, setRange] = useState<"today" | "week" | "month" | "year">(
    "today"
  );
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // ✅ for pull-to-refresh

  // ✅ Centralized function to load + filter + compute metrics
  const loadData = useCallback(() => {
    const allSales = getSalesWithDetails();
    const now = dayjs();
    let start = now.startOf("day");
    let end = now.endOf("day");

    if (range === "week") {
      start = now.startOf("week");
      end = now.endOf("week");
    } else if (range === "month") {
      start = now.startOf("month");
      end = now.endOf("month");
    } else if (range === "year") {
      start = now.startOf("year");
      end = now.endOf("year");
    }

    const filtered = allSales.filter(
      (s) =>
        dayjs(s.createdAt).isBetween(start, end, null, "[]") &&
        (customerSearch.trim()
          ? (s.customerName ?? "Cash")
              .toLowerCase()
              .includes(customerSearch.toLowerCase())
          : true)
    );

    setSales(filtered);

    if (filtered.length === 0) {
      setMetrics([]);
      return;
    }

    const totalSales = filtered.reduce((sum, s) => sum + s.totalCents, 0);
    const profit = filtered.reduce((sum, s) => {
      return (
        sum +
        s.items.reduce((pSum: number, it: any) => {
          const cost = it.product?.costPerDozen ?? 0;
          return pSum + (it.lineTotalCents - cost * it.dozens);
        }, 0)
      );
    }, 0);
    const avgSale = totalSales / filtered.length;
    const customers = new Set(
      filtered.map((s) => s.customerName ?? "Cash")
    ).size;

    setMetrics([
      {
        label: "Sales",
        value: money(totalSales),
        sub: `${filtered.length} transactions`,
        icon: "cash-multiple",
        color: "#0284C7",
      },
      {
        label: "Profit",
        value: money(profit),
        sub: `${((profit / totalSales) * 100 || 0).toFixed(1)}% margin`,
        icon: "trending-up",
        color: "#16A34A",
      },
      {
        label: "Customers",
        value: `${customers}`,
        sub: "Active customers",
        icon: "account-group-outline",
        color: "#9333EA",
      },
      {
        label: "Avg. Sale",
        value: money(avgSale),
        sub: "Per transaction",
        icon: "cart-outline",
        color: "#F59E0B",
      },
    ]);
  }, [range, customerSearch]);

  // ✅ Run when range or customer search changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ✅ Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSignOut = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 🔹 Header with Logout */}
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Analytics</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Business insights and performance metrics
      </Text>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {["today", "week", "month", "year"].map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r as any)}
            style={[styles.filterBtn, range === r && styles.filterBtnActive]}
          >
            <Text
              style={range === r ? styles.filterTextActive : styles.filterText}
            >
              {r === "today"
                ? "Today"
                : r === "week"
                ? "This Week"
                : r === "month"
                ? "This Month"
                : "This Year"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search Input */}
      <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
        <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
        <TextInput
          placeholder="Search customers..."
          value={customerSearch}
          onChangeText={setCustomerSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.searchInput}
        />
        {customerSearch.length > 0 && (
          <Pressable onPress={() => setCustomerSearch("")}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color="#9CA3AF"
            />
          </Pressable>
        )}
      </View>

      {/* Metrics (only when no search input) */}
      {customerSearch.trim().length === 0 && (
        <View style={styles.grid}>
          {metrics.map((m) => (
            <View key={m.label} style={styles.card}>
              <MaterialCommunityIcons name={m.icon} size={22} color={m.color} />
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={[styles.metricValue, { color: m.color }]}>
                {m.value}
              </Text>
              {m.sub && <Text style={styles.metricSub}>{m.sub}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Recent Transactions */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <FlatList
        data={sales.slice(0, 5)}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedSale(item)}
            style={styles.transactionRow}
          >
            <View>
              <Text style={styles.transactionName}>
                {item.customerName ?? "Cash Sale"}
              </Text>
              <Text style={styles.transactionSub}>
                {dayjs(item.createdAt).format("YYYY-MM-DD")} •{" "}
                {item.items.length} items
              </Text>
            </View>
            <Text style={styles.transactionAmount}>
              {money(item.totalCents)}
            </Text>
          </Pressable>
        )}
        // ✅ Pull-to-refresh on this screen
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Modal for Sale Details */}
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

            {/* Items */}
            <ScrollView style={{ marginTop: 12 }}>
              {selectedSale?.items.map((it: any, idx: number) => (
                <View key={it.id}>
                  <View style={styles.detailCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailName}>{it.product.name}</Text>
                      <Text style={styles.detailQty}>
                        {it.dozens} dozen × ETB{" "}
                        {it.product.pricePerDozen.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.detailTotal}>
                      {money(it.lineTotalCents)}
                    </Text>
                  </View>
                  {idx < selectedSale.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Summary */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>
                  {money(selectedSale?.totalCents ?? 0)}
                </Text>
              </View>
            </View>

            {/* Close */}
            <Pressable
              style={styles.closeBtn}
              onPress={() => setSelectedSale(null)}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20 },

  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterBtn: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  filterBtnActive: { backgroundColor: "#16A34A" },
  filterText: { color: "#374151", fontWeight: "600" },
  filterTextActive: { color: "#fff", fontWeight: "700" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  searchBoxFocused: { borderColor: "#16A34A" },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    marginLeft: 6,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  metricLabel: { fontSize: 13, color: "#6B7280", marginTop: 6 },
  metricValue: { fontSize: 20, fontWeight: "700", marginTop: 4 },
  metricSub: { fontSize: 12, color: "#9CA3AF" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  transactionName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  transactionSub: { fontSize: 12, color: "#6B7280" },
  transactionAmount: { fontSize: 15, fontWeight: "700", color: "#16A34A" },

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

  closeBtn: {
    marginTop: 16,
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
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
});
