// src/screens/FinanceTabs/FinanceScreen.tsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PagerView from "react-native-pager-view";
import dayjs from "dayjs";
import { useFocusEffect } from "expo-router";

// 🔹 Import DB helper
import { listCreditSales } from "../db/sales";

// ---------- Finance Metrics ----------
function FinanceMetrics({ creditSales, lent, borrowed }: any) {
  const [page, setPage] = useState(0);

  const creditTotal = useMemo(
    () => creditSales.reduce((sum: number, r: any) => sum + r.totalCents, 0),
    [creditSales]
  );
  const creditPending = creditSales.filter(
    (r: any) => (r.paidCents ?? 0) < r.totalCents
  ).length;

  const lentTotal = useMemo(
    () => lent.reduce((sum: number, r: any) => sum + r.amount, 0),
    [lent]
  );
  const lentUnpaid = lent.filter((r: any) => r.status !== "paid").length;

  const borrowedTotal = useMemo(
    () => borrowed.reduce((sum: number, r: any) => sum + r.amount, 0),
    [borrowed]
  );
  const borrowedUnpaid = borrowed.filter(
    (r: any) => r.status !== "paid"
  ).length;

  const metrics = [
    {
      label: "Total Credit Sales",
      value: `ETB ${(creditTotal / 100).toFixed(2)}`,
      sub: `${creditPending} pending`,
      icon: "trending-up",
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      label: "Money Lent",
      value: `ETB ${lentTotal.toFixed(2)}`,
      sub: `${lentUnpaid} unpaid`,
      icon: "currency-usd",
      color: "#EA580C",
      bg: "#FFF7ED",
    },
    {
      label: "Loan In",
      value: `ETB ${borrowedTotal.toFixed(2)}`,
      sub: `${borrowedUnpaid} unpaid`,
      icon: "account-group-outline",
      color: "#DC2626",
      bg: "#FEF2F2",
    },
  ];

  return (
    <View>
      <PagerView
        style={{ height: 130 }}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {metrics.map((m) => (
          <View
            key={m.label}
            style={[styles.carouselCard, { backgroundColor: m.bg }]}
          >
            <MaterialCommunityIcons
              name={m.icon as any}
              size={28}
              color={m.color}
            />
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={[styles.metricValue, { color: m.color }]}>
              {m.value}
            </Text>
            <Text style={styles.metricSub}>{m.sub}</Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.dotsRow}>
        {metrics.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              page === i ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ---------- Focusable Input ----------
function FocusableInput({
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
}: any) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={[styles.input, focused && styles.inputFocused]}
      keyboardType={keyboardType}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ---------- Credit Sales Tab (with modal + mark paid / delete + pull-to-refresh) ----------
function CreditSalesTab({
  records,
  setRecords,
  onRefresh,
}: {
  records: any[];
  setRecords: React.Dispatch<React.SetStateAction<any[]>>;
  onRefresh?: () => Promise<void> | void;
}) {
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const birr = (cents: number) => `ETB ${(cents / 100).toFixed(2)}`;

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const markPaid = (id: string | number) => {
    setRecords((prev) =>
      prev.map((r: any) =>
        r.id === id ? { ...r, paidCents: r.totalCents } : r
      )
    );
  };

  const deleteRecord = (id: string | number) => {
    setRecords((prev) => prev.filter((r: any) => r.id !== id));
    if (selectedSale?.id === id) setSelectedSale(null);
  };

  const renderActions = (item: any) => {
    const isPaid = (item.paidCents ?? 0) >= item.totalCents;
    return (
      <>
        {!isPaid ? (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: "#1A73E8" }]}
            onPress={() => markPaid(item.id)}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={16}
              color="#fff"
            />
            <Text style={styles.actionBtnText}>Mark Paid</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: "#DC2626" }]}
            onPress={() => deleteRecord(item.id)}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={16}
              color="#fff"
            />
            <Text style={styles.actionBtnText}>Delete</Text>
          </Pressable>
        )}
      </>
    );
  };

  return (
    <>
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          const isPaid = (item.paidCents ?? 0) >= item.totalCents;
          return (
            <Pressable onPress={() => setSelectedSale(item)}>
              <View style={styles.listCard}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Text style={styles.name}>
                      {item.customerName ?? "Unknown"}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isPaid ? "#16A34A" : "#EA580C" },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {isPaid ? "paid" : "unpaid"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>
                    {dayjs(item.createdAt).format("YYYY-MM-DD")}
                  </Text>
                </View>

                <View
                  style={{
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={[
                      styles.amount,
                      { color: isPaid ? "#16A34A" : "#EA580C" },
                    ]}
                  >
                    {birr(item.totalCents)}
                  </Text>
                  {renderActions(item)}
                </View>
              </View>
            </Pressable>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Modal for credit sale details */}
      <Modal
        visible={!!selectedSale}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSale(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedSale?.customerName ?? "Credit Sale"}
            </Text>
            <Text style={styles.modalSub}>
              {dayjs(selectedSale?.createdAt).format("YYYY-MM-DD HH:mm")}
            </Text>

            <ScrollView style={{ marginTop: 12 }}>
              {Array.isArray(selectedSale?.items) &&
              selectedSale.items.length > 0 ? (
                selectedSale.items.map((it: any, idx: number) => (
                  <View key={it.id ?? idx}>
                    <View style={styles.detailCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailName}>
                          {it?.product?.name ?? "Item"}
                        </Text>
                        <Text style={styles.detailQty}>
                          {it?.dozens ?? 0} dozen
                          {it?.product?.pricePerDozen != null
                            ? ` × ETB ${Number(
                                it.product.pricePerDozen
                              ).toFixed(2)}`
                            : ""}
                        </Text>
                      </View>
                      <Text style={styles.detailTotal}>
                        {birr(it?.lineTotalCents ?? 0)}
                      </Text>
                    </View>
                    {idx < selectedSale.items.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </View>
                ))
              ) : (
                <View
                  style={[styles.detailCard, { backgroundColor: "#fff" }]}
                >
                  <Text style={styles.detailQty}>
                    No item details available.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Summary: ONLY Total */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>
                  {birr(selectedSale?.totalCents ?? 0)}
                </Text>
              </View>
            </View>

            {/* Modal actions */}
            <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
              {(selectedSale?.paidCents ?? 0) <
              (selectedSale?.totalCents ?? 0) ? (
                <Pressable
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: "#1A73E8",
                      flex: 1,
                      flexDirection: "row",
                      justifyContent: "center",
                    },
                  ]}
                  onPress={() => {
                    markPaid(selectedSale!.id);
                    setSelectedSale((s: any) =>
                      s ? { ...s, paidCents: s.totalCents } : s
                    );
                  }}
                >
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={16}
                    color="#fff"
                  />
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                      marginLeft: 6,
                    }}
                  >
                    Mark Paid
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: "#DC2626",
                      flex: 1,
                      flexDirection: "row",
                      justifyContent: "center",
                    },
                  ]}
                  onPress={() => deleteRecord(selectedSale!.id)}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={16}
                    color="#fff"
                  />
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                      marginLeft: 6,
                    }}
                  >
                    Delete
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.closeBtn, { flex: 1 }]}
                onPress={() => setSelectedSale(null)}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------- Money Lent Tab ----------
