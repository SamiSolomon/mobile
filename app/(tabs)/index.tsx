// src/screens/DashboardScreen.tsx
import React, {
  useEffect,
  useState,
  ComponentProps,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { getSalesWithDetails, Sale } from "../db/sales";
import { getProducts, Product } from "../db/product";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
const money = (cents: number) => `ETB ${cents.toFixed(2)}`;

type Metric = {
  label: string;
  value: string;
  sub?: string;
  icon: IconName;
  color: string;
  subColor?: string;
  urgent?: boolean;
};

export default function DashboardScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [refreshing, setRefreshing] = useState(false); // ✅ for pull-to-refresh

  // ✅ Wrap refresh in useCallback so we can reuse it cleanly
  const refresh = useCallback(async () => {
    // Treat DB calls as async, works whether they return promises or not
    const s = await getSalesWithDetails();
    const p = await getProducts();

    setSales(s);
    setProducts(p);

    // --- Total Sales ---
    const totalSales = s.reduce((sum, x) => sum + x.totalCents, 0);

    // --- Profit (sales - cost) ---
    const profit = s.reduce((sum, sale) => {
      return (
        sum +
        sale.items.reduce((itemSum: number, it: any) => {
          const cost = it.product?.costPerDozen ?? 0;
          return itemSum + (it.lineTotalCents - cost * it.dozens);
        }, 0)
      );
    }, 0);

    // --- Receivables (credit sales) ---
    const receivables = s
      .filter((x) => x.isCredit)
      .reduce((sum, x) => sum + (x.totalCents - x.paidCents), 0);

    // --- Recent Sales (last 3) ---
    const sortedSales = [...s].sort(
      (a, b) => (b.createdAt as any) - (a.createdAt as any)
    );
    setRecentSales(sortedSales.slice(0, 3));

    // --- Alerts ---
    const stockAlerts: string[] = [];
    p.forEach((prod) => {
      if (prod.stockPieces === 0) {
        stockAlerts.push(`${prod.name} out of stock`);
      } else if (prod.stockPieces <= (prod.lowStockThreshold ?? 12)) {
        stockAlerts.push(
          `${prod.name} running low (${prod.stockPieces} pieces left)`
        );
      }
    });

    const overduePayments = s.filter(
      (x) => x.isCredit && x.paidCents < x.totalCents
    ).length;
    if (overduePayments > 0) {
      stockAlerts.push(`${overduePayments} overdue payments due today`);
    }

    setAlerts(stockAlerts);

    // --- Build Metrics (currently using all sales, label as Today for UI) ---
    setMetrics([
      {
        label: "Today's Sales",
        value: money(totalSales),
        sub: "+12% from yesterday",
        subColor: "#16A34A",
        icon: "currency-usd",
        color: "#111827",
      },
      {
        label: "Today's Profit",
        value: money(profit),
        sub: `${((profit / (totalSales || 1)) * 100).toFixed(1)}% margin`,
        subColor: "#16A34A",
        icon: "trending-up",
        color: "#111827",
      },
      {
        label: "Stock Alerts",
        value: `${stockAlerts.length}`,
        sub: stockAlerts.length > 0 ? "out of stock" : "All good",
        subColor: stockAlerts.length > 0 ? "#DC2626" : "#6B7280",
        icon: "alert-outline",
        color: "#111827",
        urgent: stockAlerts.length > 0,
      },
      {
        label: "Receivables",
        value: money(receivables),
        sub: `${s.filter((x) => x.isCredit).length} customers`,
        subColor: "#6B7280",
        icon: "account-group-outline",
        color: "#111827",
      },
    ]);
  }, []);

  // ✅ Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ✅ Refetch whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // ✅ Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Today&apos;s business overview</Text>

      {/* Metrics Grid */}
      <View style={styles.grid}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.cardLabel}>{m.label}</Text>
              <MaterialCommunityIcons
                name={m.icon}
                size={18}
                color="#6B7280"
              />
            </View>
            <Text style={styles.cardValue}>{m.value}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 2,
              }}
            >
              {m.sub && (
                <Text
                  style={[
                    styles.cardSub,
                    { color: m.subColor || "#6B7280" },
                  ]}
                >
                  {m.sub}
                </Text>
              )}
              {m.urgent && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Urgent</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: "#16A34A" }]}
          onPress={() => router.push("/(tabs)/sales")}
        >
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color="#fff"
            style={styles.actionIcon}
          />
          <Text style={styles.actionText}>New Sale</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, { backgroundColor: "#F3F4F6" }]}
          onPress={() => router.push("/(tabs)/products")}
        >
          <MaterialCommunityIcons
            name="cube-outline"
            size={18}
            color="#111827"
            style={styles.actionIcon}
          />
          <Text style={[styles.actionText, { color: "#111827" }]}>
            Add Product
          </Text>
        </Pressable>
      </View>

      {/* Recent Sales */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="shopping-cart" size={20} color="#111827" />
          <Text style={styles.sectionTitle}>Recent Sales</Text>
        </View>

        {recentSales.length === 0 ? (
          <Text style={styles.muted}>No sales yet.</Text>
        ) : (
          recentSales.map((sale) => (
            <Pressable
              key={sale.id}
              style={styles.transactionRow}
              onPress={() => router.push("/(tabs)/sales")}
            >
              <View>
                <Text style={styles.transactionName}>
                  {sale.customerName ?? "Cash Sale"}
                </Text>
                <Text style={styles.transactionSub}>
                  {sale.items
                    .map(
                      (i: any) =>
                        `${i.dozens} dozen ${i.product.name}`
                    )
                    .join(", ")}
                </Text>
              </View>
              <Text style={styles.transactionAmount}>
                {money(sale.totalCents)}
              </Text>
            </Pressable>
          ))
        )}

        <Pressable
          style={styles.viewAll}
          onPress={() => router.push("/(tabs)/reports")}
        >
          <MaterialCommunityIcons
            name="chart-box-outline"
            size={18}
            color="#111827"
          />
          <Text
            style={{
              marginLeft: 6,
              fontWeight: "600",
              color: "#111827",
            }}
          >
            View All Sales
          </Text>
        </Pressable>
      </View>

      {/* Alerts & Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="alert-outline"
            size={20}
            color="#111827"
          />
          <Text style={styles.sectionTitle}>Alerts & Notifications</Text>
        </View>

        {alerts.length === 0 ? (
          <Text style={styles.muted}>No alerts</Text>
        ) : (
          <View style={{ maxHeight: 220 }}>
            {alerts.map((a, idx) => (
              <View key={idx} style={styles.transactionRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <MaterialCommunityIcons
                    name="alert-outline"
                    size={18}
                    color="#F59E0B"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.transactionSub}>{a}</Text>
                </View>
                <Pressable
                  style={styles.alertBtn}
                  onPress={() => router.push("/(tabs)/products")}
                >
                  <Text style={styles.alertBtnText}>Inventory</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 16 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardLabel: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  cardValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  cardSub: { fontSize: 12 },
  badge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 4,
  },
  actionIcon: { marginRight: 8 },
  actionText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 6,
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "center",
  },

  alertBtn: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  alertBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },

  alertCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  alertText: {
    marginLeft: 8,
    color: "#374151",
    fontSize: 14,
    flexShrink: 1,
  },

  saleCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  saleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  saleName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  saleAmount: { fontSize: 15, fontWeight: "700", color: "#16A34A" },
  saleSub: { fontSize: 12, color: "#6B7280" },

  muted: { color: "#999", fontStyle: "italic", padding: 4 },

  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 60,
  },
  transactionName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  transactionSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  transactionAmount: { fontSize: 15, fontWeight: "700", color: "#16A34A" },
});
