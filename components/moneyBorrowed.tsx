import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";

const mockData = [
  { id: "1", name: "David Brown", status: "unpaid", date: "Jan 12, 2024", amount: 300 },
  { id: "2", name: "Emma Davis", status: "paid", date: "Jan 5, 2024", amount: 220 },
];

export default function MoneyBorrowedTab() {
  return (
    <FlatList
      data={mockData}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
            <Pressable
              style={item.status === "unpaid" ? styles.btnUnpaid : styles.btnPaid}
            >
              <Text
                style={
                  item.status === "unpaid" ? styles.btnTextUnpaid : styles.btnPaidText
                }
              >
                {item.status === "unpaid" ? "Mark Paid" : "Paid"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: { fontWeight: "600", fontSize: 16, color: "#111827" },
  date: { fontSize: 12, color: "#6B7280" },
  amount: { fontSize: 16, fontWeight: "700", color: "#DC2626" },
  btnUnpaid: {
    marginTop: 6,
    backgroundColor: "#DC2626",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnTextUnpaid: { color: "#fff", fontWeight: "700" },
  btnPaid: {
    marginTop: 6,
    backgroundColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnPaidText: { color: "#374151", fontWeight: "600" },
});