function MoneyLentTab({ records, setRecords }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  const addRecord = () => {
    if (!name || !phone || !amount) return;
    setRecords([
      {
        id: Date.now().toString(),
        name,
        phone,
        status: "unpaid",
        date: new Date().toLocaleDateString(),
        amount: parseFloat(amount),
      },
      ...records,
    ]);
    setName("");
    setPhone("");
    setAmount("");
  };

  const markPaid = (id: string) => {
    setRecords((prev: any[]) =>
      prev.map((r) => (r.id === id ? { ...r, status: "paid" } : r))
    );
  };

  const deleteRecord = (id: string) => {
    setRecords((prev: any[]) => prev.filter((r) => r.id !== id));
  };

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.form}>
          <FocusableInput
            placeholder="Enter full name"
            value={name}
            onChangeText={setName}
          />
          <FocusableInput
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <FocusableInput
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Pressable
            style={[styles.addBtn, { backgroundColor: "#1A73E8" }]}
            onPress={addRecord}
          >
            <Text style={styles.addBtnText}>+ Record Lent Money</Text>
          </Pressable>
        </View>
      }
      data={records}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.listCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="account-outline"
                size={18}
                color="#374151"
              />
              <Text style={styles.name}>{item.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === "paid" ? "#16A34A" : "#EA580C",
                  },
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                marginTop: 4,
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name="phone"
                size={14}
                color="#6B7280"
              />
              <Text style={styles.meta}>{item.phone}</Text>
              <MaterialCommunityIcons
                name="calendar"
                size={14}
                color="#6B7280"
                style={{ marginLeft: 10 }}
              />
              <Text style={styles.meta}>{item.date}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
            <Text style={styles.amount}>
              ETB {item.amount.toFixed(2)}
            </Text>
            {item.status !== "paid" ? (
              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: "#1A73E8" },
                ]}
                onPress={() => markPaid(item.id)}
              >
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={16}
                  color="#fff"
                />
                <Text style={styles.actionBtnText}>Mark Paid</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: "#DC2626" },
                ]}
                onPress={() => deleteRecord(item.id)}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={16}
                  color="#fff"
                />
                <Text style={styles.actionBtnText}>Delete</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    />
  );
}

// ---------- Loan In Tab ----------
function MoneyBorrowedTab({ records, setRecords }: any) {
  const [lender, setLender] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  const addRecord = () => {
    if (!lender || !phone || !amount) return;
    setRecords([
      {
        id: Date.now().toString(),
        name: lender,
        phone,
        status: "unpaid",
        date: new Date().toLocaleDateString(),
        amount: parseFloat(amount),
      },
      ...records,
    ]);
    setLender("");
    setPhone("");
    setAmount("");
  };

  const markPaid = (id: string) => {
    setRecords((prev: any[]) =>
      prev.map((r) => (r.id === id ? { ...r, status: "paid" } : r))
    );
  };

  const deleteRecord = (id: string) => {
    setRecords((prev: any[]) => prev.filter((r) => r.id !== id));
  };

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.form}>
          <FocusableInput
            placeholder="Enter lender name"
            value={lender}
            onChangeText={setLender}
          />
          <FocusableInput
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <FocusableInput
            placeholder="Amount Borrowed"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Pressable
            style={[styles.addBtn, { backgroundColor: "#EF5350" }]}
            onPress={addRecord}
          >
            <Text style={styles.addBtnText}>
              + Record Borrowed Money
            </Text>
          </Pressable>
        </View>
      }
      data={records}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.listCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="account-outline"
                size={18}
                color="#374151"
              />
              <Text style={styles.name}>{item.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === "paid" ? "#16A34A" : "#DC2626",
                  },
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                marginTop: 4,
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name="phone"
                size={14}
                color="#6B7280"
              />
              <Text style={styles.meta}>{item.phone}</Text>
              <MaterialCommunityIcons
                name="calendar"
                size={14}
                color="#6B7280"
                style={{ marginLeft: 10 }}
              />
              <Text style={styles.meta}>{item.date}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
            <Text style={styles.amount}>
              ETB {item.amount.toFixed(2)}
            </Text>
            {item.status !== "paid" ? (
              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: "#1A73E8" },
                ]}
                onPress={() => markPaid(item.id)}
              >
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={16}
                  color="#fff"
                />
                <Text style={styles.actionBtnText}>Mark Paid</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: "#DC2626" },
                ]}
                onPress={() => deleteRecord(item.id)}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={16}
                  color="#fff"
                />
                <Text style={styles.actionBtnText}>Delete</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    />
  );
}

// ---------- Top Tabs ----------
const Tab = createMaterialTopTabNavigator();

export default function FinanceScreen() {
  const [creditSales, setCreditSales] = useState<any[]>([]);
  const [lent, setLent] = useState<any[]>([]);
  const [borrowed, setBorrowed] = useState<any[]>([]);

  // ✅ wrap DB load in useCallback so we can also use it on focus / refresh
  const loadCreditSales = useCallback(async () => {
    const sales = await listCreditSales();
    setCreditSales(sales);
  }, []);

  useEffect(() => {
    loadCreditSales();
  }, [loadCreditSales]);

  useFocusEffect(
    useCallback(() => {
      loadCreditSales();
    }, [loadCreditSales])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 4,
        }}
      >
        <Text style={styles.title}>Credit Management</Text>
        <Text style={styles.subtitle}>
          Track credit sales, money lent, and borrowed funds
        </Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <FinanceMetrics
          creditSales={creditSales}
          lent={lent}
          borrowed={borrowed}
        />
      </View>

      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarStyle: {
            backgroundColor: "transparent",
            elevation: 0,
          },
          tabBarIndicatorStyle: { backgroundColor: "transparent" },
          tabBarItemStyle: { marginHorizontal: 4 },
          tabBarLabel: ({ focused }) => (
            <View
              style={[
                styles.pill,
                focused ? styles.pillActive : styles.pillInactive,
              ]}
            >
              <Text
                style={focused ? styles.pillTextActive : styles.pillText}
              >
                {route.name}
              </Text>
            </View>
          ),
        })}
      >
        <Tab.Screen name="Credit Sales">
          {() => (
            <CreditSalesTab
              records={creditSales}
              setRecords={setCreditSales}
              onRefresh={loadCreditSales} // ✅ pull-to-refresh reloads from DB
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Money Lent">
          {() => (
            <MoneyLentTab records={lent} setRecords={setLent} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Loan In">
          {() => (
            <MoneyBorrowedTab
              records={borrowed}
              setRecords={setBorrowed}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 2 },

  carouselCard: {
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 40,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 6,
  },
  metricValue: { fontSize: 24, fontWeight: "800", marginTop: 4 },
  metricSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  dotsRow: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  dotActive: { backgroundColor: "#16A34A" },
  dotInactive: { backgroundColor: "#D1D5DB" },

  form: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
  },
  inputFocused: { borderColor: "#16A34A", borderWidth: 2 },

  addBtn: {
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 12,
  },
  addBtnText: { color: "#fff", fontWeight: "700" },

  listCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  name: {
    fontWeight: "600",
    fontSize: 15,
    color: "#111827",
    marginLeft: 0,
  },
  meta: { fontSize: 12, color: "#6B7280", marginLeft: 0 },
  amount: { fontSize: 16, fontWeight: "700", marginTop: 4 },

  statusBadge: {
    marginLeft: 8,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  actionBtn: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A73E8",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    minWidth: 64,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  pillActive: { backgroundColor: "#16A34A" },
  pillInactive: { backgroundColor: "#F3F4F6" },
  pillText: { color: "#374151", fontWeight: "600" },
  pillTextActive: { color: "#fff", fontWeight: "700" },

  // Modal / detail styles
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
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  closeBtn: {
    marginTop: 16,
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});

